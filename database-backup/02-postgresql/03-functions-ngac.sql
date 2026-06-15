-- ==========================================
-- POSTGRESQL FUNCTIONS: SEGURIDAD NGAC
-- ==========================================

SET search_path TO ngac, public;

-- 1. REGISTER ERROR
CREATE OR REPLACE FUNCTION fn_registrar_log_error(
    p_modulo VARCHAR(100),
    p_mensaje TEXT
) RETURNS void AS $$
BEGIN
    INSERT INTO ACC_LOG_ERRORES (MODULO, MENSAJE, FECHA)
    VALUES (p_modulo, p_mensaje, CURRENT_TIMESTAMP);
END;
$$ LANGUAGE plpgsql;

-- 2. REGISTER ACCESS
CREATE OR REPLACE FUNCTION fn_registrar_log_acceso(
    p_usuario VARCHAR(50),
    p_objeto VARCHAR(100),
    p_operaciones VARCHAR(256),
    p_autorizado INTEGER,
    p_json_contexto TEXT
) RETURNS void AS $$
BEGIN
    INSERT INTO ACC_LOG_ACCESOS (USUARIO, CODIGO_OBJETO, OPERACIONES, AUTORIZADO, JSON_CONTEXTO, FECHA_REGISTRO)
    VALUES (COALESCE(p_usuario, 'DESCONOCIDO'), p_objeto, p_operaciones, p_autorizado, p_json_contexto, CURRENT_TIMESTAMP);
END;
$$ LANGUAGE plpgsql;

-- 3. VERIFY ACCESS FUNCTION (PL/pgSQL Core)
CREATE OR REPLACE FUNCTION fn_verificar_acceso(
    p_atributos jsonb,       -- JSON Array of strings (user attributes/nodes)
    p_operaciones jsonb,     -- JSON Array of strings (requested operations)
    p_objeto VARCHAR(256),   -- ID or Technical Code of the target object
    p_contexto_json jsonb DEFAULT NULL
) RETURNS integer AS $$
DECLARE
    v_usuario VARCHAR(256) := 'DESCONOCIDO';
    v_id_obj BIGINT := NULL;
    v_autorizado INTEGER := 0;
    v_ops_csv VARCHAR(4000) := '';
