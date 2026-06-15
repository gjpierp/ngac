-- Migracion para separar recurso canonico de grafo de menu reutilizable
-- Cada bloque esta separado por --@@ para ejecucion automatizada.

DECLARE
  v_count NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM user_tables WHERE table_name = 'ACC_MENU_NODOS';
  IF v_count = 0 THEN
    EXECUTE IMMEDIATE q'[
      CREATE TABLE acc_menu_nodos (
        id_menu_nodo NUMBER NOT NULL,
        id_nodo NUMBER NOT NULL,
        etiqueta_visible VARCHAR2(500),
        url_ruta_visible VARCHAR2(1000),
        slug_visible VARCHAR2(500),
        icono_visible VARCHAR2(100),
        descripcion_visible VARCHAR2(1000),
        orden_visual NUMBER DEFAULT 0,
        activo VARCHAR2(1) DEFAULT 'S' NOT NULL,
        fecha_creacion DATE DEFAULT SYSDATE,
        creado_por VARCHAR2(100) DEFAULT USER,
        CONSTRAINT pk_acc_menu_nodos PRIMARY KEY (id_menu_nodo),
        CONSTRAINT fk_acc_menu_nodo FOREIGN KEY (id_nodo) REFERENCES acc_nodos(id_nodo),
        CONSTRAINT chk_acc_menu_nodos_activo CHECK (activo IN ('S','N'))
      )
    ]';
  END IF;
END;
--@@
DECLARE
  v_count NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM user_tables WHERE table_name = 'ACC_MENU_ASIGNACIONES';
  IF v_count = 0 THEN
    EXECUTE IMMEDIATE q'[
      CREATE TABLE acc_menu_asignaciones (
        id_menu_asignacion NUMBER NOT NULL,
        id_menu_padre NUMBER NOT NULL,
        id_menu_hijo NUMBER NOT NULL,
        activo VARCHAR2(1) DEFAULT 'S' NOT NULL,
        fecha_creacion DATE DEFAULT SYSDATE,
        creado_por VARCHAR2(100) DEFAULT USER,
        CONSTRAINT pk_acc_menu_asignaciones PRIMARY KEY (id_menu_asignacion),
        CONSTRAINT fk_acc_menu_asig_padre FOREIGN KEY (id_menu_padre) REFERENCES acc_menu_nodos(id_menu_nodo),
        CONSTRAINT fk_acc_menu_asig_hijo FOREIGN KEY (id_menu_hijo) REFERENCES acc_menu_nodos(id_menu_nodo),
        CONSTRAINT uq_acc_menu_asig_rel UNIQUE (id_menu_padre, id_menu_hijo),
        CONSTRAINT chk_acc_menu_asig_activo CHECK (activo IN ('S','N'))
      )
    ]';
  END IF;
END;
--@@
DECLARE
  v_count NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM user_tables WHERE table_name = 'ACC_POLICY_MENU_RAICES';
  IF v_count = 0 THEN
    EXECUTE IMMEDIATE q'[
      CREATE TABLE acc_policy_menu_raices (
        id_policy_menu_raiz NUMBER NOT NULL,
        id_policy NUMBER NOT NULL,
        id_menu_nodo NUMBER NOT NULL,
        activo VARCHAR2(1) DEFAULT 'S' NOT NULL,
        fecha_creacion DATE DEFAULT SYSDATE,
        creado_por VARCHAR2(100) DEFAULT USER,
        CONSTRAINT pk_acc_policy_menu_raices PRIMARY KEY (id_policy_menu_raiz),
        CONSTRAINT fk_acc_pol_menu_policy FOREIGN KEY (id_policy) REFERENCES acc_nodos(id_nodo),
        CONSTRAINT fk_acc_pol_menu_raiz FOREIGN KEY (id_menu_nodo) REFERENCES acc_menu_nodos(id_menu_nodo),
        CONSTRAINT uq_acc_pol_menu_rel UNIQUE (id_policy, id_menu_nodo),
        CONSTRAINT chk_acc_pol_menu_activo CHECK (activo IN ('S','N'))
      )
    ]';
  END IF;
