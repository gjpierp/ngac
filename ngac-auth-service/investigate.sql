ALTER SESSION SET CURRENT_SCHEMA = NGAC_USER;

SET LINESIZE 200;
SET PAGESIZE 100;
COLUMN rol FORMAT A20;
COLUMN obj FORMAT A30;
COLUMN etiqueta FORMAT A40;
COLUMN nombre_op FORMAT A15;
COLUMN padre FORMAT A25;
COLUMN hijo FORMAT A25;

SELECT id_nodo, codigo_tecnico, etiqueta, tipo_nodo 
FROM acc_nodos 
WHERE codigo_tecnico LIKE '%ADMIN%' OR etiqueta LIKE '%Administraci%';

PROMPT === Permisos de ROL_JEFE_CONT ===
SELECT nu.codigo_tecnico as rol, 
       no.codigo_tecnico as obj, 
       no.etiqueta,
       op.nombre_op
FROM acc_asociaciones a
JOIN acc_nodos nu ON a.id_usr_attr = nu.id_nodo
JOIN acc_nodos no ON a.id_obj_attr = no.id_nodo
JOIN acc_operaciones op ON a.id_op = op.id_op
WHERE nu.codigo_tecnico = 'ROL_JEFE_CONT';

PROMPT === Enlaces de POLITICA_HOSP ===
SELECT p.codigo_tecnico as padre, h.codigo_tecnico as hijo
FROM acc_asignaciones a
JOIN acc_nodos p ON a.id_padre = p.id_nodo
JOIN acc_nodos h ON a.id_hijo = h.id_nodo
WHERE p.codigo_tecnico = 'POLITICA_HOSP' OR h.codigo_tecnico = 'POLITICA_HOSP';

PROMPT === Enlaces de ROL_JEFE_CONT ===
SELECT p.codigo_tecnico as padre, h.codigo_tecnico as hijo
FROM acc_asignaciones a
JOIN acc_nodos p ON a.id_padre = p.id_nodo
JOIN acc_nodos h ON a.id_hijo = h.id_nodo
WHERE p.codigo_tecnico = 'ROL_JEFE_CONT' OR h.codigo_tecnico = 'ROL_JEFE_CONT';

EXIT;