BEGIN
    -- Extract username from context JSON
    IF p_contexto_json IS NOT NULL THEN
        v_usuario := COALESCE(
            p_contexto_json -> 'sujeto' ->> 'usuario_id',
            p_contexto_json -> 'sujeto' ->> 'username',
            'DESCONOCIDO'
        );
    END IF;

    IF v_usuario = 'DESCONOCIDO' AND p_atributos IS NOT NULL AND jsonb_array_length(p_atributos) > 0 THEN
        v_usuario := COALESCE(p_atributos ->> 0, 'DESCONOCIDO');
    END IF;

    -- Build CSV list of operations
    SELECT string_agg(upper(trim(val)), ',') INTO v_ops_csv
    FROM jsonb_array_elements_text(p_operaciones) AS val;

    -- Find Object Node ID
    IF p_objeto ~ '^[0-9]+$' THEN
        SELECT ID_NODO INTO v_id_obj FROM ACC_NODOS WHERE ID_NODO = p_objeto::BIGINT AND ACTIVO = 'S';
    ELSE
        SELECT ID_NODO INTO v_id_obj FROM ACC_NODOS WHERE UPPER(CODIGO_TECNICO) = UPPER(TRIM(p_objeto)) AND ACTIVO = 'S';
    END IF;

    IF v_id_obj IS NULL THEN
        PERFORM fn_registrar_log_acceso(v_usuario, p_objeto, COALESCE(v_ops_csv, 'N/A'), 0, p_contexto_json::text);
        RETURN 0;
    END IF;

    -- Inferred access using Recursive CTE
    WITH RECURSIVE UserAncestors AS (
        -- Start with the user node IDs (resolved from parameters & context roles)
        SELECT ID_NODO 
        FROM ACC_NODOS 
        WHERE ACTIVO = 'S'
          AND (
              UPPER(CODIGO_TECNICO) IN (SELECT upper(val) FROM jsonb_array_elements_text(p_atributos) AS val)
              OR ID_NODO::text IN (SELECT val FROM jsonb_array_elements_text(p_atributos) AS val)
              OR (p_contexto_json IS NOT NULL AND UPPER(CODIGO_TECNICO) IN (SELECT upper(val) FROM jsonb_array_elements_text(p_contexto_json -> 'sujeto' -> 'roles') AS val))
          )
        UNION
        -- Recursively traverse parent hierarchies
        SELECT a.ID_PADRE
        FROM ACC_ASIGNACIONES a
        INNER JOIN UserAncestors ua ON a.ID_HIJO = ua.ID_NODO
        WHERE a.ACTIVO = 'S'
    ),
    ObjectAncestors AS (
        -- Start with the object node
        SELECT v_id_obj AS ID_NODO
        UNION
        -- Recursively traverse parent hierarchies
        SELECT a.ID_PADRE
        FROM ACC_ASIGNACIONES a
        INNER JOIN ObjectAncestors oa ON a.ID_HIJO = oa.ID_NODO
        WHERE a.ACTIVO = 'S'
    ),
    AllowedAssociations AS (
        SELECT DISTINCT op.nombre_op, aso.CONDICION_JSON
        FROM ACC_ASOCIACIONES aso
        INNER JOIN ACC_OPERACIONES op ON aso.ID_OP = op.ID_OP
        WHERE aso.ACTIVO = 'S' AND op.ACTIVO = 'S'
          AND aso.ID_USR_ATTR IN (SELECT ID_NODO FROM UserAncestors)
          AND aso.ID_OBJ_ATTR IN (SELECT ID_NODO FROM ObjectAncestors)
    ),
    Prohibitions AS (
        SELECT DISTINCT op.nombre_op
        FROM ACC_PROHIBICIONES pro
        INNER JOIN ACC_OPERACIONES op ON pro.ID_OP = op.ID_OP
        WHERE pro.ACTIVO = 'S' AND op.ACTIVO = 'S'
          AND pro.ID_USR_ATTR IN (SELECT ID_NODO FROM UserAncestors)
          AND pro.ID_OBJ_ATTR IN (SELECT ID_NODO FROM ObjectAncestors)
    )
    SELECT CASE WHEN EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(p_operaciones) AS req
        WHERE EXISTS (
            SELECT 1 FROM AllowedAssociations al
            WHERE UPPER(al.nombre_op) = UPPER(req)
              AND (
                  al.CONDICION_JSON IS NULL OR TRIM(al.CONDICION_JSON) = ''
                  -- Simple ABAC condition evaluator using text searches on contexto JSON
                  OR (
                      al.CONDICION_JSON LIKE '%:division%' 
                      AND (p_contexto_json -> 'sujeto' ->> 'division') IS NOT NULL
                  )
                  OR (
                      al.CONDICION_JSON LIKE '%:usuario_id%' 
                      AND (p_contexto_json -> 'sujeto' ->> 'usuario_id') IS NOT NULL
                  )
              )
        )
        AND NOT EXISTS (
            SELECT 1 FROM Prohibitions pr
            WHERE UPPER(pr.nombre_op) = UPPER(req)
        )
    ) THEN 1 ELSE 0 END INTO v_autorizado;

    -- Register access log
    PERFORM fn_registrar_log_acceso(v_usuario, p_objeto, COALESCE(v_ops_csv, 'N/A'), v_autorizado, p_contexto_json::text);
    RETURN v_autorizado;
EXCEPTION
    WHEN OTHERS THEN
        PERFORM fn_registrar_log_error('fn_verificar_acceso', SQLERRM);
        PERFORM fn_registrar_log_acceso(v_usuario, p_objeto, 'ERROR', 0, p_contexto_json::text);
        RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- 4. ROOT DIRECTORIES (RETURNS TABLE)
