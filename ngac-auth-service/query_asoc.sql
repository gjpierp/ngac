ALTER SESSION SET CURRENT_SCHEMA = NGAC_USER;

SELECT op.nombre_op, no.codigo_tecnico 
FROM acc_asociaciones a 
JOIN acc_nodos nu ON a.id_usr_attr = nu.id_nodo 
JOIN acc_nodos no ON a.id_obj_attr = no.id_nodo 
JOIN acc_operaciones op ON a.id_op = op.id_op 
WHERE nu.codigo_tecnico = 'ROL_JEFE_CONT';

SELECT op.nombre_op, no.codigo_tecnico 
FROM acc_asociaciones a 
JOIN acc_nodos nu ON a.id_usr_attr = nu.id_nodo 
JOIN acc_nodos no ON a.id_obj_attr = no.id_nodo 
JOIN acc_operaciones op ON a.id_op = op.id_op 
WHERE nu.codigo_tecnico = 'POLITICA_HOSP' OR nu.codigo_tecnico = 'POLITICA_HOSPITAL';

EXIT;
