CREATE OR REPLACE PACKAGE BODY NGAC_USER.pkg_seguridad_ngac AS

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
    TYPE t_menu_rec IS RECORD (
        id_menu_nodo NUMBER,
        id_nodo      acc_nodos.id_nodo%TYPE,
        codigo       acc_nodos.codigo_tecnico%TYPE,
        etiqueta     acc_nodos.etiqueta%TYPE,
        slug         acc_nodos.slug%TYPE,
        icono        acc_nodos.icono%TYPE,
        descripcion  acc_nodos.descripcion%TYPE,
        ruta         acc_nodos.url_ruta%TYPE,
        orden        acc_nodos.orden_visual%TYPE,
        activo       VARCHAR2(1)
    );
    TYPE t_nodos_idx IS TABLE OF t_nodo_rec INDEX BY VARCHAR2(64);
    TYPE t_menu_idx IS TABLE OF t_menu_rec INDEX BY VARCHAR2(64);
    TYPE t_number_list IS TABLE OF NUMBER INDEX BY PLS_INTEGER;
    TYPE t_hijos_idx IS TABLE OF t_number_list INDEX BY VARCHAR2(64);
    TYPE t_boolean_idx IS TABLE OF BOOLEAN INDEX BY VARCHAR2(64);
    TYPE t_atributo_idx IS TABLE OF BOOLEAN INDEX BY VARCHAR2(4000);
    
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
    TYPE t_link_table IS TABLE OF t_aso_rec INDEX BY PLS_INTEGER;
    TYPE t_aso_idx IS TABLE OF t_link_table INDEX BY VARCHAR2(64);
    
    TYPE t_anc_idx IS TABLE OF t_boolean_idx INDEX BY PLS_INTEGER;
    TYPE t_abac_cache IS TABLE OF NUMBER INDEX BY VARCHAR2(4000);

    g_nodos           t_nodos_idx;
    g_hijos           t_hijos_idx;
    g_padres          t_hijos_idx;
    g_menu_nodos      t_menu_idx;
    g_menu_hijos      t_hijos_idx;
    g_policy_menu_roots t_hijos_idx;
    g_permisos        t_boolean_idx;
    g_denegar_objs    t_boolean_idx;
    g_ctx_policies    t_atributo_idx;
    g_ctx_menu_nodes  t_boolean_idx;
    
    g_policies        t_policy_list;
    g_links           t_link_list;
    g_aso             t_aso_idx;
    g_atributos_ids   t_number_list;
    g_roles_ids       t_number_list;
    
    g_cached_ancestors t_anc_idx;
    g_abac_cache       t_abac_cache;
    g_cond_cache       t_abac_cache;
    
    g_tipo_policy_id  NUMBER;
    g_tipo_objeto_id  NUMBER;
    g_tipo_objattr_id NUMBER;
    
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

    FUNCTION fn_get_ancestors_coll(p_id NUMBER) RETURN t_boolean_idx IS
        v_res t_boolean_idx; v_queue t_number_list; v_head NUMBER := 1; v_tail NUMBER := 1; v_curr NUMBER;
    BEGIN
        IF p_id IS NULL THEN RETURN v_res; END IF;
        IF g_cached_ancestors.EXISTS(p_id) THEN RETURN g_cached_ancestors(p_id); END IF;
        v_res(p_id) := TRUE; v_queue(v_tail) := p_id; v_tail := v_tail + 1;
        WHILE v_head < v_tail LOOP
            v_curr := v_queue(v_head); v_head := v_head + 1;
            IF g_padres.EXISTS(v_curr) THEN
                FOR i IN 1 .. g_padres(v_curr).COUNT LOOP
                    IF NOT v_res.EXISTS(g_padres(v_curr)(i)) THEN 
                        v_res(g_padres(v_curr)(i)) := TRUE; 
                        v_queue(v_tail) := g_padres(v_curr)(i); 
                        v_tail := v_tail + 1; 
                    END IF;
                END LOOP;
            END IF;
        END LOOP;
        g_cached_ancestors(p_id) := v_res;
        RETURN v_res;
    END fn_get_ancestors_coll;

    FUNCTION fn_nodo_en_politica_legacy(p_id_nodo NUMBER) RETURN BOOLEAN IS
        v_ancestors t_boolean_idx; v_pol_key VARCHAR2(4000);
    BEGIN
        IF p_id_nodo IS NULL OR g_ctx_policies.COUNT = 0 THEN RETURN FALSE; END IF;
        v_ancestors := fn_get_ancestors_coll(p_id_nodo);
        v_pol_key := g_ctx_policies.FIRST;
        WHILE v_pol_key IS NOT NULL LOOP
            IF v_ancestors.EXISTS(v_pol_key) THEN RETURN TRUE; END IF;
            v_pol_key := g_ctx_policies.NEXT(v_pol_key);
        END LOOP;
        RETURN FALSE;
    END fn_nodo_en_politica_legacy;

    PROCEDURE p_resolver_menu_contexto IS
        v_queue t_number_list; v_seen_menu t_boolean_idx; v_head NUMBER; v_tail NUMBER; v_curr NUMBER; v_child NUMBER; v_root NUMBER; v_policy_key VARCHAR2(4000);
    BEGIN
        g_ctx_menu_nodes.DELETE;
        IF g_ctx_policies.COUNT = 0 OR g_menu_nodos.COUNT = 0 THEN RETURN; END IF;
        v_policy_key := g_ctx_policies.FIRST;
        WHILE v_policy_key IS NOT NULL LOOP
            IF g_policy_menu_roots.EXISTS(v_policy_key) THEN
                FOR i IN 1 .. g_policy_menu_roots(v_policy_key).COUNT LOOP
                    v_root := g_policy_menu_roots(v_policy_key)(i);
                    v_seen_menu.DELETE; v_queue.DELETE; v_head := 1; v_tail := 1;
                    IF v_root IS NOT NULL AND g_menu_nodos.EXISTS(v_root) THEN
                        v_queue(v_tail) := v_root; v_tail := v_tail + 1;
                        WHILE v_head < v_tail LOOP
                            v_curr := v_queue(v_head); v_head := v_head + 1;
                            IF NOT v_seen_menu.EXISTS(TO_CHAR(v_curr)) THEN
                                v_seen_menu(TO_CHAR(v_curr)) := TRUE;
                                g_ctx_menu_nodes(TO_CHAR(g_menu_nodos(v_curr).id_nodo)) := TRUE;
                                IF g_menu_hijos.EXISTS(v_curr) THEN
                                    FOR j IN 1 .. g_menu_hijos(v_curr).COUNT LOOP
                                        v_child := g_menu_hijos(v_curr)(j);
                                        IF NOT v_seen_menu.EXISTS(TO_CHAR(v_child)) THEN v_queue(v_tail) := v_child; v_tail := v_tail + 1; END IF;
                                    END LOOP;
                                END IF;
                            END IF;
                        END LOOP;
                    END IF;
                END LOOP;
            END IF;
            v_policy_key := g_ctx_policies.NEXT(v_policy_key);
        END LOOP;
    END p_resolver_menu_contexto;

    FUNCTION fn_menu_node_matches_claim(p_menu_id NUMBER, p_claim VARCHAR2) RETURN NUMBER IS
        v_claim VARCHAR2(4000) := TRIM(p_claim); v_num NUMBER;
    BEGIN
        IF p_menu_id IS NULL OR v_claim IS NULL OR NOT g_menu_nodos.EXISTS(p_menu_id) THEN RETURN 0; END IF;
        IF REGEXP_LIKE(v_claim, '^[0-9]+$') THEN
            v_num := TO_NUMBER(v_claim);
            IF p_menu_id = v_num OR g_menu_nodos(p_menu_id).id_nodo = v_num THEN RETURN 1; END IF;
        ELSE
            IF UPPER(g_menu_nodos(p_menu_id).codigo) = UPPER(v_claim) THEN RETURN 1; END IF;
        END IF;
        RETURN 0;
    END fn_menu_node_matches_claim;

    FUNCTION fn_verificar_acceso_mem(p_id_nodo NUMBER, p_es_policy NUMBER, p_atributos JSON_ARRAY_T, p_ops_list t_atributo_idx, p_ctx JSON_OBJECT_T) RETURN NUMBER IS
        v_ancestors t_boolean_idx; v_in_policy BOOLEAN := FALSE; v_anc_id NUMBER; v_attr_id NUMBER;
    BEGIN
        IF p_es_policy = 1 THEN RETURN 1; END IF;
        v_ancestors := fn_get_ancestors_coll(p_id_nodo);
        v_in_policy := g_ctx_menu_nodes.EXISTS(TO_CHAR(p_id_nodo));
        IF NOT v_in_policy THEN v_in_policy := fn_nodo_en_politica_legacy(p_id_nodo); END IF;
        IF NOT v_in_policy THEN RETURN 0; END IF;

        FOR v_i IN 1 .. g_atributos_ids.COUNT LOOP
            v_attr_id := g_atributos_ids(v_i); v_anc_id := v_ancestors.FIRST;
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
                                    IF v_cond IS NULL OR TRIM(v_cond) IS NULL THEN RETURN 1;
                                    ELSE
                                        DECLARE 
                                            v_result NUMBER := 0; v_cond_mapped VARCHAR2(32767) := v_cond; v_sql VARCHAR2(32767); v_ctx_clob CLOB;
                                        BEGIN
                                            IF g_abac_cache.EXISTS(v_cond) THEN v_result := g_abac_cache(v_cond);
                                            ELSE
                                                v_cond_mapped := REPLACE(v_cond_mapped, ':division', 'JSON_VALUE(v_ctx, ''$.sujeto.division'')');
                                                v_cond_mapped := REPLACE(v_cond_mapped, ':usuario_id', 'JSON_VALUE(v_ctx, ''$.sujeto.usuario_id'')');
                                                v_sql := 'DECLARE v_ctx CLOB := :ctx; BEGIN IF (' || v_cond_mapped || ') THEN :res := 1; ELSE :res := 0; END IF; END;';
                                                IF p_ctx IS NOT NULL THEN
                                                    v_ctx_clob := p_ctx.to_clob(); EXECUTE IMMEDIATE v_sql USING IN v_ctx_clob, OUT v_result;
                                                ELSE v_result := 0;
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

    PROCEDURE p_inicializar_memoria(p_atributos JSON_ARRAY_T, p_ops_list t_atributo_idx, p_ctx JSON_OBJECT_T DEFAULT NULL) IS
        v_empty_list t_number_list; v_skip_check BOOLEAN := (p_ops_list.COUNT = 0); v_val VARCHAR2(4000);
    BEGIN
        g_abac_cache.DELETE;
        g_nodos.DELETE;
        IF g_nodos.COUNT = 0 THEN
            g_hijos.DELETE; g_padres.DELETE; g_links.DELETE; g_cached_ancestors.DELETE;
            g_menu_nodos.DELETE; g_menu_hijos.DELETE; g_policy_menu_roots.DELETE;
            
            FOR a IN (
                SELECT a.id_padre, a.id_hijo FROM acc_asignaciones a 
                JOIN acc_nodos np ON a.id_padre = np.id_nodo JOIN acc_nodos nh ON a.id_hijo = nh.id_nodo 
                WHERE np.activo = 'S' AND nh.activo = 'S' ORDER BY a.id_padre, NVL(nh.orden_visual, 99999) ASC
            ) LOOP
                IF NOT g_hijos.EXISTS(a.id_padre) THEN g_hijos(a.id_padre) := v_empty_list; END IF;
                g_hijos(a.id_padre)(g_hijos(a.id_padre).COUNT + 1) := a.id_hijo;
                IF NOT g_padres.EXISTS(a.id_hijo) THEN g_padres(a.id_hijo) := v_empty_list; END IF;
                g_padres(a.id_hijo)(g_padres(a.id_hijo).COUNT + 1) := a.id_padre;
                
                DECLARE v_idx NUMBER := g_links.COUNT + 1; BEGIN
                    g_links(v_idx).id_padre := a.id_padre; g_links(v_idx).id_hijo := a.id_hijo;
                END;
            END LOOP;
            
            FOR r IN (SELECT id_nodo, codigo_tecnico, etiqueta, slug, icono, descripcion, url_ruta, orden_visual, id_tipo_nodo FROM acc_nodos WHERE activo = 'S') LOOP
                g_nodos(r.id_nodo).id_nodo := r.id_nodo; g_nodos(r.id_nodo).codigo := r.codigo_tecnico; g_nodos(r.id_nodo).etiqueta := r.etiqueta; g_nodos(r.id_nodo).slug := r.slug; g_nodos(r.id_nodo).icono := r.icono; g_nodos(r.id_nodo).descripcion := r.descripcion; g_nodos(r.id_nodo).ruta := r.url_ruta; g_nodos(r.id_nodo).orden := r.orden_visual;
            END LOOP;

            FOR r IN (
                SELECT mn.id_menu_nodo, mn.id_nodo, n.codigo_tecnico, NVL(mn.etiqueta_visible, n.etiqueta) AS etiqueta,
                       NVL(mn.slug_visible, n.slug) AS slug, NVL(mn.icono_visible, n.icono) AS icono,
                       NVL(mn.descripcion_visible, n.descripcion) AS descripcion, NVL(mn.url_ruta_visible, n.url_ruta) AS url_ruta,
                       NVL(mn.orden_visual, n.orden_visual) AS orden_visual, mn.activo
                FROM acc_menu_nodos mn JOIN acc_nodos n ON n.id_nodo = mn.id_nodo WHERE mn.activo = 'S' AND n.activo = 'S'
            ) LOOP
                g_menu_nodos(r.id_menu_nodo).id_menu_nodo := r.id_menu_nodo; g_menu_nodos(r.id_menu_nodo).id_nodo := r.id_nodo; g_menu_nodos(r.id_menu_nodo).codigo := r.codigo_tecnico; g_menu_nodos(r.id_menu_nodo).etiqueta := r.etiqueta; g_menu_nodos(r.id_menu_nodo).slug := r.slug; g_menu_nodos(r.id_menu_nodo).icono := r.icono; g_menu_nodos(r.id_menu_nodo).descripcion := r.descripcion; g_menu_nodos(r.id_menu_nodo).ruta := r.url_ruta; g_menu_nodos(r.id_menu_nodo).orden := r.orden_visual; g_menu_nodos(r.id_menu_nodo).activo := r.activo;
            END LOOP;

            FOR a IN (
                SELECT a.id_menu_padre, a.id_menu_hijo FROM acc_menu_asignaciones a
                JOIN acc_menu_nodos mp ON mp.id_menu_nodo = a.id_menu_padre JOIN acc_menu_nodos mh ON mh.id_menu_nodo = a.id_menu_hijo
                WHERE a.activo = 'S' AND mp.activo = 'S' AND mh.activo = 'S' ORDER BY a.id_menu_padre, a.id_menu_hijo
            ) LOOP
                IF NOT g_menu_hijos.EXISTS(a.id_menu_padre) THEN g_menu_hijos(a.id_menu_padre) := v_empty_list; END IF;
                g_menu_hijos(a.id_menu_padre)(g_menu_hijos(a.id_menu_padre).COUNT + 1) := a.id_menu_hijo;
            END LOOP;

            FOR r IN (
                SELECT pmr.id_policy, pmr.id_menu_nodo FROM acc_policy_menu_raices pmr
                JOIN acc_menu_nodos mn ON mn.id_menu_nodo = pmr.id_menu_nodo WHERE pmr.activo = 'S' AND mn.activo = 'S'
                ORDER BY pmr.id_policy, NVL(mn.orden_visual, 99999), pmr.id_menu_nodo
            ) LOOP
                IF NOT g_policy_menu_roots.EXISTS(r.id_policy) THEN g_policy_menu_roots(r.id_policy) := v_empty_list; END IF;
                g_policy_menu_roots(r.id_policy)(g_policy_menu_roots(r.id_policy).COUNT + 1) := r.id_menu_nodo;
            END LOOP;

            g_policies.DELETE;
            FOR r IN (SELECT id_nodo FROM acc_nodos WHERE id_tipo_nodo = g_tipo_policy_id AND activo = 'S') LOOP g_policies(r.id_nodo) := TRUE; END LOOP;

            g_aso.DELETE;
            FOR r IN (SELECT aso.id_usr_attr, aso.id_obj_attr, op.nombre_op, aso.condicion_json FROM acc_asociaciones aso INNER JOIN acc_operaciones op ON aso.id_op = op.id_op) LOOP
                DECLARE v_key VARCHAR2(64) := TO_CHAR(r.id_usr_attr) || '_' || TO_CHAR(r.id_obj_attr); v_idx NUMBER; BEGIN
                    v_idx := CASE WHEN g_aso.EXISTS(v_key) THEN g_aso(v_key).COUNT + 1 ELSE 1 END;
                    g_aso(v_key)(v_idx).nombre_op := r.nombre_op; g_aso(v_key)(v_idx).condicion_json := r.condicion_json;
                END;
            END LOOP;
        END IF;

        g_atributos_ids.DELETE;
        FOR v_i IN 0 .. p_atributos.get_size-1 LOOP 
            v_val := p_atributos.get_string(v_i);
            IF v_val IS NOT NULL THEN
                DECLARE v_attr_id NUMBER := NULL; BEGIN
                    IF REGEXP_LIKE(TRIM(v_val), '^[0-9]+$') THEN SELECT id_nodo INTO v_attr_id FROM acc_nodos WHERE id_nodo = TO_NUMBER(TRIM(v_val)) AND activo = 'S';
                    ELSE SELECT id_nodo INTO v_attr_id FROM acc_nodos WHERE UPPER(codigo_tecnico) = UPPER(TRIM(v_val)) AND activo = 'S';
                    END IF;
                    IF v_attr_id IS NOT NULL THEN g_atributos_ids(g_atributos_ids.COUNT + 1) := v_attr_id; END IF;
                EXCEPTION WHEN NO_DATA_FOUND THEN NULL; END;
            END IF;
        END LOOP;

        g_roles_ids.DELETE;
        IF p_ctx IS NOT NULL AND p_ctx.has('sujeto') THEN
            DECLARE v_sub JSON_OBJECT_T := p_ctx.get_object('sujeto'); v_roles JSON_ARRAY_T; v_role_code VARCHAR2(4000); v_role_id NUMBER; BEGIN
                IF v_sub IS NOT NULL AND v_sub.has('roles') THEN
                    v_roles := v_sub.get_array('roles');
                    IF v_roles IS NOT NULL THEN
                        FOR v_i IN 0 .. v_roles.get_size() - 1 LOOP
                            v_role_code := v_roles.get_string(v_i);
                            IF v_role_code IS NOT NULL THEN
                                BEGIN
                                    SELECT id_nodo INTO v_role_id FROM acc_nodos WHERE UPPER(codigo_tecnico) = UPPER(TRIM(v_role_code)) AND activo = 'S';
                                    g_roles_ids(g_roles_ids.COUNT + 1) := v_role_id;
                                EXCEPTION WHEN NO_DATA_FOUND THEN NULL; END;
                            END IF;
                        END LOOP;
                    END IF;
                END IF;
            END;
        END IF;

        g_denegar_objs.DELETE;
        FOR v_i IN 1 .. g_atributos_ids.COUNT LOOP
            v_val := TO_CHAR(g_atributos_ids(v_i));
            FOR r IN (SELECT aso.id_obj_attr FROM acc_asociaciones aso INNER JOIN acc_operaciones op ON aso.id_op = op.id_op WHERE aso.id_usr_attr = TO_NUMBER(v_val) AND op.nombre_op = 'DENEGAR') LOOP
                g_denegar_objs(r.id_obj_attr) := TRUE;
            END LOOP;
        END LOOP;

        g_permisos.DELETE;
        FOR r IN (SELECT id_nodo, id_tipo_nodo FROM acc_nodos WHERE activo = 'S') LOOP
            IF v_skip_check OR fn_verificar_acceso_mem(r.id_nodo, CASE WHEN r.id_tipo_nodo = g_tipo_policy_id THEN 1 ELSE 0 END, p_atributos, p_ops_list, p_ctx) = 1 THEN g_permisos(r.id_nodo) := TRUE; END IF;
        END LOOP;

        DECLARE v_cambio BOOLEAN := TRUE; BEGIN
            WHILE v_cambio LOOP v_cambio := FALSE;
                FOR i IN 1 .. g_links.COUNT LOOP
                    IF g_nodos.EXISTS(g_links(i).id_padre) AND g_permisos.EXISTS(g_links(i).id_hijo) AND NOT g_permisos.EXISTS(g_links(i).id_padre) THEN 
                        g_permisos(g_links(i).id_padre) := TRUE; v_cambio := TRUE; 
                    END IF;
                END LOOP;
            END LOOP;
        END;

        p_resolver_menu_contexto;
    END p_inicializar_memoria;

    FUNCTION fn_tiene_permiso_directo_menu(p_id_nodo NUMBER, p_ops_list t_atributo_idx, p_ctx JSON_OBJECT_T) RETURN NUMBER IS
        v_ancestors t_boolean_idx; v_attr_id NUMBER; v_anc_id NUMBER;
    BEGIN
        IF p_id_nodo IS NULL OR NOT g_nodos.EXISTS(p_id_nodo) THEN RETURN 0; END IF;
        v_ancestors := fn_get_ancestors_coll(p_id_nodo);
        v_anc_id := v_ancestors.FIRST;
        WHILE v_anc_id IS NOT NULL LOOP
            IF g_denegar_objs.EXISTS(v_anc_id) THEN RETURN 0; END IF;
            v_anc_id := v_ancestors.NEXT(v_anc_id);
        END LOOP;

        FOR v_i IN 1 .. CASE WHEN g_roles_ids.COUNT > 0 THEN g_roles_ids.COUNT ELSE g_atributos_ids.COUNT END LOOP
            v_attr_id := CASE WHEN g_roles_ids.COUNT > 0 THEN g_roles_ids(v_i) ELSE g_atributos_ids(v_i) END;
            DECLARE v_key VARCHAR2(64) := TO_CHAR(v_attr_id) || '_' || TO_CHAR(p_id_nodo); BEGIN
                IF g_aso.EXISTS(v_key) THEN
                    FOR i IN 1 .. g_aso(v_key).COUNT LOOP
                        DECLARE v_opname VARCHAR2(256) := g_aso(v_key)(i).nombre_op; v_cond VARCHAR2(4000) := g_aso(v_key)(i).condicion_json; v_result NUMBER := 0; v_cond_mapped VARCHAR2(32767); v_sql VARCHAR2(32767); v_ctx_clob CLOB; BEGIN
                            IF v_opname = 'DENEGAR' THEN RETURN 0; END IF;
                            IF p_ops_list.COUNT = 0 OR p_ops_list.EXISTS(v_opname) THEN
                                IF v_cond IS NULL OR TRIM(v_cond) IS NULL THEN RETURN 1; END IF;
                                v_cond_mapped := v_cond;
                                v_cond_mapped := REPLACE(v_cond_mapped, ':division', 'JSON_VALUE(v_ctx, ''$.sujeto.division'')');
                                v_cond_mapped := REPLACE(v_cond_mapped, ':usuario_id', 'JSON_VALUE(v_ctx, ''$.sujeto.usuario_id'')');
                                v_sql := 'DECLARE v_ctx CLOB := :ctx; BEGIN IF (' || v_cond_mapped || ') THEN :res := 1; ELSE :res := 0; END IF; END;';
                                IF p_ctx IS NOT NULL THEN v_ctx_clob := p_ctx.to_clob(); EXECUTE IMMEDIATE v_sql USING IN v_ctx_clob, OUT v_result; END IF;
                                IF v_result = 1 THEN RETURN 1; END IF;
                            END IF;
                        EXCEPTION WHEN OTHERS THEN
                            DECLARE v_err VARCHAR2(4000) := SUBSTR(SQLERRM || ' | SQL: ' || v_sql, 1, 4000); BEGIN p_registrar_log_error('NGAC_MENU_DIRECT_EVAL', v_err); END;
                        END;
                    END LOOP;
                END IF;
            END;
        END LOOP;
        RETURN 0;
    END fn_tiene_permiso_directo_menu;

    FUNCTION fn_build_json(p_id NUMBER, p_vis IN OUT t_boolean_idx, p_ops_list t_atributo_idx, p_ctx JSON_OBJECT_T, p_forzar_inclusion NUMBER DEFAULT 0) RETURN JSON_OBJECT_T IS
        v_obj JSON_OBJECT_T; v_arr JSON_ARRAY_T := JSON_ARRAY_T.parse('[]'); v_hijo JSON_OBJECT_T; v_ok BOOLEAN := FALSE; v_directo NUMBER := 0; v_id_nodo NUMBER; v_vis_key VARCHAR2(64);
    BEGIN
        IF p_id IS NULL OR NOT g_menu_nodos.EXISTS(p_id) THEN RETURN NULL; END IF;
        v_vis_key := TO_CHAR(p_id); IF p_vis.EXISTS(v_vis_key) THEN RETURN NULL; END IF;
        p_vis(v_vis_key) := TRUE;

        v_id_nodo := g_menu_nodos(p_id).id_nodo;
        v_directo := fn_tiene_permiso_directo_menu(v_id_nodo, p_ops_list, p_ctx);
        v_obj := JSON_OBJECT_T();
        v_obj.put('id', g_menu_nodos(p_id).id_nodo); v_obj.put('codigo', g_menu_nodos(p_id).codigo); v_obj.put('etiqueta', g_menu_nodos(p_id).etiqueta); v_obj.put('slug', NVL(g_menu_nodos(p_id).slug, '')); v_obj.put('icono', NVL(g_menu_nodos(p_id).icono, '')); v_obj.put('descripcion', NVL(g_menu_nodos(p_id).descripcion, '')); v_obj.put('ruta', NVL(g_menu_nodos(p_id).ruta, '')); v_obj.put('orden', g_menu_nodos(p_id).orden); v_obj.put('activo', g_menu_nodos(p_id).activo);
        IF g_menu_hijos.EXISTS(p_id) THEN
            FOR i IN 1 .. g_menu_hijos(p_id).COUNT LOOP
                v_hijo := fn_build_json(g_menu_hijos(p_id)(i), p_vis, p_ops_list, p_ctx);
                IF v_hijo IS NOT NULL THEN v_arr.append(v_hijo); v_ok := TRUE; END IF;
            END LOOP;
            IF v_ok THEN v_obj.put('hijos', v_arr); END IF;
        END IF;

        IF v_directo = 1 OR v_ok OR p_forzar_inclusion = 1 THEN RETURN v_obj; END IF;
        RETURN NULL;
    END fn_build_json;

    FUNCTION fn_obtener_menu_json (p_json_contexto CLOB) RETURN CLOB IS
        v_jo JSON_OBJECT_T; v_res JSON_ARRAY_T := JSON_ARRAY_T(); v_vis t_boolean_idx; v_atributos JSON_ARRAY_T; v_claim VARCHAR2(4000); v_ops_list t_atributo_idx;
        v_modulos_arr JSON_ARRAY_T; v_val VARCHAR2(4000); v_usuario VARCHAR2(256) := 'SYSTEM'; v_root_ids t_number_list; v_root_seen t_boolean_idx; v_policy_key VARCHAR2(4000);
    BEGIN
        DECLARE v_len NUMBER := DBMS_LOB.GETLENGTH(p_json_contexto); v_start VARCHAR2(100); v_end VARCHAR2(100); BEGIN
            v_start := DBMS_LOB.SUBSTR(p_json_contexto, 100, 1);
            IF v_len > 100 THEN v_end := DBMS_LOB.SUBSTR(p_json_contexto, 100, GREATEST(1, v_len - 99)); ELSE v_end := v_start; END IF;
            p_registrar_log_error('INPUT_CLOB_INFO', 'Size: ' || v_len || ' | Start: ' || v_start || ' | End: ' || v_end);
        END;
        
        BEGIN v_jo := JSON_OBJECT_T.parse(TRIM(p_json_contexto)); 
        EXCEPTION WHEN OTHERS THEN
            DECLARE v_len NUMBER := DBMS_LOB.GETLENGTH(p_json_contexto); v_msg VARCHAR2(4000); v_full_err VARCHAR2(4000); BEGIN
                v_msg := 'Error Sintaxis JSON (Size: ' || v_len || ') | Start: ' || DBMS_LOB.SUBSTR(p_json_contexto, 100, 1) || ' | End: ' || DBMS_LOB.SUBSTR(p_json_contexto, 100, GREATEST(1, v_len - 99));
                v_full_err := SUBSTR(v_msg || ' | ' || SQLERRM, 1, 4000); p_registrar_log_error('JSON_PARSE_ERROR', v_full_err);
                p_registrar_log_acceso('DESCONOCIDO', 'MENU_GENERATION', 'VER', 0, p_json_contexto);
                RETURN '{"error": "JSON Invalido", "detalle": "'||v_msg||'"}';
            END;
        END;

        IF v_jo.has('sujeto') THEN
            DECLARE v_sub JSON_OBJECT_T := v_jo.get_object('sujeto'); BEGIN
                IF v_sub.has('usuario_id') THEN v_usuario := v_sub.get_string('usuario_id');
                ELSIF v_sub.has('username') THEN v_usuario := v_sub.get_string('username');
                END IF;
            END;
        END IF;

        v_atributos := fn_extraer_atributos_contexto(v_jo);

        IF v_jo.has('solicitud') THEN
            DECLARE v_req JSON_OBJECT_T := v_jo.get_object('solicitud'); BEGIN
                IF v_req.has('operaciones') THEN
                    DECLARE v_ops JSON_ARRAY_T := v_req.get_array('operaciones'); BEGIN
                        IF v_ops IS NOT NULL THEN
                            FOR j IN 0 .. v_ops.get_size()-1 LOOP v_val := v_ops.get_string(j); IF v_val IS NOT NULL THEN v_ops_list(v_val) := TRUE; END IF; END LOOP;
                        END IF;
                    END;
                END IF;
                IF v_req.has('modulos') THEN v_modulos_arr := v_req.get_array('modulos'); END IF;
            END;
        END IF;

        g_ctx_policies.DELETE;
        IF v_jo.has('contexto') THEN
            DECLARE v_ctx JSON_OBJECT_T := v_jo.get_object('contexto'); BEGIN
                IF v_ctx.has('politicas') THEN
                    DECLARE v_pol JSON_ARRAY_T := v_ctx.get_array('politicas'); BEGIN
                        IF v_pol IS NOT NULL THEN
                            FOR j IN 0 .. v_pol.get_size()-1 LOOP 
                                v_val := v_pol.get_string(j);
                                IF v_val IS NOT NULL THEN
                                    DECLARE v_pol_id NUMBER := NULL; BEGIN
                                        IF REGEXP_LIKE(TRIM(v_val), '^[0-9]+$') THEN SELECT id_nodo INTO v_pol_id FROM acc_nodos WHERE id_nodo = TO_NUMBER(TRIM(v_val)) AND activo = 'S';
                                        ELSE SELECT id_nodo INTO v_pol_id FROM acc_nodos WHERE UPPER(codigo_tecnico) = UPPER(TRIM(v_val)) AND activo = 'S';
                                        END IF;
                                        IF v_pol_id IS NOT NULL THEN g_ctx_policies(TO_CHAR(v_pol_id)) := TRUE; END IF;
                                    EXCEPTION WHEN NO_DATA_FOUND THEN NULL; END;
                                END IF;
                            END LOOP;
                        END IF;
                    END;
                END IF;
            END;
        END IF;

        p_inicializar_memoria(v_atributos, v_ops_list, v_jo);
        v_root_ids.DELETE; v_root_seen.DELETE;

        IF v_modulos_arr IS NOT NULL AND v_modulos_arr.get_size() > 0 THEN
            FOR r IN (SELECT mn.id_menu_nodo FROM acc_menu_nodos mn WHERE mn.activo = 'S' ORDER BY NVL(mn.orden_visual, 99999), mn.id_menu_nodo) LOOP
                IF g_menu_nodos.EXISTS(r.id_menu_nodo) THEN
                    IF g_ctx_policies.COUNT = 0 OR g_ctx_menu_nodes.EXISTS(TO_CHAR(g_menu_nodos(r.id_menu_nodo).id_nodo)) OR fn_nodo_en_politica_legacy(g_menu_nodos(r.id_menu_nodo).id_nodo) THEN
                        FOR j IN 0 .. v_modulos_arr.get_size()-1 LOOP
                            v_claim := v_modulos_arr.get_string(j);
                            IF fn_menu_node_matches_claim(r.id_menu_nodo, v_claim) = 1 THEN v_root_ids(r.id_menu_nodo) := r.id_menu_nodo; EXIT; END IF;
                        END LOOP;
                    END IF;
                END IF;
            END LOOP;
        ELSIF g_ctx_policies.COUNT > 0 THEN
            v_policy_key := g_ctx_policies.FIRST;
            WHILE v_policy_key IS NOT NULL LOOP
                IF g_policy_menu_roots.EXISTS(v_policy_key) THEN
                    FOR i IN 1 .. g_policy_menu_roots(v_policy_key).COUNT LOOP
                        IF NOT v_root_seen.EXISTS(TO_CHAR(g_policy_menu_roots(v_policy_key)(i))) THEN
                            v_root_ids(g_policy_menu_roots(v_policy_key)(i)) := g_policy_menu_roots(v_policy_key)(i);
                            v_root_seen(TO_CHAR(g_policy_menu_roots(v_policy_key)(i))) := TRUE;
                        END IF;
                    END LOOP;
                END IF;
                v_policy_key := g_ctx_policies.NEXT(v_policy_key);
            END LOOP;
        ELSE
            FOR r IN (SELECT mn.id_menu_nodo FROM acc_menu_nodos mn WHERE mn.activo = 'S' AND NOT EXISTS (SELECT 1 FROM acc_menu_asignaciones ma WHERE ma.id_menu_hijo = mn.id_menu_nodo AND ma.activo = 'S') ORDER BY NVL(mn.orden_visual, 99999), mn.id_menu_nodo) LOOP
                v_root_ids(r.id_menu_nodo) := r.id_menu_nodo;
            END LOOP;
        END IF;

        FOR r IN (SELECT mn.id_menu_nodo FROM acc_menu_nodos mn WHERE mn.activo = 'S' ORDER BY NVL(mn.orden_visual, 99999), mn.id_menu_nodo) LOOP
            IF v_root_ids.EXISTS(r.id_menu_nodo) THEN
                v_vis.DELETE;
                DECLARE v_node JSON_OBJECT_T := fn_build_json(r.id_menu_nodo, v_vis, v_ops_list, v_jo, CASE WHEN v_modulos_arr IS NOT NULL AND v_modulos_arr.get_size() > 0 THEN 1 ELSE 0 END); BEGIN
                    IF v_node IS NOT NULL THEN v_res.append(v_node); END IF;
                END;
            END IF;
        END LOOP;

        p_registrar_log_acceso(v_usuario, 'MENU_GENERATION', 'VER', 1, p_json_contexto);
        v_jo.put('menu', v_res); RETURN v_jo.to_clob();
    EXCEPTION WHEN OTHERS THEN
        DECLARE v_err VARCHAR2(4000) := SUBSTR(SQLERRM || ' | ' || DBMS_UTILITY.FORMAT_ERROR_BACKTRACE, 1, 4000); BEGIN
            p_registrar_log_error('PKG_SEGURIDAD_NGAC.fn_obtener_menu_json', v_err);
            p_registrar_log_acceso(v_usuario, 'MENU_GENERATION', 'VER', 0, p_json_contexto);
            RETURN '{"error": "Fallo Critico", "detalle": "'||v_err||'"}';
        END;
    END fn_obtener_menu_json;

    PROCEDURE p_registrar_log_acceso (p_usuario VARCHAR2, p_objeto VARCHAR2, p_operaciones VARCHAR2, p_autorizado NUMBER, p_json_contexto CLOB) IS
        PRAGMA AUTONOMOUS_TRANSACTION;
    BEGIN
        INSERT INTO acc_log_accesos (usuario, codigo_objeto, operaciones, autorizado, json_contexto) 
        VALUES (NVL(p_usuario, 'DESCONOCIDO'), p_objeto, p_operaciones, p_autorizado, p_json_contexto);
        COMMIT;
    EXCEPTION WHEN OTHERS THEN
        DECLARE v_err VARCHAR2(4000) := SUBSTR(SQLERRM || ' | ' || DBMS_UTILITY.FORMAT_ERROR_BACKTRACE, 1, 4000); BEGIN
            p_registrar_log_error('p_registrar_log_acceso', v_err);
        END;
    END p_registrar_log_acceso;

    PROCEDURE p_registrar_log_error (p_modulo VARCHAR2, p_mensaje VARCHAR2) IS
        PRAGMA AUTONOMOUS_TRANSACTION;
    BEGIN
        INSERT INTO acc_log_errores (modulo, mensaje, fecha) VALUES (p_modulo, p_mensaje, SYSDATE);
        COMMIT;
    EXCEPTION WHEN OTHERS THEN NULL;
    END p_registrar_log_error;

    -- ===============================================================================================================================================
    -- MODIFICADO: FUNCIÓN CENTRAL CON SOPORTE JSON PARA OPERACIONES (RETRABAJADA)
    -- ===============================================================================================================================================
    FUNCTION fn_verificar_acceso (
        p_atributos       IN JSON_ARRAY_T, 
        p_operaciones     IN JSON_ARRAY_T, 
        p_objeto          IN VARCHAR2, 
        p_contexto_json   IN JSON_OBJECT_T DEFAULT NULL
    ) RETURN NUMBER IS
        v_ops_list     t_atributo_idx;
        v_id_obj       NUMBER;
        v_es_policy    NUMBER := 0;
        v_res          NUMBER;
        v_usuario      VARCHAR2(256) := 'DESCONOCIDO';
        v_ctx_clob     CLOB := NULL;
        v_val          VARCHAR2(4000);
        v_ops_csv      VARCHAR2(4000) := ''; -- Buffer para transformar a CSV solo al guardar auditoría
    BEGIN
        -- 1. Extraer el contexto CLOB e identificar al usuario analizado
        IF p_contexto_json IS NOT NULL THEN
            v_ctx_clob := p_contexto_json.to_clob();
            IF p_contexto_json.has('sujeto') THEN
                DECLARE v_sub JSON_OBJECT_T := p_contexto_json.get_object('sujeto'); BEGIN
                    IF v_sub.has('usuario_id') THEN v_usuario := v_sub.get_string('usuario_id');
                    ELSIF v_sub.has('username') THEN v_usuario := v_sub.get_string('username');
                    END IF;
                END;
            END IF;
        END IF;

        IF v_usuario = 'DESCONOCIDO' AND p_atributos IS NOT NULL AND p_atributos.get_size() > 0 THEN 
            v_usuario := p_atributos.get_string(0); 
        END IF;

        -- 2. TRABAJO COMO JSON: Recorrer directamente el arreglo JSON_ARRAY_T de operaciones inyectado
        IF p_operaciones IS NOT NULL THEN
            FOR j IN 0 .. p_operaciones.get_size() - 1 LOOP
                v_val := UPPER(TRIM(p_operaciones.get_string(j)));
                IF v_val IS NOT NULL THEN
                    v_ops_list(v_val) := TRUE; -- Almacena en la tabla hash interna de control
                    -- Construir el string CSV de forma segura únicamente con fines de almacenamiento en logs físicos
                    IF v_ops_csv IS NULL OR v_ops_csv = '' THEN v_ops_csv := v_val;
                    ELSE v_ops_csv := v_ops_csv || ',' || v_val;
                    END IF;
                END IF;
            END LOOP;
        END IF;
        
        -- 3. Identificar el nodo u objeto técnico consultado
        BEGIN
            IF REGEXP_LIKE(TRIM(p_objeto), '^[0-9]+$') THEN 
                SELECT id_nodo, id_tipo_nodo INTO v_id_obj, v_es_policy FROM acc_nodos WHERE id_nodo = TO_NUMBER(TRIM(p_objeto)) AND activo = 'S';
            ELSE 
                SELECT id_nodo, id_tipo_nodo INTO v_id_obj, v_es_policy FROM acc_nodos WHERE UPPER(codigo_tecnico) = UPPER(TRIM(p_objeto)) AND activo = 'S';
            END IF;
        EXCEPTION WHEN NO_DATA_FOUND THEN 
            p_registrar_log_acceso(v_usuario, p_objeto, NVL(v_ops_csv, 'N/A'), 0, v_ctx_clob); 
            RETURN 0; 
        END;
        
        -- 4. Cargar políticas adjuntas desde el ambiente JSON
        g_ctx_policies.DELETE;
        IF p_contexto_json IS NOT NULL AND p_contexto_json.has('contexto') THEN
            DECLARE v_ctx JSON_OBJECT_T := p_contexto_json.get_object('contexto'); BEGIN
                IF v_ctx.has('politicas') THEN
                    DECLARE v_pol JSON_ARRAY_T := v_ctx.get_array('politicas'); BEGIN
                        IF v_pol IS NOT NULL THEN
                            FOR j IN 0 .. v_pol.get_size()-1 LOOP 
                                v_val := v_pol.get_string(j);
                                IF v_val IS NOT NULL THEN
                                    DECLARE v_pol_id NUMBER := NULL; BEGIN
                                        IF REGEXP_LIKE(TRIM(v_val), '^[0-9]+$') THEN SELECT id_nodo INTO v_pol_id FROM acc_nodos WHERE id_nodo = TO_NUMBER(TRIM(v_val)) AND activo = 'S';
                                        ELSE SELECT id_nodo INTO v_pol_id FROM acc_nodos WHERE UPPER(codigo_tecnico) = UPPER(TRIM(v_val)) AND activo = 'S';
                                        END IF;
                                        IF v_pol_id IS NOT NULL THEN g_ctx_policies(TO_CHAR(v_pol_id)) := TRUE; END IF;
                                    EXCEPTION WHEN NO_DATA_FOUND THEN NULL; END;
                                END IF;
                            END LOOP;
                        END IF;
                    END;
                END IF;
            END;
        END IF;

        -- 5. Inicializar estructuras indexadas en memoria y resolver grafos NGAC
        p_inicializar_memoria(p_atributos, v_ops_list, p_contexto_json);
        v_res := fn_verificar_acceso_mem(v_id_obj, CASE WHEN v_es_policy = g_tipo_policy_id THEN 1 ELSE 0 END, p_atributos, v_ops_list, p_contexto_json);
        
        -- 6. Auditoría final
        p_registrar_log_acceso(v_usuario, p_objeto, NVL(v_ops_csv, 'N/A'), v_res, v_ctx_clob);
        RETURN v_res;
    EXCEPTION WHEN OTHERS THEN 
        p_registrar_log_acceso(v_usuario, p_objeto, NVL(v_ops_csv, 'ERROR'), 0, v_ctx_clob); 
        RETURN 0; 
    END fn_verificar_acceso;

    -- ===============================================================================================================================================
    -- FUNCIÓN: FN_GET_CARPETAS_RAIZ (Retorna SYS_REFCURSOR)
    -- ===============================================================================================================================================
    FUNCTION fn_get_carpetas_raiz (
        p_id IN NUMBER
    ) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT mn.id_menu_nodo,
                   mn.id_nodo,
                   n.codigo_tecnico AS codigo,
                   NVL(mn.etiqueta_visible, n.etiqueta) AS etiqueta,
                   NVL(mn.slug_visible, n.slug) AS slug,
                   NVL(mn.icono_visible, n.icono) AS icono,
                   NVL(mn.url_ruta_visible, n.url_ruta) AS ruta,
                   NVL(mn.orden_visual, n.orden_visual) AS orden
            FROM acc_menu_nodos mn
            JOIN acc_nodos n ON n.id_nodo = mn.id_nodo
            JOIN acc_policy_menu_raices pmr ON pmr.id_menu_nodo = mn.id_menu_nodo
            WHERE mn.activo = 'S' AND n.activo = 'S' AND pmr.activo = 'S'
              AND pmr.id_policy = p_id
              AND NOT EXISTS (
                  -- Filtro: Es raíz porque no tiene un registro donde actúe como hijo
                  SELECT 1
                  FROM acc_menu_asignaciones ma
                  WHERE ma.id_menu_hijo = mn.id_menu_nodo
                    AND ma.activo = 'S'
              )
            ORDER BY NVL(mn.orden_visual, n.orden_visual), mn.id_menu_nodo;

        RETURN v_cursor;

    EXCEPTION
        WHEN OTHERS THEN
            p_registrar_log_error('FN_GET_CARPETAS_RAIZ', SUBSTR(SQLERRM, 1, 4000));
            OPEN v_cursor FOR SELECT NULL AS id_menu_nodo FROM DUAL WHERE 1=2;
            RETURN v_cursor;
    END fn_get_carpetas_raiz;

    -- ===============================================================================================================================================
    -- FUNCIÓN: FN_GET_CARPETAS_RAIZ_SIN_HIJOS (Retorna SYS_REFCURSOR)
    -- ===============================================================================================================================================
    FUNCTION fn_get_carpetas_raiz_sin_hijos (
        p_id IN NUMBER
    ) RETURN SYS_REFCURSOR IS
        v_cursor SYS_REFCURSOR;
    BEGIN
        OPEN v_cursor FOR
            SELECT mn.id_menu_nodo,
                   mn.id_nodo,
                   n.codigo_tecnico AS codigo,
                   NVL(mn.etiqueta_visible, n.etiqueta) AS etiqueta,
                   NVL(mn.slug_visible, n.slug) AS slug,
                   NVL(mn.icono_visible, n.icono) AS icono,
                   NVL(mn.url_ruta_visible, n.url_ruta) AS ruta,
                   NVL(mn.orden_visual, n.orden_visual) AS orden
            FROM acc_menu_nodos mn
            JOIN acc_nodos n ON n.id_nodo = mn.id_nodo
            JOIN acc_policy_menu_raices pmr ON pmr.id_menu_nodo = mn.id_menu_nodo
            WHERE mn.activo = 'S' AND n.activo = 'S' AND pmr.activo = 'S'
              AND pmr.id_policy = p_id
              -- Condición 1: Es Raíz (no tiene padre)
              AND NOT EXISTS (
                  SELECT 1
                  FROM acc_menu_asignaciones ma_padre
                  WHERE ma_padre.id_menu_hijo = mn.id_menu_nodo
                    AND ma_padre.activo = 'S'
              )
              -- Condición 2: Sin Hijos (no es padre de ningún submenú)
              AND NOT EXISTS (
                  SELECT 1
                  FROM acc_menu_asignaciones ma_hijo
                  WHERE ma_hijo.id_menu_padre = mn.id_menu_nodo
                    AND ma_hijo.activo = 'S'
              )
            ORDER BY NVL(mn.orden_visual, n.orden_visual), mn.id_menu_nodo;

        RETURN v_cursor;

    EXCEPTION
        WHEN OTHERS THEN
            p_registrar_log_error('FN_GET_CARPETAS_RAIZ_SIN_HIJOS', SUBSTR(SQLERRM, 1, 4000));
            OPEN v_cursor FOR SELECT NULL AS id_menu_nodo FROM DUAL WHERE 1=2;
            RETURN v_cursor;
    END fn_get_carpetas_raiz_sin_hijos;

BEGIN
    BEGIN SELECT id_tipo_nodo INTO g_tipo_policy_id FROM acc_tipos_nodo WHERE codigo_tipo = 'POLICY'; EXCEPTION WHEN NO_DATA_FOUND THEN g_tipo_policy_id := -1; END;
    BEGIN SELECT id_tipo_nodo INTO g_tipo_objeto_id FROM acc_tipos_nodo WHERE codigo_tipo = 'OBJETO'; EXCEPTION WHEN NO_DATA_FOUND THEN g_tipo_objeto_id := -1; END;
    BEGIN SELECT id_tipo_nodo INTO g_tipo_objattr_id FROM acc_tipos_nodo WHERE codigo_tipo = 'OBJ_ATTR'; EXCEPTION WHEN NO_DATA_FOUND THEN g_tipo_objattr_id := -1; END;
END pkg_seguridad_ngac;
/