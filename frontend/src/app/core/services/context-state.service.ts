import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface NgacContext {
  politicaActiva: string;
  appIdActiva: string;
  usuarioId: string;
  roles: string[];
}

@Injectable({
  providedIn: 'root',
})
export class ContextStateService {
  private readonly STORAGE_KEY = 'safi.ngac.context-state';
  private contextSubject = new BehaviorSubject<NgacContext>({
    politicaActiva: 'POLICY_MENU',
    appIdActiva: 'SAFI_APP',
    usuarioId: '13259698',
    roles: ['ROL_DEV'],
  });

  public context$ = this.contextSubject.asObservable();

  constructor() {
    const persisted = this.readPersistedContext();
    if (persisted) {
      this.contextSubject.next(persisted);
    }
  }

  setContext(politicaActiva: string, appIdActiva: string, usuarioId?: string, roles?: string[]) {
    const current = this.contextSubject.value;
    const nextContext = {
      politicaActiva,
      appIdActiva,
      usuarioId: usuarioId || current.usuarioId,
      roles: roles || current.roles,
    };
    this.contextSubject.next(nextContext);
    this.persistContext(nextContext);
  }

  updateUserInfo(usuarioId: string, roles: string[]) {
    const current = this.contextSubject.value;
    const nextContext = {
      ...current,
      usuarioId,
      roles,
    };
    this.contextSubject.next(nextContext);
    this.persistContext(nextContext);
  }

  getContext(): NgacContext {
    return this.contextSubject.value;
  }

  private readPersistedContext(): NgacContext | null {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }

    const raw = window.localStorage.getItem(this.STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as NgacContext;
    } catch {
      window.localStorage.removeItem(this.STORAGE_KEY);
      return null;
    }
  }

  private persistContext(context: NgacContext): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    window.localStorage.setItem(this.STORAGE_KEY, JSON.stringify(context));
  }
}
