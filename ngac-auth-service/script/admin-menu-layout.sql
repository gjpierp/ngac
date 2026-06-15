-- Ajusta el menú administrativo para que cuelgue del nodo ADMINISTRACION
-- y quede modelado completamente en Oracle.

DECLARE
  v_objeto_id NUMBER;
  v_obj_attr_id NUMBER;
  v_ver_op_id NUMBER;

  FUNCTION node_id(p_code IN VARCHAR2) RETURN NUMBER IS
  BEGIN
    RETURN pkg_seguridad_admin.fn_resolve_node_id(p_code);
  END;

  PROCEDURE ensure_node(
    p_code IN VARCHAR2,
    p_label IN VARCHAR2,
    p_type_id IN NUMBER,
    p_route IN VARCHAR2 DEFAULT NULL,
    p_icon IN VARCHAR2 DEFAULT NULL,
    p_order IN NUMBER DEFAULT 0
  ) IS
    v_id NUMBER;
  BEGIN
    v_id := node_id(p_code);

    pkg_seguridad_admin.p_upsert_nodo(
      p_id_nodo => CASE WHEN v_id = 0 THEN NULL ELSE v_id END,
      p_codigo => UPPER(TRIM(p_code)),
      p_etiqueta => p_label,
      p_id_tipo_nodo => p_type_id,
      p_ruta => p_route,
      p_slug => LOWER(REPLACE(TRIM(p_code), '_', '-')),
      p_icono => p_icon,
      p_descripcion => 'Nodo de navegación administrativa',
      p_orden => p_order,
      p_activo => 'S'
    );

    v_id := node_id(p_code);

    MERGE INTO acc_menu_nodos dst
    USING (
      SELECT v_id AS id_nodo,
             p_label AS etiqueta_visible,
             p_route AS url_ruta_visible,
             LOWER(REPLACE(TRIM(p_code), '_', '-')) AS slug_visible,
             p_icon AS icono_visible,
             p_order AS orden_visual
      FROM dual
    ) src
      ON (dst.id_nodo = src.id_nodo)
    WHEN MATCHED THEN
      UPDATE SET dst.etiqueta_visible = src.etiqueta_visible,
                 dst.url_ruta_visible = src.url_ruta_visible,
                 dst.slug_visible = src.slug_visible,
                 dst.icono_visible = src.icono_visible,
                 dst.orden_visual = src.orden_visual,
                 dst.activo = 'S'
    WHEN NOT MATCHED THEN
      INSERT (
        id_nodo,
        etiqueta_visible,
        url_ruta_visible,
        slug_visible,
        icono_visible,
        descripcion_visible,
        orden_visual,
        activo,
        fecha_creacion,
        creado_por
      )
      VALUES (
        src.id_nodo,
        src.etiqueta_visible,
        src.url_ruta_visible,
        src.slug_visible,
        src.icono_visible,
        'Nodo de navegación administrativa',
        src.orden_visual,
        'S',
        SYSDATE,
        USER
      );
  END;

  PROCEDURE ensure_menu_link(p_parent_code IN VARCHAR2, p_child_code IN VARCHAR2) IS
  BEGIN
    pkg_seguridad_admin.p_enlazar_menu_nodos(node_id(p_parent_code), node_id(p_child_code));
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLCODE != -20019 AND SQLCODE != -20020 THEN
        RAISE;
      END IF;
  END;

  PROCEDURE drop_menu_link(p_parent_code IN VARCHAR2, p_child_code IN VARCHAR2) IS
  BEGIN
    pkg_seguridad_admin.p_eliminar_menu_enlace(node_id(p_parent_code), node_id(p_child_code));
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLCODE != -20002 THEN
        RAISE;
      END IF;
  END;

  PROCEDURE ensure_view_permission(p_role_code IN VARCHAR2, p_node_code IN VARCHAR2) IS
  BEGIN
    pkg_seguridad_admin.p_otorgar_permiso(
      p_id_usr => node_id(p_role_code),
      p_id_obj => node_id(p_node_code),
      p_id_op => v_ver_op_id,
      p_condicion_js => NULL
    );
  END;
