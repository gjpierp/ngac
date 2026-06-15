CREATE OR REPLACE PACKAGE pkg_seguridad_admin AS
    /**
     * ==================================================================================================================================================
     * @package     PKG_SEGURIDAD_ADMIN
     * @description Director de orquesta para la gestión de acceso de próxima generación (NGAC/ABAC). Gobierna de manera idempotente la creación de 
     * nodos, diccionarios, jerarquías y políticas.
     * @author      Gerardo Paiva
     * ==================================================================================================================================================
     * HISTORIAL DE CAMBIOS:
     * --------------------------------------------------------------------------------------------------------------------------------------------------
     * VERSIÓN  FECHA       AUTOR           DESCRIPCIÓN
     * -------  ----------  --------------  -------------------------------------------------------------------------------------------------------------
     * 1.0.0    02/05/2026  Gerardo Paiva   Creación base para centralizar la gestión de grafos y soporte de tablas.
     * 1.1.0    04/05/2026  Gerardo Paiva   Refactorización de purga a estándar DML (DELETE) para eliminar vulnerabilidades de EXECUTE IMMEDIATE.
     * 1.2.0    06/05/2026  Gerardo Paiva   Adaptación integral a estructura NGAC Pro: CRUD para Operaciones, Nodos y Políticas.
     * 1.3.0    17/05/2026  Gerardo Paiva   Eliminación de métodos SAFI redundantes (delegados a PKG_SAFI_ADMIN).
     * 1.4.0    23/05/2026  Gerardo Paiva   Alineación de tipos y corrección de p_resolver_usuario_nodo según DDL físico real.
     * ==================================================================================================================================================
     */

    -- --- FUNCIONES DE LECTURA ---
    FUNCTION fn_get_dashboard_stats RETURN SYS_REFCURSOR;
    FUNCTION fn_get_nodos_activos RETURN SYS_REFCURSOR;
    FUNCTION fn_get_asignaciones_y_asociaciones RETURN SYS_REFCURSOR;
    FUNCTION fn_get_permisos_rol(p_rolBase IN VARCHAR2) RETURN SYS_REFCURSOR;
    FUNCTION fn_get_nodos_lista RETURN SYS_REFCURSOR;
    FUNCTION fn_get_tipos_nodo RETURN SYS_REFCURSOR;
    FUNCTION fn_get_enlaces RETURN SYS_REFCURSOR;
    FUNCTION fn_get_menu_enlaces RETURN SYS_REFCURSOR;
    FUNCTION fn_get_permisos RETURN SYS_REFCURSOR;
    FUNCTION fn_get_operaciones RETURN SYS_REFCURSOR;
    FUNCTION fn_get_modulos_raiz_nodos RETURN SYS_REFCURSOR;
    FUNCTION fn_get_modulos_raiz_links RETURN SYS_REFCURSOR;
    FUNCTION fn_get_modulos_por_politicas(p_policy_codes_csv IN VARCHAR2) RETURN SYS_REFCURSOR;
    FUNCTION fn_get_nodo_diagnostico(p_codigo IN VARCHAR2) RETURN SYS_REFCURSOR;
    FUNCTION fn_get_politicas_raiz RETURN SYS_REFCURSOR;
    FUNCTION fn_get_permisos_matrix(p_rol IN VARCHAR2, p_politica_id IN NUMBER) RETURN SYS_REFCURSOR;
    FUNCTION fn_get_roles RETURN SYS_REFCURSOR;
    FUNCTION fn_get_logs RETURN SYS_REFCURSOR;
    FUNCTION fn_get_prohibiciones RETURN SYS_REFCURSOR;
    FUNCTION fn_get_roles_por_nodo(p_id IN NUMBER) RETURN SYS_REFCURSOR;
    FUNCTION fn_resolve_node_id(p_codigo IN VARCHAR2) RETURN NUMBER;
    FUNCTION fn_resolve_node_code(p_id_nodo IN NUMBER) RETURN VARCHAR2;
    FUNCTION fn_resolve_tipo_nodo_id(p_codigo IN VARCHAR2) RETURN NUMBER;
    FUNCTION fn_resolve_operacion_id(p_nombre IN VARCHAR2) RETURN NUMBER;
    FUNCTION fn_get_roles_de_usuario(p_id_usuario IN NUMBER) RETURN SYS_REFCURSOR;

    -- --- PROCEDIMIENTOS ---
    PROCEDURE p_desactivar_nodo(p_id IN NUMBER);
    PROCEDURE p_eliminar_enlace(p_id_padre IN NUMBER, p_id_hijo IN NUMBER);
    PROCEDURE p_revocar_permiso(p_id_usr IN NUMBER, p_id_obj IN NUMBER, p_id_op IN NUMBER);
    PROCEDURE p_eliminar_tipo_nodo(p_codigo IN VARCHAR2);
    PROCEDURE p_eliminar_operacion(p_nombre IN VARCHAR2);
    PROCEDURE p_delete_rol(p_id IN NUMBER);
    PROCEDURE p_revocar_prohibicion(p_id IN NUMBER);
    PROCEDURE p_limpiar_grafos;
    PROCEDURE p_enlazar_nodos(p_id_padre IN NUMBER, p_id_hijo IN NUMBER);
    PROCEDURE p_enlazar_menu_nodos(p_id_padre IN NUMBER, p_id_hijo IN NUMBER);
    PROCEDURE p_denegar_permiso(p_id_usr IN NUMBER, p_id_obj IN NUMBER, p_id_op IN NUMBER);
    PROCEDURE p_limpiar_logs;
    PROCEDURE p_upsert_operacion(p_nombre_op IN VARCHAR2, p_desc IN VARCHAR2 DEFAULT NULL);
    PROCEDURE p_upsert_tipo_nodo(p_codigo IN VARCHAR2, p_desc IN VARCHAR2 DEFAULT NULL);
    PROCEDURE p_eliminar_menu_enlace(p_id_padre IN NUMBER, p_id_hijo IN NUMBER);
    PROCEDURE p_resolver_usuario_nodo(p_id_usuario IN NUMBER, p_out_id_nodo OUT NUMBER);
    PROCEDURE p_asignar_rol_a_usuario(p_id_usuario IN NUMBER, p_id_rol IN NUMBER);
    PROCEDURE p_revocar_rol_de_usuario(p_id_usuario IN NUMBER, p_id_rol IN NUMBER);
    
    PROCEDURE p_upsert_rol(
        p_id_rol IN NUMBER DEFAULT NULL,
        p_codigo IN VARCHAR2,
        p_nombre IN VARCHAR2,
        p_descripcion IN VARCHAR2 DEFAULT NULL,
        p_url_ruta IN VARCHAR2 DEFAULT NULL,
        p_slug IN VARCHAR2 DEFAULT NULL,
        p_icono IN VARCHAR2 DEFAULT NULL,
        p_orden_visual IN NUMBER DEFAULT NULL,
        p_activo IN VARCHAR2 DEFAULT 'S'
    );

     PROCEDURE p_upsert_nodo(
         p_id_nodo  IN NUMBER DEFAULT NULL,
         p_codigo   IN VARCHAR2,
         p_etiqueta IN VARCHAR2,
         p_id_tipo_nodo IN NUMBER,
         p_ruta     IN VARCHAR2 DEFAULT NULL,
         p_slug     IN VARCHAR2 DEFAULT NULL,
         p_icono    IN VARCHAR2 DEFAULT NULL,
         p_descripcion IN VARCHAR2 DEFAULT NULL,
         p_orden    IN NUMBER   DEFAULT 0,
         p_activo   IN VARCHAR2 DEFAULT 'S'
     );

     PROCEDURE p_upsert_nodo(
         p_codigo       IN VARCHAR2,
         p_etiqueta     IN VARCHAR2,
         p_tipo         IN VARCHAR2,
         p_ruta         IN VARCHAR2 DEFAULT NULL,
         p_slug         IN VARCHAR2 DEFAULT NULL,
         p_icono        IN VARCHAR2 DEFAULT NULL,
         p_orden        IN NUMBER   DEFAULT 0,
         p_activo       IN VARCHAR2 DEFAULT 'S',
         p_descripcion  IN VARCHAR2 DEFAULT NULL
     );

     PROCEDURE p_otorgar_permiso(
         p_id_usr       IN NUMBER,
         p_id_obj       IN NUMBER,
         p_id_op        IN NUMBER,
         p_condicion_js IN VARCHAR2 DEFAULT NULL
     );

     PROCEDURE p_otorgar_permiso(
         p_cod_usr      IN VARCHAR2,
         p_cod_obj      IN VARCHAR2,
         p_cod_op       IN VARCHAR2,
         p_condicion_js IN VARCHAR2 DEFAULT NULL
     );

     PROCEDURE p_enlazar_nodos(
         p_cod_padre IN VARCHAR2,
         p_cod_hijo  IN VARCHAR2
     );

    PROCEDURE p_clonar_jerarquia(p_id_destino IN NUMBER, p_id_origen IN NUMBER);

    FUNCTION getModulosRaiz RETURN SYS_REFCURSOR;
    FUNCTION get_jerarquia_con_politicas(p_id_raiz IN NUMBER) RETURN SYS_REFCURSOR;

