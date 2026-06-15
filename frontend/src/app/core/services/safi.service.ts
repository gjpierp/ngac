import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ISafiUsuario,
  ISafiEntidad,
  ISafiUnidad,
  IRespuestaJSON,
  ICrearSafiUsuarioDto,
  ICrearSafiUnidadDto,
  ICrearSafiEntidadDto,
  IVinculoUsuarioUnidadDto,
  IVinculoUsuarioEntidadDto,
  IVinculoUnidadEntidadDto,
  ISafiModulo
} from '../models/ngac-admin.models';

@Injectable({
  providedIn: 'root',
})
export class SafiService {
  private readonly API_URL = environment.adminUrl + '/safi';

  constructor(private http: HttpClient) {}

  // ==========================================
  // 1. GESTIÓN DE USUARIOS SAFI (CRUD GENÉRICO)
  // ==========================================

  getUsuarios(): Observable<ISafiUsuario[]> {
    return this.http.get<ISafiUsuario[]>(`${this.API_URL}/usuarios`);
  }

  upsertUsuario(usuario: ISafiUsuario): Observable<IRespuestaJSON<null>> {
    return this.http.post<IRespuestaJSON<null>>(`${this.API_URL}/usuarios`, usuario);
  }

  deleteUsuario(id: number): Observable<IRespuestaJSON<null>> {
    return this.http.delete<IRespuestaJSON<null>>(`${this.API_URL}/usuarios/${id}`);
  }

  getUsuarioVinculos(userId: number): Observable<IRespuestaJSON<{ entidadIds: number[], unidadIds: number[] }>> {
    return this.http.get<IRespuestaJSON<{ entidadIds: number[], unidadIds: number[] }>>(`${this.API_URL}/usuarios/${userId}/vinculos`);
  }

  // ==========================================
  // 2. GESTIÓN DE ENTIDADES SAFI (CRUD GENÉRICO)
  // ==========================================

  getEntidades(): Observable<ISafiEntidad[]> {
    return this.http.get<ISafiEntidad[]>(`${this.API_URL}/entidades`);
  }

  upsertEntidad(entidad: ISafiEntidad): Observable<IRespuestaJSON<null>> {
    return this.http.post<IRespuestaJSON<null>>(`${this.API_URL}/entidades`, entidad);
  }

  deleteEntidad(id: number): Observable<IRespuestaJSON<null>> {
    return this.http.delete<IRespuestaJSON<null>>(`${this.API_URL}/entidades/${id}`);
  }

  getUnidadesDeEntidad(entidadId: number): Observable<IRespuestaJSON<ISafiUnidad[]>> {
    return this.http.get<IRespuestaJSON<ISafiUnidad[]>>(`${this.API_URL}/entidades/${entidadId}/unidades`);
  }

  // ==========================================
  // 3. GESTIÓN DE UNIDADES SAFI (CRUD GENÉRICO)
  // ==========================================

  getUnidades(): Observable<ISafiUnidad[]> {
    return this.http.get<ISafiUnidad[]>(`${this.API_URL}/unidades`);
  }

  upsertUnidad(unidad: ISafiUnidad): Observable<IRespuestaJSON<null>> {
    return this.http.post<IRespuestaJSON<null>>(`${this.API_URL}/unidades`, unidad);
  }

  deleteUnidad(id: number): Observable<IRespuestaJSON<null>> {
    return this.http.delete<IRespuestaJSON<null>>(`${this.API_URL}/unidades/${id}`);
  }

  // =========================================================================
  // 4. LLAMADAS A PROCEDIMIENTOS DE BASE DE DATOS (PKG_SAFI_ADMIN)
  // =========================================================================

  crearUsuario(dto: ICrearSafiUsuarioDto): Observable<IRespuestaJSON<{ id_usuario: number }>> {
    return this.http.post<IRespuestaJSON<{ id_usuario: number }>>(`${this.API_URL}/procedimientos/crear-usuario`, dto);
  }

