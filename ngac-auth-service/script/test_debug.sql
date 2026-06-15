SET SERVEROUTPUT ON;
DECLARE
    TYPE t_boolean_idx IS TABLE OF BOOLEAN INDEX BY VARCHAR2(64);
    TYPE t_number_list IS TABLE OF NUMBER INDEX BY PLS_INTEGER;
    
    v_json CLOB;
    v_menu CLOB;
    v_jo JSON_OBJECT_T;
    v_atributos JSON_ARRAY_T;
    v_atributos_ids_set t_boolean_idx;
    v_atributos_ids t_number_list;
    v_skip_check BOOLEAN := FALSE;
    
    -- Helper to resolve attribute ID
    FUNCTION fn_resolve_attr_id(p_val VARCHAR2) RETURN NUMBER IS
        v_id NUMBER := NULL;
    BEGIN
        IF REGEXP_LIKE(TRIM(p_val), '^[0-9]+$') THEN
            SELECT id_nodo INTO v_id FROM acc_nodos WHERE id_nodo = TO_NUMBER(TRIM(p_val)) AND activo = 'S';
        ELSE
            SELECT id_nodo INTO v_id FROM acc_nodos WHERE UPPER(codigo_tecnico) = UPPER(TRIM(p_val)) AND activo = 'S';
        END IF;
        RETURN v_id;
    EXCEPTION WHEN NO_DATA_FOUND THEN
        RETURN NULL;
    END;
BEGIN
    v_json := '{"sujeto":{"usuario_id":"13259698-0","roles":["ROL_JEFE_CONT"],"division":""},"contexto":{"politicas":["POLITICA_HOSPITAL"]},"solicitud":{"modulos":["ADMINISTRACION","PRESUPUESTO_HOSP"],"operaciones":["VER","CREAR","EDITAR","ELIMINAR"]},"atributos":[]}';
    v_menu := pkg_seguridad_ngac.fn_obtener_menu_json(v_json);
    
    -- Replicate initialization
    v_jo := JSON_OBJECT_T.parse(v_json);
    v_atributos := pkg_seguridad_ngac.fn_extraer_atributos_contexto(v_jo);
    
    FOR i IN 0 .. v_atributos.get_size() - 1 LOOP
        DECLARE
            v_val VARCHAR2(4000) := v_atributos.get_string(i);
            v_id NUMBER;
        BEGIN
            v_id := fn_resolve_attr_id(v_val);
            IF v_id IS NOT NULL THEN
                v_atributos_ids(v_atributos_ids.COUNT + 1) := v_id;
            END IF;
        END;
    END LOOP;
    
    -- Check skip check
    FOR i IN 1 .. v_atributos_ids.COUNT LOOP
        DECLARE
            v_attr_cod VARCHAR2(4000);
        BEGIN
            SELECT codigo_tecnico INTO v_attr_cod FROM acc_nodos WHERE id_nodo = v_atributos_ids(i);
            DBMS_OUTPUT.PUT_LINE('Attribute in g_atributos_ids: ' || v_attr_cod);
            IF UPPER(v_attr_cod) IN ('ROL_ADMIN', 'ROL_DEV', 'SYSTEM', 'ADMIN') THEN
                v_skip_check := TRUE;
            END IF;
        EXCEPTION WHEN NO_DATA_FOUND THEN NULL;
        END;
    END LOOP;
    
    IF v_skip_check THEN
        DBMS_OUTPUT.PUT_LINE('v_skip_check: TRUE');
    ELSE
        DBMS_OUTPUT.PUT_LINE('v_skip_check: FALSE');
    END IF;
END;
/
EXIT;
