-- ==========================================
-- POSTGRESQL FUNCTIONS: SAFI ADMIN
-- ==========================================

SET search_path TO ngac, public;

-- 1. CREATE USUARIO
CREATE OR REPLACE FUNCTION fn_crear_usuario(
    p_slug_usuario VARCHAR(100),
    p_rut BIGINT,
    p_dv VARCHAR(1),
    p_nombres VARCHAR(100),
    p_apellidos VARCHAR(100),
    p_email VARCHAR(150),
    OUT p_out_id BIGINT
) AS $$
BEGIN
    INSERT INTO SAFI_USUARIOS (SLUG_USUARIO, RUT, DV, NOMBRES, APELLIDOS, EMAIL, ACTIVO, CREADO_POR, FECHA_CREACION)
    VALUES (p_slug_usuario, p_rut, p_dv, p_nombres, p_apellidos, p_email, 'S', CURRENT_USER, CURRENT_TIMESTAMP)
    RETURNING ID_USUARIO INTO p_out_id;

    -- Provision corresponding security node in ACC_NODOS (User type ID is 3)
    INSERT INTO ACC_NODOS (CODIGO_TECNICO, ETIQUETA, ID_TIPO_NODO, ACTIVO, CREADO_POR, FECHA_CREACION)
    VALUES ('USR_' || p_out_id, p_nombres || ' ' || p_apellidos, 3, 'S', CURRENT_USER, CURRENT_TIMESTAMP);

EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'El RUT o el Slug ya se encuentran registrados en SAFI.' USING ERRCODE = '23505';
END;
$$ LANGUAGE plpgsql;

-- 2. DESACTIVAR USUARIO
CREATE OR REPLACE FUNCTION fn_desactivar_usuario(
    p_id_usuario BIGINT
) RETURNS void AS $$
BEGIN
    UPDATE SAFI_USUARIOS
    SET ACTIVO = 'N', FECHA_ELIMINACION = CURRENT_TIMESTAMP, ELIMINADO_POR = CURRENT_USER
    WHERE ID_USUARIO = p_id_usuario;

    -- Desactivar también su nodo de seguridad
    UPDATE ACC_NODOS
    SET ACTIVO = 'N', FECHA_ELIMINACION = CURRENT_TIMESTAMP, ELIMINADO_POR = CURRENT_USER
    WHERE CODIGO_TECNICO = 'USR_' || p_id_usuario;
END;
$$ LANGUAGE plpgsql;

-- 3. CREATE UNIDAD
CREATE OR REPLACE FUNCTION fn_crear_unidad(
    p_codigo VARCHAR(100),
    p_slug_unidad VARCHAR(100),
    p_nombre_unidad VARCHAR(255),
    p_descripcion VARCHAR(500) DEFAULT NULL,
    OUT p_out_id BIGINT
) AS $$
BEGIN
    INSERT INTO SAFI_UNIDADES (CODIGO, SLUG_UNIDAD, NOMBRE_UNIDAD, DESCRIPCION, ACTIVO, CREADO_POR, FECHA_CREACION)
    VALUES (p_codigo, p_slug_unidad, p_nombre_unidad, p_descripcion, 'S', CURRENT_USER, CURRENT_TIMESTAMP)
    RETURNING ID_UNIDAD INTO p_out_id;

    -- Provision corresponding security node in ACC_NODOS (Unit attribute type ID is 2)
    INSERT INTO ACC_NODOS (CODIGO_TECNICO, ETIQUETA, ID_TIPO_NODO, ACTIVO, CREADO_POR, FECHA_CREACION)
    VALUES ('UA_' || p_codigo, p_nombre_unidad, 2, 'S', CURRENT_USER, CURRENT_TIMESTAMP);
END;
$$ LANGUAGE plpgsql;

-- 4. CREATE ENTIDAD
CREATE OR REPLACE FUNCTION fn_crear_entidad(
    p_codigo VARCHAR(100),
    p_slug_entidad VARCHAR(100),
    p_nombre_entidad VARCHAR(255),
    p_tipo_entidad VARCHAR(50),
    OUT p_out_id BIGINT
) AS $$
BEGIN
    INSERT INTO SAFI_ENTIDADES (CODIGO, SLUG_ENTIDAD, NOMBRE_ENTIDAD, TIPO_ENTIDAD, ACTIVO, CREADO_POR, FECHA_CREACION)
    VALUES (p_codigo, p_slug_entidad, p_nombre_entidad, p_tipo_entidad, 'S', CURRENT_USER, CURRENT_TIMESTAMP)
    RETURNING ID_ENTIDAD INTO p_out_id;

    -- Provision corresponding security node in ACC_NODOS
    INSERT INTO ACC_NODOS (CODIGO_TECNICO, ETIQUETA, ID_TIPO_NODO, ACTIVO, CREADO_POR, FECHA_CREACION)
    VALUES ('ENT_' || p_codigo, p_nombre_entidad, 2, 'S', CURRENT_USER, CURRENT_TIMESTAMP);
