CREATE OR REPLACE PACKAGE pkg_safi_admin AS
    /**
     * ==================================================================================================================================================
     * @package     PKG_SAFI_ADMIN
     * @description Paquete para la gestión administrativa, la vinculación y la alimentación de datos de entidades corporativas SAFI.
     * @author      Gerardo Paiva G.
     * ==================================================================================================================================================
     * HISTORIAL DE CAMBIOS:
     * --------------------------------------------------------------------------------------------------------------------------------------------------
     * VERSIÓN  FECHA       AUTOR           DESCRIPCIÓN
     * -------  ----------  --------------  -------------------------------------------------------------------------------------------------------------
     * 1.0.0    15/05/2026  Gerardo Paiva   Creación base para centralizar la gestión y soporte de tablas de SAFI.
     * 1.1.0    18/05/2026  Gerardo Paiva   Se agregan funciones para usar en el Backend.
     * 1.2.0    23/05/2026  Gerardo Paiva   Alineación con la estructura física real: Uso del flag VARCHAR2('S'/'N') y resguardo de la columna ESTADO.
     * ==================================================================================================================================================
     */
    PROCEDURE crear_usuario(p_slug_usuario IN VARCHAR2, p_rut IN NUMBER, p_dv IN VARCHAR2, p_nombres IN VARCHAR2, p_apellidos IN VARCHAR2, p_email IN VARCHAR2, p_out_id OUT NUMBER);
    PROCEDURE desactivar_usuario(p_id_usuario IN NUMBER);
    PROCEDURE crear_unidad(p_codigo IN VARCHAR2, p_slug_unidad IN VARCHAR2, p_nombre_unidad IN VARCHAR2, p_descripcion IN VARCHAR2, p_out_id OUT NUMBER);
    PROCEDURE crear_entidad(p_codigo IN VARCHAR2, p_slug_entidad IN VARCHAR2, p_nombre_entidad IN VARCHAR2, p_tipo_entidad IN VARCHAR2, p_out_id OUT NUMBER);
    PROCEDURE vincular_usuario_unidad(p_id_usuario IN NUMBER, p_id_unidad IN NUMBER);
    PROCEDURE desvincular_usuario_unidad(p_id_usuario IN NUMBER, p_id_unidad IN NUMBER);
    PROCEDURE vincular_usuario_entidad(p_id_usuario IN NUMBER, p_id_entidad IN NUMBER);
    PROCEDURE desvincular_usuario_entidad(p_id_usuario IN NUMBER, p_id_entidad IN NUMBER);
    PROCEDURE vincular_unidad_entidad(p_id_unidad IN NUMBER, p_id_entidad IN NUMBER);
    PROCEDURE desvincular_unidad_entidad(p_id_unidad IN NUMBER, p_id_entidad IN NUMBER);
    PROCEDURE inicializar_datos_semilla;

    -- --- ADICIONES PARA FRONTEND/BACKEND CRUD SAFI ---
    FUNCTION fn_get_safi_usuarios RETURN SYS_REFCURSOR;
    FUNCTION fn_get_safi_entidades RETURN SYS_REFCURSOR;
    FUNCTION fn_get_safi_unidades RETURN SYS_REFCURSOR;

    FUNCTION fn_get_safi_usuario_by_id(p_id IN NUMBER) RETURN SYS_REFCURSOR;
    FUNCTION fn_get_safi_entidad_by_id(p_id IN NUMBER) RETURN SYS_REFCURSOR;
    FUNCTION fn_get_safi_unidad_by_id(p_id IN NUMBER) RETURN SYS_REFCURSOR;

    FUNCTION fn_get_entidades_usuario(p_id_usuario IN NUMBER) RETURN SYS_REFCURSOR;
    FUNCTION fn_get_unidades_usuario(p_id_usuario IN NUMBER) RETURN SYS_REFCURSOR;
    FUNCTION fn_get_usuarios_entidad(p_id_entidad IN NUMBER) RETURN SYS_REFCURSOR;
    FUNCTION fn_get_usuarios_unidad(p_id_unidad IN NUMBER) RETURN SYS_REFCURSOR;

    PROCEDURE p_upsert_safi_usuario(p_id IN NUMBER, p_rut IN NUMBER, p_dv IN VARCHAR2, p_nombre IN VARCHAR2, p_email IN VARCHAR2, p_estado IN NUMBER);
    PROCEDURE p_delete_safi_usuario(p_id IN NUMBER);

    PROCEDURE p_upsert_safi_entidad(p_id IN NUMBER, p_codigo IN VARCHAR2, p_nombre IN VARCHAR2, p_slug IN VARCHAR2, p_desc IN VARCHAR2);
    PROCEDURE p_delete_safi_entidad(p_id IN NUMBER);

    PROCEDURE p_upsert_safi_unidad(p_id IN NUMBER, p_codigo IN VARCHAR2, p_nombre IN VARCHAR2, p_slug IN VARCHAR2, p_desc IN VARCHAR2);
    PROCEDURE p_delete_safi_unidad(p_id IN NUMBER);

    FUNCTION fn_get_unidades_de_entidad(p_id_entidad IN NUMBER) RETURN SYS_REFCURSOR;
    FUNCTION fn_get_unidad_entidad_vinculos RETURN SYS_REFCURSOR;

