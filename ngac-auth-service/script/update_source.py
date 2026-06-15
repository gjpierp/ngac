import re

with open('script/extracted_pkg.txt', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Remove the first line (PACKAGE BODY...)
if len(lines) > 0 and 'PACKAGE BODY' in lines[0].upper():
    lines.pop(0)

# Remove garbage from the end
while len(lines) > 0:
    last_line = lines[-1].strip()
    if last_line == "" or "rows selected." in last_line.lower():
        lines.pop()
    else:
        break

content = "".join(lines)

# Prepend CREATE OR REPLACE line
content = "    -- =========================================================================\n" + \
          "    -- PAQUETE RECONSTRUIDO CON LOGICA DE CLONACION ESTRUCTURAL\n" + \
          "    -- =========================================================================\n\n" + content

# Regex for p_clonar_nodo_recursivo
pattern_recursivo = re.compile(r'PROCEDURE p_clonar_nodo_recursivo\(.*?END p_clonar_nodo_recursivo;', re.DOTALL)
new_recursivo = """PROCEDURE p_clonar_nodo_recursivo(
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
    END p_clonar_nodo_recursivo;"""

content = pattern_recursivo.sub(new_recursivo, content)

# Regex for p_clonar_jerarquia
pattern_jerarquia = re.compile(r'PROCEDURE p_clonar_jerarquia\(.*?END p_clonar_jerarquia;', re.DOTALL)
new_jerarquia = """PROCEDURE p_clonar_jerarquia(p_id_destino IN NUMBER, p_id_origen IN NUMBER) IS
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
    END p_clonar_jerarquia;"""

content = pattern_jerarquia.sub(new_jerarquia, content)

with open('script/pkg-seguridad-admin-body.sql', 'w', encoding='utf-8') as f:
    f.write(content)

print("Source file updated!")
