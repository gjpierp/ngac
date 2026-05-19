CREATE OR REPLACE PACKAGE BODY NGAC_USER.pkg_seguridad_ngac AS
/**
 * ==================================================================================================================================================
 * CUERPO DEL PAQUETE: PKG_SEGURIDAD_NGAC
 * Motor de decisión central para la gestión de accesos y generación dinámica de menús JSON basados en permisos efectivos.
 * Soporta evaluación multi-raíz (modulos) y permisos opcionales.
 * ==================================================================================================================================================
 */

    /** ===========================================================================================================================================
     * DECLARACIÓN DE VARIABLES Y TIPOS PRIVADOS
     * ==============================================================================================================================================
     */
    
    TYPE t_nodo_rec IS RECORD (
        id_nodo   acc_nodos.id_nodo%TYPE,
        codigo    acc_nodos.codigo_tecnico%TYPE,
        etiqueta  acc_nodos.etiqueta%TYPE,
        slug      acc_nodos.slug%TYPE,
        icono     acc_nodos.icono%TYPE,
        descripcion acc_nodos.descripcion%TYPE,
        ruta      acc_nodos.url_ruta%TYPE,
        orden     acc_nodos.orden_visual%TYPE
    );
    TYPE t_nodos_idx IS TABLE OF t_nodo_rec INDEX BY VARCHAR2(64);
    TYPE t_number_list IS TABLE OF NUMBER INDEX BY PLS_INTEGER;
    TYPE t_hijos_idx IS TABLE OF t_number_list INDEX BY VARCHAR2(64);
    TYPE t_boolean_idx IS TABLE OF BOOLEAN INDEX BY VARCHAR2(64);
    TYPE t_atributo_idx IS TABLE OF BOOLEAN INDEX BY VARCHAR2(4000);
    
    -- Optimizaciones de Memoria
    TYPE t_policy_list IS TABLE OF BOOLEAN INDEX BY PLS_INTEGER;
    TYPE t_link_rec IS RECORD (
        id_padre NUMBER,
        id_hijo  NUMBER
    );
    TYPE t_link_list IS TABLE OF t_link_rec INDEX BY PLS_INTEGER;
    TYPE t_aso_rec IS RECORD (
        nombre_op      VARCHAR2(256),
        condicion_json VARCHAR2(4000)
    );
    TYPE t_aso_list IS TABLE OF t_aso_rec INDEX BY PLS_INTEGER;
    TYPE t_aso_idx IS TABLE OF t_aso_list INDEX BY VARCHAR2(64);
    
    -- Caches de Rendimiento
    TYPE t_anc_idx IS TABLE OF t_boolean_idx INDEX BY PLS_INTEGER;
    TYPE t_abac_cache IS TABLE OF NUMBER INDEX BY VARCHAR2(4000);

    -- Variables Globales de Paquete
    g_nodos           t_nodos_idx;
    g_hijos           t_hijos_idx;
    g_padres          t_hijos_idx;
    g_permisos        t_boolean_idx;
    g_denegar_objs    t_boolean_idx;
    g_ctx_policies    t_atributo_idx;
    
    g_policies        t_policy_list;
    g_links           t_link_list;
    g_aso             t_aso_idx;
    g_atributos_ids   t_number_list;
    
    -- Variables de Cache
    g_cached_ancestors t_anc_idx;
    g_abac_cache       t_abac_cache;
    
    g_tipo_policy_id  NUMBER;
    g_tipo_objeto_id  NUMBER;
    g_tipo_objattr_id NUMBER;
    
    /** ============================================================================================================================================
    * FUNCION: fn_extraer_atributos_contexto
    * Descripción: Extrae atributos y metadatos del JSON de entrada.
    * ==============================================================================================================================================
    */
    FUNCTION fn_extraer_atributos_contexto(p_jo IN JSON_OBJECT_T) RETURN JSON_ARRAY_T IS
        v_arr JSON_ARRAY_T := JSON_ARRAY_T();
        PROCEDURE p_extract_from(p_obj JSON_OBJECT_T, p_key VARCHAR2) IS
            v_elem JSON_ELEMENT_T;
            v_temp_arr JSON_ARRAY_T;
            v_val VARCHAR2(4000);
        BEGIN
            IF p_obj IS NOT NULL AND p_obj.has(p_key) THEN
                v_elem := p_obj.get(p_key);
                IF v_elem.is_array THEN
                    v_temp_arr := p_obj.get_array(p_key);
                    IF v_temp_arr IS NOT NULL THEN
                        FOR j IN 0 .. v_temp_arr.get_size() - 1 LOOP 
                            v_val := v_temp_arr.get_string(j);
                            IF v_val IS NOT NULL THEN v_arr.append(v_val); END IF;
                        END LOOP;
                    END IF;
                ELSIF v_elem.is_string THEN 
                    v_val := p_obj.get_string(p_key);
                    IF v_val IS NOT NULL THEN v_arr.append(v_val); END IF;
                END IF;
            END IF;
        END;
    BEGIN
        IF p_jo IS NOT NULL THEN
            IF p_jo.has('sujeto') THEN
                DECLARE v_sub JSON_OBJECT_T := p_jo.get_object('sujeto');
                BEGIN 
                    p_extract_from(v_sub, 'roles'); 
                    IF v_sub.has('usuario_id') THEN 
                        DECLARE v_uid VARCHAR2(4000) := v_sub.get_string('usuario_id');
                        BEGIN IF v_uid IS NOT NULL THEN v_arr.append(v_uid); END IF; END;
                    END IF; 
                END;
            END IF;
            IF p_jo.has('contexto') THEN
                DECLARE v_ctx JSON_OBJECT_T := p_jo.get_object('contexto');
                BEGIN p_extract_from(v_ctx, 'politicas'); END;
            END IF;
            IF p_jo.has('solicitud') THEN
                DECLARE v_req JSON_OBJECT_T := p_jo.get_object('solicitud');
                BEGIN
                    p_extract_from(v_req, 'operaciones');
                    p_extract_from(v_req, 'modulos');
                END;
            END IF;
            p_extract_from(p_jo, 'atributos');
        END IF;
        RETURN v_arr;
    END fn_extraer_atributos_contexto;

    /** ============================================================================================================================================
    * FUNCION: fn_get_ancestors_coll
    * Descripción: Obtiene la jerarquía de ancestros activos.
    * ==============================================================================================================================================
    */
    FUNCTION fn_get_ancestors_coll(p_id NUMBER) RETURN t_boolean_idx IS
        v_res t_boolean_idx; v_queue t_number_list; v_head NUMBER := 1; v_tail NUMBER := 1; v_curr NUMBER;
    BEGIN
        IF p_id IS NULL THEN RETURN v_res; END IF;
        IF g_cached_ancestors.EXISTS(p_id) THEN
            RETURN g_cached_ancestors(p_id);
        END IF;
        v_res(p_id) := TRUE; v_queue(v_tail) := p_id; v_tail := v_tail + 1;
        WHILE v_head < v_tail LOOP
            v_curr := v_queue(v_head); v_head := v_head + 1;
            IF g_padres.EXISTS(v_curr) THEN
                FOR i IN 1 .. g_padres(v_curr).COUNT LOOP
                    IF NOT v_res.EXISTS(g_padres(v_curr)(i)) THEN v_res(g_padres(v_curr)(i)) := TRUE; v_queue(v_tail) := g_padres(v_curr)(i); v_tail := v_tail + 1; END IF;
                END LOOP;
            END IF;
        END LOOP;
        g_cached_ancestors(p_id) := v_res;
        RETURN v_res;
    END fn_get_ancestors_coll;

    /** ============================================================================================================================================
    * FUNCION: fn_verificar_acceso_mem
    * Descripción: Evaluación de seguridad NGAC/ABAC.
    * ==============================================================================================================================================
    */
    FUNCTION fn_verificar_acceso_mem(p_id_nodo NUMBER, p_es_policy NUMBER, p_atributos JSON_ARRAY_T, p_ops_list t_atributo_idx, p_ctx JSON_OBJECT_T) RETURN NUMBER IS
        v_ancestors t_boolean_idx; v_in_policy BOOLEAN := FALSE; v_anc_id NUMBER; v_attr_id NUMBER;
    BEGIN
        IF p_es_policy = 1 THEN RETURN 1; END IF;
        v_ancestors := fn_get_ancestors_coll(p_id_nodo);

        -- 1. Verificar si el ancestro pertenece a alguna política del contexto (EN MEMORIA - OPTIMIZADO)
        DECLARE
            v_pol_key VARCHAR2(4000);
        BEGIN
            v_pol_key := g_ctx_policies.FIRST;
            WHILE v_pol_key IS NOT NULL LOOP
                IF v_ancestors.EXISTS(v_pol_key) THEN
                    v_in_policy := TRUE;
                    EXIT;
                END IF;
                v_pol_key := g_ctx_policies.NEXT(v_pol_key);
            END LOOP;
        END;
        
        IF NOT v_in_policy THEN RETURN 0; END IF;

        -- 2. Evaluar permisos basados en los atributos cargados (EN MEMORIA)
        FOR v_i IN 1 .. g_atributos_ids.COUNT LOOP
            v_attr_id := g_atributos_ids(v_i);
            v_anc_id := v_ancestors.FIRST;
            WHILE v_anc_id IS NOT NULL LOOP
                IF g_denegar_objs.EXISTS(v_anc_id) THEN RETURN 0; END IF;
                
                DECLARE
                    v_key VARCHAR2(64) := TO_CHAR(v_attr_id) || '_' || TO_CHAR(v_anc_id);
                BEGIN
                    IF g_aso.EXISTS(v_key) THEN
                        FOR i IN 1 .. g_aso(v_key).COUNT LOOP
                            DECLARE
                                v_opname VARCHAR2(256) := g_aso(v_key)(i).nombre_op;
                                v_cond   VARCHAR2(4000) := g_aso(v_key)(i).condicion_json;
                            BEGIN
                                IF p_ops_list.EXISTS(v_opname) THEN
                                    IF v_cond IS NULL OR TRIM(v_cond) IS NULL THEN 
                                        RETURN 1;
                                    ELSE
                                        -- EVALUACIÓN ABAC NATIVA JSON CON CACHE DE RENDIMIENTO
                                        DECLARE 
                                            v_result NUMBER := 0; 
                                            v_cond_mapped VARCHAR2(32767) := v_cond;
                                            v_sql    VARCHAR2(32767);
                                            v_ctx_clob CLOB;
                                        BEGIN
                                            IF g_abac_cache.EXISTS(v_cond) THEN
                                                v_result := g_abac_cache(v_cond);
                                            ELSE
                                                v_cond_mapped := REPLACE(v_cond_mapped, ':division', 'JSON_VALUE(v_ctx, ''$.sujeto.division'')');
                                                v_cond_mapped := REPLACE(v_cond_mapped, ':usuario_id', 'JSON_VALUE(v_ctx, ''$.sujeto.usuario_id'')');
                                                
                                                v_sql := 'DECLARE v_ctx CLOB := :ctx; BEGIN IF (' || v_cond_mapped || ') THEN :res := 1; ELSE :res := 0; END IF; END;';
                                                
                                                IF p_ctx IS NOT NULL THEN
                                                    v_ctx_clob := p_ctx.to_clob();
                                                    EXECUTE IMMEDIATE v_sql USING IN v_ctx_clob, OUT v_result;
                                                ELSE
                                                    v_result := 0;
                                                END IF;
                                                g_abac_cache(v_cond) := v_result;
                                            END IF;
                                            
                                            IF v_result = 1 THEN RETURN 1; END IF;
                                        EXCEPTION WHEN OTHERS THEN 
                                            DECLARE v_err VARCHAR2(4000) := SUBSTR(SQLERRM || ' | SQL: ' || v_sql, 1, 4000); BEGIN
                                                p_registrar_log_error('NGAC_ABAC_EVAL', v_err);
                                            END;
                                        END;
                                    END IF;
                                END IF;
                            END;
                        END LOOP;
                    END IF;
                END;
                v_anc_id := v_ancestors.NEXT(v_anc_id);
            END LOOP;
        END LOOP;
        RETURN 0;
    END fn_verificar_acceso_mem;

    /** ============================================================================================================================================
    * PROCEDIMIENTO: p_inicializar_memoria
    * Descripción: Carga de grafos y evaluación de permisos. Cache global para estructura, dinámico para permisos.
    * ==============================================================================================================================================
    */
    PROCEDURE p_inicializar_memoria(p_atributos JSON_ARRAY_T, p_ops_list t_atributo_idx, p_ctx JSON_OBJECT_T DEFAULT NULL) IS
        v_empty_list t_number_list; v_atributos_list t_atributo_idx; v_skip_check BOOLEAN := (p_ops_list.COUNT = 0);
        v_val VARCHAR2(4000);
    BEGIN
        -- Limpiar el cache de evaluaciones ABAC de esta petición
        g_abac_cache.DELETE;
        
        -- 1. Cargar Estructura (Solo si no está en memoria)
        IF g_nodos.COUNT = 0 THEN
            g_hijos.DELETE; g_padres.DELETE; g_links.DELETE; g_cached_ancestors.DELETE;
            
            -- Cargar Enlaces y Estructuras de Nodos
            FOR a IN (
                SELECT a.id_padre, a.id_hijo FROM acc_asignaciones a 
                JOIN acc_nodos np ON a.id_padre = np.id_nodo JOIN acc_nodos nh ON a.id_hijo = nh.id_nodo 
                WHERE np.activo = 'S' AND nh.activo = 'S' ORDER BY a.id_padre, NVL(nh.orden_visual, 99999) ASC
            ) LOOP
                IF NOT g_hijos.EXISTS(a.id_padre) THEN g_hijos(a.id_padre) := v_empty_list; END IF;
                g_hijos(a.id_padre)(g_hijos(a.id_padre).COUNT + 1) := a.id_hijo;
                IF NOT g_padres.EXISTS(a.id_hijo) THEN g_padres(a.id_hijo) := v_empty_list; END IF;
                g_padres(a.id_hijo)(g_padres(a.id_hijo).COUNT + 1) := a.id_padre;
                
                DECLARE
                    v_idx NUMBER := g_links.COUNT + 1;
                BEGIN
                    g_links(v_idx).id_padre := a.id_padre;
                    g_links(v_idx).id_hijo := a.id_hijo;
                END;
            END LOOP;
            
            FOR r IN (SELECT id_nodo, codigo_tecnico, etiqueta, slug, icono, descripcion, url_ruta, orden_visual, id_tipo_nodo FROM acc_nodos WHERE activo = 'S') LOOP
                g_nodos(r.id_nodo).id_nodo := r.id_nodo; g_nodos(r.id_nodo).codigo := r.codigo_tecnico; g_nodos(r.id_nodo).etiqueta := r.etiqueta; g_nodos(r.id_nodo).slug := r.slug; g_nodos(r.id_nodo).icono := r.icono; g_nodos(r.id_nodo).descripcion := r.descripcion; g_nodos(r.id_nodo).ruta := r.url_ruta; g_nodos(r.id_nodo).orden := r.orden_visual;
            END LOOP;

            -- Cargar Políticas
            g_policies.DELETE;
            FOR r IN (SELECT id_nodo FROM acc_nodos WHERE id_tipo_nodo = g_tipo_policy_id AND activo = 'S') LOOP
                g_policies(r.id_nodo) := TRUE;
            END LOOP;

            -- Cargar Asociaciones
            g_aso.DELETE;
            FOR r IN (
                SELECT aso.id_usr_attr, aso.id_obj_attr, op.nombre_op, aso.condicion_json
                FROM acc_asociaciones aso
                INNER JOIN acc_operaciones op ON aso.id_op = op.id_op
            ) LOOP
                DECLARE
                    v_key VARCHAR2(64) := TO_CHAR(r.id_usr_attr) || '_' || TO_CHAR(r.id_obj_attr);
                    v_idx NUMBER;
                BEGIN
                    IF g_aso.EXISTS(v_key) THEN
                        v_idx := g_aso(v_key).COUNT + 1;
                    ELSE
                        v_idx := 1;
                    END IF;
                    g_aso(v_key)(v_idx).nombre_op := r.nombre_op;
                    g_aso(v_key)(v_idx).condicion_json := r.condicion_json;
                END;
            END LOOP;
        END IF;

        -- 2. Resolver Atributos de Entrada (Una sola vez por llamada)
        g_atributos_ids.DELETE;
        FOR v_i IN 0 .. p_atributos.get_size-1 LOOP 
            v_val := p_atributos.get_string(v_i);
            IF v_val IS NOT NULL THEN
                DECLARE
                    v_attr_id NUMBER := NULL;
                BEGIN
                    IF REGEXP_LIKE(TRIM(v_val), '^[0-9]+$') THEN
                        SELECT id_nodo INTO v_attr_id FROM acc_nodos WHERE id_nodo = TO_NUMBER(TRIM(v_val)) AND activo = 'S';
                    ELSE
                        SELECT id_nodo INTO v_attr_id FROM acc_nodos WHERE UPPER(codigo_tecnico) = UPPER(TRIM(v_val)) AND activo = 'S';
                    END IF;
                    IF v_attr_id IS NOT NULL THEN
                        g_atributos_ids(g_atributos_ids.COUNT + 1) := v_attr_id;
                    END IF;
                EXCEPTION WHEN NO_DATA_FOUND THEN
                    NULL; -- Ignorar
                END;
            END IF;
        END LOOP;

        -- 3. Cargar Denegaciones (EN MEMORIA)
        g_denegar_objs.DELETE;
        FOR v_i IN 1 .. g_atributos_ids.COUNT LOOP
            v_val := TO_CHAR(g_atributos_ids(v_i));
            FOR r IN (
                SELECT aso.id_obj_attr 
                FROM acc_asociaciones aso 
                INNER JOIN acc_operaciones op ON aso.id_op = op.id_op 
                WHERE aso.id_usr_attr = TO_NUMBER(v_val) AND op.nombre_op = 'DENEGAR'
            ) LOOP
                g_denegar_objs(r.id_obj_attr) := TRUE;
            END LOOP;
        END LOOP;

        -- 4. Evaluar Permisos (Utiliza fn_verificar_acceso_mem optimizada)
        g_permisos.DELETE;
        FOR r IN (SELECT id_nodo, id_tipo_nodo FROM acc_nodos WHERE activo = 'S') LOOP
            IF v_skip_check OR fn_verificar_acceso_mem(r.id_nodo, CASE WHEN r.id_tipo_nodo = g_tipo_policy_id THEN 1 ELSE 0 END, p_atributos, p_ops_list, p_ctx) = 1 THEN 
                g_permisos(r.id_nodo) := TRUE; 
            END IF;
        END LOOP;

        -- 5. Propagación de herencia de permisos (100% EN MEMORIA)
        DECLARE v_cambio BOOLEAN := TRUE; BEGIN
            WHILE v_cambio LOOP v_cambio := FALSE;
                FOR i IN 1 .. g_links.COUNT LOOP
                    IF g_nodos.EXISTS(g_links(i).id_padre) AND g_permisos.EXISTS(g_links(i).id_hijo) AND NOT g_permisos.EXISTS(g_links(i).id_padre) THEN 
                        g_permisos(g_links(i).id_padre) := TRUE; 
                        v_cambio := TRUE; 
                    END IF;
                END LOOP;
            END LOOP;
        END;
    END p_inicializar_memoria;

    /** ============================================================================================================================================
    * FUNCION: fn_build_json
    * Descripción: Construcción recursiva del árbol optimizada.
    * ==============================================================================================================================================
    */
    FUNCTION fn_build_json(p_id NUMBER, p_vis IN OUT t_boolean_idx) RETURN JSON_OBJECT_T IS
        v_obj JSON_OBJECT_T; v_arr JSON_ARRAY_T := JSON_ARRAY_T.parse('[]'); v_hijo JSON_OBJECT_T; v_ok BOOLEAN := FALSE;
    BEGIN
        IF p_id IS NULL OR NOT g_nodos.EXISTS(p_id) OR NOT g_permisos.EXISTS(p_id) OR p_vis.EXISTS(p_id) THEN RETURN NULL; END IF;
        p_vis(p_id) := TRUE; v_obj := JSON_OBJECT_T();
        v_obj.put('id', g_nodos(p_id).id_nodo); v_obj.put('codigo', g_nodos(p_id).codigo); v_obj.put('etiqueta', g_nodos(p_id).etiqueta); v_obj.put('slug', NVL(g_nodos(p_id).slug, '')); v_obj.put('icono', NVL(g_nodos(p_id).icono, '')); v_obj.put('descripcion', NVL(g_nodos(p_id).descripcion, '')); v_obj.put('ruta', NVL(g_nodos(p_id).ruta, '')); v_obj.put('orden', g_nodos(p_id).orden); v_obj.put('activo', 'S');
        IF g_hijos.EXISTS(p_id) THEN
            FOR i IN 1 .. g_hijos(p_id).COUNT LOOP 
                v_hijo := fn_build_json(g_hijos(p_id)(i), p_vis); 
                IF v_hijo IS NOT NULL THEN v_arr.append(v_hijo); v_ok := TRUE; END IF; 
            END LOOP;
            IF v_ok THEN v_obj.put('hijos', v_arr); END IF;
        END IF;
        RETURN v_obj;
    END fn_build_json;

    /** ============================================================================================================================================
    * FUNCION: fn_obtener_menu_json
    * Descripción: Generación de menú con soporte multi-raíz (modulos) y permisos opcionales.
    * ==============================================================================================================================================
    */
    FUNCTION fn_obtener_menu_json (p_json_contexto CLOB) RETURN CLOB IS
        v_jo JSON_OBJECT_T; v_res JSON_ARRAY_T := JSON_ARRAY_T(); v_vis t_boolean_idx; v_atributos JSON_ARRAY_T; v_claim VARCHAR2(4000); v_ops_list t_atributo_idx;
        v_modulos_arr JSON_ARRAY_T;
        v_val VARCHAR2(4000);
        v_usuario VARCHAR2(256) := 'SYSTEM';
    BEGIN
        -- Registro preventivo para diagnóstico de truncamiento y corrupción
        DECLARE
            v_len NUMBER := DBMS_LOB.GETLENGTH(p_json_contexto);
            v_start VARCHAR2(100);
            v_end   VARCHAR2(100);
        BEGIN
            v_start := DBMS_LOB.SUBSTR(p_json_contexto, 100, 1);
            IF v_len > 100 THEN
                v_end := DBMS_LOB.SUBSTR(p_json_contexto, 100, GREATEST(1, v_len - 99));
            ELSE
                v_end := v_start;
            END IF;
            p_registrar_log_error('INPUT_CLOB_INFO', 'Size: ' || v_len || ' | Start: ' || v_start || ' | End: ' || v_end);
        END;
        
        BEGIN
            v_jo := JSON_OBJECT_T.parse(TRIM(p_json_contexto)); 
        EXCEPTION WHEN OTHERS THEN
            DECLARE
                v_len NUMBER := DBMS_LOB.GETLENGTH(p_json_contexto);
                v_msg VARCHAR2(4000);
                v_full_err VARCHAR2(4000);
            BEGIN
                v_msg := 'Error Sintaxis JSON (Size: ' || v_len || ') | Start: ' || DBMS_LOB.SUBSTR(p_json_contexto, 100, 1) || 
                         ' | End: ' || DBMS_LOB.SUBSTR(p_json_contexto, 100, GREATEST(1, v_len - 99));
                v_full_err := SUBSTR(v_msg || ' | ' || SQLERRM, 1, 4000);
                p_registrar_log_error('JSON_PARSE_ERROR', v_full_err);
                
                -- Registrar acceso fallido por JSON inválido
                p_registrar_log_acceso('DESCONOCIDO', 'MENU_GENERATION', 'VER', 0, p_json_contexto);
                
                RETURN '{"error": "JSON Invalido", "detalle": "'||v_msg||'"}';
            END;
        END;

        -- Extraer usuario
        IF v_jo.has('sujeto') THEN
            DECLARE v_sub JSON_OBJECT_T := v_jo.get_object('sujeto'); BEGIN
                IF v_sub.has('usuario_id') THEN
                    v_usuario := v_sub.get_string('usuario_id');
                ELSIF v_sub.has('username') THEN
                    v_usuario := v_sub.get_string('username');
                END IF;
            END;
        END IF;

        v_atributos := fn_extraer_atributos_contexto(v_jo);

        -- Procesar Solicitud (Operaciones y Módulos)
        IF v_jo.has('solicitud') THEN
            DECLARE v_req JSON_OBJECT_T := v_jo.get_object('solicitud'); BEGIN
                IF v_req.has('operaciones') THEN
                    DECLARE v_ops JSON_ARRAY_T := v_req.get_array('operaciones'); BEGIN
                        IF v_ops IS NOT NULL THEN
                            FOR j IN 0 .. v_ops.get_size()-1 LOOP 
                                v_val := v_ops.get_string(j);
                                IF v_val IS NOT NULL THEN v_ops_list(v_val) := TRUE; END IF;
                            END LOOP;
                        END IF;
                    END;
                END IF;
                IF v_req.has('modulos') THEN v_modulos_arr := v_req.get_array('modulos'); END IF;
            END;
        END IF;

        -- Extraer políticas del contexto
        g_ctx_policies.DELETE;
        IF v_jo.has('contexto') THEN
            DECLARE v_ctx JSON_OBJECT_T := v_jo.get_object('contexto'); BEGIN
                IF v_ctx.has('politicas') THEN
                    DECLARE v_pol JSON_ARRAY_T := v_ctx.get_array('politicas'); BEGIN
                        IF v_pol IS NOT NULL THEN
                            FOR j IN 0 .. v_pol.get_size()-1 LOOP 
                                v_val := v_pol.get_string(j);
                                IF v_val IS NOT NULL THEN
                                    DECLARE
                                        v_pol_id NUMBER := NULL;
                                    BEGIN
                                        IF REGEXP_LIKE(TRIM(v_val), '^[0-9]+$') THEN
                                            SELECT id_nodo INTO v_pol_id FROM acc_nodos WHERE id_nodo = TO_NUMBER(TRIM(v_val)) AND activo = 'S';
                                        ELSE
                                            SELECT id_nodo INTO v_pol_id FROM acc_nodos WHERE UPPER(codigo_tecnico) = UPPER(TRIM(v_val)) AND activo = 'S';
                                        END IF;
                                        IF v_pol_id IS NOT NULL THEN
                                            g_ctx_policies(TO_CHAR(v_pol_id)) := TRUE;
                                        END IF;
                                    EXCEPTION WHEN NO_DATA_FOUND THEN
                                        NULL;
                                    END;
                                END IF;
                            END LOOP;
                        END IF;
                    END;
                END IF;
            END;
        END IF;

        -- Inicialización de Memoria
        p_inicializar_memoria(v_atributos, v_ops_list, v_jo);
        
        -- Generación de Árboles
        v_vis.DELETE; -- Reset de visitados para deduplicación global si se desea, o por raíz
        IF v_modulos_arr IS NOT NULL AND v_modulos_arr.get_size() > 0 THEN
            DECLARE
                v_res_ids t_number_list;
                v_res_id NUMBER;
            BEGIN
                -- Primero resolvemos los IDs permitidos y que existan en el array
                FOR j IN 0 .. v_modulos_arr.get_size()-1 LOOP
                    v_claim := v_modulos_arr.get_string(j);
                    IF v_claim IS NOT NULL THEN
                        BEGIN
                            IF REGEXP_LIKE(TRIM(v_claim), '^[0-9]+$') THEN
                                SELECT id_nodo INTO v_res_id FROM acc_nodos WHERE id_nodo = TO_NUMBER(TRIM(v_claim)) AND activo = 'S';
                            ELSE
                                SELECT id_nodo INTO v_res_id FROM acc_nodos WHERE UPPER(codigo_tecnico) = UPPER(TRIM(v_claim)) AND activo = 'S';
                            END IF;
                            
                            IF v_res_id IS NOT NULL AND g_permisos.EXISTS(v_res_id) THEN
                                v_res_ids(v_res_id) := v_res_id;
                            END IF;
                        EXCEPTION WHEN NO_DATA_FOUND THEN
                            NULL; -- Ignorar si el módulo no existe o no está activo
                        END;
                    END IF;
                END LOOP;

                -- Ahora recorremos acc_nodos en el orden correcto (orden_visual)
                FOR r IN (
                    SELECT n.id_nodo 
                    FROM acc_nodos n 
                    WHERE n.activo = 'S' 
                    ORDER BY NVL(n.orden_visual, 99999) ASC
                ) LOOP
                    IF v_res_ids.EXISTS(r.id_nodo) THEN
                        DECLARE 
                            v_node JSON_OBJECT_T := fn_build_json(r.id_nodo, v_vis); 
                        BEGIN
                            IF v_node IS NOT NULL THEN 
                                v_res.append(v_node); 
                            END IF;
                        END;
                    END IF;
                END LOOP;
            END;
        ELSE
            -- Raíces globales si no hay modulos específicos, ordenados por orden_visual
            FOR r IN (
                SELECT n.id_nodo 
                FROM acc_nodos n 
                WHERE n.activo = 'S' 
                  AND n.id_tipo_nodo IN (g_tipo_objeto_id, g_tipo_objattr_id) 
                  AND NOT EXISTS (SELECT 1 FROM acc_asignaciones a WHERE a.id_hijo = n.id_nodo)
                ORDER BY NVL(n.orden_visual, 99999) ASC
            ) LOOP
                IF g_permisos.EXISTS(r.id_nodo) THEN
                    DECLARE v_node JSON_OBJECT_T := fn_build_json(r.id_nodo, v_vis); BEGIN
                        IF v_node IS NOT NULL THEN v_res.append(v_node); END IF;
                    END;
                END IF;
            END LOOP;
        END IF;

        -- Registro de acceso exitoso
        p_registrar_log_acceso(v_usuario, 'MENU_GENERATION', 'VER', 1, p_json_contexto);

        v_jo.put('menu', v_res); RETURN v_jo.to_clob();
    EXCEPTION WHEN OTHERS THEN
        DECLARE v_err VARCHAR2(4000) := SUBSTR(SQLERRM || ' | ' || DBMS_UTILITY.FORMAT_ERROR_BACKTRACE, 1, 4000); BEGIN
            p_registrar_log_error('PKG_SEGURIDAD_NGAC.fn_obtener_menu_json', v_err);
            
            -- Registrar acceso fallido por error técnico
            p_registrar_log_acceso(v_usuario, 'MENU_GENERATION', 'VER', 0, p_json_contexto);
            
            RETURN '{"error": "Fallo Critico", "detalle": "'||v_err||'"}';
        END;
    END fn_obtener_menu_json;

    /** ============================================================================================================================================
    * PROCEDIMIENTO: p_registrar_log_acceso (Entrada Pública)
    * ==============================================================================================================================================
    */
    PROCEDURE p_registrar_log_acceso (
        p_usuario        VARCHAR2,
        p_objeto         VARCHAR2,
        p_operaciones    VARCHAR2,
        p_autorizado     NUMBER,
        p_json_contexto  CLOB
    ) IS
        PRAGMA AUTONOMOUS_TRANSACTION;
    BEGIN
        INSERT INTO acc_log_accesos (
            usuario,
            codigo_objeto,
            operaciones,
            autorizado,
            json_contexto
        ) VALUES (
            NVL(p_usuario, 'DESCONOCIDO'),
            p_objeto,
            p_operaciones,
            p_autorizado,
            p_json_contexto
        );
        COMMIT;
    EXCEPTION
        WHEN OTHERS THEN
            DECLARE
                v_err VARCHAR2(4000) := SUBSTR(SQLERRM || ' | ' || DBMS_UTILITY.FORMAT_ERROR_BACKTRACE, 1, 4000);
            BEGIN
                p_registrar_log_error('p_registrar_log_acceso', v_err);
            END;
    END p_registrar_log_acceso;

    /** ============================================================================================================================================
    * PROCEDIMIENTO: p_registrar_log_error (Entrada Pública)
    * ==============================================================================================================================================
    */
    PROCEDURE p_registrar_log_error (
        p_modulo  VARCHAR2,
        p_mensaje VARCHAR2
    ) IS
        PRAGMA AUTONOMOUS_TRANSACTION;
    BEGIN
        INSERT INTO acc_log_errores (
            modulo,
            mensaje,
            fecha
        ) VALUES (
            p_modulo,
            p_mensaje,
            SYSDATE
        );
        COMMIT;
    EXCEPTION
        WHEN OTHERS THEN
            -- No propagar el fallo del log de errores para no interrumpir el flujo principal
            NULL;
    END p_registrar_log_error;

    /** ============================================================================================================================================
    * FUNCION: fn_verificar_acceso (Entrada Pública)
    * ==============================================================================================================================================
    */
    FUNCTION fn_verificar_acceso (p_atributos JSON_ARRAY_T, p_operaciones_csv VARCHAR2, p_objeto VARCHAR2, p_contexto_json JSON_OBJECT_T DEFAULT NULL) RETURN NUMBER IS
        v_ops_list t_atributo_idx; v_str VARCHAR2(4000) := LTRIM(RTRIM(p_operaciones_csv, ','), ','); v_comma NUMBER; v_op VARCHAR2(256); v_id_obj NUMBER; v_es_policy NUMBER := 0;
        v_res NUMBER;
        v_usuario VARCHAR2(256) := 'DESCONOCIDO';
        v_ctx_clob CLOB := NULL;
        v_val VARCHAR2(4000);
    BEGIN
        -- Extraer usuario para auditoría
        IF p_contexto_json IS NOT NULL THEN
            v_ctx_clob := p_contexto_json.to_clob();
            IF p_contexto_json.has('sujeto') THEN
                DECLARE v_sub JSON_OBJECT_T := p_contexto_json.get_object('sujeto'); BEGIN
                    IF v_sub.has('usuario_id') THEN
                        v_usuario := v_sub.get_string('usuario_id');
                    ELSIF v_sub.has('username') THEN
                        v_usuario := v_sub.get_string('username');
                    END IF;
                END;
            END IF;
        END IF;

        IF v_usuario = 'DESCONOCIDO' AND p_atributos IS NOT NULL AND p_atributos.get_size() > 0 THEN
            v_usuario := p_atributos.get_string(0);
        END IF;

        WHILE v_str IS NOT NULL LOOP
            v_comma := INSTR(v_str, ',');
            IF v_comma > 0 THEN v_op := SUBSTR(v_str, 1, v_comma - 1); v_str := SUBSTR(v_str, v_comma + 1); ELSE v_op := v_str; v_str := NULL; END IF;
            v_op := UPPER(TRIM(v_op));
            IF v_op IS NOT NULL THEN v_ops_list(v_op) := TRUE; END IF;
        END LOOP;
        
        BEGIN
            IF REGEXP_LIKE(TRIM(p_objeto), '^[0-9]+$') THEN
                SELECT id_nodo, id_tipo_nodo INTO v_id_obj, v_es_policy FROM acc_nodos WHERE id_nodo = TO_NUMBER(TRIM(p_objeto)) AND activo = 'S';
            ELSE
                SELECT id_nodo, id_tipo_nodo INTO v_id_obj, v_es_policy FROM acc_nodos WHERE UPPER(codigo_tecnico) = UPPER(TRIM(p_objeto)) AND activo = 'S';
            END IF;
        EXCEPTION WHEN NO_DATA_FOUND THEN 
            -- Objeto no encontrado -> Acceso denegado
            p_registrar_log_acceso(v_usuario, p_objeto, p_operaciones_csv, 0, v_ctx_clob);
            RETURN 0; 
        END;
        
        -- Extraer y resolver políticas del contexto para asegurar consistencia en g_ctx_policies
        g_ctx_policies.DELETE;
        IF p_contexto_json IS NOT NULL AND p_contexto_json.has('contexto') THEN
            DECLARE v_ctx JSON_OBJECT_T := p_contexto_json.get_object('contexto'); BEGIN
                IF v_ctx.has('politicas') THEN
                    DECLARE v_pol JSON_ARRAY_T := v_ctx.get_array('politicas'); BEGIN
                        IF v_pol IS NOT NULL THEN
                            FOR j IN 0 .. v_pol.get_size()-1 LOOP 
                                v_val := v_pol.get_string(j);
                                IF v_val IS NOT NULL THEN
                                    DECLARE
                                        v_pol_id NUMBER := NULL;
                                    BEGIN
                                        IF REGEXP_LIKE(TRIM(v_val), '^[0-9]+$') THEN
                                            SELECT id_nodo INTO v_pol_id FROM acc_nodos WHERE id_nodo = TO_NUMBER(TRIM(v_val)) AND activo = 'S';
                                        ELSE
                                            SELECT id_nodo INTO v_pol_id FROM acc_nodos WHERE UPPER(codigo_tecnico) = UPPER(TRIM(v_val)) AND activo = 'S';
                                        END IF;
                                        IF v_pol_id IS NOT NULL THEN
                                            g_ctx_policies(TO_CHAR(v_pol_id)) := TRUE;
                                        END IF;
                                    EXCEPTION WHEN NO_DATA_FOUND THEN
                                        NULL;
                                    END;
                                END IF;
                            END LOOP;
                        END IF;
                    END;
                END IF;
            END;
        END IF;

        v_res := fn_verificar_acceso_mem(v_id_obj, CASE WHEN v_es_policy = g_tipo_policy_id THEN 1 ELSE 0 END, p_atributos, v_ops_list, p_contexto_json);
        
        -- Registrar acceso (1 = Autorizado, 0 = Denegado)
        p_registrar_log_acceso(v_usuario, p_objeto, p_operaciones_csv, v_res, v_ctx_clob);
        
        RETURN v_res;
    EXCEPTION WHEN OTHERS THEN 
        -- Fallo -> Acceso denegado
        p_registrar_log_acceso(v_usuario, p_objeto, p_operaciones_csv, 0, v_ctx_clob);
        RETURN 0; 
    END fn_verificar_acceso;

BEGIN
    -- Inicialización de variables globales del paquete
    BEGIN
        SELECT id_tipo_nodo INTO g_tipo_policy_id FROM acc_tipos_nodo WHERE codigo_tipo = 'POLICY';
    EXCEPTION WHEN NO_DATA_FOUND THEN g_tipo_policy_id := -1; END;
    
    BEGIN
        SELECT id_tipo_nodo INTO g_tipo_objeto_id FROM acc_tipos_nodo WHERE codigo_tipo = 'OBJETO';
    EXCEPTION WHEN NO_DATA_FOUND THEN g_tipo_objeto_id := -1; END;
    
    BEGIN
        SELECT id_tipo_nodo INTO g_tipo_objattr_id FROM acc_tipos_nodo WHERE codigo_tipo = 'OBJ_ATTR';
    EXCEPTION WHEN NO_DATA_FOUND THEN g_tipo_objattr_id := -1; END;

END pkg_seguridad_ngac;
