CREATE OR REPLACE TRIGGER trg_acc_nodos_sync_menu
AFTER INSERT OR UPDATE ON acc_nodos
FOR EACH ROW
DECLARE
    v_tipo VARCHAR2(50);
BEGIN
    -- Obtener código del tipo de nodo
    SELECT codigo_tipo INTO v_tipo
    FROM acc_tipos_nodo
    WHERE id_tipo_nodo = :NEW.id_tipo_nodo;

    -- Solo sincronizar si es un tipo del ecosistema visual de recursos
    IF v_tipo IN ('OBJ_ATTR', 'OBJETO', 'OA', 'CARPETA') THEN
        IF INSERTING THEN
            INSERT INTO acc_menu_nodos (
                id_nodo, etiqueta_visible, url_ruta_visible, slug_visible,
                icono_visible, descripcion_visible, orden_visual, activo, creado_por, fecha_creacion
            ) VALUES (
                :NEW.id_nodo, :NEW.etiqueta, :NEW.url_ruta, :NEW.slug,
                :NEW.icono, :NEW.descripcion, :NEW.orden_visual, :NEW.activo, :NEW.creado_por, :NEW.fecha_creacion
            );
        ELSIF UPDATING THEN
            UPDATE acc_menu_nodos
            SET etiqueta_visible = :NEW.etiqueta,
                url_ruta_visible = :NEW.url_ruta,
                slug_visible = :NEW.slug,
                icono_visible = :NEW.icono,
                descripcion_visible = :NEW.descripcion,
                orden_visual = :NEW.orden_visual,
                activo = :NEW.activo,
                modificado_por = :NEW.modificado_por,
                fecha_modificacion = :NEW.fecha_modificacion
            WHERE id_nodo = :NEW.id_nodo;
        END IF;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Registrar el error de forma segura antes de propagarlo
        DECLARE
            v_err VARCHAR2(4000) := SQLERRM;
        BEGIN
            INSERT INTO acc_log_errores (modulo, mensaje, fecha)
            VALUES ('TRIG_SYNC_MENU', 'Error al sincronizar nodo ID: ' || :NEW.id_nodo || ' - ' || v_err, SYSDATE);
        END;
        RAISE;
END;
/
