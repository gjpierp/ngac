// ==========================================
// NEO4J NODE LABELS & SEED GRAPH
// ==========================================

MERGE (polAdmin:NgacNode:PolicyClass {
  id_nodo: 100,
  codigo_tecnico: 'POL_ADMIN'
})
SET polAdmin.etiqueta = 'Politica Administracion',
    polAdmin.tipo_codigo = 'POLICY_CLASS',
    polAdmin.descripcion = 'Politica principal para administracion NGAC',
    polAdmin.activo = 'S',
    polAdmin.slug = 'politica-administracion',
    polAdmin.icono = 'shield',
    polAdmin.orden_visual = 1;

MERGE (uaAdmin:NgacNode:UserAttribute {
  id_nodo: 110,
  codigo_tecnico: 'UA_ADMIN_GLOBAL'
})
SET uaAdmin.etiqueta = 'Atributo Administrador Global',
    uaAdmin.tipo_codigo = 'USER_ATTR',
    uaAdmin.descripcion = 'Agrupa usuarios con control administrativo total',
    uaAdmin.activo = 'S',
    uaAdmin.slug = 'ua-admin-global',
    uaAdmin.orden_visual = 10;

MERGE (usrAdmin:NgacNode:UserNode {
  id_nodo: 111,
  codigo_tecnico: 'USR_ADMIN_ROOT'
})
SET usrAdmin.etiqueta = 'Administrador Sistema',
    usrAdmin.tipo_codigo = 'USUARIO',
    usrAdmin.descripcion = 'Usuario tecnico con privilegios globales',
    usrAdmin.activo = 'S',
    usrAdmin.slug = 'admin-root',
    usrAdmin.orden_visual = 11;

MERGE (oaAdmin:NgacNode:ObjectAttribute {
  id_nodo: 120,
  codigo_tecnico: 'OA_ADMIN'
})
SET oaAdmin.etiqueta = 'Objetos Administrativos',
    oaAdmin.tipo_codigo = 'OBJ_ATTR',
    oaAdmin.descripcion = 'Agrupa recursos de administracion NGAC',
    oaAdmin.activo = 'S',
    oaAdmin.slug = 'oa-admin',
    oaAdmin.orden_visual = 20;

MERGE (objNodos:NgacNode:ObjectNode {
  id_nodo: 121,
  codigo_tecnico: 'OBJ_NODOS'
})
SET objNodos.etiqueta = 'Gestion de Nodos',
    objNodos.tipo_codigo = 'OBJETO',
    objNodos.descripcion = 'CRUD de nodos y enlaces NGAC',
    objNodos.url_ruta = '/admin/nodos',
    objNodos.activo = 'S',
    objNodos.slug = 'gestion-nodos',
    objNodos.icono = 'sitemap',
    objNodos.orden_visual = 21;

MERGE (objPermisos:NgacNode:ObjectNode {
  id_nodo: 122,
  codigo_tecnico: 'OBJ_PERMISOS'
})
SET objPermisos.etiqueta = 'Gestion de Permisos',
    objPermisos.tipo_codigo = 'OBJETO',
    objPermisos.descripcion = 'Asignacion y revocacion de permisos',
    objPermisos.url_ruta = '/admin/permisos',
    objPermisos.activo = 'S',
    objPermisos.slug = 'gestion-permisos',
    objPermisos.icono = 'key',
    objPermisos.orden_visual = 22;

MERGE (modSafiNode:NgacNode:SafiModuleNode {
  id_nodo: 130,
  codigo_tecnico: 'MOD_SAFI'
})
SET modSafiNode.etiqueta = 'Modulo SAFI',
    modSafiNode.tipo_codigo = 'MODULO',
    modSafiNode.descripcion = 'Punto de entrada al modulo SAFI',
    modSafiNode.url_ruta = '/safi',
    modSafiNode.activo = 'S',
    modSafiNode.slug = 'modulo-safi',
    modSafiNode.icono = 'briefcase',
    modSafiNode.orden_visual = 30;

MERGE (objSafiUsuarios:NgacNode:ObjectNode {
  id_nodo: 131,
  codigo_tecnico: 'OBJ_SAFI_USUARIOS'
})
SET objSafiUsuarios.etiqueta = 'Usuarios SAFI',
    objSafiUsuarios.tipo_codigo = 'OBJETO',
    objSafiUsuarios.descripcion = 'Administracion de usuarios SAFI',
    objSafiUsuarios.url_ruta = '/safi/usuarios',
    objSafiUsuarios.activo = 'S',
    objSafiUsuarios.slug = 'safi-usuarios',
    objSafiUsuarios.icono = 'id-card',
    objSafiUsuarios.orden_visual = 31;

