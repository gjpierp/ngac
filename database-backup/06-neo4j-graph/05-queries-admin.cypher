// ==========================================
// NEO4J QUERIES: ADMIN
// ==========================================

// Dashboard resumido para administracion.
MATCH (n:NgacNode)
WITH count(n) AS totalNodos
MATCH ()-[r:ASIGNADO_A]->()
WITH totalNodos, count(r) AS totalAsignaciones
MATCH ()-[p:PERMITE]->()
WITH totalNodos, totalAsignaciones, count(p) AS totalPermisos
MATCH ()-[d:PROHIBE]->()
RETURN totalNodos,
       totalAsignaciones,
       totalPermisos,
       count(d) AS totalProhibiciones;

// Lista de nodos activos con su tipo y modulo asociado.
MATCH (n:NgacNode {activo: 'S'})
OPTIONAL MATCH (m:SafiModule)-[:EXPONE_NODO]->(n)
RETURN n.id_nodo AS id,
       n.codigo_tecnico AS codigo,
       n.etiqueta AS etiqueta,
       n.tipo_codigo AS tipo,
       m.codigo AS modulo
ORDER BY n.tipo_codigo, n.codigo_tecnico;

// Relaciones padre-hijo del grafo NGAC.
MATCH (parent:NgacNode)-[:CONTAINS]->(child:NgacNode)
RETURN parent.codigo_tecnico AS padre,
       child.codigo_tecnico AS hijo,
       child.tipo_codigo AS tipo_hijo
ORDER BY padre, hijo;

// Matriz simple de permisos por atributo de usuario y objeto.
MATCH (ua:UserAttribute)-[:PERMITE]->(oa)
OPTIONAL MATCH (ua)-[:EJECUTA]->(op:Operation)<-[:ADMITE]-(oa)
RETURN ua.codigo_tecnico AS atributo_usuario,
       oa.codigo_tecnico AS atributo_objeto,
       collect(DISTINCT op.nombre_op) AS operaciones
ORDER BY atributo_usuario, atributo_objeto;