END;
--@@
DECLARE
  v_count NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM user_sequences WHERE sequence_name = 'ACC_MENU_NODOS_SEQ';
  IF v_count = 0 THEN
    EXECUTE IMMEDIATE 'CREATE SEQUENCE acc_menu_nodos_seq START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9999999999999999999999999999';
  END IF;
END;
--@@
DECLARE
  v_count NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM user_sequences WHERE sequence_name = 'ACC_MENU_ASIGNACIONES_SEQ';
  IF v_count = 0 THEN
    EXECUTE IMMEDIATE 'CREATE SEQUENCE acc_menu_asignaciones_seq START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9999999999999999999999999999';
  END IF;
END;
--@@
DECLARE
  v_count NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM user_sequences WHERE sequence_name = 'ACC_POLICY_MENU_RAICES_SEQ';
  IF v_count = 0 THEN
    EXECUTE IMMEDIATE 'CREATE SEQUENCE acc_policy_menu_raices_seq START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9999999999999999999999999999';
  END IF;
END;
--@@
DECLARE
  v_count NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM user_indexes WHERE index_name = 'IDX_ACC_MENU_NODOS_NODO';
  IF v_count = 0 THEN
    EXECUTE IMMEDIATE 'CREATE INDEX idx_acc_menu_nodos_nodo ON acc_menu_nodos(id_nodo)';
  END IF;
END;
--@@
DECLARE
  v_count NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM user_indexes WHERE index_name = 'IDX_ACC_MENU_ASIG_PADRE';
  IF v_count = 0 THEN
    EXECUTE IMMEDIATE 'CREATE INDEX idx_acc_menu_asig_padre ON acc_menu_asignaciones(id_menu_padre)';
  END IF;
END;
--@@
DECLARE
  v_count NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM user_indexes WHERE index_name = 'IDX_ACC_MENU_ASIG_HIJO';
  IF v_count = 0 THEN
    EXECUTE IMMEDIATE 'CREATE INDEX idx_acc_menu_asig_hijo ON acc_menu_asignaciones(id_menu_hijo)';
  END IF;
END;
--@@
DECLARE
  v_count NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM user_indexes WHERE index_name = 'IDX_ACC_POL_MENU_POLICY';
  IF v_count = 0 THEN
    EXECUTE IMMEDIATE 'CREATE INDEX idx_acc_pol_menu_policy ON acc_policy_menu_raices(id_policy)';
  END IF;
END;
--@@
DECLARE
  v_count NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM user_indexes WHERE index_name = 'IDX_ACC_POL_MENU_RAIZ';
  IF v_count = 0 THEN
    EXECUTE IMMEDIATE 'CREATE INDEX idx_acc_pol_menu_raiz ON acc_policy_menu_raices(id_menu_nodo)';
  END IF;
END;
--@@
BEGIN
  EXECUTE IMMEDIATE q'[
    CREATE OR REPLACE TRIGGER trg_acc_menu_nodos_bi
    BEFORE INSERT ON acc_menu_nodos
    FOR EACH ROW
    WHEN (NEW.id_menu_nodo IS NULL)
    BEGIN
      :NEW.id_menu_nodo := acc_menu_nodos_seq.NEXTVAL;
    END;
  ]';
END;
--@@
BEGIN
  EXECUTE IMMEDIATE q'[
    CREATE OR REPLACE TRIGGER trg_acc_menu_asignaciones_bi
    BEFORE INSERT ON acc_menu_asignaciones
    FOR EACH ROW
    WHEN (NEW.id_menu_asignacion IS NULL)
    BEGIN
      :NEW.id_menu_asignacion := acc_menu_asignaciones_seq.NEXTVAL;
    END;
  ]';
