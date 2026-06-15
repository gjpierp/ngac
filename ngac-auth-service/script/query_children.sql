ALTER SESSION SET CURRENT_SCHEMA = NGAC_USER;
SET LINESIZE 200;
SELECT h.id_nodo, h.codigo_tecnico, h.etiqueta 
FROM acc_asignaciones a
JOIN acc_nodos h ON a.id_hijo = h.id_nodo
WHERE a.id_padre = 1774;
EXIT;
