-- ==========================================
-- MARIADB PROCEDURES: SEGURIDAD ADMIN
-- ==========================================

DELIMITER $$

-- 1. UPSERT OPERACION
CREATE PROCEDURE sp_upsert_operacion(
    IN p_nombre_op VARCHAR(100),
    IN p_desc VARCHAR(255)
)
BEGIN
    INSERT INTO ACC_OPERACIONES (NOMBRE_OP, DESCRIPCION, ACTIVO, CREADO_POR, FECHA_CREACION)
    VALUES (UPPER(TRIM(p_nombre_op)), p_desc, 'S', CURRENT_USER(), NOW())
    ON DUPLICATE KEY UPDATE
        DESCRIPCION = COALESCE(p_desc, DESCRIPCION),
        ACTIVO = 'S',
        FECHA_MODIFICACION = NOW(),
        MODIFICADO_POR = CURRENT_USER();
END$$

-- 2. UPSERT TIPO NODO
CREATE PROCEDURE sp_upsert_tipo_nodo(
    IN p_codigo VARCHAR(50),
    IN p_desc VARCHAR(255)
)
BEGIN
    INSERT INTO ACC_TIPOS_NODO (CODIGO_TIPO, DESCRIPCION, ACTIVO, CREADO_POR, FECHA_CREACION)
    VALUES (UPPER(TRIM(p_codigo)), p_desc, 'S', CURRENT_USER(), NOW())
    ON DUPLICATE KEY UPDATE
        DESCRIPCION = COALESCE(p_desc, DESCRIPCION),
        ACTIVO = 'S',
        FECHA_MODIFICACION = NOW(),
        MODIFICADO_POR = CURRENT_USER();
END$$

-- 3. UPSERT NODO
CREATE PROCEDURE sp_upsert_nodo(
    IN p_id_nodo BIGINT,
    IN p_codigo VARCHAR(255),
    IN p_etiqueta VARCHAR(500),
    IN p_id_tipo_nodo BIGINT,
    IN p_ruta VARCHAR(1000),
    IN p_slug VARCHAR(500),
    IN p_icono VARCHAR(100),
    IN p_descripcion VARCHAR(1000),
    IN p_orden_visual INT
)
BEGIN
    IF p_id_nodo IS NOT NULL AND EXISTS (SELECT 1 FROM ACC_NODOS WHERE ID_NODO = p_id_nodo) THEN
        UPDATE ACC_NODOS
        SET CODIGO_TECNICO = p_codigo,
            ETIQUETA = p_etiqueta,
            ID_TIPO_NODO = p_id_tipo_nodo,
            URL_RUTA = p_ruta,
            SLUG = p_slug,
            ICONO = p_icono,
            DESCRIPCION = p_descripcion,
            ORDEN_VISUAL = p_orden_visual,
            ACTIVO = 'S',
            FECHA_MODIFICACION = NOW(),
            MODIFICADO_POR = CURRENT_USER()
        WHERE ID_NODO = p_id_nodo;
    ELSE
        INSERT INTO ACC_NODOS (CODIGO_TECNICO, ETIQUETA, ID_TIPO_NODO, URL_RUTA, SLUG, ICONO, DESCRIPCION, ORDEN_VISUAL, ACTIVO, CREADO_POR, FECHA_CREACION)
        VALUES (UPPER(TRIM(p_codigo)), p_etiqueta, p_id_tipo_nodo, p_ruta, p_slug, p_icono, p_descripcion, p_orden_visual, 'S', CURRENT_USER(), NOW())
        ON DUPLICATE KEY UPDATE
            ETIQUETA = p_etiqueta,
            ID_TIPO_NODO = p_id_tipo_nodo,
            URL_RUTA = p_ruta,
            SLUG = p_slug,
            ICONO = p_icono,
            DESCRIPCION = p_descripcion,
            ORDEN_VISUAL = p_orden_visual,
            ACTIVO = 'S',
            FECHA_MODIFICACION = NOW(),
            MODIFICADO_POR = CURRENT_USER();
    END IF;
END$$

-- 4. UPSERT ROL
CREATE PROCEDURE sp_upsert_rol(
    IN p_id_rol BIGINT,
    IN p_codigo VARCHAR(50),
    IN p_nombre VARCHAR(100),
    IN p_descripcion VARCHAR(255)
)
BEGIN
    IF p_id_rol IS NOT NULL AND EXISTS (SELECT 1 FROM ACC_ROLES WHERE ID_ROL = p_id_rol) THEN
        UPDATE ACC_ROLES
        SET CODIGO = UPPER(TRIM(p_codigo)),
            NOMBRE = p_nombre,
            DESCRIPCION = p_descripcion,
            FECHA_MODIFICACION = NOW(),
            MODIFICADO_POR = CURRENT_USER()
        WHERE ID_ROL = p_id_rol;
    ELSE
        INSERT INTO ACC_ROLES (CODIGO, NOMBRE, DESCRIPCION, CREADO_POR, FECHA_CREACION)
        VALUES (UPPER(TRIM(p_codigo)), p_nombre, p_descripcion, CURRENT_USER(), NOW())
        ON DUPLICATE KEY UPDATE
            NOMBRE = p_nombre,
            DESCRIPCION = p_descripcion,
            FECHA_MODIFICACION = NOW(),
            MODIFICADO_POR = CURRENT_USER();
    END IF;
END$$

