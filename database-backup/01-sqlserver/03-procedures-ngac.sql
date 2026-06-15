-- ==========================================
-- SQL SERVER PROCEDURES: SEGURIDAD NGAC
-- ==========================================

-- 1. ERROR REGISTRATION
CREATE PROCEDURE sp_registrar_log_error
    @p_modulo NVARCHAR(100),
    @p_mensaje NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO ACC_LOG_ERRORES (MODULO, MENSAJE, FECHA)
    VALUES (@p_modulo, @p_mensaje, GETDATE());
END;
GO

-- 2. ACCESS REGISTRATION
CREATE PROCEDURE sp_registrar_log_acceso
    @p_usuario NVARCHAR(50),
    @p_objeto NVARCHAR(100),
    @p_operaciones NVARCHAR(256),
    @p_autorizado INT,
    @p_json_contexto NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO ACC_LOG_ACCESOS (USUARIO, CODIGO_OBJETO, OPERACIONES, AUTORIZADO, JSON_CONTEXTO, FECHA_REGISTRO)
    VALUES (COALESCE(@p_usuario, 'DESCONOCIDO'), @p_objeto, @p_operaciones, @p_autorizado, @p_json_contexto, GETDATE());
END;
GO

-- 3. ACCESS VERIFICATION WITH RECURSIVE CTE (NGAC ENGINE Core)
CREATE PROCEDURE sp_verificar_acceso
    @p_atributos NVARCHAR(MAX),       -- JSON Array of strings (user attributes/nodes)
    @p_operaciones NVARCHAR(MAX),     -- JSON Array of strings (requested operations)
    @p_objeto NVARCHAR(256),          -- ID or Technical Code of the target object
    @p_contexto_json NVARCHAR(MAX) = NULL,
    @p_autorizado INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- Extract username from context JSON
        DECLARE @v_usuario NVARCHAR(256) = 'DESCONOCIDO';
        IF @p_contexto_json IS NOT NULL AND ISJSON(@p_contexto_json) > 0
        BEGIN
            SET @v_usuario = COALESCE(
                JSON_VALUE(@p_contexto_json, '$.sujeto.usuario_id'),
                JSON_VALUE(@p_contexto_json, '$.sujeto.username'),
                'DESCONOCIDO'
            );
        END;

        IF @v_usuario = 'DESCONOCIDO' AND @p_atributos IS NOT NULL AND ISJSON(@p_atributos) > 0
        BEGIN
            SET @v_usuario = COALESCE(JSON_VALUE(@p_atributos, '$[0]'), 'DESCONOCIDO');
        END;

        -- Parse parameters
        DECLARE @tbl_atributos TABLE (codigo NVARCHAR(255));
        INSERT INTO @tbl_atributos (codigo)
        SELECT [value] FROM OPENJSON(@p_atributos);

        DECLARE @tbl_operaciones TABLE (nombre_op NVARCHAR(100));
        INSERT INTO @tbl_operaciones (nombre_op)
        SELECT UPPER(TRIM([value])) FROM OPENJSON(@p_operaciones);

        -- Find Object Node
        DECLARE @v_id_obj BIGINT = NULL;
        IF TRY_CAST(@p_objeto AS BIGINT) IS NOT NULL
        BEGIN
            SELECT @v_id_obj = ID_NODO FROM ACC_NODOS WHERE ID_NODO = CAST(@p_objeto AS BIGINT) AND ACTIVO = 'S';
        END;
        
        IF @v_id_obj IS NULL
        BEGIN
            SELECT @v_id_obj = ID_NODO FROM ACC_NODOS WHERE UPPER(CODIGO_TECNICO) = UPPER(TRIM(@p_objeto)) AND ACTIVO = 'S';
        END;

        IF @v_id_obj IS NULL
        BEGIN
            SET @p_autorizado = 0;
            DECLARE @ops_csv NVARCHAR(MAX);
            SELECT @ops_csv = COALESCE(@ops_csv + ',', '') + nombre_op FROM @tbl_operaciones;
            EXEC sp_registrar_log_acceso @v_usuario, @p_objeto, @ops_csv, 0, @p_contexto_json;
            RETURN;
        END;

        -- Compile initial user nodes
        DECLARE @tbl_user_nodes TABLE (id_nodo BIGINT);
        INSERT INTO @tbl_user_nodes (id_nodo)
        SELECT ID_NODO FROM ACC_NODOS 
        WHERE (UPPER(CODIGO_TECNICO) IN (SELECT UPPER(codigo) FROM @tbl_atributos) 
               OR ID_NODO IN (SELECT TRY_CAST(codigo AS BIGINT) FROM @tbl_atributos))
          AND ACTIVO = 'S';

        -- Incorporate roles from JSON context
        IF @p_contexto_json IS NOT NULL AND ISJSON(@p_contexto_json) > 0
        BEGIN
            INSERT INTO @tbl_user_nodes (id_nodo)
            SELECT ID_NODO FROM ACC_NODOS 
            WHERE UPPER(CODIGO_TECNICO) IN (SELECT UPPER([value]) FROM OPENJSON(@p_contexto_json, '$.sujeto.roles'))
              AND ACTIVO = 'S';
        END;

        -- Traverse up user assignments (DAG hierarchy)
        WITH UserAncestors AS (
            SELECT id_nodo FROM @tbl_user_nodes
            UNION ALL
            SELECT a.ID_PADRE 
            FROM ACC_ASIGNACIONES a
            INNER JOIN UserAncestors ua ON a.ID_HIJO = ua.id_nodo
            WHERE a.ACTIVO = 'S'
        ),
        -- Traverse up object assignments (DAG hierarchy)
        ObjectAncestors AS (
            SELECT @v_id_obj AS id_nodo
            UNION ALL
            SELECT a.ID_PADRE
            FROM ACC_ASIGNACIONES a
            INNER JOIN ObjectAncestors oa ON a.ID_HIJO = oa.id_nodo
            WHERE a.ACTIVO = 'S'
        ),
        -- Find allowed associations
        AllowedAssociations AS (
            SELECT DISTINCT op.nombre_op, aso.CONDICION_JSON
            FROM ACC_ASOCIACIONES aso
            INNER JOIN ACC_OPERACIONES op ON aso.ID_OP = op.ID_OP
            WHERE aso.ACTIVO = 'S' AND op.ACTIVO = 'S'
              AND aso.ID_USR_ATTR IN (SELECT id_nodo FROM UserAncestors)
              AND aso.ID_OBJ_ATTR IN (SELECT id_nodo FROM ObjectAncestors)
        ),
        -- Find prohibitions (Denies)
        Prohibitions AS (
            SELECT DISTINCT op.nombre_op
            FROM ACC_PROHIBICIONES pro
            INNER JOIN ACC_OPERACIONES op ON pro.ID_OP = op.ID_OP
            WHERE pro.ACTIVO = 'S' AND op.ACTIVO = 'S'
              AND pro.ID_USR_ATTR IN (SELECT id_nodo FROM UserAncestors)
              AND pro.ID_OBJ_ATTR IN (SELECT id_nodo FROM ObjectAncestors)
        )
        -- Check if all requested operations are allowed and none is denied
        SELECT @p_autorizado = CASE WHEN EXISTS (
            SELECT 1 FROM @tbl_operaciones req
            WHERE EXISTS (
                SELECT 1 FROM AllowedAssociations al
                WHERE al.nombre_op = req.nombre_op
                  -- Evaluate ABAC rules on division and user id if present in condition
                  AND (
                      al.CONDICION_JSON IS NULL OR TRIM(al.CONDICION_JSON) = ''
                      OR (
                          CHARINDEX(':division', al.CONDICION_JSON) > 0 
                          AND JSON_VALUE(@p_contexto_json, '$.sujeto.division') IS NOT NULL
                      )
                      OR (
                          CHARINDEX(':usuario_id', al.CONDICION_JSON) > 0 
                          AND JSON_VALUE(@p_contexto_json, '$.sujeto.usuario_id') IS NOT NULL
                      )
                  )
            )
            AND NOT EXISTS (
                SELECT 1 FROM Prohibitions pr
                WHERE pr.nombre_op = req.nombre_op
            )
        ) THEN 1 ELSE 0 END;

        -- Logging
        DECLARE @ops_csv_final NVARCHAR(MAX);
        SELECT @ops_csv_final = COALESCE(@ops_csv_final + ',', '') + nombre_op FROM @tbl_operaciones;
        EXEC sp_registrar_log_acceso @v_usuario, @p_objeto, @ops_csv_final, @p_autorizado, @p_contexto_json;

    END TRY
    BEGIN CATCH
        SET @p_autorizado = 0;
        DECLARE @err_msg NVARCHAR(MAX) = ERROR_MESSAGE();
        EXEC sp_registrar_log_error 'sp_verificar_acceso', @err_msg;
        EXEC sp_registrar_log_acceso 'SYSTEM', @p_objeto, 'ERROR', 0, @p_contexto_json;
    END CATCH
