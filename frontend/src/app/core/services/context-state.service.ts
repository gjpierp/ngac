import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface NgacContext {
  politicaActiva: string;
  appIdActiva: string;
  usuarioId: string;
  roles: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ContextStateService {
  private contextSubject = new BehaviorSubject<NgacContext>({
    politicaActiva: 'POLICY_MENU',
    appIdActiva: 'SAFI_APP',
    usuarioId: '13259698',
    roles: ['ROL_DEV']
  });

  public context$ = this.contextSubject.asObservable();

  setContext(politicaActiva: string, appIdActiva: string, usuarioId?: string, roles?: string[]) {
    const current = this.contextSubject.value;
    this.contextSubject.next({
      politicaActiva,
      appIdActiva,
      usuarioId: usuarioId || current.usuarioId,
      roles: roles || current.roles
    });
  }

  updateUserInfo(usuarioId: string, roles: string[]) {
    const current = this.contextSubject.value;
    this.contextSubject.next({
      ...current,
      usuarioId,
      roles
    });
  }

  getContext(): NgacContext {
    return this.contextSubject.value;
  }
}
