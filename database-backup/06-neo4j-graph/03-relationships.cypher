// ==========================================
// NEO4J RELATIONSHIPS
// ==========================================

MATCH (polAdmin:NgacNode {codigo_tecnico: 'POL_ADMIN'})
MATCH (uaAdmin:NgacNode {codigo_tecnico: 'UA_ADMIN_GLOBAL'})
MATCH (oaAdmin:NgacNode {codigo_tecnico: 'OA_ADMIN'})
MATCH (modSafiNode:NgacNode {codigo_tecnico: 'MOD_SAFI'})
MERGE (polAdmin)-[:CONTAINS]->(uaAdmin)
MERGE (polAdmin)-[:CONTAINS]->(oaAdmin)
MERGE (polAdmin)-[:CONTAINS]->(modSafiNode);

MATCH (uaAdmin:NgacNode {codigo_tecnico: 'UA_ADMIN_GLOBAL'})
MATCH (usrAdmin:NgacNode {codigo_tecnico: 'USR_ADMIN_ROOT'})
MERGE (usrAdmin)-[:ASIGNADO_A]->(uaAdmin);

MATCH (oaAdmin:NgacNode {codigo_tecnico: 'OA_ADMIN'})
MATCH (objNodos:NgacNode {codigo_tecnico: 'OBJ_NODOS'})
MATCH (objPermisos:NgacNode {codigo_tecnico: 'OBJ_PERMISOS'})
MERGE (objNodos)-[:ASIGNADO_A]->(oaAdmin)
MERGE (objPermisos)-[:ASIGNADO_A]->(oaAdmin);

MATCH (modSafiNode:NgacNode {codigo_tecnico: 'MOD_SAFI'})
MATCH (objSafiUsuarios:NgacNode {codigo_tecnico: 'OBJ_SAFI_USUARIOS'})
MERGE (objSafiUsuarios)-[:ASIGNADO_A]->(modSafiNode);

MATCH (uaAdmin:NgacNode {codigo_tecnico: 'UA_ADMIN_GLOBAL'})
MATCH (oaAdmin:NgacNode {codigo_tecnico: 'OA_ADMIN'})
MATCH (modSafiNode:NgacNode {codigo_tecnico: 'MOD_SAFI'})
MATCH (ver:Operation {nombre_op: 'VER'})
MATCH (editar:Operation {nombre_op: 'EDITAR'})
MERGE (uaAdmin)-[:PERMITE {condicion_json: null}]->(oaAdmin)
MERGE (uaAdmin)-[:PERMITE {condicion_json: '{"scope":"global"}'}]->(modSafiNode)
MERGE (uaAdmin)-[:EJECUTA]->(ver)
MERGE (uaAdmin)-[:EJECUTA]->(editar)
MERGE (oaAdmin)-[:ADMITE]->(ver)
MERGE (oaAdmin)-[:ADMITE]->(editar)
MERGE (modSafiNode)-[:ADMITE]->(ver);

MATCH (uaAdmin:NgacNode {codigo_tecnico: 'UA_ADMIN_GLOBAL'})
MATCH (objSafiUsuarios:NgacNode {codigo_tecnico: 'OBJ_SAFI_USUARIOS'})
MATCH (eliminar:Operation {nombre_op: 'ELIMINAR'})
MERGE (uaAdmin)-[:PROHIBE {nombre_op: 'ELIMINAR'}]->(objSafiUsuarios)
MERGE (objSafiUsuarios)-[:ADMITE]->(eliminar);

MATCH (modSafi:SafiModule {codigo: 'MOD_SAFI'})
MATCH (modSafiNode:NgacNode {codigo_tecnico: 'MOD_SAFI'})
MERGE (modSafi)-[:EXPONE_NODO]->(modSafiNode);

MATCH (modAdmin:SafiModule {codigo: 'MOD_ADMIN'})
MATCH (objNodos:NgacNode {codigo_tecnico: 'OBJ_NODOS'})
MATCH (objPermisos:NgacNode {codigo_tecnico: 'OBJ_PERMISOS'})
MERGE (modAdmin)-[:EXPONE_NODO]->(objNodos)
MERGE (modAdmin)-[:EXPONE_NODO]->(objPermisos);

MATCH (menuSafi:MenuNode {codigo_menu: 'MENU_SAFI'})
MATCH (menuUsuarios:MenuNode {codigo_menu: 'MENU_SAFI_USUARIOS'})
MATCH (modSafiNode:NgacNode {codigo_tecnico: 'MOD_SAFI'})
MATCH (objSafiUsuarios:NgacNode {codigo_tecnico: 'OBJ_SAFI_USUARIOS'})
MERGE (menuUsuarios)-[:CHILD_OF]->(menuSafi)
MERGE (menuSafi)-[:REPRESENTA]->(modSafiNode)
MERGE (menuUsuarios)-[:REPRESENTA]->(objSafiUsuarios);

MATCH (adminUser:SafiUser {slug_usuario: 'admin-sys-root-safi'})
MATCH (usrAdmin:NgacNode {codigo_tecnico: 'USR_ADMIN_ROOT'})
MATCH (central:SafiEntity {codigo: 'ENT_CENTRAL'})
MATCH (regional:SafiEntity {codigo: 'ENT_REGIONAL'})
MATCH (uniFin:SafiUnit {codigo: 'UNI_FIN'})
MATCH (uniOpe:SafiUnit {codigo: 'UNI_OPE'})
MERGE (adminUser)-[:REPRESENTADO_COMO]->(usrAdmin)
MERGE (adminUser)-[:PERTENECE_A]->(central)
MERGE (adminUser)-[:PERTENECE_A]->(regional)
MERGE (adminUser)-[:TRABAJA_EN]->(uniFin)
MERGE (adminUser)-[:TRABAJA_EN]->(uniOpe)
MERGE (uniFin)-[:PERTENECE_A]->(central)
MERGE (uniOpe)-[:PERTENECE_A]->(regional);