import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { INodo, IRespuestaJSON } from '../models/ngac-admin.models';

type NodeIdentifier = string | number;

@Injectable({
  providedIn: 'root',
})
export class AccesosService {
  private readonly API_URL = environment.adminUrl;
  private readonly CONTEXTO_STORAGE_KEY = 'safi.ngac.contexto-simulacion';

  // Global State para el árbol
  private treeSubject = new BehaviorSubject<INodo[]>([]);
  public tree$ = this.treeSubject.asObservable();
  private menuSubject = new BehaviorSubject<INodo[]>([]);
  public menu$ = this.menuSubject.asObservable();
  private dynamicModules = signal<INodo[]>([]);
  private contextoSimulacion: any = {
    sujeto: { usuario_id: '13259698-0', roles: ['ROL_DEV'], division: '' },
    contexto: { politicas: ['POLICY_MENU'] },
    solicitud: {
      operaciones: ['VER', 'CREAR', 'EDITAR', 'ELIMINAR'],
    },
    atributos: [''],
  };
  private contextoSimulacionSubject = new BehaviorSubject<any>(this.contextoSimulacion);
  public contextoSimulacion$ = this.contextoSimulacionSubject.asObservable();

  constructor(private http: HttpClient) {
    const persistedContext = this.readPersistedContext();
    if (persistedContext) {
      this.contextoSimulacion = persistedContext;
    }
    this.contextoSimulacionSubject.next(this.contextoSimulacion);
  }

  setContextoSimulacion(ctx: any) {
    this.contextoSimulacion = ctx;
    this.contextoSimulacionSubject.next(ctx);
    this.persistContext(ctx);
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
  obtenerArbol(rolBase?: NodeIdentifier, publishGlobal: boolean = true): Observable<INodo[]> {
    let params = new HttpParams();
    if (rolBase) {
      params = params.set('rolBase', String(rolBase));
    }
    const request$ = this.http.get<INodo[]>(`${this.API_URL}/arbol`, { params });
    return publishGlobal ? request$.pipe(tap((tree) => this.treeSubject.next(tree))) : request$;
  }

  generarMenuDinamico(payload: any): Observable<INodo[]> {
    return this.http.post<any>(`${this.API_URL}/arbol/generar-menu`, payload).pipe(
      map((res) => (res && res.menu ? res.menu : res)),
      tap((tree) => this.menuSubject.next(tree)),
    );
  }

  getNodos(): Observable<INodo[]> {
    return this.http.get<INodo[]>(`${this.API_URL}/nodos`);
  }

  getRolesPorNodo(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/sec/roles-by-node?id=${id}`);
  }

  upsertNodo(nodo: Partial<INodo>): Observable<IRespuestaJSON<{ id_nodo: number }>> {
    return this.http.post<IRespuestaJSON<{ id_nodo: number }>>(`${this.API_URL}/nodos`, nodo);
  }

  crearYEnlazarNodo(nodo: Partial<INodo>, padreId?: number | string): Observable<IRespuestaJSON<{ id_nodo: number }>> {
    return this.http.post<IRespuestaJSON<{ id_nodo: number }>>(`${this.API_URL}/nodos/crear-y-enlazar`, {
      ...nodo,
      padreId,
    });
  }

  deleteNodo(id: number): Observable<IRespuestaJSON<null>> {
    return this.http.delete<IRespuestaJSON<null>>(
      `${this.API_URL}/nodos/${encodeURIComponent(String(id))}`,
    );
  }

  enlazarNodos(padre: NodeIdentifier, hijo: NodeIdentifier): Observable<IRespuestaJSON<null>> {
    return this.http.post<IRespuestaJSON<null>>(`${this.API_URL}/enlaces`, {
      padre: String(padre),
      hijo: String(hijo),
    });
  }

  getEnlaces(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/enlaces`);
  }

