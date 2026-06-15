ALTER SESSION SET CURRENT_SCHEMA = NGAC_USER;

SET LINESIZE 200;
SET PAGESIZE 100;
COLUMN rol FORMAT A20;
COLUMN obj FORMAT A30;
COLUMN nombre_op FORMAT A15;

SELECT op.nombre_op, no.codigo_tecnico 
FROM acc_asociaciones a 
JOIN acc_nodos nu ON a.id_usr_attr = nu.id_nodo 
JOIN acc_nodos no ON a.id_obj_attr = no.id_nodo 
JOIN acc_operaciones op ON a.id_op = op.id_op 
WHERE nu.codigo_tecnico = 'ROL_JEFE_CONT' 
AND (no.codigo_tecnico IN ('DASHBOARD', 'NODOS', 'TIPOS_NODOS', 'JERARQUIAS', 'ROLES_PERMISOS', 'OPERACIONES', 'USUARIOS', 'HOMOLOGACION_ROLES', 'ROLES', 'UNIDADES', 'ENTIDADES', 'CLONACION'));

EXIT;
