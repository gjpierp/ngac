-- ==========================================
-- TRIGGERS
-- ==========================================

CREATE OR REPLACE TRIGGER "TRG_ACC_ASIGNACIONES_BI" 
BEFORE INSERT ON acc_asignaciones
FOR EACH ROW
 WHEN (NEW.id_asignacion IS NULL) BEGIN
    :NEW.id_asignacion := acc_asignaciones_seq.NEXTVAL;
END;;

CREATE OR REPLACE TRIGGER "TRG_ACC_ASIGNACIONES_MOD" 
BEFORE UPDATE ON acc_asignaciones
FOR EACH ROW
BEGIN
  :NEW.fecha_modificacion := SYSDATE;
  :NEW.modificado_por := USER;
END;;

CREATE OR REPLACE TRIGGER "TRG_ACC_ASOCIACIONES_BI" 
BEFORE INSERT ON acc_asociaciones
FOR EACH ROW
 WHEN (NEW.id_asociacion IS NULL) BEGIN
    :NEW.id_asociacion := acc_asociaciones_seq.NEXTVAL;
END;;

CREATE OR REPLACE TRIGGER "TRG_ACC_ASOCIACIONES_MOD" 
BEFORE UPDATE ON acc_asociaciones
FOR EACH ROW
BEGIN
  :NEW.fecha_modificacion := SYSDATE;
  :NEW.modificado_por := USER;
END;;

CREATE OR REPLACE TRIGGER "TRG_ACC_LOG_ERRORES_BI" 
BEFORE INSERT ON acc_log_errores
FOR EACH ROW
 WHEN (NEW.id_log IS NULL) BEGIN
    :NEW.id_log := acc_log_errores_seq.NEXTVAL;
END;;

CREATE OR REPLACE TRIGGER "TRG_ACC_MENU_ASIGNACIONES_BI" 
    BEFORE INSERT ON acc_menu_asignaciones
    FOR EACH ROW
     WHEN (NEW.id_menu_asignacion IS NULL) BEGIN
      :NEW.id_menu_asignacion := acc_menu_asignaciones_seq.NEXTVAL;
    END;;

CREATE OR REPLACE TRIGGER "TRG_ACC_MENU_NODOS_BI" 
    BEFORE INSERT ON acc_menu_nodos
    FOR EACH ROW
     WHEN (NEW.id_menu_nodo IS NULL) BEGIN
      :NEW.id_menu_nodo := acc_menu_nodos_seq.NEXTVAL;
    END;;

CREATE OR REPLACE TRIGGER "TRG_ACC_NODOS_BI" 
BEFORE INSERT ON acc_nodos
FOR EACH ROW
 WHEN (NEW.id_nodo IS NULL) BEGIN
    :NEW.id_nodo := acc_nodos_seq.NEXTVAL;
END;;

CREATE OR REPLACE TRIGGER "TRG_ACC_NODOS_MOD" 
BEFORE UPDATE ON acc_nodos
FOR EACH ROW
BEGIN
  :NEW.fecha_modificacion := SYSDATE;
  :NEW.modificado_por := USER;
END;;

CREATE OR REPLACE TRIGGER "TRG_ACC_NODOS_SYNC_MENU" 
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
END;;

CREATE OR REPLACE TRIGGER "TRG_ACC_OPERACIONES_BI" 
BEFORE INSERT ON acc_operaciones
FOR EACH ROW  WHEN (NEW.id_op IS NULL) BEGIN
    :NEW.id_op := acc_operaciones_seq.NEXTVAL;
END;;

CREATE OR REPLACE TRIGGER "TRG_ACC_OPERACIONES_MOD" 
BEFORE UPDATE ON acc_operaciones
FOR EACH ROW
BEGIN
  :NEW.fecha_modificacion := SYSDATE;
  :NEW.modificado_por := USER;
END;;

CREATE OR REPLACE TRIGGER "TRG_ACC_POLICY_MENU_RAICES_BI" 
    BEFORE INSERT ON acc_policy_menu_raices
    FOR EACH ROW
     WHEN (NEW.id_policy_menu_raiz IS NULL) BEGIN
      :NEW.id_policy_menu_raiz := acc_policy_menu_raices_seq.NEXTVAL;
    END;;

