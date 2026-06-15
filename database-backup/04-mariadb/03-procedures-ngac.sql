-- ==========================================
-- MARIADB PROCEDURES: SEGURIDAD NGAC
-- ==========================================

DELIMITER $$

-- 1. REGISTER ERROR
CREATE PROCEDURE sp_registrar_log_error(
    IN p_modulo VARCHAR(100),
    IN p_mensaje LONGTEXT
)
BEGIN
    INSERT INTO ACC_LOG_ERRORES (MODULO, MENSAJE, FECHA)
    VALUES (p_modulo, p_mensaje, NOW());
END$$

-- 2. REGISTER ACCESS
CREATE PROCEDURE sp_registrar_log_acceso(
    IN p_usuario VARCHAR(50),
    IN p_objeto VARCHAR(100),
    IN p_operaciones VARCHAR(256),
    IN p_autorizado INT,
    IN p_json_contexto LONGTEXT
)
BEGIN
    INSERT INTO ACC_LOG_ACCESOS (USUARIO, CODIGO_OBJETO, OPERACIONES, AUTORIZADO, JSON_CONTEXTO, FECHA_REGISTRO)
    VALUES (COALESCE(p_usuario, 'DESCONOCIDO'), p_objeto, p_operaciones, p_autorizado, p_json_contexto, NOW());
END$$

-- 3. ACCESS VERIFICATION WITH RECURSIVE CTE & JSON_TABLE
CREATE PROCEDURE sp_verificar_acceso(
    IN p_atributos LONGTEXT,       -- JSON Array of strings
    IN p_operaciones LONGTEXT,     -- JSON Array of strings
    IN p_objeto VARCHAR(256),      -- Technical Code or ID
    IN p_contexto_json LONGTEXT,   -- JSON Object context
    OUT p_autorizado INT
)
BEGIN
    DECLARE v_usuario VARCHAR(256) DEFAULT 'DESCONOCIDO';
    DECLARE v_id_obj BIGINT DEFAULT NULL;
    DECLARE v_ops_csv VARCHAR(4000) DEFAULT '';
    
    -- Error Handling
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_autorizado = 0;
        CALL sp_registrar_log_error('sp_verificar_acceso', 'Fallo de ejecucion');
        CALL sp_registrar_log_acceso('SYSTEM', p_objeto, 'ERROR', 0, p_contexto_json);
    END;

    -- Extract username from context JSON
    IF p_contexto_json IS NOT NULL AND JSON_VALID(p_contexto_json) THEN
        SET v_usuario = COALESCE(
            JSON_UNQUOTE(JSON_EXTRACT(p_contexto_json, '$.sujeto.usuario_id')),
            JSON_UNQUOTE(JSON_EXTRACT(p_contexto_json, '$.sujeto.username')),
            'DESCONOCIDO'
        );
    END IF;

    IF v_usuario = 'DESCONOCIDO' AND p_atributos IS NOT NULL AND JSON_VALID(p_atributos) AND JSON_LENGTH(p_atributos) > 0 THEN
        SET v_usuario = COALESCE(JSON_UNQUOTE(JSON_EXTRACT(p_atributos, '$[0]')), 'DESCONOCIDO');
    END IF;

    -- Generate operations CSV for auditing
    SELECT GROUP_CONCAT(UPPER(TRIM(val))) INTO v_ops_csv
    FROM JSON_TABLE(p_operaciones, '$[*]' COLUMNS (val VARCHAR(100) PATH '$')) jt;

    -- Find Object Node
    IF p_objeto REGEXP '^[0-9]+$' THEN
        SELECT ID_NODO INTO v_id_obj FROM ACC_NODOS WHERE ID_NODO = CAST(p_objeto AS SIGNED) AND ACTIVO = 'S';
    ELSE
        SELECT ID_NODO INTO v_id_obj FROM ACC_NODOS WHERE UPPER(CODIGO_TECNICO) = UPPER(TRIM(p_objeto)) AND ACTIVO = 'S';
    END IF;

    IF v_id_obj IS NULL THEN
        SET p_autorizado = 0;
        CALL sp_registrar_log_acceso(v_usuario, p_objeto, COALESCE(v_ops_csv, 'N/A'), 0, p_contexto_json);
    ELSE
        -- Verification via recursive query
        BEGIN
            -- Temp table to hold resolved user nodes
            CREATE TEMPORARY TABLE IF NOT EXISTS temp_user_nodes (id_nodo BIGINT);
            TRUNCATE TABLE temp_user_nodes;
            
            -- Insert user attributes
            INSERT INTO temp_user_nodes (id_nodo)
            SELECT ID_NODO FROM ACC_NODOS 
            WHERE (UPPER(CODIGO_TECNICO) IN (SELECT UPPER(val) FROM JSON_TABLE(p_atributos, '$[*]' COLUMNS (val VARCHAR(255) PATH '$')) jt)
                   OR ID_NODO IN (SELECT CAST(val AS SIGNED) FROM JSON_TABLE(p_atributos, '$[*]' COLUMNS (val VARCHAR(255) PATH '$')) jt))
              AND ACTIVO = 'S';

            -- Insert roles from subject
            IF p_contexto_json IS NOT NULL AND JSON_VALID(p_contexto_json) THEN
                INSERT INTO temp_user_nodes (id_nodo)
                SELECT ID_NODO FROM ACC_NODOS 
                WHERE UPPER(CODIGO_TECNICO) IN (SELECT UPPER(val) FROM JSON_TABLE(p_contexto_json, '$.sujeto.roles[*]' COLUMNS (val VARCHAR(255) PATH '$')) jt)
                  AND ACTIVO = 'S';
            END IF;

            -- Check access using recursive CTE
            SET p_autorizado = 0;
            
            BEGIN
                -- CTE Check
                WITH RECURSIVE UserAncestors AS (
                    SELECT id_nodo FROM temp_user_nodes
                    UNION
                    SELECT a.ID_PADRE
                    FROM ACC_ASIGNACIONES a
                    INNER JOIN UserAncestors ua ON a.ID_HIJO = ua.id_nodo
                    WHERE a.ACTIVO = 'S'
                ),
                ObjectAncestors AS (
                    SELECT v_id_obj AS id_nodo
                    UNION
                    SELECT a.ID_PADRE
                    FROM ACC_ASIGNACIONES a
                    INNER JOIN ObjectAncestors oa ON a.ID_HIJO = oa.id_nodo
                    WHERE a.ACTIVO = 'S'
                ),
                AllowedAssociations AS (
                    SELECT DISTINCT op.nombre_op, aso.CONDICION_JSON
                    FROM ACC_ASOCIACIONES aso
                    INNER JOIN ACC_OPERACIONES op ON aso.ID_OP = op.ID_OP
                    WHERE aso.ACTIVO = 'S' AND op.ACTIVO = 'S'
                      AND aso.ID_USR_ATTR IN (SELECT id_nodo FROM UserAncestors)
                      AND aso.ID_OBJ_ATTR IN (SELECT id_nodo FROM ObjectAncestors)
                ),
                Prohibitions AS (
                    SELECT DISTINCT op.nombre_op
                    FROM ACC_PROHIBICIONES pro
                    INNER JOIN ACC_OPERACIONES op ON pro.ID_OP = op.ID_OP
                    WHERE pro.ACTIVO = 'S' AND op.ACTIVO = 'S'
                      AND pro.ID_USR_ATTR IN (SELECT id_nodo FROM UserAncestors)
                      AND pro.ID_OBJ_ATTR IN (SELECT id_nodo FROM ObjectAncestors)
                )
                SELECT COUNT(*) > 0 INTO p_autorizado
                FROM JSON_TABLE(p_operaciones, '$[*]' COLUMNS (val VARCHAR(100) PATH '$')) jt
                WHERE EXISTS (
                    SELECT 1 FROM AllowedAssociations al
                    WHERE UPPER(al.nombre_op) = UPPER(jt.val)
                      AND (
                          al.CONDICION_JSON IS NULL OR TRIM(al.CONDICION_JSON) = ''
                          OR (
                              al.CONDICION_JSON LIKE '%:division%' 
                              AND JSON_EXTRACT(p_contexto_json, '$.sujeto.division') IS NOT NULL
                          )
                          OR (
                              al.CONDICION_JSON LIKE '%:usuario_id%' 
                              AND JSON_EXTRACT(p_contexto_json, '$.sujeto.usuario_id') IS NOT NULL
                          )
                      )
                )
                AND NOT EXISTS (
                    SELECT 1 FROM Prohibitions pr
                    WHERE UPPER(pr.nombre_op) = UPPER(jt.val)
                );
            END;

            CALL sp_registrar_log_acceso(v_usuario, p_objeto, COALESCE(v_ops_csv, 'N/A'), p_autorizado, p_contexto_json);
        END;
    END IF;
