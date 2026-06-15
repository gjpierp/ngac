// ==========================================
// MONGODB INDEXES
// ==========================================

db = db.getSiblingDB('safi_ngac');

// 1. Indexes for: nodos
db.nodos.createIndex({ id_nodo: 1 }, { unique: true });
db.nodos.createIndex({ codigo_tecnico: 1 }, { unique: true });
db.nodos.createIndex({ "tipo_nodo.codigo_tipo": 1 });
db.nodos.createIndex({ parents: 1 });
db.nodos.createIndex({ children: 1 });
db.nodos.createIndex({ activo: 1 });

// 2. Indexes for: asociaciones (Unique compound index)
db.asociaciones.createIndex({ id_usr_attr: 1, id_obj_attr: 1, operacion: 1 }, { unique: true });
db.asociaciones.createIndex({ activo: 1 });

// 3. Indexes for: prohibiciones (Unique compound index)
db.prohibiciones.createIndex({ id_usr_attr: 1, id_obj_attr: 1, operacion: 1 }, { unique: true });

// 4. Indexes for: menu_nodos
db.menu_nodos.createIndex({ id_menu_nodo: 1 }, { unique: true });
db.menu_nodos.createIndex({ id_nodo: 1 }, { unique: true });
db.menu_nodos.createIndex({ parents: 1 });
db.menu_nodos.createIndex({ children: 1 });

// 5. Indexes for: usuarios_safi
db.usuarios_safi.createIndex({ id_usuario: 1 }, { unique: true });
db.usuarios_safi.createIndex({ slug_usuario: 1 }, { unique: true });
db.usuarios_safi.createIndex({ rut: 1 }, { unique: true });
db.usuarios_safi.createIndex({ unidades: 1 });
db.usuarios_safi.createIndex({ entidades: 1 });

// 6. Indexes for: logs_auditoria
db.logs_auditoria.createIndex({ tipo: 1, fecha: -1 });
db.logs_auditoria.createIndex({ usuario: 1 });
db.logs_auditoria.createIndex({ objeto: 1 });
