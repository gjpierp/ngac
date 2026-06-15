// ==========================================
// NEO4J CONSTRAINTS & INDEXES
// ==========================================

CREATE CONSTRAINT ngac_node_id IF NOT EXISTS
FOR (n:NgacNode)
REQUIRE n.id_nodo IS UNIQUE;

CREATE CONSTRAINT ngac_node_code IF NOT EXISTS
FOR (n:NgacNode)
REQUIRE n.codigo_tecnico IS UNIQUE;

CREATE CONSTRAINT menu_node_id IF NOT EXISTS
FOR (m:MenuNode)
REQUIRE m.id_menu_nodo IS UNIQUE;

CREATE CONSTRAINT safi_user_id IF NOT EXISTS
FOR (u:SafiUser)
REQUIRE u.id_usuario IS UNIQUE;

CREATE CONSTRAINT safi_entity_id IF NOT EXISTS
FOR (e:SafiEntity)
REQUIRE e.id_entidad IS UNIQUE;

CREATE CONSTRAINT safi_unit_id IF NOT EXISTS
FOR (u:SafiUnit)
REQUIRE u.id_unidad IS UNIQUE;

CREATE CONSTRAINT safi_module_id IF NOT EXISTS
FOR (m:SafiModule)
REQUIRE m.id_modulo IS UNIQUE;

CREATE CONSTRAINT operation_name IF NOT EXISTS
FOR (o:Operation)
REQUIRE o.nombre_op IS UNIQUE;

CREATE INDEX ngac_node_tipo IF NOT EXISTS
FOR (n:NgacNode)
ON (n.tipo_codigo);

CREATE INDEX ngac_node_activo IF NOT EXISTS
FOR (n:NgacNode)
ON (n.activo);

CREATE INDEX menu_node_activo IF NOT EXISTS
FOR (m:MenuNode)
ON (m.activo);