END;
--@@
BEGIN
  EXECUTE IMMEDIATE q'[
    CREATE OR REPLACE TRIGGER trg_acc_policy_menu_raices_bi
    BEFORE INSERT ON acc_policy_menu_raices
    FOR EACH ROW
    WHEN (NEW.id_policy_menu_raiz IS NULL)
    BEGIN
      :NEW.id_policy_menu_raiz := acc_policy_menu_raices_seq.NEXTVAL;
    END;
  ]';
END;
--@@
BEGIN
  MERGE INTO acc_menu_nodos dst
  USING (
    SELECT n.id_nodo,
           NVL(n.orden_visual, 0) AS orden_visual,
           n.activo,
           NVL(n.fecha_creacion, SYSDATE) AS fecha_creacion,
           NVL(n.creado_por, USER) AS creado_por
      FROM acc_nodos n
      JOIN acc_tipos_nodo t
        ON t.id_tipo_nodo = n.id_tipo_nodo
     WHERE n.activo = 'S'
       AND t.codigo_tipo IN ('OBJETO', 'OBJ_ATTR')
  ) src
     ON (dst.id_menu_nodo = src.id_nodo)
   WHEN MATCHED THEN
     UPDATE SET dst.id_nodo = src.id_nodo,
                dst.orden_visual = src.orden_visual,
                dst.activo = src.activo
   WHEN NOT MATCHED THEN
     INSERT (
       id_menu_nodo,
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
       src.id_nodo,
       NULL,
       NULL,
       NULL,
       NULL,
       NULL,
       src.orden_visual,
       src.activo,
       src.fecha_creacion,
       src.creado_por
     );
END;
--@@
BEGIN
  MERGE INTO acc_menu_asignaciones dst
  USING (
    SELECT a.id_asignacion AS id_menu_asignacion,
           pm.id_menu_nodo AS id_menu_padre,
           hm.id_menu_nodo AS id_menu_hijo,
           SYSDATE AS fecha_creacion,
           USER AS creado_por
      FROM acc_asignaciones a
      JOIN acc_menu_nodos pm
        ON pm.id_nodo = a.id_padre
      JOIN acc_menu_nodos hm
        ON hm.id_nodo = a.id_hijo
  ) src
     ON (dst.id_menu_padre = src.id_menu_padre AND dst.id_menu_hijo = src.id_menu_hijo)
   WHEN NOT MATCHED THEN
     INSERT (
       id_menu_asignacion,
       id_menu_padre,
       id_menu_hijo,
       activo,
       fecha_creacion,
       creado_por
     )
     VALUES (
       src.id_menu_asignacion,
       src.id_menu_padre,
       src.id_menu_hijo,
       'S',
       src.fecha_creacion,
       src.creado_por
     );
END;
--@@
BEGIN
  MERGE INTO acc_policy_menu_raices dst
  USING (
    SELECT p.id_nodo AS id_policy,
           mn.id_menu_nodo,
           SYSDATE AS fecha_creacion,
           USER AS creado_por
      FROM acc_asignaciones a
      JOIN acc_nodos p
        ON p.id_nodo = a.id_padre
      JOIN acc_tipos_nodo pt
        ON pt.id_tipo_nodo = p.id_tipo_nodo
      JOIN acc_menu_nodos mn
        ON mn.id_nodo = a.id_hijo
     WHERE p.activo = 'S'
       AND pt.codigo_tipo = 'POLICY'
  ) src
     ON (dst.id_policy = src.id_policy AND dst.id_menu_nodo = src.id_menu_nodo)
   WHEN NOT MATCHED THEN
     INSERT (
       id_policy_menu_raiz,
       id_policy,
       id_menu_nodo,
       activo,
       fecha_creacion,
       creado_por
     )
     VALUES (
       acc_policy_menu_raices_seq.NEXTVAL,
       src.id_policy,
       src.id_menu_nodo,
       'S',
       src.fecha_creacion,
       src.creado_por
     );