CREATE OR REPLACE TRIGGER "TRG_ACC_PROHIBICIONES_BI" 
BEFORE INSERT ON acc_prohibiciones
FOR EACH ROW
 WHEN (NEW.id_prohibicion IS NULL) BEGIN
    :NEW.id_prohibicion := acc_prohibiciones_seq.NEXTVAL;
END;;

CREATE OR REPLACE TRIGGER "TRG_ACC_PROHIBICIONES_MOD" 
BEFORE UPDATE ON acc_prohibiciones
FOR EACH ROW
BEGIN
  :NEW.fecha_modificacion := SYSDATE;
  :NEW.modificado_por := USER;
END;;

CREATE OR REPLACE TRIGGER "TRG_ACC_ROLES_BI" 
BEFORE INSERT ON acc_roles
FOR EACH ROW
BEGIN
  IF :NEW.id_rol IS NULL THEN
    SELECT acc_roles_seq.NEXTVAL INTO :NEW.id_rol FROM dual;
  END IF;
END;;

CREATE OR REPLACE TRIGGER "TRG_ACC_TIPOS_NODO_BI" 
BEFORE INSERT ON acc_tipos_nodo
FOR EACH ROW  WHEN (NEW.id_tipo_nodo IS NULL) BEGIN
    :NEW.id_tipo_nodo := acc_tipos_nodo_seq.NEXTVAL;
END;;

CREATE OR REPLACE TRIGGER "TRG_ACC_TIPOS_NODO_MOD" 
BEFORE UPDATE ON acc_tipos_nodo
FOR EACH ROW
BEGIN
  :NEW.fecha_modificacion := SYSDATE;
  :NEW.modificado_por := USER;
END;;

CREATE OR REPLACE TRIGGER "TRG_BI_ACC_LOG_ACCESOS" 
BEFORE INSERT ON acc_log_accesos
FOR EACH ROW
BEGIN
    IF :NEW.id_log IS NULL THEN
        SELECT seq_acc_log_accesos.NEXTVAL INTO :NEW.id_log FROM DUAL;
    END IF;
END;;

CREATE OR REPLACE TRIGGER "TRG_SAFI_ENTIDADES_BI" 
BEFORE INSERT ON safi_entidades FOR EACH ROW
BEGIN
    IF :NEW.id_entidad IS NULL THEN
        SELECT seq_safi_entidades.NEXTVAL INTO :NEW.id_entidad FROM dual;
    END IF;
END;;

CREATE OR REPLACE TRIGGER "TRG_SAFI_ENTIDADES_MOD" 
BEFORE UPDATE ON safi_entidades
FOR EACH ROW
BEGIN
  :NEW.fecha_modificacion := SYSDATE;
  :NEW.modificado_por := USER;
END;;

CREATE OR REPLACE TRIGGER "TRG_SAFI_ENTIDADES_SD" BEFORE UPDATE ON safi_entidades FOR EACH ROW BEGIN IF :NEW.activo = 'N' AND :OLD.activo = 'S' THEN :NEW.fecha_eliminacion := SYSDATE; :NEW.eliminado_por := USER; ELSIF :NEW.activo = 'S' AND :OLD.activo = 'N' THEN :NEW.fecha_eliminacion := NULL; :NEW.eliminado_por := NULL; END IF; END;;

CREATE OR REPLACE TRIGGER "TRG_SAFI_MODULO_NODOS_ID" 
   BEFORE INSERT ON "SAFI_MODULO_NODOS"
   FOR EACH ROW
   BEGIN
       IF :NEW.ID_MODULO_NODO IS NULL THEN
           SELECT "SEQ_SAFI_MODULO_NODOS".NEXTVAL INTO :NEW.ID_MODULO_NODO FROM DUAL;
       END IF;
   END;;

CREATE OR REPLACE TRIGGER "TRG_SAFI_MODULOS_ID" 
   BEFORE INSERT ON "SAFI_MODULOS"
   FOR EACH ROW
   BEGIN
       IF :NEW.ID_MODULO IS NULL THEN
           SELECT "SEQ_SAFI_MODULOS".NEXTVAL INTO :NEW.ID_MODULO FROM DUAL;
       END IF;
   END;;

CREATE OR REPLACE TRIGGER "TRG_SAFI_UNIDADES_BI" 
      BEFORE INSERT ON safi_unidades FOR EACH ROW
      BEGIN
          IF :NEW.id_unidad IS NULL THEN
              SELECT seq_safi_unidades.NEXTVAL INTO :NEW.id_unidad FROM dual;
          END IF;
      END;;

