// =========================================================================
// INTERFACES Y DTOS DE SEGURIDAD NGAC / ABAC & ADMIN SAFI (BACKEND)
// =========================================================================

// --- 1. TABLA: ACC_OPERACIONES ---
export interface AccOperacion {
  id_op?: number;
  nombre_op: string;
  descripcion?: string;
}

// --- 2. TABLA: ACC_TIPOS_NODO ---
export interface AccTipoNodo {
  id_tipo_nodo?: number;
  codigo_tipo: string;
  descripcion?: string;
}

// --- 3. TABLA: ACC_NODOS ---
export interface AccNodo {
  id_nodo?: number;
  id_tipo_nodo?: number;
  tipo_nodo?: string; // Nombre amigable del tipo (UA, OA, U, O, PC, etc.)
  codigo_tecnico: string;
  etiqueta: string;
  url_ruta?: string;
  slug?: string;
  icono?: string;
  descripcion?: string;
  orden_visual?: number;
  activo: string; // 'S' o 'N'
  fecha_creacion?: Date | string;
  creado_por?: string;
  children?: AccNodo[];
}

// --- 4. TABLA: ACC_ASIGNACIONES ---
export interface AccAsignacion {
  id_asignacion?: number;
  id_padre: number;
  id_hijo: number;
}

// --- 5. TABLA: ACC_ASOCIACIONES (Permisos Permitidos) ---
export interface AccAsociacion {
  id_asociacion?: number;
  id_usr_attr: number;
  id_obj_attr: number;
  id_op: number;
  condicion_json?: string;
  fecha_registro?: Date | string;
  creado_por?: string;
}

// Alias legacy para compatibilidad
export interface AccPermiso {
  id_asociacion?: number;
  id_usr_attr: number;
  id_obj_attr: number;
  id_op: number;
  condicion_json?: string;
}

// --- 6. TABLA: ACC_PROHIBICIONES (Permisos Denegados) ---
export interface AccProhibicion {
  id_prohibicion?: number;
  id_usr_attr: number;
  id_obj_attr: number;
  id_op: number;
  fecha_registro?: Date | string;
  creado_por?: string;
}

// --- 7. TABLA: ACC_LOG_ERRORES ---
export interface AccLogError {
  id_log?: number;
  fecha: Date | string;
  modulo: string;
  mensaje: string;
}

// --- 8. TABLA: SAFI_USUARIOS ---
export interface SafiUsuario {
  id: number;
  nombre: string;
  email: string;
  estado?: number; // 1 = Activo, 0 = Inactivo
}

// --- 9. TABLA: SAFI_ENTIDADES ---
export interface SafiEntidad {
  id: number;
  nombre: string;
  slug: string;
  desc?: string;
  estado?: number; // 1 = Activo, 0 = Inactivo
}

// --- 10. TABLA: SAFI_UNIDADES ---
export interface SafiUnidad {
  id: number;
  nombre: string;
  slug: string;
  desc?: string;
  estado?: number; // 1 = Activo, 0 = Inactivo
}

// ==========================================
// DTOS PARA FLUJOS OPERACIONALES
// ==========================================

export interface AccRol {
  id_rol?: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  id_tipo_nodo?: number;
  url_ruta?: string;
  slug?: string;
  icono?: string;
  orden_visual?: number;
  activo?: string; // 'S' o 'N'
}

export interface UpsertNodoDto {
  codigo: string;
  etiqueta: string;
  tipo: string;
  ruta?: string;
  slug?: string;
  icono?: string;
  descripcion?: string;
  orden?: number;
  activo?: string;
}

export interface EnlazarNodoDto {
  padre: string;
  hijo: string;
}

export interface OtorgarPermisoDto {
  usr: string;
  obj: string;
  op: string;
  condicion_js?: string;
}

export interface UpsertTipoNodoDto {
  codigo: string;
  descripcion?: string;
}

// --- DTOS PARA LOS NUEVOS PROCEDIMIENTOS SAFI ADMIN ---
export interface CrearSafiUsuarioDto {
  slug_usuario: string;
  rut: string;
  nombres: string;
  apellidos: string;
  email: string;
}

export interface CrearSafiUnidadDto {
  slug_unidad: string;
  nombre_unidad: string;
  descripcion: string;
}

export interface CrearSafiEntidadDto {
  slug_entidad: string;
  nombre_entidad: string;
  tipo_entidad: string;
}

export interface VinculoUsuarioUnidadDto {
  id_usuario: number;
  id_unidad: number;
}

export interface VinculoUsuarioEntidadDto {
  id_usuario: number;
  id_entidad: number;
}

export interface VinculoUnidadEntidadDto {
  id_unidad: number;
  id_entidad: number;
}

// --- INTERFACES PARA PAYLOAD NGAC (Next-Generation Access Control) ---
export interface INgacRequest {
  sujeto: {
    usuario_id: string;
    roles: string[];
  };
  contexto: {
    politicas: string[];
  };
  solicitud: {
    app_id: string;
    operaciones: string[];
  };
}