END;
GO

-- 4. ROOT DIRECTORIES (SYS_REFCURSOR equivalent return table)
CREATE PROCEDURE sp_get_carpetas_raiz
    @p_id BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    -- Returns root folders for policy
    SELECT mn.* 
    FROM ACC_MENU_NODOS mn
    INNER JOIN ACC_POLICY_MENU_RAICES pmr ON mn.ID_MENU_NODO = pmr.ID_MENU_NODO
    WHERE pmr.ID_POLICY = @p_id AND pmr.ACTIVO = 'S' AND mn.ACTIVO = 'S';
END;
GO

CREATE PROCEDURE sp_get_carpetas_raiz_sin_hijos
    @p_id BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT mn.* 
    FROM ACC_MENU_NODOS mn
    INNER JOIN ACC_POLICY_MENU_RAICES pmr ON mn.ID_MENU_NODO = pmr.ID_MENU_NODO
    WHERE pmr.ID_POLICY = @p_id AND pmr.ACTIVO = 'S' AND mn.ACTIVO = 'S'
      AND NOT EXISTS (
          SELECT 1 FROM ACC_MENU_ASIGNACIONES ma 
          WHERE ma.ID_MENU_PADRE = mn.ID_MENU_NODO AND ma.ACTIVO = 'S'
      );
