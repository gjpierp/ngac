CREATE OR REPLACE PACKAGE NGAC_USER.pkg_safi_admin AS
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