END$$

-- 4. ROOT DIRECTORIES
CREATE PROCEDURE sp_get_carpetas_raiz(
    IN p_id BIGINT
)
BEGIN
    SELECT mn.* 
    FROM ACC_MENU_NODOS mn
    INNER JOIN ACC_POLICY_MENU_RAICES pmr ON mn.ID_MENU_NODO = pmr.ID_MENU_NODO
    WHERE pmr.ID_POLICY = p_id AND pmr.ACTIVO = 'S' AND mn.ACTIVO = 'S';
END$$

CREATE PROCEDURE sp_get_carpetas_raiz_sin_hijos(
    IN p_id BIGINT
)
BEGIN
    SELECT mn.* 
    FROM ACC_MENU_NODOS mn
    INNER JOIN ACC_POLICY_MENU_RAICES pmr ON mn.ID_MENU_NODO = pmr.ID_MENU_NODO
    WHERE pmr.ID_POLICY = p_id AND pmr.ACTIVO = 'S' AND mn.ACTIVO = 'S'
      AND NOT EXISTS (
          SELECT 1 FROM ACC_MENU_ASIGNACIONES ma 
          WHERE ma.ID_MENU_PADRE = mn.ID_MENU_NODO AND ma.ACTIVO = 'S'
      );
END$$

-- 5. BUILD MENU JSON
CREATE PROCEDURE sp_obtener_menu_json(
    IN p_json_contexto LONGTEXT,
    OUT p_menu_json LONGTEXT
)
BEGIN
    SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
            'id', ID_MENU_NODO,
            'label', ETIQUETA_VISIBLE,
            'path', URL_RUTA_VISIBLE,
            'slug', SLUG_VISIBLE,
            'icon', ICONO_VISIBLE,
            'order', ORDEN_VISUAL
        )
    ) INTO p_menu_json
    FROM ACC_MENU_NODOS
    WHERE ACTIVO = 'S';
    
    CALL sp_registrar_log_acceso('SYSTEM', 'MENU_GENERATION', 'VER', 1, p_json_contexto);
END$$

DELIMITER ;