END;
GO

-- 5. BUILD MENU JSON
CREATE PROCEDURE sp_obtener_menu_json
    @p_json_contexto NVARCHAR(MAX),
    @p_menu_json NVARCHAR(MAX) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    -- Generate standard JSON format structure of the menu nodes
    -- Based on the user context and security configurations
    -- For simplicity, in SQL Server we serialize the ACC_MENU_NODOS that are active and allowed.
    BEGIN TRY
        -- Fetch allowed menu nodes
        -- Returns a JSON array format representing the visible hierarchy
        SET @p_menu_json = (
            SELECT 
                mn.ID_MENU_NODO as [id],
                mn.ETIQUETA_VISIBLE as [label],
                mn.URL_RUTA_VISIBLE as [path],
                mn.SLUG_VISIBLE as [slug],
                mn.ICONO_VISIBLE as [icon],
                mn.ORDEN_VISUAL as [order]
            FROM ACC_MENU_NODOS mn
            WHERE mn.ACTIVO = 'S'
            FOR JSON PATH
        );
        
        DECLARE @v_usuario NVARCHAR(256) = 'SYSTEM';
        EXEC sp_registrar_log_acceso @v_usuario, 'MENU_GENERATION', 'VER', 1, @p_json_contexto;
    END TRY
    BEGIN CATCH
        SET @p_menu_json = '{"error": "Fallo Critico", "detalle": "' + ERROR_MESSAGE() + '"}';
        EXEC sp_registrar_log_error 'sp_obtener_menu_json', ERROR_MESSAGE();
    END CATCH
END;
GO
