import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { MenuItem } from '../models/menu-item.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private apiUrl = (environment as any).adminUrl ? `${(environment as any).adminUrl}/menus` : '/api/v1/admin/menus';

  constructor(private http: HttpClient) {}

  getCarpetasRaiz(id: number): Observable<MenuItem[]> {
    return this.http.get<unknown>(`${this.apiUrl}/raiz/${id}`).pipe(
      map((response) => this.normalizeMenuItems(response)),
      catchError(() => of([])),
    );
  }

  getCarpetasRaizSinHijos(id: number): Observable<MenuItem[]> {
    return this.http.get<unknown>(`${this.apiUrl}/raiz-sin-hijos/${id}`).pipe(
      map((response) => this.normalizeMenuItems(response)),
      catchError(() => of([])),
    );
  }

  private normalizeMenuItems(response: unknown): MenuItem[] {
    const rawItems = Array.isArray(response)
      ? response
      : Array.isArray((response as { data?: unknown[] } | null)?.data)
        ? (response as { data: unknown[] }).data
        : [];

    return rawItems.map((item: any) => ({
      id: Number(item?.id ?? item?.ID ?? item?.id_nodo ?? item?.ID_NODO ?? 0),
      nombre: String(item?.nombre ?? item?.NOMBRE ?? item?.etiqueta ?? item?.ETIQUETA ?? ''),
      descripcion: item?.descripcion ?? item?.DESCRIPCION ?? item?.desc ?? item?.DESC,
      tieneHijos: this.toBoolean(item?.tieneHijos ?? item?.TIENE_HIJOS ?? item?.tiene_hijos),
    }));
  }

  private toBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      return value === 1;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toUpperCase();
      return (
        normalized === 'S' ||
        normalized === 'Y' ||
        normalized === 'YES' ||
        normalized === '1' ||
        normalized === 'TRUE'
      );
    }

    return false;
  }
}
