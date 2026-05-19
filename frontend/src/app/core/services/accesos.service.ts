import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { INodo, IRespuestaJSON } from '../models/ngac-admin.models';

@Injectable({
  providedIn: 'root',
})
export class AccesosService {
  private readonly API_URL = environment.adminUrl;

  // Global State para el árbol
  private treeSubject = new BehaviorSubject<INodo[]>([]);
  public tree$ = this.treeSubject.asObservable();
  private dynamicModules = signal<INodo[]>([]);
  private contextoSimulacion: any = {
    sujeto: { usuario_id: '13259698', roles: ['ROL_DEV'], division: '' },
    contexto: { politicas: ['POLICY_MENU'] },
    solicitud: {
      modulos: ['ADMINISTRACION', 'CONTABILIDAD', 'CONSOLIDACION_CKS'],
      operaciones: ['VER', 'EDITAR', 'CREAR', 'ELIMINAR']
    },
    atributos: ['']
  };

  constructor(private http: HttpClient) {}

  setContextoSimulacion(ctx: any) {
    this.contextoSimulacion = ctx;
  }

  getContextoSimulacion() {
    return this.contextoSimulacion;
  }

  recargarMenu() {
    if (this.contextoSimulacion) {
      this.generarMenuDinamico(this.contextoSimulacion).subscribe();
    } else {
      this.obtenerArbol().subscribe();
    }
  }

  /**
   * Carga el árbol completo o filtrado por rol, y actualiza el State global
   */
  obtenerArbol(rolBase?: string): Observable<INodo[]> {
    let params = new HttpParams();
    if (rolBase) {
      params = params.set('rolBase', rolBase);
    }
    return this.http
      .get<INodo[]>(`${this.API_URL}/arbol`, { params })
      .pipe(tap((tree) => this.treeSubject.next(tree)));
  }

  generarMenuDinamico(payload: any): Observable<INodo[]> {
    return this.http
      .post<any>(`${this.API_URL}/arbol/generar-menu`, payload)
      .pipe(
        map((res) => (res && res.menu ? res.menu : res)),
        tap((tree) => this.treeSubject.next(tree)),
      );
  }

  getNodos(): Observable<INodo[]> {
    return this.http.get<INodo[]>(`${this.API_URL}/nodos`);
  }

  getRolesPorNodo(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/sec/roles-by-node?id=${id}`);
  }

  upsertNodo(nodo: Partial<INodo>): Observable<IRespuestaJSON<null>> {
    return this.http.post<IRespuestaJSON<null>>(`${this.API_URL}/nodos`, nodo);
  }

  deleteNodo(codigo: string): Observable<IRespuestaJSON<null>> {
    return this.http.delete<IRespuestaJSON<null>>(
      `${this.API_URL}/nodos/${encodeURIComponent(codigo)}`,
    );
  }

  enlazarNodos(padre: string, hijo: string): Observable<IRespuestaJSON<null>> {
    return this.http.post<IRespuestaJSON<null>>(`${this.API_URL}/enlaces`, { padre, hijo });
  }

  getEnlaces(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/enlaces`);
  }

  deleteEnlace(padre: string, hijo: string): Observable<IRespuestaJSON<null>> {
    return this.http.delete<IRespuestaJSON<null>>(
      `${this.API_URL}/enlaces/${encodeURIComponent(padre)}/${encodeURIComponent(hijo)}`,
    );
  }

  // --- Gestión de roles por usuario (endpoints dedicados, sin fuzzy matching) ---
  getRolesDeUsuario(userId: number): Observable<{ success: boolean; data: { codigoRol: string; nombre: string }[] }> {
    return this.http.get<any>(`${this.API_URL}/safi/usuarios/${userId}/roles`);
  }

  asignarRolAUsuario(userId: number, codigoRol: string): Observable<IRespuestaJSON<null>> {
    return this.http.post<IRespuestaJSON<null>>(`${this.API_URL}/safi/usuarios/${userId}/roles`, { codigoRol });
  }

  revocarRolDeUsuario(userId: number, codigoRol: string): Observable<IRespuestaJSON<null>> {
    return this.http.delete<IRespuestaJSON<null>>(`${this.API_URL}/safi/usuarios/${userId}/roles/${encodeURIComponent(codigoRol)}`);
  }

  otorgarPermiso(
    usr: string,
    obj: string,
    op: string,
    condicion?: string,
  ): Observable<IRespuestaJSON<null>> {
    return this.http.post<IRespuestaJSON<null>>(`${this.API_URL}/permisos`, {
      usr,
      obj,
      op,
      condicion_js: condicion,
    });
  }

  getPermisos(
    usr?: string,
    obj?: string | number,
    page: number = 1,
    pageSize: number = 5,
  ): Observable<{ total: number; data: any[] }> {
    let params = new HttpParams();
    if (usr) params = params.set('usr', usr);
    if (obj) params = params.set('obj', obj);
    params = params.set('page', page.toString());
    params = params.set('pageSize', pageSize.toString());
    return this.http.get<{ total: number; data: any[] }>(`${this.API_URL}/permisos`, { params });
  }

  revocarPermiso(usr: string, obj: string, op: string): Observable<IRespuestaJSON<null>> {
    return this.http.delete<IRespuestaJSON<null>>(`${this.API_URL}/permisos`, {
      body: { usr, obj, op },
    });
  }

  denegarPermiso(usr: string, obj: string, op: string): Observable<IRespuestaJSON<null>> {
    return this.http.post<IRespuestaJSON<null>>(`${this.API_URL}/permisos/denegar`, {
      usr,
      obj,
      op,
    });
  }

  getOperaciones(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/operaciones`);
  }

  upsertOperacion(op: any): Observable<IRespuestaJSON<null>> {
    return this.http.post<IRespuestaJSON<null>>(`${this.API_URL}/operaciones`, op);
  }

  deleteOperacion(nombre: string): Observable<IRespuestaJSON<null>> {
    return this.http.delete<IRespuestaJSON<null>>(
      `${this.API_URL}/operaciones/${encodeURIComponent(nombre)}`,
    );
  }

  getTiposNodo(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/nodos/tipos`);
  }

  upsertTipoNodo(tipo: any): Observable<IRespuestaJSON<null>> {
    return this.http.post<IRespuestaJSON<null>>(`${this.API_URL}/tipos-nodo`, tipo);
  }

  deleteTipoNodo(codigo: string): Observable<IRespuestaJSON<null>> {
    return this.http.delete<IRespuestaJSON<null>>(
      `${this.API_URL}/tipos-nodo/${encodeURIComponent(codigo)}`,
    );
  }

  getDashboardStats(): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/dashboard/stats`);
  }
  /**
   * Obtiene los módulos raíz
   */
  getModulosRaiz(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/modulos-raiz`);
  }

  /**
   * Obtiene todos los roles
   */
  getRoles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/roles`);
  }

  /**
   * Obtiene las políticas raíz
   */
  getPoliticasRaiz(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/politicas-raiz`);
  }

  /**
   * Obtiene la matriz de permisos para un rol y política
   */
  getPermissionMatrix(rol: string, politica: string): Observable<any> {
    const params = new HttpParams().set('rol', rol).set('politica', politica);
    return this.http.get<any>(`${this.API_URL}/permisos/matriz`, { params });
  }
}
