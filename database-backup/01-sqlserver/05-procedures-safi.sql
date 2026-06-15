-- ==========================================
-- SQL SERVER PROCEDURES: SAFI ADMIN
-- ==========================================

-- 1. CREATE USUARIO
CREATE PROCEDURE sp_crear_usuario
    @p_slug_usuario NVARCHAR(100),
    @p_rut BIGINT,
    @p_dv NVARCHAR(1),
    @p_nombres NVARCHAR(100),
    @p_apellidos NVARCHAR(100),
    @p_email NVARCHAR(150),
    @p_out_id BIGINT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        INSERT INTO SAFI_USUARIOS (SLUG_USUARIO, RUT, DV, NOMBRES, APELLIDOS, EMAIL, ACTIVO, CREADO_POR, FECHA_CREACION)
        VALUES (@p_slug_usuario, @p_rut, @p_dv, @p_nombres, @p_apellidos, @p_email, 'S', SYSTEM_USER, GETDATE());
        
        SET @p_out_id = SCOPE_IDENTITY();

        -- Provision corresponding security node in ACC_NODOS (User type ID is usually 3)
        INSERT INTO ACC_NODOS (CODIGO_TECNICO, ETIQUETA, ID_TIPO_NODO, ACTIVO, CREADO_POR, FECHA_CREACION)
        VALUES ('USR_' + CAST(@p_out_id AS NVARCHAR(20)), @p_nombres + ' ' + @p_apellidos, 3, 'S', SYSTEM_USER, GETDATE());

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        -- Raise application error for duplicate values
        IF ERROR_NUMBER() IN (2601, 2627)
        BEGIN
            THROW 50001, 'El RUT o el Slug ya se encuentran registrados en SAFI.', 1;
        END
        ELSE
        BEGIN
            THROW;
        END;
    END CATCH
END;
GO