END pkg_safi_admin;
/

/

CREATE OR REPLACE PACKAGE BODY pkg_safi_admin AS

    PROCEDURE crear_usuario(p_slug_usuario IN VARCHAR2, p_rut IN NUMBER, p_dv IN VARCHAR2, p_nombres IN VARCHAR2, p_apellidos IN VARCHAR2, p_email IN VARCHAR2, p_out_id OUT NUMBER) IS
    BEGIN
        INSERT INTO safi_usuarios (slug_usuario, rut, dv, nombres, apellidos, email, activo)
        VALUES (p_slug_usuario, p_rut, p_dv, p_nombres, p_apellidos, p_email, 'S')
        RETURNING id_usuario INTO p_out_id;

        -- Provision corresponding security node in acc_nodos
        INSERT INTO acc_nodos (codigo_tecnico, etiqueta, id_tipo_nodo, activo, creado_por, fecha_creacion)
        VALUES ('USR_' || p_out_id, p_nombres || ' ' || p_apellidos, 3, 'S', USER, SYSDATE);

        COMMIT;
    EXCEPTION
        WHEN DUP_VAL_ON_INDEX THEN
            ROLLBACK;
            RAISE_APPLICATION_ERROR(-20001, 'El RUT o el Slug ya se encuentran registrados en SAFI.');
        WHEN OTHERS THEN
            ROLLBACK;
            RAISE;
    END crear_usuario;

    PROCEDURE desactivar_usuario(p_id_usuario IN NUMBER) IS
    BEGIN
        UPDATE safi_usuarios SET activo = 'N' WHERE id_usuario = p_id_usuario;
        UPDATE safi_usuarios_unidades SET activo = 'N' WHERE id_usuario = p_id_usuario;
        UPDATE safi_usuarios_entidades SET activo = 'N' WHERE id_usuario = p_id_usuario;
        COMMIT;
    END desactivar_usuario;

    PROCEDURE crear_unidad(p_codigo IN VARCHAR2, p_slug_unidad IN VARCHAR2, p_nombre_unidad IN VARCHAR2, p_descripcion IN VARCHAR2, p_out_id OUT NUMBER) IS
    BEGIN
        INSERT INTO safi_unidades (codigo, slug_unidad, nombre_unidad, descripcion, activo)
        VALUES (p_codigo, p_slug_unidad, p_nombre_unidad, p_descripcion, 'S')
        RETURNING id_unidad INTO p_out_id;
        COMMIT;
    END crear_unidad;

    PROCEDURE crear_entidad(p_codigo IN VARCHAR2, p_slug_entidad IN VARCHAR2, p_nombre_entidad IN VARCHAR2, p_tipo_entidad IN VARCHAR2, p_out_id OUT NUMBER) IS
    BEGIN
        INSERT INTO safi_entidades (codigo, slug_entidad, nombre_entidad, tipo_entidad, activo)
        VALUES (p_codigo, p_slug_entidad, p_nombre_entidad, p_tipo_entidad, 'S')
        RETURNING id_entidad INTO p_out_id;
        COMMIT;
    END crear_entidad;

    PROCEDURE vincular_usuario_unidad(p_id_usuario IN NUMBER, p_id_unidad IN NUMBER) IS
    BEGIN
        MERGE INTO safi_usuarios_unidades uu
        USING DUAL ON (uu.id_usuario = p_id_usuario AND uu.id_unidad = p_id_unidad)
        WHEN MATCHED THEN UPDATE SET uu.activo = 'S'
        WHEN NOT MATCHED THEN INSERT (id_usuario, id_unidad, activo) VALUES (p_id_usuario, p_id_unidad, 'S');
        COMMIT;
    END vincular_usuario_unidad;

    PROCEDURE desvincular_usuario_unidad(p_id_usuario IN NUMBER, p_id_unidad IN NUMBER) IS
    BEGIN
        UPDATE safi_usuarios_unidades SET activo = 'N' WHERE id_usuario = p_id_usuario AND id_unidad = p_id_unidad;
        COMMIT;
    END desvincular_usuario_unidad;

    PROCEDURE vincular_usuario_entidad(p_id_usuario IN NUMBER, p_id_entidad IN NUMBER) IS
    BEGIN
        MERGE INTO safi_usuarios_entidades ue
        USING DUAL ON (ue.id_usuario = p_id_usuario AND ue.id_entidad = p_id_entidad)
        WHEN MATCHED THEN UPDATE SET ue.activo = 'S'
        WHEN NOT MATCHED THEN INSERT (id_usuario, id_entidad, activo) VALUES (p_id_usuario, p_id_entidad, 'S');
        COMMIT;
    END vincular_usuario_entidad;

    PROCEDURE desvincular_usuario_entidad(p_id_usuario IN NUMBER, p_id_entidad IN NUMBER) IS
    BEGIN
        UPDATE safi_usuarios_entidades SET activo = 'N' WHERE id_usuario = p_id_usuario AND id_entidad = p_id_entidad;
        COMMIT;
    END desvincular_usuario_entidad;

    PROCEDURE vincular_unidad_entidad(p_id_unidad IN NUMBER, p_id_entidad IN NUMBER) IS
    BEGIN
        MERGE INTO safi_unidades_entidades unie
        USING DUAL ON (unie.id_unidad = p_id_unidad AND unie.id_entidad = p_id_entidad)
        WHEN MATCHED THEN UPDATE SET unie.activo = 'S'
        WHEN NOT MATCHED THEN INSERT (id_unidad, id_entidad, activo) VALUES (p_id_unidad, p_id_entidad, 'S');
        COMMIT;
    END vincular_unidad_entidad;

    PROCEDURE desvincular_unidad_entidad(p_id_unidad IN NUMBER, p_id_entidad IN NUMBER) IS
    BEGIN
        UPDATE safi_unidades_entidades SET activo = 'N' WHERE id_unidad = p_id_unidad AND id_entidad = p_id_entidad;
        COMMIT;
    END desvincular_unidad_entidad;

    PROCEDURE inicializar_datos_semilla IS
        v_admin_id NUMBER;
    BEGIN
        crear_usuario(
            p_slug_usuario => 'admin-sys-root-safi',
            p_rut          => 0,
            p_dv           => '0',
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
            SELECT id_usuario AS id, rut AS rut_numero, dv AS rut_dv, 
                   (nombres || ' ' || apellidos) AS nombre, email, 
                   CASE WHEN activo = 'S' THEN 1 ELSE 0 END AS estado
            FROM safi_usuarios
            ORDER BY id_usuario;
        RETURN v_cursor;
    END fn_get_safi_usuarios;

    FUNCTION fn_get_safi_entidades RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT id_entidad AS id, codigo, nombre_entidad AS nombre, slug_entidad AS slug, tipo_entidad AS "desc", activo
            FROM safi_entidades
            ORDER BY id_entidad;
        RETURN v_cursor;
    END fn_get_safi_entidades;

    FUNCTION fn_get_safi_unidades RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT id_unidad AS id, codigo, nombre_unidad AS nombre, slug_unidad AS slug, descripcion AS "desc", activo
            FROM safi_unidades
            ORDER BY id_unidad;
        RETURN v_cursor;
    END fn_get_safi_unidades;

    PROCEDURE p_upsert_safi_usuario(p_id IN NUMBER, p_rut IN NUMBER, p_dv IN VARCHAR2, p_nombre IN VARCHAR2, p_email IN VARCHAR2, p_estado IN NUMBER) IS
        v_nombres VARCHAR2(100);
        v_apellidos VARCHAR2(100);
        v_slug VARCHAR2(100);
        v_activo VARCHAR2(1);
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
        v_activo := CASE WHEN p_estado = 1 THEN 'S' ELSE 'N' END;

        MERGE INTO safi_usuarios t
        USING (SELECT p_id AS id_usuario FROM dual) s
        ON (t.id_usuario = s.id_usuario)
        WHEN MATCHED THEN
            UPDATE SET t.nombres = v_nombres, t.apellidos = v_apellidos, t.email = p_email, t.activo = v_activo, t.rut = p_rut, t.dv = p_dv
        WHEN NOT MATCHED THEN
            INSERT (id_usuario, slug_usuario, rut, dv, nombres, apellidos, email, activo)
            VALUES (p_id, v_slug, p_rut, p_dv, v_nombres, v_apellidos, p_email, v_activo);

        -- Provision/update user node in acc_nodos
        MERGE INTO acc_nodos t
        USING (SELECT 'USR_' || p_id AS codigo_tecnico FROM dual) s
        ON (t.codigo_tecnico = s.codigo_tecnico)
        WHEN MATCHED THEN
            UPDATE SET t.etiqueta = p_nombre, t.activo = v_activo
        WHEN NOT MATCHED THEN
            INSERT (codigo_tecnico, etiqueta, id_tipo_nodo, activo, creado_por, fecha_creacion)
            VALUES ('USR_' || p_id, p_nombre, 3, v_activo, USER, SYSDATE);

        COMMIT;
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            RAISE;
    END p_upsert_safi_usuario;

    PROCEDURE p_delete_safi_usuario(p_id IN NUMBER) IS
    BEGIN
        UPDATE safi_usuarios SET activo = 'N', fecha_eliminacion = SYSDATE WHERE id_usuario = p_id;
        UPDATE acc_nodos SET activo = 'N' WHERE codigo_tecnico = 'USR_' || p_id;
        COMMIT;
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            RAISE;
    END p_delete_safi_usuario;

    PROCEDURE p_upsert_safi_entidad(p_id IN NUMBER, p_codigo IN VARCHAR2, p_nombre IN VARCHAR2, p_slug IN VARCHAR2, p_desc IN VARCHAR2) IS
    BEGIN
        MERGE INTO safi_entidades t
        USING (SELECT p_id AS id_entidad FROM dual) s
        ON (t.id_entidad = s.id_entidad)
        WHEN MATCHED THEN
            UPDATE SET t.codigo = p_codigo, t.nombre_entidad = p_nombre, t.slug_entidad = p_slug, t.tipo_entidad = p_desc
        WHEN NOT MATCHED THEN
            INSERT (id_entidad, codigo, slug_entidad, nombre_entidad, tipo_entidad, activo)
            VALUES (p_id, p_codigo, p_slug, p_nombre, p_desc, 'S');
        COMMIT;
    END p_upsert_safi_entidad;

    PROCEDURE p_delete_safi_entidad(p_id IN NUMBER) IS
    BEGIN
        -- Actualiza de forma segura la columna de texto y deja el hook para el trigger_SD
        UPDATE safi_entidades SET activo = 'N', fecha_eliminacion = SYSDATE WHERE id_entidad = p_id;
        
        -- Desconectar Usuarios de esta entidad
        DELETE FROM safi_usuarios_entidades WHERE id_entidad = p_id;

        -- Desconectar Unidades de esta entidad
        DELETE FROM safi_unidades_entidades WHERE id_entidad = p_id;
        
        COMMIT;
    END p_delete_safi_entidad;

    PROCEDURE p_upsert_safi_unidad(p_id IN NUMBER, p_codigo IN VARCHAR2, p_nombre IN VARCHAR2, p_slug IN VARCHAR2, p_desc IN VARCHAR2) IS
    BEGIN
        MERGE INTO safi_unidades t
        USING (SELECT p_id AS id_unidad FROM dual) s
        ON (t.id_unidad = s.id_unidad)
        WHEN MATCHED THEN
            UPDATE SET t.codigo = p_codigo, t.nombre_unidad = p_nombre, t.slug_unidad = p_slug, t.descripcion = p_desc
        WHEN NOT MATCHED THEN
            INSERT (id_unidad, codigo, slug_unidad, nombre_unidad, descripcion, activo)
            VALUES (p_id, p_codigo, p_slug, p_nombre, p_desc, 'S');
        COMMIT;
    END p_upsert_safi_unidad;

    PROCEDURE p_delete_safi_unidad(p_id IN NUMBER) IS
    BEGIN
        UPDATE safi_unidades SET activo = 'N', fecha_eliminacion = SYSDATE WHERE id_unidad = p_id;
        
        -- Desconectar Usuarios de esta unidad
        DELETE FROM safi_usuarios_unidades WHERE id_unidad = p_id;

        -- Desconectar la unidad de todas las entidades
        DELETE FROM safi_unidades_entidades WHERE id_unidad = p_id;
        
        COMMIT;
    END p_delete_safi_unidad;

    -- ================= FUNCIONES DE CONSULTA Y ADMINISTRACIÓN ADICIONALES =================

    FUNCTION fn_get_safi_usuario_by_id(p_id IN NUMBER) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT id_usuario AS id, nombres, apellidos, email, 
                   CASE WHEN activo = 'S' THEN 1 ELSE 0 END AS estado
            FROM safi_usuarios
            WHERE id_usuario = p_id;
        RETURN v_cursor;
    END fn_get_safi_usuario_by_id;

    FUNCTION fn_get_safi_entidad_by_id(p_id IN NUMBER) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT id_entidad AS id, codigo, nombre_entidad, slug_entidad, tipo_entidad, activo
            FROM safi_entidades
            WHERE id_entidad = p_id;
        RETURN v_cursor;
    END fn_get_safi_entidad_by_id;

    FUNCTION fn_get_safi_unidad_by_id(p_id IN NUMBER) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT id_unidad AS id, codigo, nombre_unidad, slug_unidad, descripcion, activo
            FROM safi_unidades
            WHERE id_unidad = p_id;
        RETURN v_cursor;
    END fn_get_safi_unidad_by_id;

    FUNCTION fn_get_entidades_usuario(p_id_usuario IN NUMBER) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT e.id_entidad, e.codigo, e.nombre_entidad, e.slug_entidad, e.tipo_entidad, e.activo
            FROM safi_entidades e
            JOIN safi_usuarios_entidades ue ON ue.id_entidad = e.id_entidad
            WHERE ue.id_usuario = p_id_usuario AND ue.activo = 'S';
        RETURN v_cursor;
    END fn_get_entidades_usuario;

    FUNCTION fn_get_unidades_usuario(p_id_usuario IN NUMBER) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT u.id_unidad, u.codigo, u.nombre_unidad, u.slug_unidad, u.descripcion, u.activo
            FROM safi_unidades u
            JOIN safi_usuarios_unidades uu ON uu.id_unidad = u.id_unidad
            WHERE uu.id_usuario = p_id_usuario AND uu.activo = 'S';
        RETURN v_cursor;
    END fn_get_unidades_usuario;

    FUNCTION fn_get_usuarios_entidad(p_id_entidad IN NUMBER) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT u.id_usuario, u.nombres, u.apellidos, u.email, 
                   CASE WHEN u.activo = 'S' THEN 1 ELSE 0 END AS estado
            FROM safi_usuarios u
            JOIN safi_usuarios_entidades ue ON ue.id_usuario = u.id_usuario
            WHERE ue.id_entidad = p_id_entidad AND ue.activo = 'S';
        RETURN v_cursor;
    END fn_get_usuarios_entidad;

    FUNCTION fn_get_usuarios_unidad(p_id_unidad IN NUMBER) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT u.id_usuario, u.nombres, u.apellidos, u.email, 
                   CASE WHEN u.activo = 'S' THEN 1 ELSE 0 END AS estado
            FROM safi_usuarios u
            JOIN safi_usuarios_unidades uu ON uu.id_usuario = u.id_usuario
            WHERE uu.id_unidad = p_id_unidad AND uu.activo = 'S';
        RETURN v_cursor;
    END fn_get_usuarios_unidad;

    FUNCTION fn_get_unidades_de_entidad(p_id_entidad IN NUMBER) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT u.id_unidad AS id, u.codigo, u.nombre_unidad AS nombre, u.slug_unidad AS slug, u.descripcion AS "desc", u.activo
            FROM safi_unidades u
            JOIN safi_unidades_entidades ue ON u.id_unidad = ue.id_unidad
            WHERE ue.id_entidad = p_id_entidad 
              AND ue.activo = 'S'
              AND u.activo = 'S';
        RETURN v_cursor;
    END fn_get_unidades_de_entidad;

    FUNCTION fn_get_unidad_entidad_vinculos RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT id_unidad, id_entidad 
            FROM safi_unidades_entidades 
            WHERE activo = 'S';
        RETURN v_cursor;
    END fn_get_unidad_entidad_vinculos;

END pkg_safi_admin;
/

/
