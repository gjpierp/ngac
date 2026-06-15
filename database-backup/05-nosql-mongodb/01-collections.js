// ==========================================
// MONGODB SCHEMA: COLLECTIONS & VALIDATION
// ==========================================

db = db.getSiblingDB('safi_ngac');

// 1. Collection: nodos (Representing ACC_NODOS + ACC_TIPOS_NODO + ACC_ASIGNACIONES in hybrid graph adjacency model)
db.createCollection('nodos', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['id_nodo', 'codigo_tecnico', 'etiqueta', 'tipo_nodo', 'activo'],
      properties: {
        id_nodo: { bsonType: 'long', description: 'Unique integer node ID' },
        codigo_tecnico: { bsonType: 'string', description: 'Unique technical code string' },
        etiqueta: { bsonType: 'string', description: 'Readable label of the node' },
        tipo_nodo: {
          bsonType: 'object',
          required: ['codigo_tipo'],
          properties: {
            codigo_tipo: { bsonType: 'string' },
            descripcion: { bsonType: 'string' }
          }
        },
        url_ruta: { bsonType: ['string', 'null'] },
        slug: { bsonType: ['string', 'null'] },
        icono: { bsonType: ['string', 'null'] },
        orden_visual: { bsonType: 'int' },
        activo: { enum: ['S', 'N'] },
        descripcion: { bsonType: ['string', 'null'] },
        fecha_creacion: { bsonType: 'date' },
        creado_por: { bsonType: 'string' },
        fecha_modificacion: { bsonType: ['date', 'null'] },
        modificado_por: { bsonType: ['string', 'null'] },
        fecha_eliminacion: { bsonType: ['date', 'null'] },
        eliminado_por: { bsonType: ['string', 'null'] },
        parents: {
          bsonType: 'array',
          items: { bsonType: 'long' },
          description: 'Adjacency list: parent node IDs'
        },
        children: {
          bsonType: 'array',
          items: { bsonType: 'long' },
          description: 'Adjacency list: child node IDs'
        }
      }
    }
  }
});

// 2. Collection: asociaciones (Representing ACC_ASOCIACIONES + ACC_OPERACIONES)
db.createCollection('asociaciones', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['id_usr_attr', 'id_obj_attr', 'operacion', 'activo'],
      properties: {
        id_usr_attr: { bsonType: 'long', description: 'Reference to id_nodo of user attribute' },
        id_obj_attr: { bsonType: 'long', description: 'Reference to id_nodo of object attribute' },
        operacion: { bsonType: 'string', description: 'Operation code (e.g. READ, WRITE)' },
        condicion_json: { bsonType: ['string', 'null'] },
        activo: { enum: ['S', 'N'] },
        fecha_creacion: { bsonType: 'date' },
        creado_por: { bsonType: 'string' },
        fecha_modificacion: { bsonType: ['date', 'null'] },
        modificado_por: { bsonType: ['string', 'null'] }
      }
    }
  }
});

// 3. Collection: prohibiciones (Representing ACC_PROHIBICIONES)
db.createCollection('prohibiciones', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['id_usr_attr', 'id_obj_attr', 'operacion', 'activo'],
      properties: {
        id_usr_attr: { bsonType: 'long' },
        id_obj_attr: { bsonType: 'long' },
        operacion: { bsonType: 'string' },
        activo: { enum: ['S', 'N'] },
        fecha_creacion: { bsonType: 'date' },
        creado_por: { bsonType: 'string' }
      }
    }
  }
});

// 4. Collection: menu_nodos (Representing ACC_MENU_NODOS + ACC_MENU_ASIGNACIONES)
db.createCollection('menu_nodos', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['id_menu_nodo', 'id_nodo', 'etiqueta_visible', 'activo'],
      properties: {
        id_menu_nodo: { bsonType: 'long' },
        id_nodo: { bsonType: 'long' },
        etiqueta_visible: { bsonType: 'string' },
        url_ruta_visible: { bsonType: ['string', 'null'] },
        slug_visible: { bsonType: ['string', 'null'] },
        icono_visible: { bsonType: ['string', 'null'] },
        descripcion_visible: { bsonType: ['string', 'null'] },
        orden_visual: { bsonType: 'int' },
        activo: { enum: ['S', 'N'] },
        parents: { bsonType: 'array', items: { bsonType: 'long' } },
        children: { bsonType: 'array', items: { bsonType: 'long' } }
      }
    }
  }
});

// 5. Collection: usuarios_safi (Representing SAFI_USUARIOS + SAFI_USUARIOS_UNIDADES + SAFI_USUARIOS_ENTIDADES)
db.createCollection('usuarios_safi', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['id_usuario', 'slug_usuario', 'rut', 'dv', 'nombres', 'apellidos', 'email', 'activo'],
      properties: {
        id_usuario: { bsonType: 'long' },
        slug_usuario: { bsonType: 'string' },
        rut: { bsonType: 'long' },
        dv: { bsonType: 'string' },
        nombres: { bsonType: 'string' },
        apellidos: { bsonType: 'string' },
        email: { bsonType: 'string' },
        activo: { enum: ['S', 'N'] },
        fecha_creacion: { bsonType: 'date' },
        creado_por: { bsonType: 'string' },
        unidades: {
          bsonType: 'array',
          items: { bsonType: 'string' },
          description: 'Array of unit technical codes (e.g. UA_CONTA)'
        },
        entidades: {
          bsonType: 'array',
          items: { bsonType: 'string' },
          description: 'Array of entity technical codes (e.g. ENT_CENTRAL)'
        }
      }
    }
  }
});

// 6. Collection: logs_auditoria (Representing ACC_LOG_ACCESOS and ACC_LOG_ERRORES)
db.createCollection('logs_auditoria', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['tipo', 'fecha'],
      properties: {
        tipo: { enum: ['ACCESO', 'ERROR'] },
        fecha: { bsonType: 'date' },
        usuario: { bsonType: 'string' },
        objeto: { bsonType: 'string' },
        operaciones: { bsonType: 'string' },
        autorizado: { bsonType: 'int' },
        modulo: { bsonType: 'string' },
        mensaje: { bsonType: 'string' },
        contexto_json: { bsonType: 'string' }
      }
    }
  }
});
