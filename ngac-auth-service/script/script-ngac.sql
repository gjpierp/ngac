/* =========================================================================
    SCRIPT DE ELIMINACIÓN DE OBJETOS - MODELO NGAC/ABAC
    ========================================================================= */

-- 1. ELIMINACIÓN DE PAQUETES (Lógica de negocio)
DROP PACKAGE pkg_seguridad_ngac;
DROP PACKAGE pkg_seguridad_admin;

-- 2. ELIMINACIÓN DE TABLAS (Orden inverso por FKs)
DROP TABLE acc_prohibiciones CASCADE CONSTRAINTS;
DROP TABLE acc_asociaciones CASCADE CONSTRAINTS;
DROP TABLE acc_asignaciones CASCADE CONSTRAINTS;
DROP TABLE acc_nodos CASCADE CONSTRAINTS;
DROP TABLE acc_tipos_nodo CASCADE CONSTRAINTS;
DROP TABLE acc_operaciones CASCADE CONSTRAINTS;
DROP TABLE acc_log_errores CASCADE CONSTRAINTS;

-- 3. ELIMINACIÓN DE SECUENCIAS
DROP SEQUENCE acc_operaciones_seq;
DROP SEQUENCE acc_nodos_seq;
DROP SEQUENCE acc_asignaciones_seq;
DROP SEQUENCE acc_asociaciones_seq;
DROP SEQUENCE acc_prohibiciones_seq;
DROP SEQUENCE acc_tipos_nodo_seq;
DROP SEQUENCE acc_log_errores_seq;

-- 4. LIMPIEZA DE BUFFER (Opcional)
PURGE RECYCLEBIN;

COMMIT;

/* =========================================================================
    SCRIPT DE CREACIÓN DE OBJETOS - MODELO NGAC/ABAC
    ========================================================================= */

-- 1. SECUENCIAS
CREATE SEQUENCE acc_operaciones_seq START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE acc_nodos_seq       START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE acc_asignaciones_seq  START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE acc_asociaciones_seq  START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE acc_prohibiciones_seq START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE acc_tipos_nodo_seq START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE acc_log_errores_seq START WITH 1 INCREMENT BY 1 NOCACHE;

-- 2. TABLAS MAESTRAS
CREATE TABLE acc_operaciones (
    id_op        NUMBER NOT NULL,
    nombre_op    VARCHAR2(100) NOT NULL,
    descripcion  VARCHAR2(255),
    CONSTRAINT pk_acc_operaciones PRIMARY KEY (id_op),
    CONSTRAINT uq_acc_operaciones_nom UNIQUE (nombre_op)
);

-- Tabla Maestra de Tipos de Nodo (U, UA, O, OA, PC)
CREATE TABLE acc_tipos_nodo (
    id_tipo_nodo NUMBER NOT NULL,
    codigo_tipo  VARCHAR2(50) NOT NULL,
    descripcion  VARCHAR2(255),
    CONSTRAINT pk_acc_tipos_nodo PRIMARY KEY (id_tipo_nodo),
    CONSTRAINT uq_acc_tipos_codigo UNIQUE (codigo_tipo)
);

-- Grafo de Nodos (Usuarios, Atributos y Objetos)
CREATE TABLE acc_nodos (
    id_nodo        NUMBER NOT NULL,
    id_tipo_nodo   NUMBER NOT NULL, -- FK a acc_tipos_nodo[cite: 3]
    codigo_tecnico VARCHAR2(255) NOT NULL, 
    etiqueta       VARCHAR2(500) NOT NULL, 
    url_ruta       VARCHAR2(1000),         
    slug           VARCHAR2(500),
    icono          VARCHAR2(100),
    descripcion    VARCHAR2(1000),         
    orden_visual   NUMBER DEFAULT 0,
    activo         VARCHAR2(1) DEFAULT 'S' NOT NULL,
    fecha_creacion DATE DEFAULT SYSDATE,
    creado_por     VARCHAR2(100) DEFAULT USER,
    CONSTRAINT pk_acc_nodos PRIMARY KEY (id_nodo),
    CONSTRAINT uq_acc_nodos_cod UNIQUE (codigo_tecnico),
    CONSTRAINT chk_acc_nodos_activo CHECK (activo IN ('S', 'N')),
    CONSTRAINT fk_nodo_tipo FOREIGN KEY (id_tipo_nodo) REFERENCES acc_tipos_nodo(id_tipo_nodo)
);

-- 3. RELACIONES Y POLÍTICAS

-- Jerarquía del Grafo (Relaciones Padre-Hijo)
CREATE TABLE acc_asignaciones (
    id_asignacion NUMBER NOT NULL,
    id_padre      NUMBER NOT NULL,
    id_hijo       NUMBER NOT NULL,
    CONSTRAINT pk_acc_asignaciones PRIMARY KEY (id_asignacion),
    CONSTRAINT uq_acc_asign_rel UNIQUE (id_padre, id_hijo),
    CONSTRAINT fk_asig_padre FOREIGN KEY (id_padre) REFERENCES acc_nodos(id_nodo) ON DELETE CASCADE,
    CONSTRAINT fk_asig_hijo  FOREIGN KEY (id_hijo)  REFERENCES acc_nodos(id_nodo) ON DELETE CASCADE
);