END;
--@@
DECLARE
  v_next NUMBER;
  v_target NUMBER;
BEGIN
  SELECT NVL(MAX(id_menu_nodo), 0) + 1 INTO v_target FROM acc_menu_nodos;
  SELECT acc_menu_nodos_seq.NEXTVAL INTO v_next FROM dual;
  IF v_next < v_target THEN
    EXECUTE IMMEDIATE 'ALTER SEQUENCE acc_menu_nodos_seq INCREMENT BY ' || TO_CHAR(v_target - v_next);
    SELECT acc_menu_nodos_seq.NEXTVAL INTO v_next FROM dual;
    EXECUTE IMMEDIATE 'ALTER SEQUENCE acc_menu_nodos_seq INCREMENT BY 1';
  END IF;
END;
--@@
DECLARE
  v_next NUMBER;
  v_target NUMBER;
BEGIN
  SELECT NVL(MAX(id_menu_asignacion), 0) + 1 INTO v_target FROM acc_menu_asignaciones;
  SELECT acc_menu_asignaciones_seq.NEXTVAL INTO v_next FROM dual;
  IF v_next < v_target THEN
    EXECUTE IMMEDIATE 'ALTER SEQUENCE acc_menu_asignaciones_seq INCREMENT BY ' || TO_CHAR(v_target - v_next);
    SELECT acc_menu_asignaciones_seq.NEXTVAL INTO v_next FROM dual;
    EXECUTE IMMEDIATE 'ALTER SEQUENCE acc_menu_asignaciones_seq INCREMENT BY 1';
  END IF;
END;
--@@
DECLARE
  v_next NUMBER;
  v_target NUMBER;
BEGIN
  SELECT NVL(MAX(id_policy_menu_raiz), 0) + 1 INTO v_target FROM acc_policy_menu_raices;
  SELECT acc_policy_menu_raices_seq.NEXTVAL INTO v_next FROM dual;
  IF v_next < v_target THEN
    EXECUTE IMMEDIATE 'ALTER SEQUENCE acc_policy_menu_raices_seq INCREMENT BY ' || TO_CHAR(v_target - v_next);
    SELECT acc_policy_menu_raices_seq.NEXTVAL INTO v_next FROM dual;
    EXECUTE IMMEDIATE 'ALTER SEQUENCE acc_policy_menu_raices_seq INCREMENT BY 1';
  END IF;
END;
--@@
BEGIN
  MERGE INTO acc_menu_asignaciones dst
  USING (
    SELECT parent_mn.id_menu_nodo AS id_menu_padre,
           child_mn.id_menu_nodo AS id_menu_hijo
      FROM acc_menu_nodos parent_mn
      JOIN acc_nodos parent_n
        ON parent_n.id_nodo = parent_mn.id_nodo
      JOIN acc_menu_nodos child_mn
        ON 1 = 1
      JOIN acc_nodos child_n
        ON child_n.id_nodo = child_mn.id_nodo
     WHERE UPPER(parent_n.codigo_tecnico) = 'PRESUPUESTO_HOSP'
       AND UPPER(child_n.codigo_tecnico) IN (
         'PRESUPUESTO_PARAMETROS',
         'PRESUPUESTO_PROCESOS',
         'PRESUPUESTO_CONSULTAS',
         'PRESUPUESTO_INFORMES',
         'PRESUPUESTO_CIERRES'
       )
  ) src
     ON (dst.id_menu_padre = src.id_menu_padre AND dst.id_menu_hijo = src.id_menu_hijo)
   WHEN NOT MATCHED THEN
     INSERT (
       id_menu_asignacion,
       id_menu_padre,
       id_menu_hijo,
       activo,
       fecha_creacion,
       creado_por
     )
     VALUES (
       acc_menu_asignaciones_seq.NEXTVAL,
       src.id_menu_padre,
       src.id_menu_hijo,
       'S',
       SYSDATE,
       USER
     );
END;
--@@
COMMIT;