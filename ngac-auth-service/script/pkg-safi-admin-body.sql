CREATE OR REPLACE PACKAGE BODY NGAC_USER.pkg_safi_admin AS

    PROCEDURE crear_usuario(p_slug_usuario IN VARCHAR2, p_rut IN VARCHAR2, p_nombres IN VARCHAR2, p_apellidos IN VARCHAR2, p_email IN VARCHAR2, p_out_id OUT NUMBER) IS
    BEGIN
        INSERT INTO safi_usuarios (slug_usuario, rut, nombres, apellidos, email)
        VALUES (p_slug_usuario, p_rut, p_nombres, p_apellidos, p_email)
        RETURNING id_usuario INTO p_out_id;
        COMMIT;
    EXCEPTION
        WHEN DUP_VAL_ON_INDEX THEN
            RAISE_APPLICATION_ERROR(-20001, 'El RUT o el Slug ya se encuentran registrados en SAFI.');
    END crear_usuario;

    PROCEDURE desactivar_usuario(p_id_usuario IN NUMBER) IS
    BEGIN
        UPDATE safi_usuarios SET estado = 0 WHERE id_usuario = p_id_usuario;
        UPDATE safi_usuarios_unidades SET estado = 0 WHERE id_usuario = p_id_usuario;
        UPDATE safi_usuarios_entidades SET estado = 0 WHERE id_usuario = p_id_usuario;
        COMMIT;
    END desactivar_usuario;

    PROCEDURE crear_unidad(p_slug_unidad IN VARCHAR2, p_nombre_unidad IN VARCHAR2, p_descripcion IN VARCHAR2, p_out_id OUT NUMBER) IS
    BEGIN
        INSERT INTO safi_unidades (slug_unidad, nombre_unidad, descripcion)
        VALUES (p_slug_unidad, p_nombre_unidad, p_descripcion)
        RETURNING id_unidad INTO p_out_id;
        COMMIT;
    END crear_unidad;

    PROCEDURE crear_entidad(p_slug_entidad IN VARCHAR2, p_nombre_entidad IN VARCHAR2, p_tipo_entidad IN VARCHAR2, p_out_id OUT NUMBER) IS
    BEGIN
        INSERT INTO safi_entidades (slug_entidad, nombre_entidad, tipo_entidad)
        VALUES (p_slug_entidad, p_nombre_entidad, p_tipo_entidad)
        RETURNING id_entidad INTO p_out_id;
        COMMIT;
    END crear_entidad;

    PROCEDURE vincular_usuario_unidad(p_id_usuario IN NUMBER, p_id_unidad IN NUMBER) IS
    BEGIN
        MERGE INTO safi_usuarios_unidades uu
        USING DUAL ON (uu.id_usuario = p_id_usuario AND uu.id_unidad = p_id_unidad)
        WHEN MATCHED THEN UPDATE SET estado = 1
        WHEN NOT MATCHED THEN INSERT (id_usuario, id_unidad) VALUES (p_id_usuario, p_id_unidad);
        COMMIT;
    END vincular_usuario_unidad;

    PROCEDURE desvincular_usuario_unidad(p_id_usuario IN NUMBER, p_id_unidad IN NUMBER) IS
    BEGIN
        UPDATE safi_usuarios_unidades SET estado = 0 WHERE id_usuario = p_id_usuario AND id_unidad = p_id_unidad;
        COMMIT;
    END desvincular_usuario_unidad;

    PROCEDURE vincular_usuario_entidad(p_id_usuario IN NUMBER, p_id_entidad IN NUMBER) IS
    BEGIN
        MERGE INTO safi_usuarios_entidades ue
        USING DUAL ON (ue.id_usuario = p_id_usuario AND ue.id_entidad = p_id_entidad)
        WHEN MATCHED THEN UPDATE SET estado = 1
        WHEN NOT MATCHED THEN INSERT (id_usuario, id_entidad) VALUES (p_id_usuario, p_id_entidad);
        COMMIT;
    END vincular_usuario_entidad;

    PROCEDURE desvincular_usuario_entidad(p_id_usuario IN NUMBER, p_id_entidad IN NUMBER) IS
    BEGIN
        UPDATE safi_usuarios_entidades SET estado = 0 WHERE id_usuario = p_id_usuario AND id_entidad = p_id_entidad;
        COMMIT;
    END desvincular_usuario_entidad;

    PROCEDURE vincular_unidad_entidad(p_id_unidad IN NUMBER, p_id_entidad IN NUMBER) IS
    BEGIN
        MERGE INTO safi_unidades_entidades unie
        USING DUAL ON (unie.id_unidad = p_id_unidad AND unie.id_entidad = p_id_entidad)
        WHEN MATCHED THEN UPDATE SET estado = 1
        WHEN NOT MATCHED THEN INSERT (id_unidad, id_entidad) VALUES (p_id_unidad, p_id_entidad);
        COMMIT;
    END vincular_unidad_entidad;

    PROCEDURE desvincular_unidad_entidad(p_id_unidad IN NUMBER, p_id_entidad IN NUMBER) IS
    BEGIN
        UPDATE safi_unidades_entidades SET estado = 0 WHERE id_unidad = p_id_unidad AND id_entidad = p_id_entidad;
        COMMIT;
    END desvincular_unidad_entidad;

    PROCEDURE inicializar_datos_semilla IS
        v_admin_id NUMBER;
    BEGIN
        crear_usuario(
            p_slug_usuario => 'admin-sys-root-safi',
            p_rut          => '00000000-0',
            p_nombres      => 'Administrador',
            p_apellidos    => 'Sistema SAFI',
            p_email        => 'gjpierp@gmail.com',
            p_out_id       => v_admin_id
        );
        DBMS_OUTPUT.PUT_LINE('Semilla SAFI inicializada correctamente. ID: ' || v_admin_id);
    END inicializar_datos_semilla;

    -- --- ADICIONES PARA FRONTEND/BACKEND CRUD SAFI ---

    FUNCTION fn_get_safi_usuarios RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT id_usuario AS id, (nombres || ' ' || apellidos) AS nombre, email, estado
            FROM safi_usuarios
            ORDER BY id_usuario;
        RETURN v_cursor;
    END fn_get_safi_usuarios;

    FUNCTION fn_get_safi_entidades RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT id_entidad AS id, nombre_entidad AS nombre, slug_entidad AS slug, tipo_entidad AS "desc", estado
            FROM safi_entidades
            ORDER BY id_entidad;
        RETURN v_cursor;
    END fn_get_safi_entidades;

    FUNCTION fn_get_safi_unidades RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT id_unidad AS id, nombre_unidad AS nombre, slug_unidad AS slug, descripcion AS "desc", estado
            FROM safi_unidades
            ORDER BY id_unidad;
        RETURN v_cursor;
    END fn_get_safi_unidades;

    PROCEDURE p_upsert_safi_usuario(p_id IN NUMBER, p_nombre IN VARCHAR2, p_email IN VARCHAR2, p_estado IN NUMBER) IS
        v_nombres VARCHAR2(100);
        v_apellidos VARCHAR2(100);
        v_slug VARCHAR2(100);
        v_pos NUMBER;
    BEGIN
        v_pos := INSTR(p_nombre, ' ');
        IF v_pos > 0 THEN
            v_nombres := SUBSTR(p_nombre, 1, v_pos - 1);
            v_apellidos := SUBSTR(p_nombre, v_pos + 1);
        ELSE
            v_nombres := p_nombre;
            v_apellidos := ' ';
        END IF;

        v_slug := UPPER(REGEXP_REPLACE(p_nombre, '[^A-Za-z0-9]', '_'));

        MERGE INTO safi_usuarios t
        USING (SELECT p_id AS id_usuario FROM dual) s
        ON (t.id_usuario = s.id_usuario)
        WHEN MATCHED THEN
            UPDATE SET t.nombres = v_nombres, t.apellidos = v_apellidos, t.email = p_email, t.estado = p_estado
        WHEN NOT MATCHED THEN
            INSERT (id_usuario, slug_usuario, rut, nombres, apellidos, email, estado)
            VALUES (p_id, v_slug, '00000000-0', v_nombres, v_apellidos, p_email, p_estado);
        COMMIT;
    END p_upsert_safi_usuario;

    PROCEDURE p_delete_safi_usuario(p_id IN NUMBER) IS
    BEGIN
        UPDATE safi_usuarios SET estado = 0, fecha_eliminacion = SYSDATE WHERE id_usuario = p_id;
        COMMIT;
    END p_delete_safi_usuario;

    PROCEDURE p_upsert_safi_entidad(p_id IN NUMBER, p_nombre IN VARCHAR2, p_slug IN VARCHAR2, p_desc IN VARCHAR2, p_estado IN NUMBER) IS
    BEGIN
        MERGE INTO safi_entidades t
        USING (SELECT p_id AS id_entidad FROM dual) s
        ON (t.id_entidad = s.id_entidad)
        WHEN MATCHED THEN
            UPDATE SET t.nombre_entidad = p_nombre, t.slug_entidad = p_slug, t.tipo_entidad = p_desc, t.estado = p_estado
        WHEN NOT MATCHED THEN
            INSERT (id_entidad, slug_entidad, nombre_entidad, tipo_entidad, estado)
            VALUES (p_id, p_slug, p_nombre, p_desc, p_estado);
        COMMIT;
    END p_upsert_safi_entidad;

    PROCEDURE p_delete_safi_entidad(p_id IN NUMBER) IS
    BEGIN
        UPDATE safi_entidades SET estado = 0, fecha_eliminacion = SYSDATE WHERE id_entidad = p_id;
        COMMIT;
    END p_delete_safi_entidad;

    PROCEDURE p_upsert_safi_unidad(p_id IN NUMBER, p_nombre IN VARCHAR2, p_slug IN VARCHAR2, p_desc IN VARCHAR2, p_estado IN NUMBER) IS
    BEGIN
        MERGE INTO safi_unidades t
        USING (SELECT p_id AS id_unidad FROM dual) s
        ON (t.id_unidad = s.id_unidad)
        WHEN MATCHED THEN
            UPDATE SET t.nombre_unidad = p_nombre, t.slug_unidad = p_slug, t.descripcion = p_desc, t.estado = p_estado
        WHEN NOT MATCHED THEN
            INSERT (id_unidad, slug_unidad, nombre_unidad, descripcion, estado)
            VALUES (p_id, p_slug, p_nombre, p_desc, p_estado);
        COMMIT;
    END p_upsert_safi_unidad;

    PROCEDURE p_delete_safi_unidad(p_id IN NUMBER) IS
    BEGIN
        UPDATE safi_unidades SET estado = 0, fecha_eliminacion = SYSDATE WHERE id_unidad = p_id;
        COMMIT;
    END p_delete_safi_unidad;

    -- ================= FUNCIONES DE CONSULTA Y ADMINISTRACIÓN ADICIONALES =================

    FUNCTION fn_get_safi_usuario_by_id(p_id IN NUMBER) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT id_usuario AS id, nombres, apellidos, email, estado
            FROM safi_usuarios
            WHERE id_usuario = p_id;
        RETURN v_cursor;
    END fn_get_safi_usuario_by_id;

    FUNCTION fn_get_safi_entidad_by_id(p_id IN NUMBER) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT id_entidad AS id, nombre_entidad, slug_entidad, tipo_entidad, estado
            FROM safi_entidades
            WHERE id_entidad = p_id;
        RETURN v_cursor;
    END fn_get_safi_entidad_by_id;

    FUNCTION fn_get_safi_unidad_by_id(p_id IN NUMBER) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT id_unidad AS id, nombre_unidad, slug_unidad, descripcion, estado
            FROM safi_unidades
            WHERE id_unidad = p_id;
        RETURN v_cursor;
    END fn_get_safi_unidad_by_id;

    FUNCTION fn_get_entidades_usuario(p_id_usuario IN NUMBER) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT e.id_entidad, e.nombre_entidad, e.slug_entidad, e.tipo_entidad, e.estado
            FROM safi_entidades e
            JOIN safi_usuarios_entidades ue ON ue.id_entidad = e.id_entidad
            WHERE ue.id_usuario = p_id_usuario AND (ue.estado = 1 OR ue.estado IS NULL);
        RETURN v_cursor;
    END fn_get_entidades_usuario;

    FUNCTION fn_get_unidades_usuario(p_id_usuario IN NUMBER) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT u.id_unidad, u.nombre_unidad, u.slug_unidad, u.descripcion, u.estado
            FROM safi_unidades u
            JOIN safi_usuarios_unidades uu ON uu.id_unidad = u.id_unidad
            WHERE uu.id_usuario = p_id_usuario AND (uu.estado = 1 OR uu.estado IS NULL);
        RETURN v_cursor;
    END fn_get_unidades_usuario;

    FUNCTION fn_get_usuarios_entidad(p_id_entidad IN NUMBER) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT u.id_usuario, u.nombres, u.apellidos, u.email, u.estado
            FROM safi_usuarios u
            JOIN safi_usuarios_entidades ue ON ue.id_usuario = u.id_usuario
            WHERE ue.id_entidad = p_id_entidad AND (ue.estado = 1 OR ue.estado IS NULL);
        RETURN v_cursor;
    END fn_get_usuarios_entidad;

    FUNCTION fn_get_usuarios_unidad(p_id_unidad IN NUMBER) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT u.id_usuario, u.nombres, u.apellidos, u.email, u.estado
            FROM safi_usuarios u
            JOIN safi_usuarios_unidades uu ON uu.id_usuario = u.id_usuario
            WHERE uu.id_unidad = p_id_unidad AND (uu.estado = 1 OR uu.estado IS NULL);
        RETURN v_cursor;
    END fn_get_usuarios_unidad;

    FUNCTION fn_get_unidades_de_entidad(p_id_entidad IN NUMBER) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT u.id_unidad AS id, u.nombre_unidad AS nombre, u.slug_unidad AS slug, u.descripcion AS "desc", u.estado
            FROM safi_unidades u
            JOIN safi_unidades_entidades ue ON u.id_unidad = ue.id_unidad
            WHERE ue.id_entidad = p_id_entidad 
              AND (ue.estado = 1 OR ue.estado IS NULL) 
              AND u.estado = 1;
        RETURN v_cursor;
    END fn_get_unidades_de_entidad;

    FUNCTION fn_get_unidad_entidad_vinculos RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT id_unidad, id_entidad 
            FROM safi_unidades_entidades 
            WHERE estado = 1 OR estado IS NULL;
        RETURN v_cursor;
    END fn_get_unidad_entidad_vinculos;

END pkg_safi_admin;