import { Component, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatrizPermisosComponent, MatrixRow, MatrixCell } from '../../shared/components/matriz-permisos/matriz-permisos.component';
import { AccesosService } from '../../core/services/accesos.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NGAC_OPERATIONS } from '../../core/models/ngac-admin.models';

@Component({
  selector: 'app-pagina-matriz-permisos',
  standalone: true,
  imports: [CommonModule, MatrizPermisosComponent, MatSnackBarModule],
  template: `
    <div class="animate-in fade-in duration-1000 flex flex-col h-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <!-- CABECERA PRINCIPAL PREMIUM -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-slate-100 pb-6">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <h1 class="text-3xl font-black text-slate-800 tracking-tight">
              Matriz de <span class="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Permisos</span>
            </h1>
          </div>
          <p class="text-slate-500 text-xs font-medium flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            Visualización interactiva y asignación rápida de operaciones permitidas sobre objetos por cada rol
          </p>
        </div>
      </div>

      <div class="bg-white border border-slate-100 rounded-[32px] shadow-xl shadow-slate-100/50 overflow-hidden p-8">
        <app-matriz-permisos
          [columns]="columns()"
          [rows]="rows()"
          [loading]="loading()"
          [roles]="roles()"
          [politicas]="politicas()"
          [selectedRole]="selectedRole()"
          [selectedPolicy]="selectedPolicy()"
          (cellToggle)="onCellToggle($event)"
          (filterChange)="onFilterChange($event)"
        ></app-matriz-permisos>
      </div>
    </div>
  `,
})
export class PaginaMatrizPermisos implements OnInit {
  columns = signal<string[]>([]);
  rows = signal<MatrixRow[]>([]);
  loading = signal(false);
  roles = signal<any[]>([]);
  politicas = signal<any[]>([]);
  operaciones = signal<string[]>([]);
  selectedRole = signal('');
  selectedPolicy = signal('');

  constructor(
    private accesosSvc: AccesosService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit() {
    this.loadRoles();
    this.loadPoliticas();
    this.loadOperaciones();
  }

  loadRoles() {
    this.accesosSvc.getRoles().subscribe({
      next: (roles) => this.roles.set(roles),
      error: () => this.snackBar.open('Error al cargar los roles', 'Cerrar', { duration: 4000 }),
    });
  }

  loadPoliticas() {
    this.accesosSvc.getPoliticasRaiz().subscribe({
      next: (pols) => this.politicas.set(pols),
      error: () =>
        this.snackBar.open('Error al cargar las políticas', 'Cerrar', { duration: 4000 }),
    });
  }

  loadOperaciones() {
    this.accesosSvc.getOperaciones().subscribe({
      next: (ops) => {
        const opNames = (ops || []).map((op: any) => op.nombre_op || op);
        this.operaciones.set(opNames.length ? opNames : NGAC_OPERATIONS);
        this.columns.set(opNames.length ? opNames : NGAC_OPERATIONS);
        this.loadMatrix();
      },
      error: () =>
        this.snackBar.open('Error al cargar las operaciones', 'Cerrar', { duration: 4000 }),
    });
  }

  loadMatrix() {
    this.loading.set(true);
    const rol = this.selectedRole();
    const politica = this.selectedPolicy();
    this.accesosSvc.getPermissionMatrix(rol, politica).subscribe({
      next: (resp) => {
        const ops = this.operaciones();
        // Agrupar por objeto (módulo/política)
        const grouped: Record<string, any[]> = {};
        (resp.data || []).forEach((perm: import('../../core/models/ngac-admin.models').Permiso) => {
          if (!grouped[perm.obj]) grouped[perm.obj] = [];
          grouped[perm.obj].push(perm);
        });
        const rows: MatrixRow[] = Object.entries(grouped).map(([obj, perms]) => {
          const label = perms[0]?.obj_etiqueta || obj;
          const cells: MatrixCell[] = ops.map((op) => {
            const found = perms.find((p) => (p.op || '').toUpperCase() === op.toUpperCase());
            return {
              value: !!found,
              editable: true,
            };
          });
          return { id: obj, label, cells };
        });
        this.rows.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.rows.set([]);
        this.loading.set(false);
        this.snackBar.open('Error al cargar la matriz de permisos', 'Cerrar', { duration: 4000 });
      },
    });
  }

  onCellToggle(event: { row: MatrixRow; colIndex: number }) {
    const rol = this.selectedRole();
    const obj = event.row.id;
    const op = this.columns()[event.colIndex];
    const cell = event.row.cells[event.colIndex];
    if (!rol || !obj || !op) {
      this.snackBar.open('Selecciona un rol y un objeto', 'Cerrar', { duration: 2000 });
      return;
    }
    this.loading.set(true);
    const action$ = cell.value
      ? this.accesosSvc.revocarPermiso(rol, obj, op)
      : this.accesosSvc.otorgarPermiso(rol, obj, op);
    action$.subscribe({
      next: () => {
        this.snackBar.open(cell.value ? 'Permiso revocado' : 'Permiso otorgado', 'Cerrar', {
          duration: 1500,
        });
        this.loadMatrix();
      },
      error: (err) => {
        this.snackBar.open('Error: ' + (err.error?.detail || err.message), 'Cerrar', {
          duration: 3000,
        });
        this.loading.set(false);
      },
    });
  }

  onFilterChange(event: { role: string; policy: string }) {
    this.selectedRole.set(event.role);
    this.selectedPolicy.set(event.policy);
    this.loadMatrix();
  }
}
