-- ==========================================
-- SQL SERVER PROCEDURES: SEGURIDAD ADMIN (CRUD)
-- ==========================================

-- 1. UPSERT OPERACION
CREATE PROCEDURE sp_upsert_operacion
    @p_nombre_op NVARCHAR(100),
    @p_desc NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    MERGE INTO ACC_OPERACIONES AS target
    USING (SELECT UPPER(TRIM(@p_nombre_op)) AS nombre_op) AS source
    ON (target.NOMBRE_OP = source.nombre_op)
    WHEN MATCHED THEN
        UPDATE SET DESCRIPCION = COALESCE(@p_desc, target.DESCRIPCION),
                   ACTIVO = 'S',
                   FECHA_MODIFICACION = GETDATE(),
                   MODIFICADO_POR = SYSTEM_USER
    WHEN NOT MATCHED THEN
        INSERT (NOMBRE_OP, DESCRIPCION, ACTIVO, CREADO_POR, FECHA_CREACION)
        VALUES (source.nombre_op, @p_desc, 'S', SYSTEM_USER, GETDATE());
END;
GO

-- 2. UPSERT TIPO NODO
CREATE PROCEDURE sp_upsert_tipo_nodo
    @p_codigo NVARCHAR(50),
    @p_desc NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    MERGE INTO ACC_TIPOS_NODO AS target
    USING (SELECT UPPER(TRIM(@p_codigo)) AS codigo) AS source
    ON (target.CODIGO_TIPO = source.codigo)
    WHEN MATCHED THEN
        UPDATE SET DESCRIPCION = COALESCE(@p_desc, target.DESCRIPCION),
                   ACTIVO = 'S',
                   FECHA_MODIFICACION = GETDATE(),
                   MODIFICADO_POR = SYSTEM_USER
    WHEN NOT MATCHED THEN
        INSERT (CODIGO_TIPO, DESCRIPCION, ACTIVO, CREADO_POR, FECHA_CREACION)
        VALUES (source.codigo, @p_desc, 'S', SYSTEM_USER, GETDATE());
END;
GO

-- 3. UPSERT NODO (Basic and Extended signatures)
CREATE PROCEDURE sp_upsert_nodo
    @p_id_nodo BIGINT = NULL,
    @p_codigo NVARCHAR(255),
    @p_etiqueta NVARCHAR(500),
    @p_id_tipo_nodo BIGINT,
    @p_ruta NVARCHAR(1000) = NULL,
    @p_slug NVARCHAR(500) = NULL,
    @p_icono NVARCHAR(100) = NULL,
    @p_descripcion NVARCHAR(1000) = NULL,
    @p_orden_visual INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    IF @p_id_nodo IS NOT NULL AND EXISTS (SELECT 1 FROM ACC_NODOS WHERE ID_NODO = @p_id_nodo)
    BEGIN
        UPDATE ACC_NODOS
        SET CODIGO_TECNICO = @p_codigo,
            ETIQUETA = @p_etiqueta,
            ID_TIPO_NODO = @p_id_tipo_nodo,
            URL_RUTA = @p_ruta,
            SLUG = @p_slug,
            ICONO = @p_icono,
            DESCRIPCION = @p_descripcion,
            ORDEN_VISUAL = @p_orden_visual,
            ACTIVO = 'S',
            FECHA_MODIFICACION = GETDATE(),
            MODIFICADO_POR = SYSTEM_USER
        WHERE ID_NODO = @p_id_nodo;
    END
    ELSE
    BEGIN
        MERGE INTO ACC_NODOS AS target
        USING (SELECT UPPER(TRIM(@p_codigo)) AS codigo) AS source
        ON (target.CODIGO_TECNICO = source.codigo)
        WHEN MATCHED THEN
            UPDATE SET ETIQUETA = @p_etiqueta,
                       ID_TIPO_NODO = @p_id_tipo_nodo,
                       URL_RUTA = @p_ruta,
                       SLUG = @p_slug,
                       ICONO = @p_icono,
                       DESCRIPCION = @p_descripcion,
                       ORDEN_VISUAL = @p_orden_visual,
                       ACTIVO = 'S',
                       FECHA_MODIFICACION = GETDATE(),
                       MODIFICADO_POR = SYSTEM_USER
        WHEN NOT MATCHED THEN
            INSERT (CODIGO_TECNICO, ETIQUETA, ID_TIPO_NODO, URL_RUTA, SLUG, ICONO, DESCRIPCION, ORDEN_VISUAL, ACTIVO, CREADO_POR, FECHA_CREACION)
            VALUES (source.codigo, @p_etiqueta, @p_id_tipo_nodo, @p_ruta, @p_slug, @p_icono, @p_descripcion, @p_orden_visual, 'S', SYSTEM_USER, GETDATE());
    END;