-- Políticas de Acceso Permitido (Allow) + ABAC
CREATE TABLE acc_asociaciones (
    id_asociacion   NUMBER NOT NULL,
    id_usr_attr     NUMBER NOT NULL,
    id_obj_attr     NUMBER NOT NULL,
    id_op           NUMBER NOT NULL,
    condicion_json  VARCHAR2(2000),  -- Columna para reglas ABAC dinámicas[cite: 1]
    fecha_registro  DATE DEFAULT SYSDATE,
    creado_por      VARCHAR2(100) DEFAULT USER,
    CONSTRAINT pk_acc_asociaciones PRIMARY KEY (id_asociacion),
    CONSTRAINT uq_acc_asoc_rel UNIQUE (id_usr_attr, id_obj_attr, id_op),
    CONSTRAINT fk_asoc_usr FOREIGN KEY (id_usr_attr) REFERENCES acc_nodos(id_nodo),
    CONSTRAINT fk_asoc_obj FOREIGN KEY (id_obj_attr) REFERENCES acc_nodos(id_nodo),
    CONSTRAINT fk_asoc_op  FOREIGN KEY (id_op)       REFERENCES acc_operaciones(id_op)
);

-- Políticas de Acceso Denegado (Deny)
CREATE TABLE acc_prohibiciones (
    id_prohibicion  NUMBER NOT NULL,
    id_usr_attr     NUMBER NOT NULL,
    id_obj_attr     NUMBER NOT NULL,
    id_op           NUMBER NOT NULL,
    fecha_registro  DATE DEFAULT SYSDATE,
    creado_por      VARCHAR2(100) DEFAULT USER,
    CONSTRAINT pk_acc_prohibiciones PRIMARY KEY (id_prohibicion),
    CONSTRAINT uq_acc_proh_rel UNIQUE (id_usr_attr, id_obj_attr, id_op),
    CONSTRAINT fk_proh_usr FOREIGN KEY (id_usr_attr) REFERENCES acc_nodos(id_nodo),
    CONSTRAINT fk_proh_obj FOREIGN KEY (id_obj_attr) REFERENCES acc_nodos(id_nodo),
    CONSTRAINT fk_proh_op  FOREIGN KEY (id_op)       REFERENCES acc_operaciones(id_op)
);

-- Tabla de log de errores con PK
CREATE TABLE acc_log_errores (
    id_log      NUMBER NOT NULL PRIMARY KEY,
    fecha       DATE DEFAULT SYSDATE NOT NULL,
    modulo      VARCHAR2(100) NOT NULL,
    mensaje     VARCHAR2(4000) NOT NULL
);

-- 4. ÍNDICES DE RENDIMIENTO (Críticos para el motor NGAC)
CREATE INDEX idx_asig_hijo ON acc_asignaciones(id_hijo, id_padre);
-- CREATE INDEX idx_asoc_lookup ON acc_asociaciones(id_usr_attr, id_obj_attr, id_op);
-- CREATE INDEX idx_proh_lookup ON acc_prohibiciones(id_usr_attr, id_obj_attr, id_op);
CREATE INDEX idx_nodos_tipo ON acc_nodos(id_tipo_nodo, activo);
CREATE INDEX idx_log_errores_fecha ON acc_log_errores(fecha);
CREATE INDEX idx_log_errores_modulo ON acc_log_errores(modulo);
CREATE INDEX idx_log_errores_fecha_modulo ON acc_log_errores(fecha, modulo);

-- 5. TRIGGERS DE AUTOINCREMENTO
CREATE OR REPLACE TRIGGER trg_acc_operaciones_bi
BEFORE INSERT ON acc_operaciones
FOR EACH ROW WHEN (NEW.id_op IS NULL)
BEGIN
    :NEW.id_op := acc_operaciones_seq.NEXTVAL;
END;
/

CREATE OR REPLACE TRIGGER trg_acc_tipos_nodo_bi
BEFORE INSERT ON acc_tipos_nodo
FOR EACH ROW WHEN (NEW.id_tipo_nodo IS NULL)
BEGIN
    :NEW.id_tipo_nodo := acc_tipos_nodo_seq.NEXTVAL;
END;
/

CREATE OR REPLACE TRIGGER trg_acc_nodos_bi
BEFORE INSERT ON acc_nodos
FOR EACH ROW
WHEN (NEW.id_nodo IS NULL)
BEGIN
    :NEW.id_nodo := acc_nodos_seq.NEXTVAL;
END;
/

CREATE OR REPLACE TRIGGER trg_acc_asignaciones_bi
BEFORE INSERT ON acc_asignaciones
FOR EACH ROW
WHEN (NEW.id_asignacion IS NULL)
BEGIN
    :NEW.id_asignacion := acc_asignaciones_seq.NEXTVAL;
END;
/

CREATE OR REPLACE TRIGGER trg_acc_asociaciones_bi
BEFORE INSERT ON acc_asociaciones
FOR EACH ROW
WHEN (NEW.id_asociacion IS NULL)
BEGIN
    :NEW.id_asociacion := acc_asociaciones_seq.NEXTVAL;
END;
/

CREATE OR REPLACE TRIGGER trg_acc_prohibiciones_bi
BEFORE INSERT ON acc_prohibiciones
FOR EACH ROW
WHEN (NEW.id_prohibicion IS NULL)
BEGIN 
    :NEW.id_prohibicion := acc_prohibiciones_seq.NEXTVAL;
END;
/

CREATE OR REPLACE TRIGGER trg_acc_log_errores_bi
BEFORE INSERT ON acc_log_errores
FOR EACH ROW
WHEN (NEW.id_log IS NULL)
BEGIN
    :NEW.id_log := acc_log_errores_seq.NEXTVAL;
END;
/