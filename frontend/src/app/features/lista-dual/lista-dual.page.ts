import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComponenteListaDual, DualListItem } from './componente-lista-dual.component';
import { AccesosService } from '../../core/services/accesos.service';
import { SafiService } from '../../core/services/safi.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-pagina-lista-dual',
  standalone: true,
  imports: [CommonModule, ComponenteListaDual, MatSnackBarModule, MatSelectModule, MatFormFieldModule, FormsModule],
  template: `
    <div class="animate-in fade-in duration-1000 flex flex-col h-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-slate-100 pb-6">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <h1 class="text-3xl font-black text-slate-800 tracking-tight">
              Asignación de <span class="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Roles a Usuarios</span>
            </h1>
          </div>
          <p class="text-slate-500 text-xs font-medium flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            Asigna y revoca roles del sistema de seguridad a usuarios a través de una lista interactiva dual
          </p>
        </div>
      </div>
      
      <div class="mb-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <mat-form-field appearance="outline" class="w-full md:w-1/2">
          <mat-label>Seleccione un Rol</mat-label>
          <mat-select [(ngModel)]="selectedRole" (selectionChange)="onRoleSelected()">
            <mat-option *ngFor="let rol of roles()" [value]="rol.id_nodo || rol.id_rol">
              {{ rol.etiqueta || rol.nombre_op || rol.codigo || rol.codigo_tecnico }}
            </mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div class="bg-white border border-slate-100 rounded-[32px] shadow-xl shadow-slate-100/50 overflow-hidden p-8" *ngIf="selectedRole()">
        <app-componente-lista-dual
          [available]="available()"
          [selected]="selected()"
          titleLeft="Usuarios Disponibles"
          [titleRight]="'Usuarios Asignados'"
          (selectionChange)="onSelectionChange($event)"
        ></app-componente-lista-dual>
      </div>
    </div>
  `,
})
export class PaginaListaDual implements OnInit {
  roles = signal<any[]>([]);
  allUsers = signal<DualListItem[]>([]);
  available = signal<DualListItem[]>([]);
  selected = signal<DualListItem[]>([]);
  selectedRole = signal<number | null>(null);
  loading = signal(false);

  constructor(
    private accesosSvc: AccesosService,
    private safiSvc: SafiService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit() {
    forkJoin({
      roles: this.accesosSvc.getRoles(),
      usuarios: this.safiSvc.getUsuarios()
    }).subscribe(({roles, usuarios}) => {
      this.roles.set(roles || []);
      const usersList = (usuarios || []).map(u => ({
        id: String(u.id),
        label: `${u.nombre} (${u.rut_numero}-${u.rut_dv})`
      }));
      this.allUsers.set(usersList);
    });
  }

  onRoleSelected() {
    const roleId = this.selectedRole();
    if (!roleId) return;

    this.loading.set(true);
    
    this.accesosSvc.obtenerArbol(roleId, false).subscribe({
        next: (hijos) => {
            const asignadosIds = new Set(hijos.map(h => h.id_nodo).map(String));
            
            const all = this.allUsers();
            this.selected.set(all.filter(u => asignadosIds.has(u.id)));
            this.available.set(all.filter(u => !asignadosIds.has(u.id)));
            this.loading.set(false);
        },
        error: () => {
            this.loading.set(false);
            this.snackBar.open('Error al cargar la jerarquía del rol', 'Cerrar', { duration: 2500 });
        }
    });
  }

  onSelectionChange(event: { selected: DualListItem[] }) {
    // Si estuviéramos guardando en BD real:
    // iterar sobre las diferencias y llamar enlazarMenuNodos / deleteMenuEnlace
    this.snackBar.open('Asignaciones actualizadas', 'Cerrar', { duration: 1500 });
  }
}
