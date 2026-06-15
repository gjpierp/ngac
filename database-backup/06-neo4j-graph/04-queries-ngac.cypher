// ==========================================
// NEO4J QUERIES: NGAC SECURITY
// ==========================================

// Verifica si un usuario tiene acceso a un objeto para una operacion dada.
WITH 'USR_ADMIN_ROOT' AS userCode, 'OBJ_NODOS' AS objectCode, 'VER' AS operationName
MATCH (usr:UserNode {codigo_tecnico: userCode})-[:ASIGNADO_A]->(ua:UserAttribute)
MATCH (obj:ObjectNode {codigo_tecnico: objectCode})-[:ASIGNADO_A*0..]->(oa:ObjectAttribute)
MATCH (ua)-[:EJECUTA]->(:Operation {nombre_op: operationName})
MATCH (oa)-[:ADMITE]->(:Operation {nombre_op: operationName})
MATCH path = (ua)-[:PERMITE|CONTAINS*0..]->(oa)
WHERE NOT EXISTS {
MATCH (ua)-[:PROHIBE {nombre_op: operationName}]->(obj)
}
RETURN usr.codigo_tecnico AS usuario,
       obj.codigo_tecnico AS objeto,
       operationName AS operacion,
       CASE WHEN COUNT(path) > 0 THEN true ELSE false END AS autorizado;

// Obtiene los objetos autorizados para un usuario y operacion.
WITH 'USR_ADMIN_ROOT' AS userCode, 'VER' AS operationName
MATCH (usr:UserNode {codigo_tecnico: userCode})-[:ASIGNADO_A]->(ua:UserAttribute)
MATCH (ua)-[:EJECUTA]->(:Operation {nombre_op: operationName})
MATCH (ua)-[:PERMITE|CONTAINS*0..]->(oa:ObjectAttribute)
MATCH (obj:ObjectNode)-[:ASIGNADO_A*0..]->(oa)
WHERE NOT EXISTS {
MATCH (ua)-[:PROHIBE {nombre_op: operationName}]->(obj)
}
RETURN DISTINCT obj.codigo_tecnico AS codigo_objeto,
                obj.etiqueta AS etiqueta,
                obj.url_ruta AS ruta
ORDER BY obj.codigo_tecnico;

// Diagnostico de ancestros para un nodo.
WITH 'OBJ_SAFI_USUARIOS' AS nodeCode
MATCH (start:NgacNode {codigo_tecnico: nodeCode})
OPTIONAL MATCH path = (start)-[:ASIGNADO_A|CONTAINS*1..]->(ancestor:NgacNode)
RETURN start.codigo_tecnico AS nodo,
       collect(DISTINCT ancestor.codigo_tecnico) AS ancestros,
       max(length(path)) AS profundidad_maxima;