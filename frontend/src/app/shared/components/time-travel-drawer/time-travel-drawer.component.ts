import { Component, Input, Output, EventEmitter, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { INodo } from '../../../core/models/ngac-admin.models';

export interface AuditRecord {
  id: string;
  action: 'CREAR' | 'MODIFICAR' | 'ELIMINAR' | 'RESTAURAR';
  timestamp: string;
  user: string;
  details: string;
}

@Component({
  selector: 'app-time-travel-drawer',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './time-travel-drawer.component.html',
  styleUrls: ['./time-travel-drawer.component.scss']
})
export class TimeTravelDrawerComponent {
  @Input() set node(val: INodo | null) {
    this._node.set(val);
    this.generateMockAuditHistory(val);
  }
  @Input() isOpen = false;
  @Output() closeDrawer = new EventEmitter<void>();

  private _node = signal<INodo | null>(null);
  public auditHistory = signal<AuditRecord[]>([]);

  // Derived signal to check if node was modified in the last 24h
  public hasRecentChanges = computed(() => {
    const history = this.auditHistory();
    if (!history.length) return false;
    
    const latestTimestamp = new Date(history[0].timestamp).getTime();
    const now = new Date().getTime();
    const hours24 = 24 * 60 * 60 * 1000;
    return (now - latestTimestamp) <= hours24;
  });

  generateMockAuditHistory(nodo: INodo | null) {
    if (!nodo) {
      this.auditHistory.set([]);
      return;
    }

    // In a real scenario, this would come from `GET /api/ngac/audit/:id`
    const now = new Date();
    const history: AuditRecord[] = [
      {
        id: '1',
        action: 'MODIFICAR',
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        user: 'ADMIN_USER',
        details: 'Modificó las propiedades del nodo ' + nodo.etiqueta
      },
      {
        id: '2',
        action: 'CREAR',
        timestamp: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
        user: 'SYSTEM',
        details: 'Creó el nodo inicial'
      }
    ];

    // Sometimes simulate soft delete
    if (nodo.activo === 'N') {
      history.unshift({
        id: '3',
        action: 'ELIMINAR',
        timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
        user: 'ADMIN_USER',
        details: 'Aplicó Soft Delete (Inactivación)'
      });
    }

    this.auditHistory.set(history);
  }

  getActionIcon(action: string): string {
    switch(action) {
      case 'CREAR': return 'add_circle';
      case 'MODIFICAR': return 'edit';
      case 'ELIMINAR': return 'delete';
      case 'RESTAURAR': return 'restore';
      default: return 'info';
    }
  }

  getActionColor(action: string): string {
    switch(action) {
      case 'CREAR': return 'text-green-500 bg-green-100';
      case 'MODIFICAR': return 'text-blue-500 bg-blue-100';
      case 'ELIMINAR': return 'text-red-500 bg-red-100';
      case 'RESTAURAR': return 'text-yellow-500 bg-yellow-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  }
}