-- 2. DESACTIVAR USUARIO
CREATE PROCEDURE sp_desactivar_usuario
    @p_id_usuario BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        UPDATE SAFI_USUARIOS
        SET ACTIVO = 'N', FECHA_ELIMINACION = GETDATE(), ELIMINADO_POR = SYSTEM_USER
        WHERE ID_USUARIO = @p_id_usuario;

        -- Desactivar también su nodo de seguridad
        UPDATE ACC_NODOS
        SET ACTIVO = 'N', FECHA_ELIMINACION = GETDATE(), ELIMINADO_POR = SYSTEM_USER
        WHERE CODIGO_TECNICO = 'USR_' + CAST(@p_id_usuario AS NVARCHAR(20));

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- 3. CREATE UNIDAD
CREATE PROCEDURE sp_crear_unidad
    @p_codigo NVARCHAR(100),
    @p_slug_unidad NVARCHAR(100),
    @p_nombre_unidad NVARCHAR(255),
    @p_descripcion NVARCHAR(500) = NULL,
    @p_out_id BIGINT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        INSERT INTO SAFI_UNIDADES (CODIGO, SLUG_UNIDAD, NOMBRE_UNIDAD, DESCRIPCION, ACTIVO, CREADO_POR, FECHA_CREACION)
        VALUES (@p_codigo, @p_slug_unidad, @p_nombre_unidad, @p_descripcion, 'S', SYSTEM_USER, GETDATE());
        
        SET @p_out_id = SCOPE_IDENTITY();

        -- Provision corresponding security node in ACC_NODOS (Unit/User Attribute type ID is usually 2 or UA)
        INSERT INTO ACC_NODOS (CODIGO_TECNICO, ETIQUETA, ID_TIPO_NODO, ACTIVO, CREADO_POR, FECHA_CREACION)
        VALUES ('UA_' + @p_codigo, @p_nombre_unidad, 2, 'S', SYSTEM_USER, GETDATE());

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- 4. CREATE ENTIDAD
CREATE PROCEDURE sp_crear_entidad
    @p_codigo NVARCHAR(100),
    @p_slug_entidad NVARCHAR(100),
    @p_nombre_entidad NVARCHAR(255),
    @p_tipo_entidad NVARCHAR(50),
    @p_out_id BIGINT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        INSERT INTO SAFI_ENTIDADES (CODIGO, SLUG_ENTIDAD, NOMBRE_ENTIDAD, TIPO_ENTIDAD, ACTIVO, CREADO_POR, FECHA_CREACION)
        VALUES (@p_codigo, @p_slug_entidad, @p_nombre_entidad, @p_tipo_entidad, 'S', SYSTEM_USER, GETDATE());
        
        SET @p_out_id = SCOPE_IDENTITY();

        -- Provision corresponding security node in ACC_NODOS
        INSERT INTO ACC_NODOS (CODIGO_TECNICO, ETIQUETA, ID_TIPO_NODO, ACTIVO, CREADO_POR, FECHA_CREACION)
        VALUES ('ENT_' + @p_codigo, @p_nombre_entidad, 2, 'S', SYSTEM_USER, GETDATE());

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- 5. BINDINGS (VINCULOS)
CREATE PROCEDURE sp_vincular_usuario_unidad
    @p_id_usuario BIGINT,
    @p_id_unidad BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    MERGE INTO SAFI_USUARIOS_UNIDADES AS target
    USING (SELECT @p_id_usuario AS usr, @p_id_unidad AS uni) AS source
    ON (target.ID_USUARIO = source.usr AND target.ID_UNIDAD = source.uni)
    WHEN MATCHED THEN
        UPDATE SET ACTIVO = 'S', FECHA_MODIFICACION = GETDATE(), MODIFICADO_POR = SYSTEM_USER
    WHEN NOT MATCHED THEN
        INSERT (ID_USUARIO, ID_UNIDAD, ACTIVO, CREADO_POR, FECHA_CREACION)
        VALUES (source.usr, source.uni, 'S', SYSTEM_USER, GETDATE());
        
    -- Assign user node under unit attribute node in access control hierarchy
    DECLARE @u_code NVARCHAR(100);
    SELECT @u_code = CODIGO FROM SAFI_UNIDADES WHERE ID_UNIDAD = @p_id_unidad;
    
    DECLARE @usr_node BIGINT;
    DECLARE @uni_node BIGINT;
    SELECT @usr_node = ID_NODO FROM ACC_NODOS WHERE CODIGO_TECNICO = 'USR_' + CAST(@p_id_usuario AS NVARCHAR(20)) AND ACTIVO = 'S';
    SELECT @uni_node = ID_NODO FROM ACC_NODOS WHERE CODIGO_TECNICO = 'UA_' + @u_code AND ACTIVO = 'S';
    
    IF @usr_node IS NOT NULL AND @uni_node IS NOT NULL
    BEGIN
        EXEC sp_enlazar_nodos @uni_node, @usr_node;
    END;
END;
GO

CREATE PROCEDURE sp_desvincular_usuario_unidad
    @p_id_usuario BIGINT,
    @p_id_unidad BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE SAFI_USUARIOS_UNIDADES
    SET ACTIVO = 'N', FECHA_ELIMINACION = GETDATE(), ELIMINADO_POR = SYSTEM_USER
    WHERE ID_USUARIO = @p_id_usuario AND ID_UNIDAD = @p_id_unidad;
    
    -- Revoke link in security graph
    DECLARE @u_code NVARCHAR(100);
    SELECT @u_code = CODIGO FROM SAFI_UNIDADES WHERE ID_UNIDAD = @p_id_unidad;
    
    DECLARE @usr_node BIGINT;
    DECLARE @uni_node BIGINT;
    SELECT @usr_node = ID_NODO FROM ACC_NODOS WHERE CODIGO_TECNICO = 'USR_' + CAST(@p_id_usuario AS NVARCHAR(20));
    SELECT @uni_node = ID_NODO FROM ACC_NODOS WHERE CODIGO_TECNICO = 'UA_' + @u_code;
    
    IF @usr_node IS NOT NULL AND @uni_node IS NOT NULL
    BEGIN
        EXEC sp_eliminar_enlace @uni_node, @usr_node;
    END;
END;
GO

-- 6. LIST REPORTING PROCEDURES
CREATE PROCEDURE sp_get_safi_usuarios
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM SAFI_USUARIOS WHERE ACTIVO = 'S';
END;
GO

CREATE PROCEDURE sp_get_safi_entidades
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM SAFI_ENTIDADES WHERE ACTIVO = 'S';
END;
GO

CREATE PROCEDURE sp_get_safi_unidades
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM SAFI_UNIDADES WHERE ACTIVO = 'S';
END;
GO