  getMenuEnlaces(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/menu/enlaces`);
  }

  deleteEnlace(padre: NodeIdentifier, hijo: NodeIdentifier): Observable<IRespuestaJSON<null>> {
    return this.http.delete<IRespuestaJSON<null>>(
      `${this.API_URL}/enlaces/${encodeURIComponent(String(padre))}/${encodeURIComponent(String(hijo))}`,
    );
  }

  enlazarMenuNodos(padre: NodeIdentifier, hijo: NodeIdentifier): Observable<IRespuestaJSON<null>> {
    return this.http.post<IRespuestaJSON<null>>(`${this.API_URL}/menu/enlaces`, {
      padre: String(padre),
      hijo: String(hijo),
    });
  }

  clonarMenuJerarquia(padre: NodeIdentifier, hijo: NodeIdentifier): Observable<IRespuestaJSON<null>> {
    return this.http.post<IRespuestaJSON<null>>(`${this.API_URL}/menu/clonar`, {
      padre: String(padre),
      hijo: String(hijo),
    });
  }

  deleteMenuEnlace(padre: NodeIdentifier, hijo: NodeIdentifier): Observable<IRespuestaJSON<null>> {
    return this.http.delete<IRespuestaJSON<null>>(
      `${this.API_URL}/menu/enlaces/${encodeURIComponent(String(padre))}/${encodeURIComponent(String(hijo))}`,
    );
  }

  // --- Gestión de roles por usuario (endpoints dedicados, sin fuzzy matching) ---
  getRolesDeUsuario(userId: number): Observable<{
    success: boolean;
    data: { id_rol?: number; codigo?: string; nombre: string }[];
  }> {
    return this.http.get<any>(`${this.API_URL}/safi/usuarios/${userId}/roles`);
  }

  asignarRolAUsuario(userId: number, idRol: number): Observable<IRespuestaJSON<null>> {
    return this.http.post<IRespuestaJSON<null>>(`${this.API_URL}/safi/usuarios/${userId}/roles`, {
      idRol,
    });
  }

  revocarRolDeUsuario(userId: number, idRol: number): Observable<IRespuestaJSON<null>> {
    return this.http.delete<IRespuestaJSON<null>>(
      `${this.API_URL}/safi/usuarios/${userId}/roles/${encodeURIComponent(String(idRol))}`,
    );
  }

  otorgarPermiso(
    usr: NodeIdentifier,
    obj: NodeIdentifier,
    op: string,
    condicion?: string,
  ): Observable<IRespuestaJSON<null>> {
    return this.http.post<IRespuestaJSON<null>>(`${this.API_URL}/permisos`, {
      usr: String(usr),
      obj: String(obj),
      op,
      condicion_js: condicion,
    });
  }

  getPermisos(
    usr?: string | number,
    obj?: string | number,
    page: number = 1,
    pageSize: number = 5,
  ): Observable<{ total: number; data: any[] }> {
    let params = new HttpParams();
    if (usr !== undefined && usr !== null && usr !== '') params = params.set('usr', String(usr));
    if (obj) params = params.set('obj', obj);
    params = params.set('page', page.toString());
    params = params.set('pageSize', pageSize.toString());
    return this.http.get<{ total: number; data: any[] }>(`${this.API_URL}/permisos`, { params });
  }

  revocarPermiso(
    usr: NodeIdentifier,
    obj: NodeIdentifier,
    op: string,
  ): Observable<IRespuestaJSON<null>> {
    return this.http.delete<IRespuestaJSON<null>>(`${this.API_URL}/permisos`, {
      body: { usr: String(usr), obj: String(obj), op },
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

  private readPersistedContext(): any | null {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }

    const raw = window.localStorage.getItem(this.CONTEXTO_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      const ctx = JSON.parse(raw);
      // Remover módulos explícitos del contexto persistido.
      // El motor ABAC de Oracle los resuelve automáticamente desde la política
      // mediante g_policy_menu_roots; inyectarlos activa un camino distinto
      // (fn_menu_node_matches_claim) que puede filtrar incorrectamente el sidebar.
      if (ctx?.solicitud?.modulos) {
        delete ctx.solicitud.modulos;
      }
      return ctx;
    } catch {
      window.localStorage.removeItem(this.CONTEXTO_STORAGE_KEY);
      return null;
    }
  }

  private persistContext(ctx: any): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    window.localStorage.setItem(this.CONTEXTO_STORAGE_KEY, JSON.stringify(ctx));
  }

  /**
   * Obtiene los módulos raíz
   */
  getModulosRaiz(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/modulos-raiz`);
  }

  getModulosPorPoliticas(policyCodes: string[]): Observable<string[]> {
    let params = new HttpParams();
    if (policyCodes.length > 0) {
      params = params.set('codes', policyCodes.join(','));
    }
    return this.http.get<string[]>(`${this.API_URL}/modulos-por-politicas`, { params });
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
  getPermissionMatrix(rol: string | number, politica: string | number): Observable<any> {
    const params = new HttpParams().set('rol', String(rol)).set('politica', String(politica));
    return this.http.get<any>(`${this.API_URL}/permisos/matriz`, { params });
  }
}