BEGIN
  v_objeto_id := pkg_seguridad_admin.fn_resolve_tipo_nodo_id('OBJETO');
  v_obj_attr_id := pkg_seguridad_admin.fn_resolve_tipo_nodo_id('OBJ_ATTR');
  v_ver_op_id := pkg_seguridad_admin.fn_resolve_operacion_id('VER');

  ensure_node('DASHBOARD', 'Tablero', v_objeto_id, '/tablero', 'dashboard', 10);
  ensure_node('RECURSOS_MENU', 'Recursos', v_obj_attr_id, NULL, 'inventory_2', 20);
  ensure_node('MENU_ADMIN', 'Menú', v_obj_attr_id, NULL, 'menu_open', 30);
  ensure_node('POLITICAS', 'Políticas', v_objeto_id, '/politicas', 'policy', 40);
  ensure_node('ROLES_MENU', 'Roles', v_obj_attr_id, NULL, 'admin_panel_settings', 50);
  ensure_node('PERMISOS_MENU', 'Permisos', v_obj_attr_id, NULL, 'lock_open', 60);
  ensure_node('CONTEXTOS', 'Contextos', v_objeto_id, '/generador-contexto', 'hub', 70);
  ensure_node('USUARIOS', 'Usuarios', v_objeto_id, '/usuarios', 'group', 80);
  ensure_node('ORGANIZACION_MENU', 'Organización', v_obj_attr_id, NULL, 'apartment', 90);
  ensure_node('AUDITORIA_MENU', 'Auditoría', v_obj_attr_id, NULL, 'monitoring', 100);

  ensure_node('NODOS', 'Nodos', v_objeto_id, '/nodos', 'account_tree', 10);
  ensure_node('TIPOS_NODOS', 'Tipos de Nodo', v_objeto_id, '/tipos-nodo', 'category', 20);
  ensure_node('OPERACIONES', 'Operaciones', v_objeto_id, '/operaciones', 'key', 30);
  ensure_node('JERARQUIAS', 'Jerarquía', v_objeto_id, '/jerarquia', 'schema', 10);
  ensure_node('CLONACION', 'Clonación', v_objeto_id, '/clonacion', 'content_copy', 20);
  ensure_node('ROLES', 'Gestión de Roles', v_objeto_id, '/roles', 'shield', 10);
  ensure_node('ASIGNAR_ROLES', 'Asignación', v_objeto_id, '/asignar-roles', 'swap_horiz', 20);
  ensure_node('PERMISOS', 'Gestión', v_objeto_id, '/permisos', 'fact_check', 10);
  ensure_node('MATRIZ_PERMISOS', 'Matriz', v_objeto_id, '/matriz-permisos', 'grid_view', 20);
  ensure_node('COMPARADOR', 'Comparador', v_objeto_id, '/comparador', 'compare_arrows', 30);
  ensure_node('ENTIDADES', 'Entidades', v_objeto_id, '/entidades', 'domain', 10);
  ensure_node('UNIDADES', 'Unidades', v_objeto_id, '/unidades', 'lan', 20);
  ensure_node('SAFI', 'Vínculos', v_objeto_id, '/safi', 'device_hub', 30);
  ensure_node('HOMOLOGACION_ROLES', 'Homologación', v_objeto_id, '/homologacion-roles', 'rule', 10);

  ensure_menu_link('ADMINISTRACION', 'DASHBOARD');
  ensure_menu_link('ADMINISTRACION', 'RECURSOS_MENU');
  ensure_menu_link('ADMINISTRACION', 'MENU_ADMIN');
  ensure_menu_link('ADMINISTRACION', 'POLITICAS');
  ensure_menu_link('ADMINISTRACION', 'ROLES_MENU');
  ensure_menu_link('ADMINISTRACION', 'PERMISOS_MENU');
  ensure_menu_link('ADMINISTRACION', 'CONTEXTOS');
  ensure_menu_link('ADMINISTRACION', 'USUARIOS');
  ensure_menu_link('ADMINISTRACION', 'ORGANIZACION_MENU');
  ensure_menu_link('ADMINISTRACION', 'AUDITORIA_MENU');

  ensure_menu_link('RECURSOS_MENU', 'NODOS');
  ensure_menu_link('RECURSOS_MENU', 'TIPOS_NODOS');
  ensure_menu_link('RECURSOS_MENU', 'OPERACIONES');

  ensure_menu_link('MENU_ADMIN', 'JERARQUIAS');
  ensure_menu_link('MENU_ADMIN', 'CLONACION');

  ensure_menu_link('ROLES_MENU', 'ROLES');
  ensure_menu_link('ROLES_MENU', 'ASIGNAR_ROLES');

  ensure_menu_link('PERMISOS_MENU', 'PERMISOS');
  ensure_menu_link('PERMISOS_MENU', 'MATRIZ_PERMISOS');
  ensure_menu_link('PERMISOS_MENU', 'COMPARADOR');

  ensure_menu_link('ORGANIZACION_MENU', 'ENTIDADES');
  ensure_menu_link('ORGANIZACION_MENU', 'UNIDADES');
  ensure_menu_link('ORGANIZACION_MENU', 'SAFI');

  ensure_menu_link('AUDITORIA_MENU', 'HOMOLOGACION_ROLES');

  drop_menu_link('ADMINISTRACION', 'NODOS');
  drop_menu_link('ADMINISTRACION', 'TIPOS_NODOS');
  drop_menu_link('ADMINISTRACION', 'OPERACIONES');
  drop_menu_link('ADMINISTRACION', 'ROLES');
  drop_menu_link('ADMINISTRACION', 'JERARQUIAS');
  drop_menu_link('ADMINISTRACION', 'ENTIDADES');
  drop_menu_link('ADMINISTRACION', 'UNIDADES');
  drop_menu_link('ADMINISTRACION', 'COMPARADOR');
  drop_menu_link('ADMINISTRACION', 'CLONACION');

  ensure_view_permission('ROL_DEV', 'CONTEXTOS');
  ensure_view_permission('ROL_DEV', 'AUDITORIA_MENU');
  ensure_view_permission('ROL_DEV', 'HOMOLOGACION_ROLES');

  COMMIT;
END;
/