END;
GO

-- 4. UPSERT ROL
CREATE PROCEDURE sp_upsert_rol
    @p_id_rol BIGINT = NULL,
    @p_codigo NVARCHAR(50),
    @p_nombre NVARCHAR(100),
    @p_descripcion NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF @p_id_rol IS NOT NULL AND EXISTS (SELECT 1 FROM ACC_ROLES WHERE ID_ROL = @p_id_rol)
    BEGIN
        UPDATE ACC_ROLES
        SET CODIGO = UPPER(TRIM(@p_codigo)),
            NOMBRE = @p_nombre,
            DESCRIPCION = @p_descripcion,
            FECHA_MODIFICACION = GETDATE(),
            MODIFICADO_POR = SYSTEM_USER
        WHERE ID_ROL = @p_id_rol;
    END
    ELSE
    BEGIN
        MERGE INTO ACC_ROLES AS target
        USING (SELECT UPPER(TRIM(@p_codigo)) AS codigo) AS source
        ON (target.CODIGO = source.codigo)
        WHEN MATCHED THEN
            UPDATE SET NOMBRE = @p_nombre,
                       DESCRIPCION = @p_descripcion,
                       FECHA_MODIFICACION = GETDATE(),
                       MODIFICADO_POR = SYSTEM_USER
        WHEN NOT MATCHED THEN
            INSERT (CODIGO, NOMBRE, DESCRIPCION, CREADO_POR, FECHA_CREACION)
            VALUES (source.codigo, @p_nombre, @p_descripcion, SYSTEM_USER, GETDATE());
    END;
END;
GO

-- 5. LINK NODES (ENLAZAR NODOS)
CREATE PROCEDURE sp_enlazar_nodos
    @p_id_padre BIGINT,
    @p_id_hijo BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    MERGE INTO ACC_ASIGNACIONES AS target
    USING (SELECT @p_id_padre AS padre, @p_id_hijo AS hijo) AS source
    ON (target.ID_PADRE = source.padre AND target.ID_HIJO = source.hijo)
    WHEN MATCHED THEN
        UPDATE SET ACTIVO = 'S', FECHA_MODIFICACION = GETDATE(), MODIFICADO_POR = SYSTEM_USER
    WHEN NOT MATCHED THEN
        INSERT (ID_PADRE, ID_HIJO, ACTIVO, CREADO_POR, FECHA_CREACION)
        VALUES (source.padre, source.hijo, 'S', SYSTEM_USER, GETDATE());
END;
GO

CREATE PROCEDURE sp_enlazar_nodos_por_codigo
    @p_cod_padre NVARCHAR(255),
    @p_cod_hijo NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @id_padre BIGINT = NULL;
    DECLARE @id_hijo BIGINT = NULL;
    
    SELECT @id_padre = ID_NODO FROM ACC_NODOS WHERE UPPER(CODIGO_TECNICO) = UPPER(TRIM(@p_cod_padre)) AND ACTIVO = 'S';
    SELECT @id_hijo = ID_NODO FROM ACC_NODOS WHERE UPPER(CODIGO_TECNICO) = UPPER(TRIM(@p_cod_hijo)) AND ACTIVO = 'S';
    
    IF @id_padre IS NOT NULL AND @id_hijo IS NOT NULL
    BEGIN
        EXEC sp_enlazar_nodos @id_padre, @id_hijo;
    END;
END;
GO

-- 6. GRANT PERMISSION (OTORGAR PERMISO)
CREATE PROCEDURE sp_otorgar_permiso
    @p_id_usr BIGINT,
    @p_id_obj BIGINT,
    @p_id_op BIGINT,
    @p_condicion_js NVARCHAR(2000) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    MERGE INTO ACC_ASOCIACIONES AS target
    USING (SELECT @p_id_usr AS usr, @p_id_obj AS obj, @p_id_op AS op) AS source
    ON (target.ID_USR_ATTR = source.usr AND target.ID_OBJ_ATTR = source.obj AND target.ID_OP = source.op)
    WHEN MATCHED THEN
        UPDATE SET CONDICION_JSON = @p_condicion_js,
                   ACTIVO = 'S',
                   FECHA_MODIFICACION = GETDATE(),
                   MODIFICADO_POR = SYSTEM_USER
    WHEN NOT MATCHED THEN
        INSERT (ID_USR_ATTR, ID_OBJ_ATTR, ID_OP, CONDICION_JSON, ACTIVO, CREADO_POR, FECHA_CREACION)
        VALUES (source.usr, source.obj, source.op, @p_condicion_js, 'S', SYSTEM_USER, GETDATE());
