// ==========================================
// NEO4J QUERIES: SAFI
// ==========================================

// Usuarios SAFI con sus unidades y entidades.
MATCH (u:SafiUser)
OPTIONAL MATCH (u)-[:TRABAJA_EN]->(unidad:SafiUnit)
OPTIONAL MATCH (u)-[:PERTENECE_A]->(entidad:SafiEntity)
RETURN u.id_usuario AS id_usuario,
       u.slug_usuario AS usuario,
       u.email AS email,
       collect(DISTINCT unidad.codigo) AS unidades,
       collect(DISTINCT entidad.codigo) AS entidades
ORDER BY u.id_usuario;

// Unidades agrupadas por entidad.
MATCH (unidad:SafiUnit)-[:PERTENECE_A]->(entidad:SafiEntity)
RETURN entidad.codigo AS entidad,
       collect(unidad.codigo) AS unidades
ORDER BY entidad;

// Menu accesible para un usuario SAFI a partir de su nodo NGAC.
WITH 'admin-sys-root-safi' AS slugUsuario
MATCH (u:SafiUser {slug_usuario: slugUsuario})-[:REPRESENTADO_COMO]->(usr:UserNode)
MATCH (usr)-[:ASIGNADO_A]->(ua:UserAttribute)
MATCH (menu:MenuNode)-[:REPRESENTA]->(obj:NgacNode)
MATCH (ua)-[:PERMITE|CONTAINS*0..]->(obj)
WHERE NOT EXISTS {
MATCH (ua)-[:PROHIBE {nombre_op: 'VER'}]->(obj)
}
RETURN DISTINCT menu.etiqueta_visible AS menu,
                menu.url_ruta_visible AS ruta,
                menu.orden_visual AS orden
ORDER BY orden, menu;