-- 5. LINK NODES
CREATE PROCEDURE sp_enlazar_nodos(
    IN p_id_padre BIGINT,
    IN p_id_hijo BIGINT
)
BEGIN
    INSERT INTO ACC_ASIGNACIONES (ID_PADRE, ID_HIJO, ACTIVO, CREADO_POR, FECHA_CREACION)
    VALUES (p_id_padre, p_id_hijo, 'S', CURRENT_USER(), NOW())
    ON DUPLICATE KEY UPDATE
        ACTIVO = 'S',
        FECHA_MODIFICACION = NOW(),
        MODIFICADO_POR = CURRENT_USER();
END$$

-- 6. GRANT PERMISSION
CREATE PROCEDURE sp_otorgar_permiso(
    IN p_id_usr BIGINT,
    IN p_id_obj BIGINT,
    IN p_id_op BIGINT,
    IN p_condicion_js VARCHAR(2000)
)
BEGIN
    INSERT INTO ACC_ASOCIACIONES (ID_USR_ATTR, ID_OBJ_ATTR, ID_OP, CONDICION_JSON, ACTIVO, CREADO_POR, FECHA_CREACION)
    VALUES (p_id_usr, p_id_obj, p_id_op, p_condicion_js, 'S', CURRENT_USER(), NOW())
    ON DUPLICATE KEY UPDATE
        CONDICION_JSON = p_condicion_js,
        ACTIVO = 'S',
        FECHA_MODIFICACION = NOW(),
        MODIFICADO_POR = CURRENT_USER();
END$$

-- 7. DENY PERMISSION
CREATE PROCEDURE sp_denegar_permiso(
    IN p_id_usr BIGINT,
    IN p_id_obj BIGINT,
    IN p_id_op BIGINT
)
BEGIN
    INSERT INTO ACC_PROHIBICIONES (ID_USR_ATTR, ID_OBJ_ATTR, ID_OP, ACTIVO, CREADO_POR, FECHA_CREACION)
    VALUES (p_id_usr, p_id_obj, p_id_op, 'S', CURRENT_USER(), NOW())
    ON DUPLICATE KEY UPDATE
        ACTIVO = 'S',
        FECHA_MODIFICACION = NOW(),
        MODIFICADO_POR = CURRENT_USER();
END$$

-- 8. REVOKES & DELETIONS
CREATE PROCEDURE sp_desactivar_nodo(
    IN p_id BIGINT
)
BEGIN
    UPDATE ACC_NODOS
    SET ACTIVO = 'N', FECHA_ELIMINACION = NOW(), ELIMINADO_POR = CURRENT_USER()
    WHERE ID_NODO = p_id;
END$$

CREATE PROCEDURE sp_eliminar_enlace(
    IN p_id_padre BIGINT,
    IN p_id_hijo BIGINT
)
BEGIN
    UPDATE ACC_ASIGNACIONES
    SET ACTIVO = 'N', FECHA_ELIMINACION = NOW(), ELIMINADO_POR = CURRENT_USER()
    WHERE ID_PADRE = p_id_padre AND ID_HIJO = p_id_hijo;
END$$

CREATE PROCEDURE sp_revocar_permiso(
    IN p_id_usr BIGINT,
    IN p_id_obj BIGINT,
    IN p_id_op BIGINT
)
BEGIN
    UPDATE ACC_ASOCIACIONES
    SET ACTIVO = 'N', FECHA_ELIMINACION = NOW(), ELIMINADO_POR = CURRENT_USER()
    WHERE ID_USR_ATTR = p_id_usr AND ID_OBJ_ATTR = p_id_obj AND ID_OP = p_id_op;
END$$

-- 9. CLONING HIERARCHY
CREATE PROCEDURE sp_clonar_jerarquia(
    IN p_id_destino BIGINT,
    IN p_id_origen BIGINT
)
BEGIN
    INSERT INTO ACC_ASIGNACIONES (ID_PADRE, ID_HIJO, ACTIVO, CREADO_POR, FECHA_CREACION)
    SELECT p_id_destino, ID_HIJO, 'S', CURRENT_USER(), NOW()
    FROM ACC_ASIGNACIONES
    WHERE ID_PADRE = p_id_origen AND ACTIVO = 'S'
    ON DUPLICATE KEY UPDATE ACTIVO = 'S';
END$$

-- 10. LIST REPORTING PROCEDURES
CREATE PROCEDURE sp_get_dashboard_stats()
BEGIN
    SELECT 
        (SELECT COUNT(*) FROM ACC_NODOS WHERE ACTIVO = 'S') AS ActiveNodes,
        (SELECT COUNT(*) FROM ACC_ASIGNACIONES WHERE ACTIVO = 'S') AS TotalAssignments,
        (SELECT COUNT(*) FROM ACC_ASOCIACIONES WHERE ACTIVO = 'S') AS TotalAssociations,
        (SELECT COUNT(*) FROM ACC_PROHIBICIONES WHERE ACTIVO = 'S') AS TotalProhibitions,
        (SELECT COUNT(*) FROM SAFI_USUARIOS WHERE ACTIVO = 'S') AS ActiveSafiUsers;
END$$

CREATE PROCEDURE sp_get_nodos_activos()
BEGIN
    SELECT n.*, t.CODIGO_TIPO 
    FROM ACC_NODOS n
    INNER JOIN ACC_TIPOS_NODO t ON n.ID_TIPO_NODO = t.ID_TIPO_NODO
    WHERE n.ACTIVO = 'S';
END$$

CREATE PROCEDURE sp_get_roles()
BEGIN
    SELECT * FROM ACC_ROLES;
END$$

DELIMITER ;
