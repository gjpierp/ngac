CREATE OR REPLACE PACKAGE NGAC_USER.pkg_seguridad_ngac AS
/** ==================================================================================================================================================
* PACKAGE:     PKG_SEGURIDAD_NGAC
* ==================================================================================================================================================
* AUTOR:       Gerardo Paiva
* FECHA:       28/04/2026
* DESCRIPCIÓN: Motor de decisión central para la gestión de accesos y generación dinámica de menús JSON basados en permisos efectivos evaluados
*              en tiempo de ejecución. Incorpora evaluación multi-política (NGAC Policy Classes) y mecanismos avanzados de control de acceso.
* RESPONSABILIDADES:
*              - Evaluar permisos de acceso a objetos y operaciones.
*              - Generar menús dinámicos en formato JSON según contexto y políticas.
*              - Integrar clases de políticas (Policy Classes) y compuertas lógicas.
*              - Optimizar el rendimiento mediante uso de caché y tipado dinámico.
* NOTAS PROFESIONALES:
*              - Este paquete es parte fundamental del sistema de seguridad NGAC.
*              - Cumple con estándares de seguridad y auditoría para sistemas financieros.
*              - Documentar cualquier modificación relevante en el historial de cambios.
* HISTORIAL DE CAMBIOS:
* ==================================================================================================================================================
* VERSIÓN  | FECHA      | AUTOR           | DESCRIPCIÓN
* ======== | ========== | =============== | ========================================================================================================
* 1.0.0    | 28/04/2026 | Gerardo Paiva   | Creación motor inferencia NGAC para generación de menú JSON.
* 1.1.0    | 29/04/2026 | Gerardo Paiva   | Optimización de rendimiento por memoria caché y tipado dinámico.
* 1.2.0    | 30/04/2026 | Gerardo Paiva   | Inclusión explícita de Nodos Raíz en output JSON.
* 1.3.0    | 02/05/2026 | Gerardo Paiva   | Normalización e inyección de metadata orden hacia el frontend.
* 2.0.0    | 04/05/2026 | Gerardo Paiva   | Implementación de Policy Classes (PC) y Compuerta AND para cumplimiento de sistema financiero.
* 2.1.0    | 08/05/2026 | Gerardo Paiva   | Corrección de firmas públicas: alineación header/body (JSON_ARRAY_T).
* 2.2.0    | 16/05/2026 | Gerardo Paiva   | Incorporación de procedimiento de registro autónomo de auditoría de accesos.
* ==================================================================================================================================================
*/

    /** ============================================================================================================================================
    * FUNCION: fn_verificar_acceso
    * Descripción: Verifica si un usuario tiene acceso a un objeto y operación específica.
    *              Evalúa primero deny-override (prohibiciones) y luego permisos por Policy Class.
    * Parámetros:
    *   p_atributos       : Array JSON con los atributos/roles del usuario (JSON_ARRAY_T)
    *   p_operaciones_csv : Lista CSV de operaciones a validar (ej: ',VER,EDITAR,')
    *   p_id_objeto       : ID numérico del objeto o recurso
    * Retorna:
    *   NUMBER (1=acceso permitido, 0=denegado)
    * ==============================================================================================================================================
    */
    FUNCTION fn_verificar_acceso (
        p_atributos       JSON_ARRAY_T,
        p_operaciones_csv VARCHAR2,
        p_objeto          VARCHAR2,
        p_contexto_json   JSON_OBJECT_T DEFAULT NULL
    ) RETURN NUMBER;

    /** ============================================================================================================================================
    * FUNCION: fn_obtener_menu_json
    * Descripción: Genera el menú dinámico en formato JSON según el contexto recibido.
    *              Soporta estructura JSON: sujeto (usuario, roles), contexto (políticas), solicitud (app, ops).
    * Parámetros:
    *   p_json_contexto : Contexto de usuario y políticas en formato JSON (CLOB).
    * Retorna:
    *   CLOB con el objeto de contexto original enriquecido con el campo "menu" (JSON array).
    * ==============================================================================================================================================
    */
    FUNCTION fn_obtener_menu_json (
        p_json_contexto CLOB
    ) RETURN CLOB;

    /** ============================================================================================================================================
    * FUNCION: fn_extraer_atributos_contexto
    * Descripción: Extrae el array de atributos desde el objeto JSON de contexto.
    *              Consolida valores (arrays o strings) de las propiedades:
    *              POLICY, ROLES, PERMISO, MODULOS, claims y atributos.
    * Parámetros:
    *   p_jo : Objeto JSON de contexto (JSON_OBJECT_T)
    * Retorna:
    *   JSON_ARRAY_T con los atributos del usuario consolidados.
    * ==============================================================================================================================================
    */
    FUNCTION fn_extraer_atributos_contexto(
        p_jo IN JSON_OBJECT_T
    ) RETURN JSON_ARRAY_T;

    /** ============================================================================================================================================
    * PROCEDIMIENTO: p_registrar_log_acceso
    * Descripción: Registra un intento de acceso (exitoso o denegado) en la tabla acc_log_accesos de forma autónoma.
    * Parámetros:
    *   p_usuario        : Identificador del usuario (RUT o nombre de usuario).
    *   p_objeto         : ID numérico o código técnico del objeto o recurso accedido.
    *   p_operaciones    : Lista de operaciones intentadas.
    *   p_autorizado     : Indicador de autorización (1 = Permitido, 0 = Denegado).
    *   p_json_contexto  : Contexto JSON completo de la solicitud (CLOB).
    * ==============================================================================================================================================
    */
    PROCEDURE p_registrar_log_acceso (
        p_usuario        VARCHAR2,
        p_objeto         VARCHAR2,
        p_operaciones    VARCHAR2,
        p_autorizado     NUMBER,
        p_json_contexto  CLOB
    );

    /** ============================================================================================================================================
    * PROCEDIMIENTO: p_registrar_log_error
    * Descripción: Registra un error en la tabla acc_log_errores de forma autónoma.
    * Parámetros:
    *   p_modulo  : Nombre del módulo o procedimiento donde ocurrió el error.
    *   p_mensaje : Mensaje descriptivo o traza técnica del error.
    * ==============================================================================================================================================
    */
    PROCEDURE p_registrar_log_error (
        p_modulo  VARCHAR2,
        p_mensaje VARCHAR2
    );

END pkg_seguridad_ngac;