MERGE (menuSafi:MenuNode {
  id_menu_nodo: 900,
  codigo_menu: 'MENU_SAFI'
})
SET menuSafi.etiqueta_visible = 'Modulo SAFI',
    menuSafi.url_ruta_visible = '/safi',
    menuSafi.slug_visible = 'modulo-safi',
    menuSafi.icono_visible = 'briefcase',
    menuSafi.activo = 'S',
    menuSafi.orden_visual = 1;

MERGE (menuUsuarios:MenuNode {
  id_menu_nodo: 901,
  codigo_menu: 'MENU_SAFI_USUARIOS'
})
SET menuUsuarios.etiqueta_visible = 'Usuarios',
    menuUsuarios.url_ruta_visible = '/safi/usuarios',
    menuUsuarios.slug_visible = 'safi-usuarios',
    menuUsuarios.icono_visible = 'id-card',
    menuUsuarios.activo = 'S',
    menuUsuarios.orden_visual = 2;

MERGE (adminUser:SafiUser {
  id_usuario: 1,
  slug_usuario: 'admin-sys-root-safi'
})
SET adminUser.rut = 0,
    adminUser.dv = '0',
    adminUser.nombres = 'Administrador',
    adminUser.apellidos = 'Sistema SAFI',
    adminUser.email = 'gjpierp@gmail.com',
    adminUser.activo = 'S';

MERGE (central:SafiEntity {
  id_entidad: 1,
  codigo: 'ENT_CENTRAL'
})
SET central.nombre_entidad = 'Entidad Central',
    central.slug_entidad = 'entidad-central',
    central.tipo_entidad = 'CENTRAL',
    central.activo = 'S';

MERGE (regional:SafiEntity {
  id_entidad: 2,
  codigo: 'ENT_REGIONAL'
})
SET regional.nombre_entidad = 'Entidad Regional',
    regional.slug_entidad = 'entidad-regional',
    regional.tipo_entidad = 'REGIONAL',
    regional.activo = 'S';

MERGE (uniFin:SafiUnit {
  id_unidad: 1,
  codigo: 'UNI_FIN'
})
SET uniFin.nombre_unidad = 'Unidad de Finanzas',
    uniFin.slug_unidad = 'unidad-finanzas',
    uniFin.descripcion = 'Unidad encargada de presupuesto y tesoreria',
    uniFin.activo = 'S';

MERGE (uniOpe:SafiUnit {
  id_unidad: 2,
  codigo: 'UNI_OPE'
})
SET uniOpe.nombre_unidad = 'Unidad de Operaciones',
    uniOpe.slug_unidad = 'unidad-operaciones',
    uniOpe.descripcion = 'Unidad encargada del soporte operacional',
    uniOpe.activo = 'S';

MERGE (modAdmin:SafiModule {
  id_modulo: 1,
  codigo: 'MOD_ADMIN'
})
SET modAdmin.nombre = 'Administracion NGAC',
    modAdmin.descripcion = 'Mantencion de nodos, permisos y jerarquias',
    modAdmin.activo = 'S';

MERGE (modSafi:SafiModule {
  id_modulo: 2,
  codigo: 'MOD_SAFI'
})
SET modSafi.nombre = 'Administracion SAFI',
    modSafi.descripcion = 'Mantencion de usuarios, unidades y entidades',
    modSafi.activo = 'S';

MERGE (ver:Operation { nombre_op: 'VER' })
SET ver.id_op = 1, ver.descripcion = 'Permite visualizar recursos', ver.activo = 'S';

MERGE (crear:Operation { nombre_op: 'CREAR' })
SET crear.id_op = 2, crear.descripcion = 'Permite crear registros', crear.activo = 'S';

MERGE (editar:Operation { nombre_op: 'EDITAR' })
SET editar.id_op = 3, editar.descripcion = 'Permite modificar registros', editar.activo = 'S';

MERGE (eliminar:Operation { nombre_op: 'ELIMINAR' })
SET eliminar.id_op = 4, eliminar.descripcion = 'Permite eliminar registros', eliminar.activo = 'S';

MERGE (aprobar:Operation { nombre_op: 'APROBAR' })
SET aprobar.id_op = 5, aprobar.descripcion = 'Permite aprobar operaciones criticas', aprobar.activo = 'S';