/**
 * =========================================================================
 * INTERFACES Y MODELOS DE SEGURIDAD NGAC / ABAC & ADMIN SAFI (FRONTEND)
 * Mapeo directo y completo de las 10 tablas del modelo relacional
 * =========================================================================
 */

// --- 1. TABLA: ACC_OPERACIONES ---
export interface IOperacion {
  id_op?: number;
  nombre_op: string;
  descripcion?: string;
  [key: string]: any;
}

// Alias legacy para compatibilidad
export interface Operacion {
  nombre_op: string;
  descripcion?: string;
  [key: string]: any;
}

// --- 2. TABLA: ACC_TIPOS_NODO ---
export interface ITipoNodo {
  id_tipo_nodo?: number;
  codigo_tipo: string;
  descripcion?: string;
}

// --- 3. TABLA: ACC_NODOS ---
export interface INodo {
  id_nodo?: number;
  id_tipo_nodo?: number;
  tipo_nodo?: string; // Corresponde al alias 'tipo_nodo' (U, O, UA, OA, PC, etc.)
  codigo_tecnico: string;
  etiqueta: string;
  url_ruta?: string;
  slug?: string;
  icono?: string;
  descripcion?: string;
  orden_visual?: number;
  activo: string; // 'S' or 'N'
  fecha_creacion?: Date | string;
  creado_por?: string;
  children?: INodo[];
  [key: string]: any;
}

// --- 4. TABLA: ACC_ASIGNACIONES (Enlaces Jerárquicos) ---
export interface IAsignacion {
  id_asignacion?: number;
  id_menu_asignacion?: number;
  id_padre: number;
  id_hijo: number;
  padre_codigo?: string;
  hijo_codigo?: string;
  [key: string]: any;
}

// Alias legacy para compatibilidad
export interface Enlace {
  padre: string;
  hijo: string;
  [key: string]: any;
}

// --- 5. TABLA: ACC_ASOCIACIONES (Permisos Permitidos / Allow) ---
export interface IAsociacion {
  id_asociacion?: number;
  id_usr_attr: number;
  id_obj_attr: number;
  id_op: number;
  condicion_json?: string;
  fecha_registro?: Date | string;
  creado_por?: string;
  // Campos auxiliares devueltos en joins
  usr?: string;
  usr_etiqueta?: string;
  obj?: string;
  obj_etiqueta?: string;
  op?: string;
  [key: string]: any;
}

// Alias legacy para compatibilidad
export interface Permiso {
  obj: string;
  obj_etiqueta?: string;
  op: string;
  [key: string]: any;
}

// --- 6. TABLA: ACC_PROHIBICIONES (Permisos Denegados / Deny) ---
export interface IProhibicion {
  id_prohibicion?: number;
  id_usr_attr: number;
  id_obj_attr: number;
  id_op: number;
  fecha_registro?: Date | string;
  creado_por?: string;
  // Campos auxiliares
  usr?: string;
  obj?: string;
  op?: string;
  [key: string]: any;
}

// --- 7. TABLA: ACC_LOG_ERRORES ---
export interface ILogError {
  id_log?: number;
  fecha: Date | string;
  modulo: string;
  mensaje: string;
}

// --- 8. TABLA: SAFI_USUARIOS ---
export interface ISafiUsuario {
  id: number;
  rut_numero: string;
  rut_dv: string;
  nombre: string;
  email: string;
  estado?: number; // 1 = Activo, 0 = Inactivo
}

// --- 9. TABLA: SAFI_ENTIDADES ---
export interface ISafiEntidad {
  id: number;
  codigo: string;
  nombre: string;
  slug: string;
  desc?: string;
  activo?: string;
}

// --- 10. TABLA: SAFI_UNIDADES ---
export interface ISafiUnidad {
  id: number;
  codigo: string;
  nombre: string;
  slug: string;
  desc?: string;
  activo?: string;
}

// ==========================================
// ESTRUCTURAS COMPLEMENTARIAS
// ==========================================

export interface IRol {
  id_rol?: number;
  id_nodo?: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  id_tipo_nodo?: number;
  url_ruta?: string;
  slug?: string;
  icono?: string;
  orden_visual?: number;
  activo?: string | boolean;
}

export interface IRespuestaJSON<T> {
  success: boolean;
  message?: string;
  data: T;
  error?: string;
}

export const NGAC_OPERATIONS = [
  'VER',
  'CREAR',
  'EDITAR',
  'ELIMINAR',
  'APROBAR',
  'AUDITAR',
  'DESCARGAR',
  'EJECUTAR',
  'IMPRIMIR',
  'EXPORTAR',
];

// --- DTOS PARA LOS NUEVOS PROCEDIMIENTOS SAFI ADMIN ---
export interface ICrearSafiUsuarioDto {
  slug_usuario: string;
  rut_numero: string;
  rut_dv: string;
  nombres: string;
  apellidos: string;
  email: string;
}

export interface ICrearSafiUnidadDto {
  codigo: string;
  slug_unidad: string;
  nombre_unidad: string;
  descripcion: string;
}

export interface ICrearSafiEntidadDto {
  codigo: string;
  slug_entidad: string;
  nombre_entidad: string;
  tipo_entidad: string;
}

export interface IVinculoUsuarioUnidadDto {
  id_usuario: number;
  id_unidad: number;
}

export interface IVinculoUsuarioEntidadDto {
  id_usuario: number;
  id_entidad: number;
}

export interface IVinculoUnidadEntidadDto {
  id_unidad: number;
  id_entidad: number;
}

// --- 11. TABLA: SAFI_MODULOS ---
export interface ISafiModulo {
  id_modulo?: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  activo?: string;
  nodos?: INodo[];
}

// --- 12. TABLA: SAFI_MODULO_NODOS ---
export interface ISafiModuloNodo {
  id_modulo_nodo?: number;
  id_modulo: number;
  id_nodo: number;
  activo?: string;
}