CREATE OR REPLACE TRIGGER "TRG_SAFI_UNIDADES_MOD" 
BEFORE UPDATE ON safi_unidades
FOR EACH ROW
BEGIN
  :NEW.fecha_modificacion := SYSDATE;
  :NEW.modificado_por := USER;
END;;

CREATE OR REPLACE TRIGGER "TRG_SAFI_UNIDADES_SD" 
      BEFORE UPDATE ON safi_unidades FOR EACH ROW
      BEGIN
          IF :NEW.activo = 'N' AND :OLD.activo = 'S' THEN 
              :NEW.fecha_eliminacion := SYSDATE;
              :NEW.eliminado_por := USER;
          ELSIF :NEW.activo = 'S' AND :OLD.activo = 'N' THEN 
              :NEW.fecha_eliminacion := NULL;
              :NEW.eliminado_por := NULL;
          END IF;
      END;;

CREATE OR REPLACE TRIGGER "TRG_SAFI_USUARIOS_BI" 
BEFORE INSERT ON safi_usuarios FOR EACH ROW
BEGIN
    IF :NEW.id_usuario IS NULL THEN
        SELECT seq_safi_usuarios.NEXTVAL INTO :NEW.id_usuario FROM dual;
    END IF;
END;;

CREATE OR REPLACE TRIGGER "TRG_SAFI_USUARIOS_MOD" 
BEFORE UPDATE ON safi_usuarios
FOR EACH ROW
BEGIN
  :NEW.fecha_modificacion := SYSDATE;
  :NEW.modificado_por := USER;
END;;

CREATE OR REPLACE TRIGGER "TRG_SAFI_USUARIOS_SD" 
      BEFORE UPDATE ON safi_usuarios FOR EACH ROW
      BEGIN
          IF :NEW.activo = 'N' AND :OLD.activo = 'S' THEN 
              :NEW.fecha_eliminacion := SYSDATE;
              :NEW.eliminado_por := USER;
          ELSIF :NEW.activo = 'S' AND :OLD.activo = 'N' THEN 
              :NEW.fecha_eliminacion := NULL;
              :NEW.eliminado_por := NULL;
          END IF;
      END;;

CREATE OR REPLACE TRIGGER "TRG_ACC_ASIGNACIONES_MOD" 
BEFORE UPDATE ON acc_asignaciones
FOR EACH ROW
BEGIN
  :NEW.fecha_modificacion := SYSDATE;
  :NEW.modificado_por := USER;
END;;

CREATE OR REPLACE TRIGGER "TRG_ACC_ASIGNACIONES_BI" 
BEFORE INSERT ON acc_asignaciones
FOR EACH ROW
 WHEN (NEW.id_asignacion IS NULL) BEGIN
    :NEW.id_asignacion := acc_asignaciones_seq.NEXTVAL;
END;;

CREATE OR REPLACE TRIGGER "TRG_ACC_ASOCIACIONES_MOD" 
BEFORE UPDATE ON acc_asociaciones
FOR EACH ROW
BEGIN
  :NEW.fecha_modificacion := SYSDATE;
  :NEW.modificado_por := USER;
END;;

CREATE OR REPLACE TRIGGER "TRG_ACC_ASOCIACIONES_BI" 
BEFORE INSERT ON acc_asociaciones
FOR EACH ROW
 WHEN (NEW.id_asociacion IS NULL) BEGIN
    :NEW.id_asociacion := acc_asociaciones_seq.NEXTVAL;
END;;

CREATE OR REPLACE TRIGGER "TRG_BI_ACC_LOG_ACCESOS" 
BEFORE INSERT ON acc_log_accesos
FOR EACH ROW
BEGIN
    IF :NEW.id_log IS NULL THEN
        SELECT seq_acc_log_accesos.NEXTVAL INTO :NEW.id_log FROM DUAL;
    END IF;
END;;

CREATE OR REPLACE TRIGGER "TRG_ACC_LOG_ERRORES_BI" 
BEFORE INSERT ON acc_log_errores
FOR EACH ROW
 WHEN (NEW.id_log IS NULL) BEGIN
    :NEW.id_log := acc_log_errores_seq.NEXTVAL;
END;;

