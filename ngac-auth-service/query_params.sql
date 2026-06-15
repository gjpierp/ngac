ALTER SESSION SET CURRENT_SCHEMA = NGAC_USER;

SET LINESIZE 200;
SET PAGESIZE 100;
COLUMN codigo_tecnico FORMAT A60;
COLUMN etiqueta FORMAT A60;

SELECT n.id_nodo, n.codigo_tecnico, n.etiqueta 
FROM acc_nodos n 
WHERE n.codigo_tecnico LIKE '%PARAMETROS%';

EXIT;