CREATE OR REPLACE FUNCTION fn_get_carpetas_raiz(
    p_id BIGINT
) RETURNS TABLE (
    ID_MENU_NODO BIGINT,
    ID_NODO BIGINT,
    ETIQUETA_VISIBLE VARCHAR,
    URL_RUTA_VISIBLE VARCHAR,
    SLUG_VISIBLE VARCHAR,
    ICONO_VISIBLE VARCHAR,
    DESCRIPCION_VISIBLE VARCHAR,
    ORDEN_VISUAL NUMERIC,
    ACTIVO VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT mn.ID_MENU_NODO, mn.ID_NODO, mn.ETIQUETA_VISIBLE, mn.URL_RUTA_VISIBLE, mn.SLUG_VISIBLE, mn.ICONO_VISIBLE, mn.DESCRIPCION_VISIBLE, mn.ORDEN_VISUAL, mn.ACTIVO
    FROM ACC_MENU_NODOS mn
    INNER JOIN ACC_POLICY_MENU_RAICES pmr ON mn.ID_MENU_NODO = pmr.ID_MENU_NODO
    WHERE pmr.ID_POLICY = p_id AND pmr.ACTIVO = 'S' AND mn.ACTIVO = 'S';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_get_carpetas_raiz_sin_hijos(
    p_id BIGINT
) RETURNS TABLE (
    ID_MENU_NODO BIGINT,
    ID_NODO BIGINT,
    ETIQUETA_VISIBLE VARCHAR,
    URL_RUTA_VISIBLE VARCHAR,
    SLUG_VISIBLE VARCHAR,
    ICONO_VISIBLE VARCHAR,
    DESCRIPCION_VISIBLE VARCHAR,
    ORDEN_VISUAL NUMERIC,
    ACTIVO VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT mn.ID_MENU_NODO, mn.ID_NODO, mn.ETIQUETA_VISIBLE, mn.URL_RUTA_VISIBLE, mn.SLUG_VISIBLE, mn.ICONO_VISIBLE, mn.DESCRIPCION_VISIBLE, mn.ORDEN_VISUAL, mn.ACTIVO
    FROM ACC_MENU_NODOS mn
    INNER JOIN ACC_POLICY_MENU_RAICES pmr ON mn.ID_MENU_NODO = pmr.ID_MENU_NODO
    WHERE pmr.ID_POLICY = p_id AND pmr.ACTIVO = 'S' AND mn.ACTIVO = 'S'
      AND NOT EXISTS (
          SELECT 1 FROM ACC_MENU_ASIGNACIONES ma 
          WHERE ma.ID_MENU_PADRE = mn.ID_MENU_NODO AND ma.ACTIVO = 'S'
      );
END;
$$ LANGUAGE plpgsql;

-- 5. BUILD MENU JSON
CREATE OR REPLACE FUNCTION fn_obtener_menu_json(
    p_json_contexto TEXT
) RETURNS TEXT AS $$
DECLARE
    v_menu TEXT;
BEGIN
    -- Select rows as JSON array text
    SELECT json_agg(t)::text INTO v_menu
    FROM (
        SELECT 
            ID_MENU_NODO AS id,
            ETIQUETA_VISIBLE AS label,
            URL_RUTA_VISIBLE AS path,
            SLUG_VISIBLE AS slug,
            ICONO_VISIBLE AS icon,
            ORDEN_VISUAL AS order
        FROM ACC_MENU_NODOS
        WHERE ACTIVO = 'S'
    ) t;
    
    PERFORM fn_registrar_log_acceso('SYSTEM', 'MENU_GENERATION', 'VER', 1, p_json_contexto);
    RETURN v_menu;
EXCEPTION
    WHEN OTHERS THEN
        PERFORM fn_registrar_log_error('fn_obtener_menu_json', SQLERRM);
        RETURN '{"error": "Fallo Critico", "detalle": "' || SQLERRM || '"}';
END;
$$ LANGUAGE plpgsql;