CREATE OR REPLACE TRIGGER "TRG_ACC_MENU_ASIGNACIONES_BI" 
    BEFORE INSERT ON acc_menu_asignaciones
    FOR EACH ROW
     WHEN (NEW.id_menu_asignacion IS NULL) BEGIN
      :NEW.id_menu_asignacion := acc_menu_asignaciones_seq.NEXTVAL;
    END;;

CREATE OR REPLACE TRIGGER "TRG_ACC_MENU_NODOS_BI" 
    BEFORE INSERT ON acc_menu_nodos
    FOR EACH ROW
     WHEN (NEW.id_menu_nodo IS NULL) BEGIN
      :NEW.id_menu_nodo := acc_menu_nodos_seq.NEXTVAL;
    END;;

CREATE OR REPLACE TRIGGER "TRG_ACC_NODOS_SYNC_MENU" 
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
END;;

CREATE OR REPLACE TRIGGER "TRG_ACC_NODOS_MOD" 
BEFORE UPDATE ON acc_nodos
FOR EACH ROW
BEGIN
  :NEW.fecha_modificacion := SYSDATE;
  :NEW.modificado_por := USER;
END;;

CREATE OR REPLACE TRIGGER "TRG_ACC_NODOS_BI" 
BEFORE INSERT ON acc_nodos
FOR EACH ROW
 WHEN (NEW.id_nodo IS NULL) BEGIN
    :NEW.id_nodo := acc_nodos_seq.NEXTVAL;
END;;

CREATE OR REPLACE TRIGGER "TRG_ACC_OPERACIONES_MOD" 
BEFORE UPDATE ON acc_operaciones
FOR EACH ROW
BEGIN
  :NEW.fecha_modificacion := SYSDATE;
  :NEW.modificado_por := USER;
END;;

CREATE OR REPLACE TRIGGER "TRG_ACC_OPERACIONES_BI" 
BEFORE INSERT ON acc_operaciones
FOR EACH ROW  WHEN (NEW.id_op IS NULL) BEGIN
    :NEW.id_op := acc_operaciones_seq.NEXTVAL;
END;;

CREATE OR REPLACE TRIGGER "TRG_ACC_POLICY_MENU_RAICES_BI" 
    BEFORE INSERT ON acc_policy_menu_raices
    FOR EACH ROW
     WHEN (NEW.id_policy_menu_raiz IS NULL) BEGIN
      :NEW.id_policy_menu_raiz := acc_policy_menu_raices_seq.NEXTVAL;
    END;;

CREATE OR REPLACE TRIGGER "TRG_ACC_PROHIBICIONES_MOD" 
BEFORE UPDATE ON acc_prohibiciones
FOR EACH ROW
BEGIN
  :NEW.fecha_modificacion := SYSDATE;
  :NEW.modificado_por := USER;
END;;

CREATE OR REPLACE TRIGGER "TRG_ACC_PROHIBICIONES_BI" 
BEFORE INSERT ON acc_prohibiciones
FOR EACH ROW
 WHEN (NEW.id_prohibicion IS NULL) BEGIN
    :NEW.id_prohibicion := acc_prohibiciones_seq.NEXTVAL;
END;;

CREATE OR REPLACE TRIGGER "TRG_ACC_ROLES_BI" 
BEFORE INSERT ON acc_roles
FOR EACH ROW
BEGIN
  IF :NEW.id_rol IS NULL THEN
    SELECT acc_roles_seq.NEXTVAL INTO :NEW.id_rol FROM dual;
  END IF;
END;;

CREATE OR REPLACE TRIGGER "TRG_ACC_TIPOS_NODO_MOD" 
BEFORE UPDATE ON acc_tipos_nodo
FOR EACH ROW
BEGIN
  :NEW.fecha_modificacion := SYSDATE;
  :NEW.modificado_por := USER;
END;;

CREATE OR REPLACE TRIGGER "TRG_ACC_TIPOS_NODO_BI" 
BEFORE INSERT ON acc_tipos_nodo
FOR EACH ROW  WHEN (NEW.id_tipo_nodo IS NULL) BEGIN
    :NEW.id_tipo_nodo := acc_tipos_nodo_seq.NEXTVAL;
END;;

CREATE OR REPLACE TRIGGER "TRG_SAFI_ENTIDADES_MOD" 
BEFORE UPDATE ON safi_entidades
FOR EACH ROW
BEGIN
  :NEW.fecha_modificacion := SYSDATE;
  :NEW.modificado_por := USER;