END;
$$ LANGUAGE plpgsql;

-- 5. BINDINGS (VINCULOS)
CREATE OR REPLACE FUNCTION fn_vincular_usuario_unidad(
    p_id_usuario BIGINT,
    p_id_unidad BIGINT
) RETURNS void AS $$
DECLARE
    v_u_code VARCHAR(100);
    v_usr_node BIGINT;
    v_uni_node BIGINT;
BEGIN
    INSERT INTO SAFI_USUARIOS_UNIDADES (ID_USUARIO, ID_UNIDAD, ACTIVO, CREADO_POR, FECHA_CREACION)
    VALUES (p_id_usuario, p_id_unidad, 'S', CURRENT_USER, CURRENT_TIMESTAMP)
    ON CONFLICT (ID_USUARIO, ID_UNIDAD) DO UPDATE
    SET ACTIVO = 'S', FECHA_MODIFICACION = CURRENT_TIMESTAMP, MODIFICADO_POR = CURRENT_USER;

    -- Link user node under unit attribute node in access control hierarchy
    SELECT CODIGO INTO v_u_code FROM SAFI_UNIDADES WHERE ID_UNIDAD = p_id_unidad;
    SELECT ID_NODO INTO v_usr_node FROM ACC_NODOS WHERE CODIGO_TECNICO = 'USR_' || p_id_usuario AND ACTIVO = 'S';
    SELECT ID_NODO INTO v_uni_node FROM ACC_NODOS WHERE CODIGO_TECNICO = 'UA_' || v_u_code AND ACTIVO = 'S';

    IF v_usr_node IS NOT NULL AND v_uni_node IS NOT NULL THEN
        PERFORM fn_enlazar_nodos(v_uni_node, v_usr_node);
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_desvincular_usuario_unidad(
    p_id_usuario BIGINT,
    p_id_unidad BIGINT
) RETURNS void AS $$
DECLARE
    v_u_code VARCHAR(100);
    v_usr_node BIGINT;
    v_uni_node BIGINT;
BEGIN
    UPDATE SAFI_USUARIOS_UNIDADES
    SET ACTIVO = 'N', FECHA_ELIMINACION = CURRENT_TIMESTAMP, ELIMINADO_POR = CURRENT_USER
    WHERE ID_USUARIO = p_id_usuario AND ID_UNIDAD = p_id_unidad;

    -- Revoke link in security graph
    SELECT CODIGO INTO v_u_code FROM SAFI_UNIDADES WHERE ID_UNIDAD = p_id_unidad;
    SELECT ID_NODO INTO v_usr_node FROM ACC_NODOS WHERE CODIGO_TECNICO = 'USR_' || p_id_usuario;
    SELECT ID_NODO INTO v_uni_node FROM ACC_NODOS WHERE CODIGO_TECNICO = 'UA_' || v_u_code;

    IF v_usr_node IS NOT NULL AND v_uni_node IS NOT NULL THEN
        PERFORM fn_eliminar_enlace(v_uni_node, v_usr_node);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 6. SEARCH LISTINGS
CREATE OR REPLACE FUNCTION fn_get_safi_usuarios()
RETURNS SETOF SAFI_USUARIOS AS $$
BEGIN
    RETURN QUERY SELECT * FROM SAFI_USUARIOS WHERE ACTIVO = 'S';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_get_safi_entidades()
RETURNS SETOF SAFI_ENTIDADES AS $$
BEGIN
    RETURN QUERY SELECT * FROM SAFI_ENTIDADES WHERE ACTIVO = 'S';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_get_safi_unidades()
RETURNS SETOF SAFI_UNIDADES AS $$
BEGIN
    RETURN QUERY SELECT * FROM SAFI_UNIDADES WHERE ACTIVO = 'S';
END;
$$ LANGUAGE plpgsql;
$$;