  desactivarUsuario(idUsuario: number): Observable<IRespuestaJSON<null>> {
    return this.http.post<IRespuestaJSON<null>>(`${this.API_URL}/procedimientos/desactivar-usuario`, { id_usuario: idUsuario });
  }

  crearUnidad(dto: ICrearSafiUnidadDto): Observable<IRespuestaJSON<{ id_unidad: number }>> {
    return this.http.post<IRespuestaJSON<{ id_unidad: number }>>(`${this.API_URL}/procedimientos/crear-unidad`, dto);
  }

  crearEntidad(dto: ICrearSafiEntidadDto): Observable<IRespuestaJSON<{ id_entidad: number }>> {
    return this.http.post<IRespuestaJSON<{ id_entidad: number }>>(`${this.API_URL}/procedimientos/crear-entidad`, dto);
  }

  vincularUsuarioUnidad(dto: IVinculoUsuarioUnidadDto): Observable<IRespuestaJSON<null>> {
    return this.http.post<IRespuestaJSON<null>>(`${this.API_URL}/vinculos/usuario-unidad`, dto);
  }

  desvincularUsuarioUnidad(dto: IVinculoUsuarioUnidadDto): Observable<IRespuestaJSON<null>> {
    return this.http.request<IRespuestaJSON<null>>('DELETE', `${this.API_URL}/vinculos/usuario-unidad`, { body: dto });
  }

  vincularUsuarioEntidad(dto: IVinculoUsuarioEntidadDto): Observable<IRespuestaJSON<null>> {
    return this.http.post<IRespuestaJSON<null>>(`${this.API_URL}/vinculos/usuario-entidad`, dto);
  }

  desvincularUsuarioEntidad(dto: IVinculoUsuarioEntidadDto): Observable<IRespuestaJSON<null>> {
    return this.http.request<IRespuestaJSON<null>>('DELETE', `${this.API_URL}/vinculos/usuario-entidad`, { body: dto });
  }

  vincularUnidadEntidad(dto: IVinculoUnidadEntidadDto): Observable<IRespuestaJSON<null>> {
    return this.http.post<IRespuestaJSON<null>>(`${this.API_URL}/vinculos/unidad-entidad`, dto);
  }

  desvincularUnidadEntidad(dto: IVinculoUnidadEntidadDto): Observable<IRespuestaJSON<null>> {
    return this.http.request<IRespuestaJSON<null>>('DELETE', `${this.API_URL}/vinculos/unidad-entidad`, { body: dto });
  }

  getUnidadEntidadVinculos(): Observable<IRespuestaJSON<{ id_unidad: number, id_entidad: number }[]>> {
    return this.http.get<IRespuestaJSON<{ id_unidad: number, id_entidad: number }[]>>(`${this.API_URL}/vinculos/unidad-entidad`);
  }

  // ==========================================
  // 5. GESTIÓN DE MÓDULOS SAFI
  // ==========================================

  getModulos(): Observable<ISafiModulo[]> {
    return this.http.get<ISafiModulo[]>(`${this.API_URL}/modulos`);
  }

  upsertModulo(modulo: ISafiModulo): Observable<IRespuestaJSON<null>> {
    return this.http.post<IRespuestaJSON<null>>(`${this.API_URL}/modulos`, modulo);
  }

  deleteModulo(id: number): Observable<IRespuestaJSON<null>> {
    return this.http.delete<IRespuestaJSON<null>>(`${this.API_URL}/modulos/${id}`);
  }

  vincularModuloNodo(idModulo: number, idNodo: number): Observable<IRespuestaJSON<null>> {
    return this.http.post<IRespuestaJSON<null>>(`${this.API_URL}/vinculos/modulo-nodo`, { id_modulo: idModulo, id_nodo: idNodo });
  }

  desvincularModuloNodo(idModulo: number, idNodo: number): Observable<IRespuestaJSON<null>> {
    return this.http.request<IRespuestaJSON<null>>('DELETE', `${this.API_URL}/vinculos/modulo-nodo`, { body: { id_modulo: idModulo, id_nodo: idNodo } });
  }
}
