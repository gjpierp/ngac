import { Injectable, signal, computed } from '@angular/core';

export interface DraftChange {
  id: string;
  type: 'UPDATE_ORDER' | 'UPDATE_PERMISSION' | 'SOFT_DELETE';
  payload: any;
}

@Injectable({
  providedIn: 'root'
})
export class NgacDraftService {
  private _changes = signal<DraftChange[]>([]);
  public changes = this._changes.asReadonly();
  
  public hasDrafts = computed(() => this._changes().length > 0);

  // Modo Impostor (Roles)
  private _imposterRole = signal<string | null>(null);
  public imposterRole = this._imposterRole.asReadonly();

  setImposterRole(role: string | null) {
    this._imposterRole.set(role);
  }

  addChange(change: DraftChange) {
    this._changes.update(drafts => {
      // If there's an existing change for the same entity and type, overwrite it
      const existingIdx = drafts.findIndex(d => d.id === change.id && d.type === change.type);
      if (existingIdx >= 0) {
        const updated = [...drafts];
        updated[existingIdx] = change;
        return updated;
      }
      return [...drafts, change];
    });
  }

  clearDrafts() {
    this._changes.set([]);
  }

  getDraftPayload() {
    return {
      modifications: this._changes(),
      audit_user: 'ADMIN' // or actual user session
    };
  }
}
