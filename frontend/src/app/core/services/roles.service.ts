import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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

@Injectable({ providedIn: 'root' })
export class RolesService {
  private readonly API_URL = environment.adminUrl + '/roles';

  constructor(private http: HttpClient) {}

  getRoles(): Observable<IRol[]> {
    return this.http.get<any[]>(this.API_URL).pipe(
      map((roles) =>
        (roles || []).map((role) => ({
          id_rol: role?.id_rol ?? role?.ID_ROL ?? role?.id_nodo ?? role?.ID_NODO,
          id_nodo: role?.id_nodo ?? role?.ID_NODO ?? role?.id_rol ?? role?.ID_ROL,
          codigo: String(
            role?.codigo ?? role?.CODIGO ?? role?.codigo_tecnico ?? role?.CODIGO_TECNICO ?? '',
          ),
          nombre: String(
            role?.nombre ?? role?.NOMBRE ?? role?.etiqueta ?? role?.ETIQUETA ?? role?.codigo ?? '',
          ),
          descripcion: String(role?.descripcion ?? role?.DESCRIPCION ?? ''),
          id_tipo_nodo: role?.id_tipo_nodo ?? role?.ID_TIPO_NODO,
          url_ruta: role?.url_ruta ?? role?.URL_RUTA ?? '',
          slug: role?.slug ?? role?.SLUG ?? '',
          icono: role?.icono ?? role?.ICONO ?? 'admin_panel_settings',
          orden_visual: role?.orden_visual ?? role?.ORDEN_VISUAL ?? 0,
          activo: role?.activo ?? role?.ACTIVO ?? 'S',
        })),
      ),
    );
  }

  upsertRol(rol: IRol): Observable<any> {
    if (rol.id_rol) {
      return this.http.put(`${this.API_URL}/${rol.id_rol}`, rol);
    } else {
      return this.http.post(this.API_URL, rol);
    }
  }

  deleteRol(id_rol: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id_rol}`);
  }
}
