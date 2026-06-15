CREATE OR REPLACE PACKAGE NGAC_USER.pkg_seguridad_admin AS
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