END;;

CREATE OR REPLACE TRIGGER "TRG_SAFI_ENTIDADES_SD" BEFORE UPDATE ON safi_entidades FOR EACH ROW BEGIN IF :NEW.activo = 'N' AND :OLD.activo = 'S' THEN :NEW.fecha_eliminacion := SYSDATE; :NEW.eliminado_por := USER; ELSIF :NEW.activo = 'S' AND :OLD.activo = 'N' THEN :NEW.fecha_eliminacion := NULL; :NEW.eliminado_por := NULL; END IF; END;;

CREATE OR REPLACE TRIGGER "TRG_SAFI_ENTIDADES_BI" 
BEFORE INSERT ON safi_entidades FOR EACH ROW
BEGIN
    IF :NEW.id_entidad IS NULL THEN
        SELECT seq_safi_entidades.NEXTVAL INTO :NEW.id_entidad FROM dual;
    END IF;
END;;

CREATE OR REPLACE TRIGGER "TRG_SAFI_MODULO_NODOS_ID" 
   BEFORE INSERT ON "SAFI_MODULO_NODOS"
   FOR EACH ROW
   BEGIN
       IF :NEW.ID_MODULO_NODO IS NULL THEN
           SELECT "SEQ_SAFI_MODULO_NODOS".NEXTVAL INTO :NEW.ID_MODULO_NODO FROM DUAL;
       END IF;
   END;;

CREATE OR REPLACE TRIGGER "TRG_SAFI_MODULOS_ID" 
   BEFORE INSERT ON "SAFI_MODULOS"
   FOR EACH ROW
   BEGIN
       IF :NEW.ID_MODULO IS NULL THEN
           SELECT "SEQ_SAFI_MODULOS".NEXTVAL INTO :NEW.ID_MODULO FROM DUAL;
       END IF;
   END;;

CREATE OR REPLACE TRIGGER "TRG_SAFI_UNIDADES_MOD" 
BEFORE UPDATE ON safi_unidades
FOR EACH ROW
BEGIN
  :NEW.fecha_modificacion := SYSDATE;
  :NEW.modificado_por := USER;
END;;

CREATE OR REPLACE TRIGGER "TRG_SAFI_UNIDADES_BI" 
      BEFORE INSERT ON safi_unidades FOR EACH ROW
      BEGIN
          IF :NEW.id_unidad IS NULL THEN
              SELECT seq_safi_unidades.NEXTVAL INTO :NEW.id_unidad FROM dual;
          END IF;
      END;;

CREATE OR REPLACE TRIGGER "TRG_SAFI_UNIDADES_SD" 
      BEFORE UPDATE ON safi_unidades FOR EACH ROW
      BEGIN
          IF :NEW.activo = 'N' AND :OLD.activo = 'S' THEN 
              :NEW.fecha_eliminacion := SYSDATE;
              :NEW.eliminado_por := USER;
          ELSIF :NEW.activo = 'S' AND :OLD.activo = 'N' THEN 
              :NEW.fecha_eliminacion := NULL;
              :NEW.eliminado_por := NULL;
          END IF;
      END;;

CREATE OR REPLACE TRIGGER "TRG_SAFI_USUARIOS_BI" 
BEFORE INSERT ON safi_usuarios FOR EACH ROW
BEGIN
    IF :NEW.id_usuario IS NULL THEN
        SELECT seq_safi_usuarios.NEXTVAL INTO :NEW.id_usuario FROM dual;
    END IF;
END;;

CREATE OR REPLACE TRIGGER "TRG_SAFI_USUARIOS_MOD" 
BEFORE UPDATE ON safi_usuarios
FOR EACH ROW
BEGIN
  :NEW.fecha_modificacion := SYSDATE;
  :NEW.modificado_por := USER;
END;;

CREATE OR REPLACE TRIGGER "TRG_SAFI_USUARIOS_SD" 
      BEFORE UPDATE ON safi_usuarios FOR EACH ROW
      BEGIN
          IF :NEW.activo = 'N' AND :OLD.activo = 'S' THEN 
              :NEW.fecha_eliminacion := SYSDATE;
              :NEW.eliminado_por := USER;
          ELSIF :NEW.activo = 'S' AND :OLD.activo = 'N' THEN 
              :NEW.fecha_eliminacion := NULL;
              :NEW.eliminado_por := NULL;
          END IF;
      END;;
