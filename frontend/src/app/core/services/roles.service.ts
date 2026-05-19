import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface IRol {
  id_rol?: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
}

@Injectable({ providedIn: 'root' })
export class RolesService {
  private readonly API_URL = environment.adminUrl + '/roles';

  constructor(private http: HttpClient) {}

  getRoles(): Observable<IRol[]> {
    return this.http.get<IRol[]>(this.API_URL);
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