END pkg_seguridad_admin;
/

/

-- =========================================================================
    -- PAQUETE RECONSTRUIDO CON LOGICA DE CLONACION ESTRUCTURAL
    -- =========================================================================


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
	p_id_nodo  IN NUMBER DEFAULT NULL,
	p_codigo   IN VARCHAR2,
	p_etiqueta IN VARCHAR2,
	p_id_tipo_nodo IN NUMBER,
	p_ruta	   IN VARCHAR2 DEFAULT NULL,
	p_slug	   IN VARCHAR2 DEFAULT NULL,
	p_icono    IN VARCHAR2 DEFAULT NULL,
	p_descripcion IN VARCHAR2 DEFAULT NULL,
	p_orden    IN NUMBER   DEFAULT 0,
	p_activo   IN VARCHAR2 DEFAULT 'S'
    ) IS
	v_dummy NUMBER;
    BEGIN
	BEGIN
	    SELECT id_tipo_nodo INTO v_dummy
	    FROM acc_tipos_nodo WHERE id_tipo_nodo = p_id_tipo_nodo;
	EXCEPTION WHEN NO_DATA_FOUND THEN
	    DBMS_OUTPUT.PUT_LINE('[ERR] Tipo de nodo inexistente ID: ' || p_id_tipo_nodo);
	    RETURN;
	END;

	IF p_id_nodo IS NOT NULL THEN
	    UPDATE acc_nodos
	    SET codigo_tecnico = p_codigo,
		etiqueta = p_etiqueta,
		id_tipo_nodo = p_id_tipo_nodo,
		url_ruta = p_ruta,
		slug = p_slug,
		icono = p_icono,
		descripcion = p_descripcion,
		orden_visual = p_orden,
		activo = p_activo
	    WHERE id_nodo = p_id_nodo;

	    IF SQL%ROWCOUNT = 0 THEN
		RAISE_APPLICATION_ERROR(-20017, 'Nodo no encontrado ID: ' || p_id_nodo);
	    END IF;
	ELSE
	    INSERT INTO acc_nodos (codigo_tecnico, etiqueta, id_tipo_nodo, url_ruta, slug, icono, descripcion, orden_visual, activo, creado_por)
	    VALUES (p_codigo, p_etiqueta, p_id_tipo_nodo, p_ruta, p_slug, p_icono, p_descripcion, p_orden, p_activo, USER);
	END IF;
    END p_upsert_nodo;

    PROCEDURE p_upsert_nodo(
	p_codigo       IN VARCHAR2,
	p_etiqueta     IN VARCHAR2,
	p_tipo	       IN VARCHAR2,
	p_ruta	       IN VARCHAR2 DEFAULT NULL,
	p_slug	       IN VARCHAR2 DEFAULT NULL,
	p_icono        IN VARCHAR2 DEFAULT NULL,
	p_orden        IN NUMBER   DEFAULT 0,
	p_activo       IN VARCHAR2 DEFAULT 'S',
	p_descripcion  IN VARCHAR2 DEFAULT NULL
    ) IS
	v_id_tipo NUMBER;
	v_id_nodo NUMBER;
    BEGIN
	v_id_tipo := fn_resolve_tipo_nodo_id(p_tipo);
	IF v_id_tipo IS NULL THEN
	    DBMS_OUTPUT.PUT_LINE('[ERR] Tipo de nodo inexistente: ' || p_tipo);
	    RETURN;
	END IF;

	BEGIN
	    SELECT id_nodo INTO v_id_nodo
	    FROM acc_nodos
	    WHERE codigo_tecnico = p_codigo;
	EXCEPTION WHEN NO_DATA_FOUND THEN
	    v_id_nodo := NULL;
	END;

	p_upsert_nodo(
	    p_id_nodo	   => v_id_nodo,
	    p_codigo	   => p_codigo,
	    p_etiqueta	   => p_etiqueta,
	    p_id_tipo_nodo => v_id_tipo,
	    p_ruta	   => p_ruta,
	    p_slug	   => p_slug,
	    p_icono	   => p_icono,
	    p_descripcion  => p_descripcion,
	    p_orden	   => p_orden,
	    p_activo	   => p_activo
	);
    END p_upsert_nodo;

    PROCEDURE p_enlazar_nodos(p_id_padre IN NUMBER, p_id_hijo IN NUMBER) IS
	v_dummy NUMBER;
    BEGIN
	BEGIN
	    SELECT id_nodo INTO v_dummy FROM acc_nodos WHERE id_nodo = p_id_padre;
	EXCEPTION WHEN NO_DATA_FOUND THEN
	    RAISE_APPLICATION_ERROR(-20008, 'Padre no encontrado ID: ' || p_id_padre);
	END;

	BEGIN
	    SELECT id_nodo INTO v_dummy FROM acc_nodos WHERE id_nodo = p_id_hijo;
	EXCEPTION WHEN NO_DATA_FOUND THEN
	    RAISE_APPLICATION_ERROR(-20008, 'Hijo no encontrado ID: ' || p_id_hijo);
	END;

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

    PROCEDURE p_enlazar_nodos(p_cod_padre IN VARCHAR2, p_cod_hijo IN VARCHAR2) IS
	v_id_padre NUMBER;
	v_id_hijo NUMBER;
    BEGIN
	v_id_padre := fn_resolve_node_id(p_cod_padre);
	IF v_id_padre IS NULL OR v_id_padre = 0 THEN
	    DBMS_OUTPUT.PUT_LINE('[ERR] Padre no encontrado por codigo: ' || p_cod_padre);
	    RETURN;
	END IF;

	v_id_hijo := fn_resolve_node_id(p_cod_hijo);
	IF v_id_hijo IS NULL OR v_id_hijo = 0 THEN
	    DBMS_OUTPUT.PUT_LINE('[ERR] Hijo no encontrado por codigo: ' || p_cod_hijo);
	    RETURN;
	END IF;

	p_enlazar_nodos(v_id_padre, v_id_hijo);
    END p_enlazar_nodos;

    PROCEDURE p_enlazar_menu_nodos(p_id_padre IN NUMBER, p_id_hijo IN NUMBER) IS
	v_menu_padre NUMBER;
	v_menu_hijo NUMBER;
	v_tipo_padre VARCHAR2(50);
    BEGIN
	-- Validar que el padre no sea una hoja (tipo OBJETO o OA)
	SELECT tn.codigo_tipo INTO v_tipo_padre
	FROM acc_nodos n
	JOIN acc_tipos_nodo tn ON n.id_tipo_nodo = tn.id_tipo_nodo
	WHERE n.id_nodo = p_id_padre;

	-- Se comenta esta validación ya que en la base de datos real los sub-directorios del menú también son de tipo OBJETO.
	-- IF v_tipo_padre IN ('OBJETO', 'OA') THEN
        --     RAISE_APPLICATION_ERROR(-20022, 'Un nodo final (hoja) no puede actuar como padre en la jerarquía.');
	-- END IF;

	BEGIN
	    SELECT id_menu_nodo INTO v_menu_padre FROM acc_menu_nodos
	    WHERE id_nodo = p_id_padre AND activo = 'S' AND ROWNUM = 1;
	EXCEPTION WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20019, 'Nodo menú padre no encontrado ID: ' || p_id_padre);
	END;

	BEGIN
	    SELECT id_menu_nodo INTO v_menu_hijo FROM acc_menu_nodos
	    WHERE id_nodo = p_id_hijo AND activo = 'S' AND ROWNUM = 1;
	EXCEPTION WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20020, 'Nodo menú hijo no encontrado ID: ' || p_id_hijo);
	END;

	IF v_menu_padre = v_menu_hijo THEN
            RAISE_APPLICATION_ERROR(-20021, 'No se puede enlazar un nodo menú consigo mismo');
	END IF;

	INSERT INTO acc_menu_asignaciones (id_menu_padre, id_menu_hijo)
	SELECT v_menu_padre, v_menu_hijo
	FROM dual
	WHERE NOT EXISTS (
	    SELECT 1 FROM acc_menu_asignaciones ma
	    WHERE ma.id_menu_padre = v_menu_padre AND ma.id_menu_hijo = v_menu_hijo
	);

	IF SQL%ROWCOUNT > 0 THEN
            DBMS_OUTPUT.PUT_LINE('[MENU_LINK] Enlazado menú ID: ' || p_id_padre || ' -> ' || p_id_hijo);
	END IF;
    END p_enlazar_menu_nodos;

    PROCEDURE p_otorgar_permiso(p_id_usr IN NUMBER, p_id_obj IN NUMBER, p_id_op IN NUMBER, p_condicion_js IN VARCHAR2 DEFAULT NULL) IS
	v_dummy NUMBER;
    BEGIN
	BEGIN
	    SELECT id_nodo INTO v_dummy FROM acc_nodos WHERE id_nodo = p_id_usr;
	EXCEPTION WHEN NO_DATA_FOUND THEN
	    RAISE_APPLICATION_ERROR(-20008, 'Usuario o Rol no encontrado ID: ' || p_id_usr);
	END;

	BEGIN
	    SELECT id_nodo INTO v_dummy FROM acc_nodos WHERE id_nodo = p_id_obj;
	EXCEPTION WHEN NO_DATA_FOUND THEN
	    RAISE_APPLICATION_ERROR(-20008, 'Objeto o Nodo no encontrado ID: ' || p_id_obj);
	END;

	BEGIN
	    SELECT id_op INTO v_dummy FROM acc_operaciones WHERE id_op = p_id_op;
	EXCEPTION WHEN NO_DATA_FOUND THEN
	    RAISE_APPLICATION_ERROR(-20018, 'Operacion no encontrada ID: ' || p_id_op);
	END;

	UPDATE acc_asociaciones
	SET condicion_json = p_condicion_js
	WHERE id_usr_attr = p_id_usr AND id_obj_attr = p_id_obj AND id_op = p_id_op;

	IF SQL%ROWCOUNT = 0 THEN
	    INSERT INTO acc_asociaciones (id_usr_attr, id_obj_attr, id_op, condicion_json, creado_por)
	    VALUES (p_id_usr, p_id_obj, p_id_op, p_condicion_js, USER);
	END IF;

	MERGE INTO acc_asignaciones t
	USING (SELECT p_id_usr as id_padre, p_id_obj as id_hijo FROM dual) s
	ON (t.id_padre = s.id_padre AND t.id_hijo = s.id_hijo)
	WHEN NOT MATCHED THEN
	    INSERT (id_padre, id_hijo) VALUES (s.id_padre, s.id_hijo);

	DBMS_OUTPUT.PUT_LINE('[ALLOW] Permiso otorgado ID_USR=' || p_id_usr || ' ID_OP=' || p_id_op || ' ID_OBJ=' || p_id_obj);
    END p_otorgar_permiso;

    PROCEDURE p_otorgar_permiso(
	p_cod_usr      IN VARCHAR2,
	p_cod_obj      IN VARCHAR2,
	p_cod_op       IN VARCHAR2,
	p_condicion_js IN VARCHAR2 DEFAULT NULL
    ) IS
	v_id_usr NUMBER;
	v_id_obj NUMBER;
	v_id_op NUMBER;
    BEGIN
	v_id_usr := fn_resolve_node_id(p_cod_usr);
	IF v_id_usr IS NULL OR v_id_usr = 0 THEN
	    DBMS_OUTPUT.PUT_LINE('[ERR] Usuario o Rol no encontrado: ' || p_cod_usr);
	    RETURN;
	END IF;

	v_id_obj := fn_resolve_node_id(p_cod_obj);
	IF v_id_obj IS NULL OR v_id_obj = 0 THEN
	    DBMS_OUTPUT.PUT_LINE('[ERR] Objeto o Nodo no encontrado: ' || p_cod_obj);
	    RETURN;
	END IF;

	v_id_op := fn_resolve_operacion_id(p_cod_op);
	IF v_id_op IS NULL OR v_id_op = 0 THEN
	    p_upsert_operacion(p_cod_op);
	    v_id_op := fn_resolve_operacion_id(p_cod_op);
	END IF;

	p_otorgar_permiso(v_id_usr, v_id_obj, v_id_op, p_condicion_js);
    END p_otorgar_permiso;

    PROCEDURE p_denegar_permiso(p_id_usr IN NUMBER, p_id_obj IN NUMBER, p_id_op IN NUMBER) IS
	v_dummy NUMBER;
	v_total NUMBER;
    BEGIN
	BEGIN
	    SELECT id_nodo INTO v_dummy FROM acc_nodos WHERE id_nodo = p_id_usr;
	EXCEPTION WHEN NO_DATA_FOUND THEN
	    RAISE_APPLICATION_ERROR(-20008, 'Usuario o Rol no encontrado ID: ' || p_id_usr);
	END;

	BEGIN
	    SELECT id_nodo INTO v_dummy FROM acc_nodos WHERE id_nodo = p_id_obj;
	EXCEPTION WHEN NO_DATA_FOUND THEN
	    RAISE_APPLICATION_ERROR(-20008, 'Objeto o Nodo no encontrado ID: ' || p_id_obj);
	END;

	BEGIN
	    SELECT id_op INTO v_dummy FROM acc_operaciones WHERE id_op = p_id_op;
	EXCEPTION WHEN NO_DATA_FOUND THEN
	    RAISE_APPLICATION_ERROR(-20018, 'Operacion no encontrada ID: ' || p_id_op);
	END;

	INSERT INTO acc_prohibiciones (id_usr_attr, id_obj_attr, id_op, creado_por)
	SELECT p_id_usr, p_id_obj, p_id_op, USER
	FROM dual
	WHERE NOT EXISTS (
	    SELECT 1 FROM acc_prohibiciones p
	    WHERE p.id_usr_attr = p_id_usr AND p.id_obj_attr = p_id_obj AND p.id_op = p_id_op
	);

	IF SQL%ROWCOUNT > 0 THEN
	    DBMS_OUTPUT.PUT_LINE('[DENY] Prohibicion inyectada ID_USR=' || p_id_usr || ' ID_OP=' || p_id_op || ' ID_OBJ=' || p_id_obj);
	END IF;

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
	    SELECT a.id_asignacion, a.id_padre, a.id_hijo, p.codigo_tecnico as padre, h.codigo_tecnico as hijo
	    FROM acc_asignaciones a
	    JOIN acc_nodos p ON a.id_padre = p.id_nodo
	    JOIN acc_nodos h ON a.id_hijo = h.id_nodo
	    ORDER BY a.id_asignacion DESC;
	RETURN v_cursor;
    END fn_get_enlaces;

    FUNCTION fn_get_menu_enlaces RETURN SYS_REFCURSOR IS
	v_cursor SYS_REFCURSOR;
    BEGIN
	OPEN v_cursor FOR
	    SELECT ma.id_menu_asignacion, n_padre.id_nodo AS id_padre, n_hijo.id_nodo AS id_hijo,
		   n_padre.codigo_tecnico AS padre, n_hijo.codigo_tecnico AS hijo,
		   n_padre.etiqueta AS padre_etiqueta, n_hijo.etiqueta AS hijo_etiqueta
	    FROM acc_menu_asignaciones ma
	    JOIN acc_menu_nodos mn_padre ON mn_padre.id_menu_nodo = ma.id_menu_padre
	    JOIN acc_menu_nodos mn_hijo ON mn_hijo.id_menu_nodo = ma.id_menu_hijo
	    JOIN acc_nodos n_padre ON n_padre.id_nodo = mn_padre.id_nodo
	    JOIN acc_nodos n_hijo ON n_hijo.id_nodo = mn_hijo.id_nodo
	    ORDER BY ma.id_menu_asignacion DESC;
	RETURN v_cursor;
    END fn_get_menu_enlaces;

    FUNCTION fn_get_permisos RETURN SYS_REFCURSOR IS
	v_cursor SYS_REFCURSOR;
    BEGIN
	OPEN v_cursor FOR
	    SELECT p.id_asociacion, usr.id_nodo as usr, usr.codigo_tecnico as usr_codigo, usr.etiqueta as usr_etiqueta,
		   obj.id_nodo as obj, obj.codigo_tecnico as obj_codigo, obj.etiqueta as obj_etiqueta,
		   op.nombre_op as op, p.condicion_json, p.fecha_creacion as fecha_registro
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
	    SELECT DISTINCT p.id_nodo AS id_padre, h.id_nodo AS id_hijo
	    FROM acc_menu_asignaciones a
	    JOIN acc_menu_nodos mp ON a.id_menu_padre = mp.id_menu_nodo
	    JOIN acc_menu_nodos mh ON a.id_menu_hijo = mh.id_menu_nodo
	    JOIN acc_nodos p ON mp.id_nodo = p.id_nodo
	    JOIN acc_nodos h ON mh.id_nodo = h.id_nodo
	    JOIN acc_tipos_nodo tp ON p.id_tipo_nodo = tp.id_tipo_nodo
	    JOIN acc_tipos_nodo th ON h.id_tipo_nodo = th.id_tipo_nodo
	    WHERE UPPER(tp.codigo_tipo) IN ('OBJ_ATTR', 'OBJETO')
	      AND UPPER(th.codigo_tipo) IN ('OBJ_ATTR', 'OBJETO');
	RETURN v_cursor;
    END fn_get_modulos_raiz_links;

    FUNCTION fn_get_modulos_por_politicas(p_policy_codes_csv IN VARCHAR2) RETURN SYS_REFCURSOR IS
	v_cursor SYS_REFCURSOR;
    BEGIN
	OPEN v_cursor FOR
	    WITH policy_codes AS (
		SELECT UPPER(TRIM(REGEXP_SUBSTR(p_policy_codes_csv, '[^,]+', 1, LEVEL))) AS codigo
		FROM dual
		CONNECT BY REGEXP_SUBSTR(p_policy_codes_csv, '[^,]+', 1, LEVEL) IS NOT NULL
	    )
	    SELECT DISTINCT n.codigo_tecnico
	    FROM policy_codes pc
	    JOIN acc_nodos p ON UPPER(p.codigo_tecnico) = pc.codigo
	    JOIN acc_policy_menu_raices pmr ON pmr.id_policy = p.id_nodo
	    JOIN acc_menu_nodos mn ON mn.id_menu_nodo = pmr.id_menu_nodo
	    JOIN acc_nodos n ON n.id_nodo = mn.id_nodo
	    WHERE mn.activo = 'S'
	    ORDER BY n.codigo_tecnico;
	RETURN v_cursor;
    END fn_get_modulos_por_politicas;

    FUNCTION fn_get_nodo_diagnostico(p_codigo IN VARCHAR2) RETURN SYS_REFCURSOR IS
	v_cursor SYS_REFCURSOR;
    BEGIN
	OPEN v_cursor FOR
	    SELECT n.id_nodo, n.activo, n.codigo_tecnico, t.codigo_tipo AS tipo_nodo
	    FROM acc_nodos n
	    LEFT JOIN acc_tipos_nodo t ON t.id_tipo_nodo = n.id_tipo_nodo
	    WHERE UPPER(n.codigo_tecnico) = UPPER(TRIM(p_codigo));
	RETURN v_cursor;
    END fn_get_nodo_diagnostico;

    FUNCTION fn_get_politicas_raiz RETURN SYS_REFCURSOR IS
	v_cursor SYS_REFCURSOR;
    BEGIN
	OPEN v_cursor FOR
	    SELECT n.id_nodo, n.codigo_tecnico, n.etiqueta, t.codigo_tipo as tipo_nodo,
		   n.url_ruta, n.slug, n.icono, n.descripcion, n.orden_visual, n.activo
	    FROM acc_nodos n
	    LEFT JOIN acc_asignaciones a ON n.id_nodo = a.id_hijo
	    LEFT JOIN acc_tipos_nodo t ON n.id_tipo_nodo = t.id_tipo_nodo
	    WHERE UPPER(t.codigo_tipo) = 'POLICY' AND a.id_hijo IS NULL
	    ORDER BY n.orden_visual ASC;
	RETURN v_cursor;
    END fn_get_politicas_raiz;

    FUNCTION fn_get_permisos_matrix(p_rol IN VARCHAR2, p_politica_id IN NUMBER) RETURN SYS_REFCURSOR IS
	v_cursor SYS_REFCURSOR;
    BEGIN
	OPEN v_cursor FOR
	    WITH descendants AS (
		SELECT p_politica_id AS id_nodo FROM dual
		UNION
		SELECT a.id_hijo AS id_nodo
		FROM acc_asignaciones a
		START WITH a.id_padre = p_politica_id
		CONNECT BY PRIOR a.id_hijo = a.id_padre
	    )
	    SELECT p.id_asociacion, usr.id_nodo AS usr, usr.codigo_tecnico AS usr_codigo, usr.etiqueta AS usr_etiqueta,
		   obj.id_nodo AS obj, obj.codigo_tecnico AS obj_codigo, obj.etiqueta AS obj_etiqueta,
		   op.nombre_op AS op, p.condicion_json, p.fecha_creacion AS fecha_registro
	    FROM acc_asociaciones p
	    JOIN acc_nodos usr ON p.id_usr_attr = usr.id_nodo
	    JOIN acc_nodos obj ON p.id_obj_attr = obj.id_nodo
	    JOIN acc_operaciones op ON p.id_op = op.id_op
	    WHERE UPPER(usr.codigo_tecnico) = UPPER(TRIM(p_rol))
	      AND obj.id_nodo IN (SELECT id_nodo FROM descendants)
	    ORDER BY obj.etiqueta ASC, op.nombre_op ASC;
	RETURN v_cursor;
    END fn_get_permisos_matrix;

    FUNCTION fn_get_roles RETURN SYS_REFCURSOR IS
	v_cursor SYS_REFCURSOR;
    BEGIN
	OPEN v_cursor FOR
	    SELECT n.id_nodo as id_rol, n.id_nodo as id_nodo, n.codigo_tecnico as codigo, n.etiqueta as nombre,
		   n.descripcion, n.id_tipo_nodo, n.url_ruta, n.slug, n.icono, n.orden_visual, n.activo
	    FROM acc_nodos n
	    JOIN acc_tipos_nodo t ON n.id_tipo_nodo = t.id_tipo_nodo
	    WHERE UPPER(t.codigo_tipo) IN ('USUARIO', 'USR_ATTR') AND n.codigo_tecnico LIKE 'ROL_%'
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
	    SELECT p.id_prohibicion, usr.id_nodo as usr, usr.etiqueta as usr_etiqueta,
		   obj.id_nodo as obj, obj.etiqueta as obj_etiqueta, op.nombre_op as op,
		   p.fecha_creacion as fecha_registro, p.creado_por
	    FROM acc_prohibiciones p
	    JOIN acc_nodos usr ON p.id_usr_attr = usr.id_nodo
	    JOIN acc_nodos obj ON p.id_obj_attr = obj.id_nodo
	    JOIN acc_operaciones op ON p.id_op = op.id_op
	    ORDER BY p.fecha_creacion DESC;
	RETURN v_cursor;
    END fn_get_prohibiciones;

    FUNCTION fn_get_roles_por_nodo(p_id IN NUMBER) RETURN SYS_REFCURSOR IS
	v_cursor SYS_REFCURSOR;
    BEGIN
	OPEN v_cursor FOR
	    SELECT DISTINCT n_rol.id_nodo AS id_rol, n_rol.codigo_tecnico AS codigo, n_rol.etiqueta AS nombre
	    FROM acc_nodos n_rol
	    WHERE n_rol.codigo_tecnico LIKE 'ROL_%'
	      AND (
		  EXISTS (SELECT 1 FROM acc_asignaciones a WHERE a.id_padre = n_rol.id_nodo AND a.id_hijo = p_id)
		  OR EXISTS (SELECT 1 FROM acc_asociaciones aso WHERE aso.id_usr_attr = n_rol.id_nodo AND aso.id_obj_attr = p_id)
	      )
	    ORDER BY n_rol.etiqueta;
	RETURN v_cursor;
    END fn_get_roles_por_nodo;

    PROCEDURE p_desactivar_nodo(p_id IN NUMBER) IS
    BEGIN
	-- 1. Desactivar el nodo principal
	UPDATE acc_nodos SET activo = 'N' WHERE id_nodo = p_id;
	IF SQL%ROWCOUNT = 0 THEN
	    RAISE_APPLICATION_ERROR(-20001, 'Nodo no encontrado ID: ' || p_id);
	END IF;

	-- 2. Desactivar en acc_menu_nodos
	UPDATE acc_menu_nodos SET activo = 'N' WHERE id_nodo = p_id;

	-- 3. Desactivar asignaciones (enlaces de seguridad)
	UPDATE acc_asignaciones SET activo = 'N' WHERE id_padre = p_id OR id_hijo = p_id;

        -- 4. Desactivar asignaciones de menú
	UPDATE acc_menu_asignaciones
	SET activo = 'N'
	WHERE id_menu_padre IN (SELECT id_menu_nodo FROM acc_menu_nodos WHERE id_nodo = p_id)
	   OR id_menu_hijo IN (SELECT id_menu_nodo FROM acc_menu_nodos WHERE id_nodo = p_id);

	-- 5. Desactivar asociaciones de permisos
	UPDATE acc_asociaciones SET activo = 'N' WHERE id_obj_attr = p_id;
    END p_desactivar_nodo;

    PROCEDURE p_eliminar_enlace(p_id_padre IN NUMBER, p_id_hijo IN NUMBER) IS
	v_dummy NUMBER;
    BEGIN
	BEGIN
	    SELECT id_nodo INTO v_dummy FROM acc_nodos WHERE id_nodo = p_id_padre;
	EXCEPTION WHEN NO_DATA_FOUND THEN
	    RAISE_APPLICATION_ERROR(-20008, 'Padre no encontrado ID: ' || p_id_padre);
	END;

	BEGIN
	    SELECT id_nodo INTO v_dummy FROM acc_nodos WHERE id_nodo = p_id_hijo;
	EXCEPTION WHEN NO_DATA_FOUND THEN
	    RAISE_APPLICATION_ERROR(-20008, 'Hijo no encontrado ID: ' || p_id_hijo);
	END;

	DELETE FROM acc_asignaciones WHERE id_padre = p_id_padre AND id_hijo = p_id_hijo;
	IF SQL%ROWCOUNT = 0 THEN
            RAISE_APPLICATION_ERROR(-20002, 'Vínculo no encontrado');
	END IF;
    END p_eliminar_enlace;

    PROCEDURE p_eliminar_menu_enlace(p_id_padre IN NUMBER, p_id_hijo IN NUMBER) IS
    BEGIN
	DELETE FROM acc_menu_asignaciones ma
	WHERE ma.id_menu_padre IN (SELECT mn.id_menu_nodo FROM acc_menu_nodos mn WHERE mn.id_nodo = p_id_padre)
	  AND ma.id_menu_hijo IN (SELECT mn.id_menu_nodo FROM acc_menu_nodos mn WHERE mn.id_nodo = p_id_hijo);

	IF SQL%ROWCOUNT = 0 THEN
            RAISE_APPLICATION_ERROR(-20002, 'Vínculo de menú no encontrado');
	END IF;
    END p_eliminar_menu_enlace;

    PROCEDURE p_revocar_permiso(p_id_usr IN NUMBER, p_id_obj IN NUMBER, p_id_op IN NUMBER) IS
	v_dummy NUMBER;
	v_total NUMBER;
    BEGIN
	BEGIN
	    SELECT id_nodo INTO v_dummy FROM acc_nodos WHERE id_nodo = p_id_usr;
	EXCEPTION WHEN NO_DATA_FOUND THEN
	    RAISE_APPLICATION_ERROR(-20008, 'Usuario o Rol no encontrado ID: ' || p_id_usr);
	END;

	BEGIN
	    SELECT id_nodo INTO v_dummy FROM acc_nodos WHERE id_nodo = p_id_obj;
	EXCEPTION WHEN NO_DATA_FOUND THEN
	    RAISE_APPLICATION_ERROR(-20008, 'Objeto o Nodo no encontrado ID: ' || p_id_obj);
	END;

	BEGIN
	    SELECT id_op INTO v_dummy FROM acc_operaciones WHERE id_op = p_id_op;
	EXCEPTION WHEN NO_DATA_FOUND THEN
	    RAISE_APPLICATION_ERROR(-20018, 'Operacion no encontrada ID: ' || p_id_op);
	END;

	DELETE FROM acc_asociaciones WHERE id_usr_attr = p_id_usr AND id_obj_attr = p_id_obj AND id_op = p_id_op;

	IF SQL%ROWCOUNT = 0 THEN
	    RAISE_APPLICATION_ERROR(-20003, 'Permiso no encontrado');
	END IF;

	SELECT COUNT(*) INTO v_total FROM acc_asociaciones WHERE id_usr_attr = p_id_usr AND id_obj_attr = p_id_obj;
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
    -- RESOLUCIÓN DE USUARIOS AJUSTADO AL MODELO FÍSICO REAL (Columna SLUG de SAFI)
    -- =========================================================================

    PROCEDURE p_resolver_usuario_nodo(p_id_usuario IN NUMBER, p_out_id_nodo OUT NUMBER) IS
	v_id_nodo NUMBER := NULL;
	v_user_tipo_id NUMBER := NULL;
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
                -- CORREGIDO: Se cambia el campo ficticio por slug_usuario que es el campo físico real de SAFI_USUARIOS
		SELECT nombres, apellidos, slug_usuario, email
		INTO v_nombres, v_apellidos, v_slug, v_email
		FROM safi_usuarios
		WHERE id_usuario = p_id_usuario;

		SELECT id_tipo_nodo INTO v_user_tipo_id
		FROM acc_tipos_nodo
		WHERE UPPER(codigo_tipo) = 'USUARIO' AND ROWNUM = 1;

		p_upsert_nodo(
		    p_id_nodo => NULL,
		    p_codigo => 'USR_' || TO_CHAR(p_id_usuario),
		    p_etiqueta => TRIM(v_nombres || ' ' || v_apellidos),
		    p_id_tipo_nodo => v_user_tipo_id,
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
	    WHERE a.id_hijo = v_user_node_id AND n.codigo_tecnico LIKE 'ROL_%';

	RETURN v_cursor;
    END fn_get_roles_de_usuario;

    PROCEDURE p_asignar_rol_a_usuario(p_id_usuario IN NUMBER, p_id_rol IN NUMBER) IS
	v_user_node_id NUMBER;
	v_rol_node_id NUMBER;
    BEGIN
	p_resolver_usuario_nodo(p_id_usuario, v_user_node_id);

	BEGIN
	    SELECT id_nodo INTO v_rol_node_id
	    FROM acc_nodos
	    WHERE id_nodo = p_id_rol AND id_tipo_nodo = 2 AND activo = 'S';
	EXCEPTION WHEN NO_DATA_FOUND THEN
	    RAISE_APPLICATION_ERROR(-20016, 'No se encontro el rol con ID ' || p_id_rol);
	END;

	p_enlazar_nodos(v_rol_node_id, v_user_node_id);
	COMMIT;
    END p_asignar_rol_a_usuario;

    PROCEDURE p_revocar_rol_de_usuario(p_id_usuario IN NUMBER, p_id_rol IN NUMBER) IS
	v_user_node_id NUMBER;
	v_rol_node_id NUMBER;
    BEGIN
	p_resolver_usuario_nodo(p_id_usuario, v_user_node_id);

	BEGIN
	    SELECT id_nodo INTO v_rol_node_id
	    FROM acc_nodos
	    WHERE id_nodo = p_id_rol AND id_tipo_nodo = 2 AND activo = 'S';
	EXCEPTION WHEN NO_DATA_FOUND THEN
	    RAISE_APPLICATION_ERROR(-20016, 'No se encontro el rol con ID ' || p_id_rol);
	END;

	p_eliminar_enlace(v_rol_node_id, v_user_node_id);
	COMMIT;
    END p_revocar_rol_de_usuario;

    PROCEDURE p_upsert_rol(
	p_id_rol IN NUMBER DEFAULT NULL,
	p_codigo IN VARCHAR2,
	p_nombre IN VARCHAR2,
	p_descripcion IN VARCHAR2 DEFAULT NULL,
	p_url_ruta IN VARCHAR2 DEFAULT NULL,
	p_slug IN VARCHAR2 DEFAULT NULL,
	p_icono IN VARCHAR2 DEFAULT NULL,
	p_orden_visual IN NUMBER DEFAULT NULL,
	p_activo IN VARCHAR2 DEFAULT 'S'
    ) IS
	v_codigo VARCHAR2(200);
	v_existing acc_nodos%ROWTYPE;
	v_role_type_id NUMBER;
	v_has_existing BOOLEAN := FALSE;
    BEGIN
	v_codigo := UPPER(TRIM(p_codigo));
	IF v_codigo NOT LIKE 'ROL_%' THEN
	    v_codigo := 'ROL_' || v_codigo;
	END IF;

	BEGIN
	    SELECT * INTO v_existing FROM acc_nodos
	    WHERE UPPER(codigo_tecnico) = v_codigo AND ROWNUM = 1;
	    v_has_existing := TRUE;
	EXCEPTION WHEN NO_DATA_FOUND THEN
	    v_has_existing := FALSE;
	END;

	BEGIN
	    SELECT id_tipo_nodo INTO v_role_type_id
	    FROM (
		SELECT id_tipo_nodo, CASE WHEN UPPER(codigo_tipo) = 'USR_ATTR' THEN 0 ELSE 1 END AS prioridad
		FROM acc_tipos_nodo WHERE UPPER(codigo_tipo) IN ('USR_ATTR', 'USUARIO') ORDER BY prioridad
	    )
	    WHERE ROWNUM = 1;
	EXCEPTION WHEN NO_DATA_FOUND THEN
	    RAISE_APPLICATION_ERROR(-20022, 'No existe un tipo de nodo compatible para roles (USR_ATTR o USUARIO)');
	END;

	p_upsert_nodo(
	    p_id_nodo => COALESCE(p_id_rol, CASE WHEN v_has_existing THEN v_existing.id_nodo END),
	    p_codigo => v_codigo,
	    p_etiqueta => p_nombre,
	    p_id_tipo_nodo => COALESCE(CASE WHEN v_has_existing THEN v_existing.id_tipo_nodo END, v_role_type_id),
	    p_ruta => COALESCE(p_url_ruta, CASE WHEN v_has_existing THEN v_existing.url_ruta END),
	    p_slug => COALESCE(p_slug, CASE WHEN v_has_existing THEN v_existing.slug END),
	    p_icono => COALESCE(p_icono, CASE WHEN v_has_existing THEN v_existing.icono END),
	    p_descripcion => COALESCE(p_descripcion, CASE WHEN v_has_existing THEN v_existing.descripcion END),
	    p_orden => COALESCE(p_orden_visual, CASE WHEN v_has_existing THEN v_existing.orden_visual END, 0),
	    p_activo => COALESCE(p_activo, CASE WHEN v_has_existing THEN v_existing.activo END, 'S')
	);
    END p_upsert_rol;

    FUNCTION fn_resolve_node_id(p_codigo IN VARCHAR2) RETURN NUMBER IS
	v_id NUMBER := 0;
    BEGIN
	SELECT id_nodo INTO v_id FROM acc_nodos WHERE codigo_tecnico = UPPER(TRIM(p_codigo)) AND ROWNUM = 1;
	RETURN v_id;
    EXCEPTION WHEN NO_DATA_FOUND THEN RETURN 0;
    END fn_resolve_node_id;

    FUNCTION fn_resolve_node_code(p_id_nodo IN NUMBER) RETURN VARCHAR2 IS
	v_codigo VARCHAR2(4000) := '';
    BEGIN
	SELECT codigo_tecnico INTO v_codigo FROM acc_nodos WHERE id_nodo = p_id_nodo AND ROWNUM = 1;
	RETURN UPPER(TRIM(v_codigo));
    EXCEPTION WHEN NO_DATA_FOUND THEN RETURN '';
    END fn_resolve_node_code;

    FUNCTION fn_resolve_tipo_nodo_id(p_codigo IN VARCHAR2) RETURN NUMBER IS
	v_id NUMBER := 0;
    BEGIN
	SELECT id_tipo_nodo INTO v_id FROM acc_tipos_nodo WHERE UPPER(codigo_tipo) = UPPER(TRIM(p_codigo)) AND ROWNUM = 1;
	RETURN v_id;
    EXCEPTION WHEN NO_DATA_FOUND THEN RETURN 0;
    END fn_resolve_tipo_nodo_id;

    FUNCTION fn_resolve_operacion_id(p_nombre IN VARCHAR2) RETURN NUMBER IS
	v_id NUMBER := 0;
    BEGIN
	SELECT id_op INTO v_id FROM acc_operaciones WHERE UPPER(nombre_op) = UPPER(TRIM(p_nombre)) AND ROWNUM = 1;
	RETURN v_id;
    EXCEPTION WHEN NO_DATA_FOUND THEN RETURN 0;
    END fn_resolve_operacion_id;

    PROCEDURE p_clonar_nodo_recursivo(
        p_id_nodo_origen IN NUMBER,
        p_id_nodo_padre_nuevo IN NUMBER,
        p_id_menu_padre_nuevo IN NUMBER
    ) IS
        v_child_count NUMBER := 0;
        v_new_id_nodo NUMBER;
        v_new_id_menu_nodo NUMBER := NULL;
        v_has_menu NUMBER := 0;
        v_orig_menu_nodo NUMBER := NULL;
    BEGIN
        SELECT COUNT(*) INTO v_child_count
        FROM acc_asignaciones a
        WHERE a.id_padre = p_id_nodo_origen 
          AND a.activo = 'S';

        IF v_child_count > 0 THEN
            SELECT acc_nodos_seq.NEXTVAL INTO v_new_id_nodo FROM dual;
            
            INSERT INTO acc_nodos (
                id_nodo, id_tipo_nodo, codigo_tecnico, etiqueta, url_ruta,
                slug, icono, orden_visual, activo, descripcion, creado_por, fecha_creacion
            )
            SELECT 
                v_new_id_nodo, id_tipo_nodo, SUBSTR(codigo_tecnico, 1, 220) || '_C' || v_new_id_nodo, etiqueta, url_ruta,
                slug, icono, orden_visual, activo, descripcion, USER, SYSDATE
            FROM acc_nodos
            WHERE id_nodo = p_id_nodo_origen;
            
            SELECT COUNT(*) INTO v_has_menu 
            FROM acc_menu_nodos 
            WHERE id_nodo = p_id_nodo_origen AND activo = 'S';
            
            IF v_has_menu > 0 THEN
                SELECT acc_menu_nodos_seq.NEXTVAL INTO v_new_id_menu_nodo FROM dual;
                
                INSERT INTO acc_menu_nodos (
                    id_menu_nodo, id_nodo, etiqueta_visible, url_ruta_visible,
                    slug_visible, icono_visible, descripcion_visible, orden_visual, activo, creado_por, fecha_creacion
                )
                SELECT 
                    v_new_id_menu_nodo, v_new_id_nodo, etiqueta_visible, url_ruta_visible,
                    slug_visible, icono_visible, descripcion_visible, orden_visual, activo, USER, SYSDATE
                FROM acc_menu_nodos
                WHERE id_nodo = p_id_nodo_origen AND activo = 'S' AND ROWNUM = 1;
            END IF;
            
            IF p_id_nodo_padre_nuevo IS NOT NULL THEN
                INSERT INTO acc_asignaciones (id_padre, id_hijo, activo, creado_por, fecha_creacion)
                VALUES (p_id_nodo_padre_nuevo, v_new_id_nodo, 'S', USER, SYSDATE);
                
                IF p_id_menu_padre_nuevo IS NOT NULL AND v_new_id_menu_nodo IS NOT NULL THEN
                    INSERT INTO acc_menu_asignaciones (id_menu_padre, id_menu_hijo, activo, creado_por, fecha_creacion)
                    VALUES (p_id_menu_padre_nuevo, v_new_id_menu_nodo, 'S', USER, SYSDATE);
                END IF;
            END IF;
            
            FOR r IN (
                SELECT id_hijo AS id_hijo_origen
                FROM acc_asignaciones
                WHERE id_padre = p_id_nodo_origen 
                  AND activo = 'S'
            ) LOOP
                p_clonar_nodo_recursivo(r.id_hijo_origen, v_new_id_nodo, v_new_id_menu_nodo);
            END LOOP;

        ELSE
            BEGIN
                SELECT id_menu_nodo INTO v_orig_menu_nodo
                FROM acc_menu_nodos
                WHERE id_nodo = p_id_nodo_origen AND activo = 'S' AND ROWNUM = 1;
            EXCEPTION WHEN NO_DATA_FOUND THEN
                v_orig_menu_nodo := NULL;
            END;
            
            IF p_id_nodo_padre_nuevo IS NOT NULL THEN
                INSERT INTO acc_asignaciones (id_padre, id_hijo, activo, creado_por, fecha_creacion)
                SELECT p_id_nodo_padre_nuevo, p_id_nodo_origen, 'S', USER, SYSDATE
                FROM dual
                WHERE NOT EXISTS (
                    SELECT 1 FROM acc_asignaciones 
                    WHERE id_padre = p_id_nodo_padre_nuevo AND id_hijo = p_id_nodo_origen
                );
                
                IF p_id_menu_padre_nuevo IS NOT NULL AND v_orig_menu_nodo IS NOT NULL THEN
                    INSERT INTO acc_menu_asignaciones (id_menu_padre, id_menu_hijo, activo, creado_por, fecha_creacion)
                    SELECT p_id_menu_padre_nuevo, v_orig_menu_nodo, 'S', USER, SYSDATE
                    FROM dual
                    WHERE NOT EXISTS (
                        SELECT 1 FROM acc_menu_asignaciones
                        WHERE id_menu_padre = p_id_menu_padre_nuevo AND id_menu_hijo = v_orig_menu_nodo
                    );
                END IF;
            END IF;
        END IF;
    END p_clonar_nodo_recursivo;

    PROCEDURE p_clonar_jerarquia(p_id_destino IN NUMBER, p_id_origen IN NUMBER) IS
        v_menu_destino NUMBER := NULL;
        v_dummy NUMBER;
    BEGIN
        BEGIN
            SELECT id_nodo INTO v_dummy FROM acc_nodos WHERE id_nodo = p_id_destino;
        EXCEPTION WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20025, 'Nodo destino no encontrado ID: ' || p_id_destino);
        END;

        BEGIN
            SELECT id_nodo INTO v_dummy FROM acc_nodos WHERE id_nodo = p_id_origen;
        EXCEPTION WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20026, 'Nodo origen no encontrado ID: ' || p_id_origen);
        END;

        BEGIN
            SELECT id_menu_nodo INTO v_menu_destino
            FROM acc_menu_nodos
            WHERE id_nodo = p_id_destino AND activo = 'S' AND ROWNUM = 1;
        EXCEPTION WHEN NO_DATA_FOUND THEN
            v_menu_destino := NULL;
        END;

        FOR r IN (
            SELECT id_hijo AS id_hijo_origen
            FROM acc_asignaciones
            WHERE id_padre = p_id_origen
              AND activo = 'S'
        ) LOOP
            p_clonar_nodo_recursivo(r.id_hijo_origen, p_id_destino, v_menu_destino);
        END LOOP;
    END p_clonar_jerarquia;

    FUNCTION getModulosRaiz RETURN SYS_REFCURSOR IS
	v_cursor SYS_REFCURSOR;
    BEGIN
	OPEN v_cursor FOR
	    SELECT
		n.id_nodo,
		n.codigo_tecnico,
		n.etiqueta,
		n.descripcion,
		n.orden_visual,
		t.codigo_tipo as tipo_nodo
	    FROM acc_nodos n
	    JOIN acc_tipos_nodo t ON n.id_tipo_nodo = t.id_tipo_nodo
	    WHERE NOT EXISTS (
		SELECT 1 FROM acc_asignaciones a
		WHERE a.id_hijo = n.id_nodo AND a.activo = 'S'
	    )
	    AND n.activo = 'S'
	    AND t.codigo_tipo IN ('OBJETO', 'OBJ_ATTR')
	    ORDER BY n.orden_visual ASC, n.etiqueta ASC;
	RETURN v_cursor;
    END getModulosRaiz;

    FUNCTION get_jerarquia_con_politicas(p_id_raiz IN NUMBER) RETURN SYS_REFCURSOR IS
	v_cursor SYS_REFCURSOR;
    BEGIN
	OPEN v_cursor FOR
	    WITH jerarquia (id_nodo, id_padre, nivel) AS (
		SELECT id_nodo, TO_NUMBER(NULL) as id_padre, 0 as nivel
		FROM acc_nodos
		WHERE id_nodo = p_id_raiz AND activo = 'S'
		UNION ALL
		SELECT a.id_hijo, a.id_padre, j.nivel + 1
		FROM acc_asignaciones a
		JOIN jerarquia j ON a.id_padre = j.id_nodo
		WHERE a.activo = 'S'
	    )
	    SELECT
		j.id_nodo,
		n.codigo_tecnico,
		n.etiqueta,
		n.descripcion,
		j.id_padre,
		j.nivel,
		t.codigo_tipo as tipo_nodo,
		(
		    SELECT LISTAGG(p.codigo_tecnico, ',') WITHIN GROUP (ORDER BY p.codigo_tecnico)
		    FROM acc_asignaciones ap
		    JOIN acc_nodos p ON ap.id_hijo = p.id_nodo
		    JOIN acc_tipos_nodo tp ON p.id_tipo_nodo = tp.id_tipo_nodo
		    WHERE ap.id_padre = j.id_nodo
		      AND ap.activo = 'S'
		      AND p.activo = 'S'
		      AND tp.codigo_tipo = 'POLICY'
		) as politicas_directas
	    FROM jerarquia j
	    JOIN acc_nodos n ON j.id_nodo = n.id_nodo
	    JOIN acc_tipos_nodo t ON n.id_tipo_nodo = t.id_tipo_nodo
	    WHERE n.activo = 'S'
	    ORDER BY j.nivel, n.orden_visual;
	RETURN v_cursor;
    END get_jerarquia_con_politicas;

END pkg_seguridad_admin;

/
