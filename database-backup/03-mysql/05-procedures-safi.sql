-- ==========================================
-- MYSQL PROCEDURES: SAFI ADMIN
-- ==========================================

DELIMITER $$

-- 1. CREATE USUARIO
CREATE PROCEDURE sp_crear_usuario(
    IN p_slug_usuario VARCHAR(100),
    IN p_rut BIGINT,
    IN p_dv VARCHAR(1),
    IN p_nombres VARCHAR(100),
    IN p_apellidos VARCHAR(100),
    IN p_email VARCHAR(150),
    OUT p_out_id BIGINT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        -- Raise application error for duplicate values (MySQL 1062 error)
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El RUT o el Slug ya se encuentran registrados en SAFI.';
    END;

    START TRANSACTION;
    
    INSERT INTO SAFI_USUARIOS (SLUG_USUARIO, RUT, DV, NOMBRES, APELLIDOS, EMAIL, ACTIVO, CREADO_POR, FECHA_CREACION)
    VALUES (p_slug_usuario, p_rut, p_dv, p_nombres, p_apellidos, p_email, 'S', CURRENT_USER(), NOW());
    
    SET p_out_id = LAST_INSERT_ID();

    -- Provision corresponding security node in ACC_NODOS (User type ID is 3)
    INSERT INTO ACC_NODOS (CODIGO_TECNICO, ETIQUETA, ID_TIPO_NODO, ACTIVO, CREADO_POR, FECHA_CREACION)
    VALUES (CONCAT('USR_', p_out_id), CONCAT(p_nombres, ' ', p_apellidos), 3, 'S', CURRENT_USER(), NOW());

    COMMIT;
END$$

-- 2. DESACTIVAR USUARIO
CREATE PROCEDURE sp_desactivar_usuario(
    IN p_id_usuario BIGINT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
    END;

    START TRANSACTION;
    
    UPDATE SAFI_USUARIOS
    SET ACTIVO = 'N', FECHA_ELIMINACION = NOW(), ELIMINADO_POR = CURRENT_USER()
    WHERE ID_USUARIO = p_id_usuario;

    -- Desactivar también su nodo de seguridad
    UPDATE ACC_NODOS
    SET ACTIVO = 'N', FECHA_ELIMINACION = NOW(), ELIMINADO_POR = CURRENT_USER()
    WHERE CODIGO_TECNICO = CONCAT('USR_', p_id_usuario);

    COMMIT;
END$$

-- 3. CREATE UNIDAD
CREATE PROCEDURE sp_crear_unidad(
    IN p_codigo VARCHAR(100),
    IN p_slug_unidad VARCHAR(100),
    IN p_nombre_unidad VARCHAR(255),
    IN p_descripcion VARCHAR(500),
    OUT p_out_id BIGINT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
    END;

    START TRANSACTION;
    
    INSERT INTO SAFI_UNIDADES (CODIGO, SLUG_UNIDAD, NOMBRE_UNIDAD, DESCRIPCION, ACTIVO, CREADO_POR, FECHA_CREACION)
    VALUES (p_codigo, p_slug_unidad, p_nombre_unidad, p_descripcion, 'S', CURRENT_USER(), NOW());
    
    SET p_out_id = LAST_INSERT_ID();

    -- Provision corresponding security node in ACC_NODOS (Unit attribute type ID is 2)
    INSERT INTO ACC_NODOS (CODIGO_TECNICO, ETIQUETA, ID_TIPO_NODO, ACTIVO, CREADO_POR, FECHA_CREACION)
    VALUES (CONCAT('UA_', p_codigo), p_nombre_unidad, 2, 'S', CURRENT_USER(), NOW());

    COMMIT;
END$$

-- 4. CREATE ENTIDAD
CREATE PROCEDURE sp_crear_entidad(
    IN p_codigo VARCHAR(100),
    IN p_slug_entidad VARCHAR(100),
    IN p_nombre_entidad VARCHAR(255),
    IN p_tipo_entidad VARCHAR(50),
    OUT p_out_id BIGINT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
    END;

    START TRANSACTION;
    
    INSERT INTO SAFI_ENTIDADES (CODIGO, SLUG_ENTIDAD, NOMBRE_ENTIDAD, TIPO_ENTIDAD, ACTIVO, CREADO_POR, FECHA_CREACION)
    VALUES (p_codigo, p_slug_entidad, p_nombre_entidad, p_tipo_entidad, 'S', CURRENT_USER(), NOW());
    
    SET p_out_id = LAST_INSERT_ID();

    -- Provision corresponding security node in ACC_NODOS
    INSERT INTO ACC_NODOS (CODIGO_TECNICO, ETIQUETA, ID_TIPO_NODO, ACTIVO, CREADO_POR, FECHA_CREACION)
    VALUES (CONCAT('ENT_', p_codigo), p_nombre_entidad, 2, 'S', CURRENT_USER(), NOW());

    COMMIT;
END$$

-- 5. BINDINGS (VINCULOS)
CREATE PROCEDURE sp_vincular_usuario_unidad(
    IN p_id_usuario BIGINT,
    IN p_id_unidad BIGINT
)
BEGIN
    DECLARE v_u_code VARCHAR(100);
    DECLARE v_usr_node BIGINT;
    DECLARE v_uni_node BIGINT;
    
    INSERT INTO SAFI_USUARIOS_UNIDADES (ID_USUARIO, ID_UNIDAD, ACTIVO, CREADO_POR, FECHA_CREACION)
    VALUES (p_id_usuario, p_id_unidad, 'S', CURRENT_USER(), NOW())
    ON DUPLICATE KEY UPDATE
        ACTIVO = 'S', FECHA_MODIFICACION = NOW(), MODIFICADO_POR = CURRENT_USER();

    -- Link user node under unit attribute node in access control hierarchy
    SELECT CODIGO INTO v_u_code FROM SAFI_UNIDADES WHERE ID_UNIDAD = p_id_unidad;
    SELECT ID_NODO INTO v_usr_node FROM ACC_NODOS WHERE CODIGO_TECNICO = CONCAT('USR_', p_id_usuario) AND ACTIVO = 'S';
    SELECT ID_NODO INTO v_uni_node FROM ACC_NODOS WHERE CODIGO_TECNICO = CONCAT('UA_', v_u_code) AND ACTIVO = 'S';

    IF v_usr_node IS NOT NULL AND v_uni_node IS NOT NULL THEN
        CALL sp_enlazar_nodos(v_uni_node, v_usr_node);
    END IF;
END$$

CREATE PROCEDURE sp_desvincular_usuario_unidad(
    IN p_id_usuario BIGINT,
    IN p_id_unidad BIGINT
)
BEGIN
    DECLARE v_u_code VARCHAR(100);
    DECLARE v_usr_node BIGINT;
    DECLARE v_uni_node BIGINT;
    
    UPDATE SAFI_USUARIOS_UNIDADES
    SET ACTIVO = 'N', FECHA_ELIMINACION = NOW(), ELIMINADO_POR = CURRENT_USER()
    WHERE ID_USUARIO = p_id_usuario AND ID_UNIDAD = p_id_unidad;

    -- Revoke link in security graph
    SELECT CODIGO INTO v_u_code FROM SAFI_UNIDADES WHERE ID_UNIDAD = p_id_unidad;
    SELECT ID_NODO INTO v_usr_node FROM ACC_NODOS WHERE CODIGO_TECNICO = CONCAT('USR_', p_id_usuario);
    SELECT ID_NODO INTO v_uni_node FROM ACC_NODOS WHERE CODIGO_TECNICO = CONCAT('UA_', v_u_code);

    IF v_usr_node IS NOT NULL AND v_uni_node IS NOT NULL THEN
        CALL sp_eliminar_enlace(v_uni_node, v_usr_node);
    END IF;
END$$

-- 6. SEARCH LISTINGS
CREATE PROCEDURE sp_get_safi_usuarios()
BEGIN
    SELECT * FROM SAFI_USUARIOS WHERE ACTIVO = 'S';
END$$

CREATE PROCEDURE sp_get_safi_entidades()
BEGIN
    SELECT * FROM SAFI_ENTIDADES WHERE ACTIVO = 'S';
END$$

CREATE PROCEDURE sp_get_safi_unidades()
BEGIN
    SELECT * FROM SAFI_UNIDADES WHERE ACTIVO = 'S';
END$$

DELIMITER ;
