CREATE OR REPLACE PACKAGE BODY NGAC_USER.pkg_seguridad_admin AS
    /**
     * =========================================================================
     * CUERPO DEL PAQUETE: PKG_SEGURIDAD_ADMIN
     * Todas las inserciones utilizan el patrón UPSERT (Update o Insert) para
     * garantizar la idempotencia de los scripts autogenerados.
     * =========================================================================
     */

    PROCEDURE p_limpiar_grafos IS
    BEGIN
        DELETE FROM acc_prohibiciones;
        DELETE FROM acc_asociaciones;
        DELETE FROM acc_asignaciones;
        DELETE FROM acc_nodos;
        COMMIT;
        DBMS_OUTPUT.PUT_LINE('[CLEAN] Purga total de grafos completada.');
    END p_limpiar_grafos;

    PROCEDURE p_upsert_operacion(p_nombre_op IN VARCHAR2, p_desc IN VARCHAR2 DEFAULT NULL) IS
    BEGIN
        MERGE INTO acc_operaciones t
        USING (SELECT UPPER(TRIM(p_nombre_op)) as nom FROM dual) s
        ON (t.nombre_op = s.nom)
        WHEN MATCHED THEN
            UPDATE SET descripcion = p_desc
        WHEN NOT MATCHED THEN
            INSERT (nombre_op, descripcion) VALUES (s.nom, p_desc);

        IF SQL%ROWCOUNT > 0 THEN
            DBMS_OUTPUT.PUT_LINE('[OP] Operación procesada: ' || UPPER(p_nombre_op));
        END IF;
    END p_upsert_operacion;

    PROCEDURE p_upsert_tipo_nodo(p_codigo IN VARCHAR2, p_desc IN VARCHAR2 DEFAULT NULL) IS
    BEGIN
        MERGE INTO acc_tipos_nodo t
        USING (SELECT UPPER(TRIM(p_codigo)) as cod FROM dual) s
        ON (t.codigo_tipo = s.cod)
        WHEN MATCHED THEN
            UPDATE SET descripcion = p_desc
        WHEN NOT MATCHED THEN
            INSERT (codigo_tipo, descripcion) VALUES (s.cod, p_desc);

        IF SQL%ROWCOUNT > 0 THEN
            DBMS_OUTPUT.PUT_LINE('[TYPE] Tipo de nodo procesado: ' || UPPER(p_codigo));
        END IF;
    END p_upsert_tipo_nodo;

    PROCEDURE p_upsert_nodo(
        p_codigo   IN VARCHAR2,
        p_etiqueta IN VARCHAR2,
        p_tipo_cod IN VARCHAR2,
        p_ruta     IN VARCHAR2 DEFAULT NULL,
        p_slug     IN VARCHAR2 DEFAULT NULL,
        p_icono    IN VARCHAR2 DEFAULT NULL,
        p_descripcion IN VARCHAR2 DEFAULT NULL,
        p_orden    IN NUMBER   DEFAULT 0,
        p_activo   IN VARCHAR2 DEFAULT 'S'
    ) IS
        v_id_tipo NUMBER;
    BEGIN
        BEGIN
            SELECT id_tipo_nodo INTO v_id_tipo
            FROM acc_tipos_nodo WHERE codigo_tipo = UPPER(p_tipo_cod);
        EXCEPTION WHEN NO_DATA_FOUND THEN
            DBMS_OUTPUT.PUT_LINE('[ERR] Tipo de nodo inexistente: ' || p_tipo_cod);
            RETURN;
        END;

        UPDATE acc_nodos
        SET etiqueta = p_etiqueta,
            id_tipo_nodo = v_id_tipo,
            url_ruta = p_ruta,
            slug = p_slug,
            icono = p_icono,
            descripcion = p_descripcion,
            orden_visual = p_orden,
            activo = p_activo
        WHERE codigo_tecnico = p_codigo;

        IF SQL%ROWCOUNT = 0 THEN
            INSERT INTO acc_nodos (codigo_tecnico, etiqueta, id_tipo_nodo, url_ruta, slug, icono, descripcion, orden_visual, activo, creado_por)
            VALUES (p_codigo, p_etiqueta, v_id_tipo, p_ruta, p_slug, p_icono, p_descripcion, p_orden, p_activo, USER);
        END IF;
    END p_upsert_nodo;

    PROCEDURE p_enlazar_nodos(p_id_padre IN NUMBER, p_id_hijo IN NUMBER) IS
        v_dummy NUMBER;
    BEGIN
        -- Verificar que el Padre exista
        BEGIN
            SELECT id_nodo INTO v_dummy FROM acc_nodos WHERE id_nodo = p_id_padre;
        EXCEPTION WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20008, 'Padre no encontrado ID: ' || p_id_padre);
        END;

        -- Verificar que el Hijo exista
        BEGIN
            SELECT id_nodo INTO v_dummy FROM acc_nodos WHERE id_nodo = p_id_hijo;
        EXCEPTION WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20008, 'Hijo no encontrado ID: ' || p_id_hijo);
        END;

        -- Realizar el enlace en acc_asignaciones
        INSERT INTO acc_asignaciones (id_padre, id_hijo)
        SELECT p_id_padre, p_id_hijo
        FROM dual
        WHERE NOT EXISTS (
            SELECT 1 FROM acc_asignaciones a
            WHERE a.id_padre = p_id_padre AND a.id_hijo = p_id_hijo
        );

        IF SQL%ROWCOUNT > 0 THEN
            DBMS_OUTPUT.PUT_LINE('[LINK] Enlazado ID: ' || p_id_padre || ' -> ' || p_id_hijo);
        END IF;
    END p_enlazar_nodos;

    PROCEDURE p_otorgar_permiso(p_id_usr IN NUMBER, p_id_obj IN NUMBER, p_op IN VARCHAR2, p_condicion_js IN VARCHAR2 DEFAULT NULL) IS
        v_dummy NUMBER;
    BEGIN
        -- Verificar que el Usuario / Rol exista
        BEGIN
            SELECT id_nodo INTO v_dummy FROM acc_nodos WHERE id_nodo = p_id_usr;
        EXCEPTION WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20008, 'Usuario o Rol no encontrado ID: ' || p_id_usr);
        END;

        -- Verificar que el Objeto / Nodo exista
        BEGIN
            SELECT id_nodo INTO v_dummy FROM acc_nodos WHERE id_nodo = p_id_obj;
        EXCEPTION WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20008, 'Objeto o Nodo no encontrado ID: ' || p_id_obj);
        END;

        UPDATE acc_asociaciones
        SET condicion_json = p_condicion_js
        WHERE id_usr_attr = p_id_usr
          AND id_obj_attr = p_id_obj
          AND id_op IN (SELECT id_op FROM acc_operaciones WHERE nombre_op = UPPER(TRIM(p_op)));

        IF SQL%ROWCOUNT = 0 THEN
            INSERT INTO acc_asociaciones (id_usr_attr, id_obj_attr, id_op, condicion_json, creado_por)
            SELECT p_id_usr, p_id_obj, op.id_op, p_condicion_js, USER
            FROM acc_operaciones op
            WHERE op.nombre_op = UPPER(TRIM(p_op))
              AND ROWNUM = 1;
        END IF;

        -- Asegurar el vínculo en acc_asignaciones
        MERGE INTO acc_asignaciones t
        USING (SELECT p_id_usr as id_padre, p_id_obj as id_hijo FROM dual) s
        ON (t.id_padre = s.id_padre AND t.id_hijo = s.id_hijo)
        WHEN NOT MATCHED THEN
            INSERT (id_padre, id_hijo) VALUES (s.id_padre, s.id_hijo);

        DBMS_OUTPUT.PUT_LINE('[ALLOW] Permiso otorgado ID: ' || p_id_usr || ' puede ' || p_op || ' en ID ' || p_id_obj);
    END p_otorgar_permiso;

    PROCEDURE p_denegar_permiso(p_id_usr IN NUMBER, p_id_obj IN NUMBER, p_op IN VARCHAR2) IS
        v_dummy NUMBER;
        v_total NUMBER;
    BEGIN
        -- Verificar que el Usuario / Rol exista
        BEGIN
            SELECT id_nodo INTO v_dummy FROM acc_nodos WHERE id_nodo = p_id_usr;
        EXCEPTION WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20008, 'Usuario o Rol no encontrado ID: ' || p_id_usr);
        END;

        -- Verificar que el Objeto / Nodo exista
        BEGIN
            SELECT id_nodo INTO v_dummy FROM acc_nodos WHERE id_nodo = p_id_obj;
        EXCEPTION WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20008, 'Objeto o Nodo no encontrado ID: ' || p_id_obj);
        END;

        INSERT INTO acc_prohibiciones (id_usr_attr, id_obj_attr, id_op, creado_por)
        SELECT p_id_usr, p_id_obj, op.id_op, USER
        FROM acc_operaciones op
        WHERE op.nombre_op = UPPER(TRIM(p_op))
        AND NOT EXISTS (
            SELECT 1 FROM acc_prohibiciones p
            WHERE p.id_usr_attr = p_id_usr AND p.id_obj_attr = p_id_obj AND p.id_op = op.id_op
        ) AND ROWNUM = 1;

        IF SQL%ROWCOUNT > 0 THEN
            DBMS_OUTPUT.PUT_LINE('[DENY] Prohibición inyectada ID: ' || p_id_usr || ' denegado ' || p_op || ' en ID ' || p_id_obj);
        END IF;

        -- Verificar si quedan otros permisos y desvincular si no hay más
        SELECT COUNT(*) INTO v_total FROM acc_asociaciones 
        WHERE id_usr_attr = p_id_usr AND id_obj_attr = p_id_obj;

        IF v_total = 0 THEN
            DELETE FROM acc_asignaciones WHERE id_padre = p_id_usr AND id_hijo = p_id_obj;
        END IF;
    END p_denegar_permiso;

    PROCEDURE p_limpiar_logs IS
    BEGIN
        DELETE FROM acc_log_errores;
        COMMIT;
        DBMS_OUTPUT.PUT_LINE('[CLEAN] Logs de errores eliminados.');
    END p_limpiar_logs;

    -- =========================================================================
    -- IMPLEMENTACIÓN DE FUNCIONES DE LECTURA (CURSORES)
    -- =========================================================================

    FUNCTION fn_get_dashboard_stats RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT 
                (SELECT COUNT(*) FROM acc_nodos) AS total_nodos,
                (SELECT COUNT(*) FROM acc_nodos n JOIN acc_tipos_nodo t ON n.id_tipo_nodo = t.id_tipo_nodo WHERE UPPER(t.codigo_tipo) IN ('USUARIO', 'USR_ATTR') AND n.codigo_tecnico LIKE 'ROL_%') AS acc_roles,
                (SELECT COUNT(*) FROM acc_asignaciones) AS asignaciones_jerarquicas,
                (SELECT COUNT(*) FROM acc_asociaciones) AS asociaciones_permisos,
                (SELECT COUNT(*) FROM acc_prohibiciones) AS acc_prohibiciones,
                (SELECT COUNT(*) FROM acc_log_errores) AS errores_recientes,
                (SELECT COUNT(*) FROM acc_operaciones) AS total_operaciones,
                (SELECT COUNT(*) FROM acc_tipos_nodo) AS total_tipos_nodo
            FROM dual;
        RETURN v_cursor;
    END fn_get_dashboard_stats;

    FUNCTION fn_get_nodos_activos RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT n.id_nodo, n.codigo_tecnico, n.etiqueta, n.id_tipo_nodo, t.codigo_tipo as tipo_nodo, 
                   n.url_ruta, n.slug, n.icono, n.orden_visual, n.activo 
            FROM acc_nodos n
            LEFT JOIN acc_tipos_nodo t ON n.id_tipo_nodo = t.id_tipo_nodo
            ORDER BY n.orden_visual ASC;
        RETURN v_cursor;
    END fn_get_nodos_activos;

    FUNCTION fn_get_asignaciones_y_asociaciones RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT id_padre, id_hijo FROM acc_asignaciones
            UNION ALL
            SELECT id_usr_attr as id_padre, id_obj_attr as id_hijo FROM acc_asociaciones;
        RETURN v_cursor;
    END fn_get_asignaciones_y_asociaciones;

    FUNCTION fn_get_permisos_rol(p_rolBase IN VARCHAR2) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT aso.id_obj_attr 
            FROM acc_asociaciones aso
            INNER JOIN acc_nodos ua ON aso.id_usr_attr = ua.id_nodo
            WHERE ua.codigo_tecnico = UPPER(TRIM(p_rolBase));
        RETURN v_cursor;
    END fn_get_permisos_rol;

    FUNCTION fn_get_nodos_lista RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT n.id_nodo, n.codigo_tecnico, n.etiqueta, t.codigo_tipo as tipo_nodo, 
                   n.url_ruta, n.slug, n.icono, n.descripcion, n.orden_visual, n.activo
            FROM acc_nodos n
            LEFT JOIN acc_tipos_nodo t ON n.id_tipo_nodo = t.id_tipo_nodo
            ORDER BY n.id_nodo DESC;
        RETURN v_cursor;
    END fn_get_nodos_lista;

    FUNCTION fn_get_tipos_nodo RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT id_tipo_nodo, codigo_tipo, descripcion 
            FROM acc_tipos_nodo
            ORDER BY id_tipo_nodo ASC;
        RETURN v_cursor;
    END fn_get_tipos_nodo;

    FUNCTION fn_get_enlaces RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT a.id_asignacion,
                   a.id_padre,
                   a.id_hijo,
                   p.codigo_tecnico as padre, 
                   h.codigo_tecnico as hijo
            FROM acc_asignaciones a
            JOIN acc_nodos p ON a.id_padre = p.id_nodo
            JOIN acc_nodos h ON a.id_hijo = h.id_nodo
            ORDER BY a.id_asignacion DESC;
        RETURN v_cursor;
    END fn_get_enlaces;

    FUNCTION fn_get_permisos RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT p.id_asociacion, 
                   usr.id_nodo as usr, 
                   usr.etiqueta as usr_etiqueta,
                   obj.id_nodo as obj, 
                   obj.etiqueta as obj_etiqueta,
                   op.nombre_op as op,
                   p.condicion_json
            FROM acc_asociaciones p
            JOIN acc_nodos usr ON p.id_usr_attr = usr.id_nodo
            JOIN acc_nodos obj ON p.id_obj_attr = obj.id_nodo
            JOIN acc_operaciones op ON p.id_op = op.id_op
            ORDER BY p.id_asociacion DESC;
        RETURN v_cursor;
    END fn_get_permisos;

    FUNCTION fn_get_operaciones RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT id_op, nombre_op, descripcion 
            FROM acc_operaciones
            ORDER BY id_op ASC;
        RETURN v_cursor;
    END fn_get_operaciones;

    FUNCTION fn_get_modulos_raiz_nodos RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT n.id_nodo, n.codigo_tecnico, n.etiqueta, t.codigo_tipo as tipo_nodo, 
                   n.url_ruta, n.slug, n.icono, n.descripcion, n.orden_visual, n.activo
            FROM acc_nodos n
            JOIN acc_tipos_nodo t ON n.id_tipo_nodo = t.id_tipo_nodo
            WHERE UPPER(t.codigo_tipo) IN ('OBJ_ATTR', 'OBJETO')
            ORDER BY n.orden_visual ASC;
        RETURN v_cursor;
    END fn_get_modulos_raiz_nodos;

    FUNCTION fn_get_modulos_raiz_links RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT a.id_padre, a.id_hijo 
            FROM acc_asignaciones a
            JOIN acc_nodos p ON a.id_padre = p.id_nodo
            JOIN acc_nodos h ON a.id_hijo = h.id_nodo
            JOIN acc_tipos_nodo tp ON p.id_tipo_nodo = tp.id_tipo_nodo
            JOIN acc_tipos_nodo th ON h.id_tipo_nodo = th.id_tipo_nodo
            WHERE UPPER(tp.codigo_tipo) IN ('OBJ_ATTR', 'OBJETO')
              AND UPPER(th.codigo_tipo) IN ('OBJ_ATTR', 'OBJETO');
        RETURN v_cursor;
    END fn_get_modulos_raiz_links;

    FUNCTION fn_get_politicas_raiz RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT n.id_nodo, n.codigo_tecnico, n.etiqueta, t.codigo_tipo as tipo_nodo, 
                   n.url_ruta, n.slug, n.icono, n.descripcion, n.orden_visual, n.activo
            FROM acc_nodos n
            LEFT JOIN acc_asignaciones a ON n.id_nodo = a.id_hijo
            LEFT JOIN acc_tipos_nodo t ON n.id_tipo_nodo = t.id_tipo_nodo
            WHERE UPPER(t.codigo_tipo) = 'POLICY'
              AND a.id_hijo IS NULL
            ORDER BY n.orden_visual ASC;
        RETURN v_cursor;
    END fn_get_politicas_raiz;

    FUNCTION fn_get_roles RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT n.id_nodo as id_rol, n.codigo_tecnico as codigo, n.etiqueta as nombre, n.descripcion
            FROM acc_nodos n
            JOIN acc_tipos_nodo t ON n.id_tipo_nodo = t.id_tipo_nodo
            WHERE UPPER(t.codigo_tipo) IN ('USUARIO', 'USR_ATTR')
              AND n.codigo_tecnico LIKE 'ROL_%'
            ORDER BY n.orden_visual ASC;
        RETURN v_cursor;
    END fn_get_roles;

    FUNCTION fn_get_logs RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT id_log, fecha, modulo, mensaje FROM acc_log_errores ORDER BY fecha DESC;
        RETURN v_cursor;
    END fn_get_logs;

    FUNCTION fn_get_prohibiciones RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT p.id_prohibicion, 
                   usr.id_nodo as usr, 
                   usr.etiqueta as usr_etiqueta,
                   obj.id_nodo as obj, 
                   obj.etiqueta as obj_etiqueta,
                   op.nombre_op as op,
                   p.fecha_registro,
                   p.creado_por
            FROM acc_prohibiciones p
            JOIN acc_nodos usr ON p.id_usr_attr = usr.id_nodo
            JOIN acc_nodos obj ON p.id_obj_attr = obj.id_nodo
            JOIN acc_operaciones op ON p.id_op = op.id_op
            ORDER BY p.fecha_registro DESC;
        RETURN v_cursor;
    END fn_get_prohibiciones;

    FUNCTION fn_get_roles_por_nodo(p_id IN NUMBER) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT DISTINCT 
                n_rol.id_nodo AS id_rol,
                n_rol.codigo_tecnico AS codigo,
                n_rol.etiqueta AS nombre
            FROM acc_asociaciones aso
            INNER JOIN acc_nodos n_rol ON aso.id_usr_attr = n_rol.id_nodo
            WHERE aso.id_obj_attr = p_id
            ORDER BY n_rol.etiqueta;
        RETURN v_cursor;
    END fn_get_roles_por_nodo;

    -- =========================================================================
    -- PROCEDIMIENTOS DE ELIMINACION / ACTUALIZACION RESTANTES
    -- =========================================================================

    PROCEDURE p_desactivar_nodo(p_codigo IN VARCHAR2) IS
    BEGIN
        UPDATE acc_nodos SET activo = 'N' WHERE codigo_tecnico = UPPER(TRIM(p_codigo));
        IF SQL%ROWCOUNT = 0 THEN
            RAISE_APPLICATION_ERROR(-20001, 'Nodo no encontrado: ' || p_codigo);
        END IF;
    END p_desactivar_nodo;

    PROCEDURE p_eliminar_enlace(p_id_padre IN NUMBER, p_id_hijo IN NUMBER) IS
        v_dummy NUMBER;
    BEGIN
        -- Verificar que el Padre exista
        BEGIN
            SELECT id_nodo INTO v_dummy FROM acc_nodos WHERE id_nodo = p_id_padre;
        EXCEPTION WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20008, 'Padre no encontrado ID: ' || p_id_padre);
        END;

        -- Verificar que el Hijo exista
        BEGIN
            SELECT id_nodo INTO v_dummy FROM acc_nodos WHERE id_nodo = p_id_hijo;
        EXCEPTION WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20008, 'Hijo no encontrado ID: ' || p_id_hijo);
        END;

        DELETE FROM acc_asignaciones 
        WHERE id_padre = p_id_padre
          AND id_hijo = p_id_hijo;

        IF SQL%ROWCOUNT = 0 THEN
            RAISE_APPLICATION_ERROR(-20002, 'Vínculo no encontrado');
        END IF;
    END p_eliminar_enlace;

    PROCEDURE p_revocar_permiso(p_id_usr IN NUMBER, p_id_obj IN NUMBER, p_op IN VARCHAR2) IS
        v_dummy NUMBER;
        v_total NUMBER;
    BEGIN
        -- Verificar que el Usuario / Rol exista
        BEGIN
            SELECT id_nodo INTO v_dummy FROM acc_nodos WHERE id_nodo = p_id_usr;
        EXCEPTION WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20008, 'Usuario o Rol no encontrado ID: ' || p_id_usr);
        END;

        -- Verificar que el Objeto / Nodo exista
        BEGIN
            SELECT id_nodo INTO v_dummy FROM acc_nodos WHERE id_nodo = p_id_obj;
        EXCEPTION WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20008, 'Objeto o Nodo no encontrado ID: ' || p_id_obj);
        END;

        DELETE FROM acc_asociaciones 
        WHERE id_usr_attr = p_id_usr
          AND id_obj_attr = p_id_obj
          AND id_op IN (SELECT id_op FROM acc_operaciones WHERE nombre_op = UPPER(TRIM(p_op)));
        
        IF SQL%ROWCOUNT = 0 THEN
            RAISE_APPLICATION_ERROR(-20003, 'Permiso no encontrado');
        END IF;

        -- Verificar si quedan otros permisos y desvincular si no hay más
        SELECT COUNT(*) INTO v_total FROM acc_asociaciones 
        WHERE id_usr_attr = p_id_usr AND id_obj_attr = p_id_obj;

        IF v_total = 0 THEN
            DELETE FROM acc_asignaciones WHERE id_padre = p_id_usr AND id_hijo = p_id_obj;
        END IF;
    END p_revocar_permiso;

    PROCEDURE p_eliminar_tipo_nodo(p_codigo IN VARCHAR2) IS
    BEGIN
        DELETE FROM acc_tipos_nodo WHERE codigo_tipo = UPPER(TRIM(p_codigo));
        IF SQL%ROWCOUNT = 0 THEN
            RAISE_APPLICATION_ERROR(-20004, 'Tipo de nodo no encontrado');
        END IF;
    END p_eliminar_tipo_nodo;

    PROCEDURE p_eliminar_operacion(p_nombre IN VARCHAR2) IS
    BEGIN
        DELETE FROM acc_operaciones WHERE nombre_op = UPPER(TRIM(p_nombre));
        IF SQL%ROWCOUNT = 0 THEN
            RAISE_APPLICATION_ERROR(-20005, 'Operación no encontrada');
        END IF;
    END p_eliminar_operacion;

    PROCEDURE p_delete_rol(p_id IN NUMBER) IS
    BEGIN
        UPDATE acc_nodos SET activo = 'N' 
        WHERE id_nodo = p_id 
          AND id_tipo_nodo = (SELECT id_tipo_nodo FROM acc_tipos_nodo WHERE UPPER(codigo_tipo) = 'USR_ATTR');
        IF SQL%ROWCOUNT = 0 THEN
            RAISE_APPLICATION_ERROR(-20006, 'Rol no encontrado o no autorizado');
        END IF;
    END p_delete_rol;

    PROCEDURE p_revocar_prohibicion(p_id IN NUMBER) IS
    BEGIN
        DELETE FROM acc_prohibiciones WHERE id_prohibicion = p_id;
        IF SQL%ROWCOUNT = 0 THEN
            RAISE_APPLICATION_ERROR(-20007, 'Prohibición no encontrada');
        END IF;
    END p_revocar_prohibicion;

    -- =========================================================================
    -- CRUD PARA ROLES SPECIFIC
    -- =========================================================================

    PROCEDURE p_resolver_usuario_nodo(p_id_usuario IN NUMBER, p_out_id_nodo OUT NUMBER) IS
        v_id_nodo NUMBER := NULL;
        v_nombres VARCHAR2(100);
        v_apellidos VARCHAR2(100);
        v_slug VARCHAR2(100);
        v_email VARCHAR2(100);
    BEGIN
        BEGIN
            SELECT id_nodo INTO v_id_nodo
            FROM acc_nodos
            WHERE id_tipo_nodo IN (2, 3) 
              AND activo = 'S' 
              AND codigo_tecnico NOT LIKE 'ROL_%'
              AND (codigo_tecnico LIKE '%' || TO_CHAR(p_id_usuario) || '%' OR etiqueta IN (
                SELECT nombres || ' ' || apellidos FROM safi_usuarios WHERE id_usuario = p_id_usuario
                UNION
                SELECT slug_usuario FROM safi_usuarios WHERE id_usuario = p_id_usuario
              ))
              AND ROWNUM = 1;
        EXCEPTION WHEN NO_DATA_FOUND THEN
            NULL;
        END;

        IF v_id_nodo IS NULL THEN
            BEGIN
                SELECT nombres, apellidos, slug_usuario, email 
                INTO v_nombres, v_apellidos, v_slug, v_email
                FROM safi_usuarios 
                WHERE id_usuario = p_id_usuario;
                
                p_upsert_nodo(
                    p_codigo => 'USR_' || TO_CHAR(p_id_usuario),
                    p_etiqueta => TRIM(v_nombres || ' ' || v_apellidos),
                    p_tipo_cod => 'USUARIO',
                    p_ruta => NULL,
                    p_slug => COALESCE(v_slug, 'USR_' || TO_CHAR(p_id_usuario)),
                    p_icono => NULL,
                    p_descripcion => 'Usuario SAFI - ' || v_email,
                    p_orden => 0,
                    p_activo => 'S'
                );
                
                SELECT id_nodo INTO v_id_nodo
                FROM acc_nodos
                WHERE codigo_tecnico = 'USR_' || TO_CHAR(p_id_usuario);
            EXCEPTION WHEN NO_DATA_FOUND THEN
                RAISE_APPLICATION_ERROR(-20015, 'No se encontró nodo NGAC ni registro SAFI para el usuario con ID ' || p_id_usuario);
            END;
        END IF;
        
        p_out_id_nodo := v_id_nodo;
    END p_resolver_usuario_nodo;

    FUNCTION fn_get_roles_de_usuario(p_id_usuario IN NUMBER) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
        v_user_node_id NUMBER;
    BEGIN
        p_resolver_usuario_nodo(p_id_usuario, v_user_node_id);
        
        OPEN v_cursor FOR
            SELECT n.id_nodo AS id_rol, n.codigo_tecnico AS codigo, n.etiqueta AS nombre, n.descripcion
            FROM acc_nodos n
            JOIN acc_asignaciones a ON n.id_nodo = a.id_padre
            WHERE a.id_hijo = v_user_node_id
              AND n.codigo_tecnico LIKE 'ROL_%';
              
        RETURN v_cursor;
    END fn_get_roles_de_usuario;

    PROCEDURE p_asignar_rol_a_usuario(p_id_usuario IN NUMBER, p_codigo_rol IN VARCHAR2) IS
        v_user_node_id NUMBER;
        v_rol_node_id NUMBER;
    BEGIN
        p_resolver_usuario_nodo(p_id_usuario, v_user_node_id);
        
        BEGIN
            SELECT id_nodo INTO v_rol_node_id
            FROM acc_nodos
            WHERE codigo_tecnico = UPPER(TRIM(p_codigo_rol)) 
              AND id_tipo_nodo = 2 
              AND activo = 'S';
        EXCEPTION WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20016, 'No se encontró el rol con código ' || p_codigo_rol);
        END;
        
        p_enlazar_nodos(v_rol_node_id, v_user_node_id);
        COMMIT;
    END p_asignar_rol_a_usuario;

    PROCEDURE p_revocar_rol_de_usuario(p_id_usuario IN NUMBER, p_codigo_rol IN VARCHAR2) IS
        v_user_node_id NUMBER;
        v_rol_node_id NUMBER;
    BEGIN
        p_resolver_usuario_nodo(p_id_usuario, v_user_node_id);
        
        BEGIN
            SELECT id_nodo INTO v_rol_node_id
            FROM acc_nodos
            WHERE codigo_tecnico = UPPER(TRIM(p_codigo_rol)) 
              AND id_tipo_nodo = 2 
              AND activo = 'S';
        EXCEPTION WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20016, 'No se encontró el rol con código ' || p_codigo_rol);
        END;
        
        p_eliminar_enlace(v_rol_node_id, v_user_node_id);
        COMMIT;
    END p_revocar_rol_de_usuario;

    FUNCTION fn_resolve_node_id(p_codigo IN VARCHAR2) RETURN NUMBER IS
        v_id NUMBER := 0;
    BEGIN
        SELECT id_nodo INTO v_id 
        FROM acc_nodos 
        WHERE codigo_tecnico = UPPER(TRIM(p_codigo)) 
          AND ROWNUM = 1;
        RETURN v_id;
    EXCEPTION WHEN NO_DATA_FOUND THEN
        RETURN 0;
    END fn_resolve_node_id;

END pkg_seguridad_admin;