END;
GO

-- 7. DENY PERMISSION (PROHIBICIONES)
CREATE PROCEDURE sp_denegar_permiso
    @p_id_usr BIGINT,
    @p_id_obj BIGINT,
    @p_id_op BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    MERGE INTO ACC_PROHIBICIONES AS target
    USING (SELECT @p_id_usr AS usr, @p_id_obj AS obj, @p_id_op AS op) AS source
    ON (target.ID_USR_ATTR = source.usr AND target.ID_OBJ_ATTR = source.obj AND target.ID_OP = source.op)
    WHEN MATCHED THEN
        UPDATE SET ACTIVO = 'S', FECHA_MODIFICACION = GETDATE(), MODIFICADO_POR = SYSTEM_USER
    WHEN NOT MATCHED THEN
        INSERT (ID_USR_ATTR, ID_OBJ_ATTR, ID_OP, ACTIVO, CREADO_POR, FECHA_CREACION)
        VALUES (source.usr, source.obj, source.op, 'S', SYSTEM_USER, GETDATE());
END;
GO

-- 8. REVOKES & DELETIONS
CREATE PROCEDURE sp_desactivar_nodo
    @p_id BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE ACC_NODOS
    SET ACTIVO = 'N', FECHA_ELIMINACION = GETDATE(), ELIMINADO_POR = SYSTEM_USER
    WHERE ID_NODO = @p_id;
END;
GO

CREATE PROCEDURE sp_eliminar_enlace
    @p_id_padre BIGINT,
    @p_id_hijo BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE ACC_ASIGNACIONES
    SET ACTIVO = 'N', FECHA_ELIMINACION = GETDATE(), ELIMINADO_POR = SYSTEM_USER
    WHERE ID_PADRE = @p_id_padre AND ID_HIJO = @p_id_hijo;
END;
GO

CREATE PROCEDURE sp_revocar_permiso
    @p_id_usr BIGINT,
    @p_id_obj BIGINT,
    @p_id_op BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE ACC_ASOCIACIONES
    SET ACTIVO = 'N', FECHA_ELIMINACION = GETDATE(), ELIMINADO_POR = SYSTEM_USER
    WHERE ID_USR_ATTR = @p_id_usr AND ID_OBJ_ATTR = @p_id_obj AND ID_OP = @p_id_op;
END;
GO

-- 9. CLONING HIERARCHY
CREATE PROCEDURE sp_clonar_jerarquia
    @p_id_destino BIGINT,
    @p_id_origen BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    -- Clone all assignments from origen to destino
    INSERT INTO ACC_ASIGNACIONES (ID_PADRE, ID_HIJO, ACTIVO, CREADO_POR, FECHA_CREACION)
    SELECT @p_id_destino, ID_HIJO, 'S', SYSTEM_USER, GETDATE()
    FROM ACC_ASIGNACIONES
    WHERE ID_PADRE = @p_id_origen AND ACTIVO = 'S'
      AND NOT EXISTS (
          SELECT 1 FROM ACC_ASIGNACIONES 
          WHERE ID_PADRE = @p_id_destino AND ID_HIJO = ACC_ASIGNACIONES.ID_HIJO
      );
END;
GO

-- 10. ADMINISTRATIVE REPORTS / PROCEDURES RETURNING RESULT SETS
CREATE PROCEDURE sp_get_dashboard_stats
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        (SELECT COUNT(*) FROM ACC_NODOS WHERE ACTIVO = 'S') AS ActiveNodes,
        (SELECT COUNT(*) FROM ACC_ASIGNACIONES WHERE ACTIVO = 'S') AS TotalAssignments,
        (SELECT COUNT(*) FROM ACC_ASOCIACIONES WHERE ACTIVO = 'S') AS TotalAssociations,
        (SELECT COUNT(*) FROM ACC_PROHIBICIONES WHERE ACTIVO = 'S') AS TotalProhibitions,
        (SELECT COUNT(*) FROM SAFI_USUARIOS WHERE ACTIVO = 'S') AS ActiveSafiUsers;
END;
GO

CREATE PROCEDURE sp_get_nodos_activos
AS
BEGIN
    SET NOCOUNT ON;
    SELECT n.*, t.CODIGO_TIPO 
    FROM ACC_NODOS n
    INNER JOIN ACC_TIPOS_NODO t ON n.ID_TIPO_NODO = t.ID_TIPO_NODO
    WHERE n.ACTIVO = 'S';
END;
GO

CREATE PROCEDURE sp_get_roles
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM ACC_ROLES;
END;
GO
