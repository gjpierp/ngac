import { Component, Inject, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SafiService } from '../../../core/services/safi.service';
import { AccesosService } from '../../../core/services/accesos.service';
import { ISafiUsuario, ISafiEntidad, ISafiUnidad } from '../../../core/models/ngac-admin.models';

interface RoleItem {
  id: string; // codigo_tecnico
  label: string; // etiqueta
}

@Component({
  selector: 'app-dialogo-gestor-usuario',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  template: `
    <div class="rounded-3xl overflow-hidden shadow-2xl bg-white max-w-xl w-full border border-gray-150 animate-in zoom-in-95 duration-200">
      
      <!-- Cabecera Premium del Gestor -->
      <div class="p-6 bg-slate-900 text-white relative flex justify-between items-start">
        <div class="absolute inset-0 bg-gradient-to-r from-slate-900 to-indigo-950 opacity-95 z-0"></div>
        
        <div class="relative z-10">
          <span class="text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 bg-indigo-500/25 border border-indigo-400/30 rounded-md text-indigo-300">
            ID SAFI: {{ usuario.id }}
          </span>
          <h3 class="text-xl font-extrabold mt-2 tracking-tight">{{ usuario.nombre }}</h3>
          <p class="text-slate-300 text-xs mt-1.5 flex items-center gap-1.5 font-medium">
            <mat-icon class="!w-4 !h-4 !text-sm text-slate-400">email</mat-icon>
            {{ usuario.email }}
          </p>
        </div>

        <button mat-icon-button (click)="close()" class="relative z-10 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Contenido de Gestión de Atributos y Roles -->
      <div class="p-6 space-y-6 max-h-[460px] overflow-y-auto">
        
        <!-- SECCIÓN 1: ROLES DE SEGURIDAD (NGAC) -->
        <div class="space-y-3">
          <h4 class="text-[11px] font-black uppercase tracking-widest text-slate-450 flex items-center gap-2">
            <mat-icon class="!w-4 !h-4 !text-base text-indigo-500">security</mat-icon>
            Roles de Seguridad (NGAC)
          </h4>
          
          <!-- Listado de Chips de Roles Asignados -->
          <div class="flex flex-wrap gap-2 min-h-[44px] p-3 bg-slate-50 border border-slate-100 rounded-2xl">
            <div *ngFor="let rol of assignedRoles()" 
                 class="group flex items-center gap-1.5 pl-3 pr-1 py-1 bg-indigo-50 border border-indigo-100/60 text-indigo-700 text-xs font-bold rounded-xl hover:bg-indigo-100 transition-colors">
              <span>{{ rol.label }}</span>
              <button (click)="revokeRole(rol.id)" 
                      matTooltip="Revocar rol"
                      class="w-5 h-5 rounded-lg flex items-center justify-center text-indigo-400 group-hover:text-red-500 group-hover:bg-red-50/50 hover:bg-indigo-200 transition-all">
                <mat-icon class="!w-3 !h-3 !text-xs">close</mat-icon>
              </button>
            </div>
            <div *ngIf="assignedRoles().length === 0" class="text-gray-400 text-xs italic py-1 pl-1">
              Ningún rol de seguridad asignado.
            </div>
          </div>

          <!-- Selector de Nuevo Rol -->
          <div *ngIf="availableRoles().length > 0" class="relative">
            <mat-select placeholder="Asignar nuevo rol..." 
                        (selectionChange)="assignRole($event.value); $event.source.value = null"
                        class="w-full p-3 bg-white border border-slate-200 rounded-2xl text-xs focus:outline-none shadow-sm cursor-pointer hover:border-indigo-400 transition-colors">
              <mat-option *ngFor="let r of availableRoles()" [value]="r.id">
                ➕ {{ r.label }}
              </mat-option>
            </mat-select>
          </div>
        </div>

        <hr class="border-gray-100">

        <!-- SECCIÓN 2: VINCULACIÓN COMERCIAL (ENTIDAD) -->
        <div class="space-y-2.5">
          <h4 class="text-[11px] font-black uppercase tracking-widest text-slate-450 flex items-center gap-2">
            <mat-icon class="!w-4 !h-4 !text-base text-amber-500">business</mat-icon>
            Entidad Comercial (SAFI)
          </h4>
          <div class="relative">
            <mat-select [ngModel]="selectedEntidadId()" 
                        (selectionChange)="onEntityChange($event.value)"
                        placeholder="Seleccionar entidad comercial..." 
                        class="w-full p-3 bg-white border border-slate-200 rounded-2xl text-xs focus:outline-none shadow-sm cursor-pointer hover:border-amber-400 transition-colors">
              <mat-option [value]="null" class="text-red-600 font-black">❌ Sin Entidad Comercial (Desvincular)</mat-option>
              <mat-option *ngFor="let e of entidades" [value]="e.id">
                🏢 {{ e.nombre }} ({{ e.slug }})
              </mat-option>
            </mat-select>
          </div>
        </div>

        <hr class="border-gray-100">

        <!-- SECCIÓN 3: UBICACIÓN ORGANIZACIONAL (UNIDAD) -->
        <div class="space-y-2.5">
          <h4 class="text-[11px] font-black uppercase tracking-widest text-slate-450 flex items-center gap-2">
            <mat-icon class="!w-4 !h-4 !text-base text-emerald-500">lan</mat-icon>
            Unidad Organizacional (SAFI)
          </h4>
          <div class="relative">
            <mat-select [ngModel]="selectedUnidadId()" 
                        (selectionChange)="onUnitChange($event.value)"
                        placeholder="Seleccionar unidad/área..." 
                        class="w-full p-3 bg-white border border-slate-200 rounded-2xl text-xs focus:outline-none shadow-sm cursor-pointer hover:border-emerald-400 transition-colors">
              <mat-option [value]="null" class="text-red-600 font-black">❌ Sin Unidad Organizacional (Desvincular)</mat-option>
              <mat-option *ngFor="let u of unidades" [value]="u.id">
                ⎔ {{ u.nombre }} ({{ u.slug }})
              </mat-option>
            </mat-select>
          </div>
        </div>

      </div>

      <!-- Footer de Sincronización -->
      <div class="bg-slate-50/80 p-4 border-t border-slate-100 flex items-center justify-between text-[9px] uppercase font-black tracking-widest text-slate-400">
        <span>Relational Integrity Engine</span>
        <span class="flex items-center gap-1.5" [ngClass]="loading() ? 'text-amber-500' : 'text-emerald-500'">
          <span class="w-1.5 h-1.5 rounded-full bg-current" [class.animate-pulse]="loading()"></span>
          {{ loading() ? 'Sincronizando...' : 'Conectado a Motor' }}
        </span>
      </div>

    </div>
  `,
})
export class DialogoGestorUsuarioComponent implements OnInit {
  usuario: ISafiUsuario;

  private safiSvc = inject(SafiService);
  private accesosSvc = inject(AccesosService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<DialogoGestorUsuarioComponent>);

  // Catálogos globales cargados al abrir
  entidades: ISafiEntidad[] = [];
  unidades: ISafiUnidad[] = [];
  allNodes = signal<any[]>([]);
  allLinks = signal<any[]>([]);
  roles = signal<any[]>([]);

  // Estado del usuario actual
  selectedEntidadId = signal<number | null>(null);
  selectedUnidadId = signal<number | null>(null);
  loading = signal<boolean>(false);

  // Computados de Roles
  assignedRoles = computed<RoleItem[]>(() => {
    const userNode = this.findUserNode();
    if (!userNode) return [];

    const userLinks = this.allLinks().filter(lnk => lnk.id_hijo === userNode.id_nodo);
    const assignedIds = new Set(userLinks.map(lnk => lnk.id_padre));

    return this.roles()
      .filter(r => assignedIds.has(r.id_nodo))
      .map(r => ({ id: r.codigo_tecnico, label: r.etiqueta }));
  });

  availableRoles = computed<RoleItem[]>(() => {
    const userNode = this.findUserNode();
    if (!userNode) return this.roles().map(r => ({ id: r.codigo_tecnico, label: r.etiqueta }));

    const userLinks = this.allLinks().filter(lnk => lnk.id_hijo === userNode.id_nodo);
    const assignedIds = new Set(userLinks.map(lnk => lnk.id_padre));

    return this.roles()
      .filter(r => !assignedIds.has(r.id_nodo))
      .map(r => ({ id: r.codigo_tecnico, label: r.etiqueta }));
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: { usuario: ISafiUsuario }) {
    this.usuario = data.usuario;
  }

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.loading.set(true);

    // 1. Cargar vínculos actuales del usuario (entidades/unidades)
    this.safiSvc.getUsuarioVinculos(this.usuario.id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const eId = res.data.entidadIds && res.data.entidadIds.length > 0 ? res.data.entidadIds[0] : null;
          const uId = res.data.unidadIds && res.data.unidadIds.length > 0 ? res.data.unidadIds[0] : null;
          this.selectedEntidadId.set(eId);
          this.selectedUnidadId.set(uId);
        }
      }
    });

    // 2. Cargar catálogos comerciales SAFI
    this.safiSvc.getEntidades().subscribe((res: ISafiEntidad[]) => {
      this.entidades = (res || []).filter((e: ISafiEntidad) => e.estado !== 0);
    });

    this.safiSvc.getUnidades().subscribe((res: ISafiUnidad[]) => {
      this.unidades = (res || []).filter((u: ISafiUnidad) => u.estado !== 0);
    });

    // 3. Cargar datos de red NGAC para cálculo de roles
    this.accesosSvc.getNodos().subscribe(nodos => {
      this.allNodes.set(nodos);
      this.roles.set(nodos.filter(n => n.tipo_nodo === 'ROL' || n.tipo_nodo === 'UA'));
    });

    this.accesosSvc.getEnlaces().subscribe(enlaces => {
      this.allLinks.set(enlaces);
      this.loading.set(false);
    });
  }

  findUserNode(): any {
    const slug = (this.usuario.nombre || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '_');
    
    // Buscar coincidencia en nodos de tipo USR o USER
    return this.allNodes().find(n => 
      n.codigo_tecnico === `USR_${this.usuario.id}` || 
      n.codigo_tecnico === slug.toUpperCase() ||
      n.etiqueta.toLowerCase() === this.usuario.nombre.toLowerCase()
    );
  }

  onEntityChange(newEntityId: number | null) {
    const oldEntityId = this.selectedEntidadId();
    this.loading.set(true);

    const completeChange = () => {
      if (newEntityId) {
        this.safiSvc.vincularUsuarioEntidad({ id_usuario: this.usuario.id, id_entidad: newEntityId }).subscribe({
          next: () => {
            this.selectedEntidadId.set(newEntityId);
            this.mostrarMensaje('✅ Entidad comercial vinculada');
            this.loading.set(false);
          },
          error: (err) => {
            this.mostrarMensaje('❌ Error al vincular entidad: ' + err.message, true);
            this.loading.set(false);
          }
        });
      } else {
        this.selectedEntidadId.set(null);
        this.mostrarMensaje('✅ Entidad comercial desvinculada');
        this.loading.set(false);
      }
    };

    if (oldEntityId) {
      this.safiSvc.desvincularUsuarioEntidad({ id_usuario: this.usuario.id, id_entidad: oldEntityId }).subscribe({
        next: () => completeChange(),
        error: () => completeChange()
      });
    } else {
      completeChange();
    }
  }

  onUnitChange(newUnidadId: number | null) {
    const oldUnidadId = this.selectedUnidadId();
    this.loading.set(true);

    const completeChange = () => {
      if (newUnidadId) {
        this.safiSvc.vincularUsuarioUnidad({ id_usuario: this.usuario.id, id_unidad: newUnidadId }).subscribe({
          next: () => {
            this.selectedUnidadId.set(newUnidadId);
            this.mostrarMensaje('✅ Unidad organizacional vinculada');
            this.loading.set(false);
          },
          error: (err) => {
            this.mostrarMensaje('❌ Error al vincular unidad: ' + err.message, true);
            this.loading.set(false);
          }
        });
      } else {
        this.selectedUnidadId.set(null);
        this.mostrarMensaje('✅ Unidad organizacional desvinculada');
        this.loading.set(false);
      }
    };

    if (oldUnidadId) {
      this.safiSvc.desvincularUsuarioUnidad({ id_usuario: this.usuario.id, id_unidad: oldUnidadId }).subscribe({
        next: () => completeChange(),
        error: () => completeChange()
      });
    } else {
      completeChange();
    }
  }

  assignRole(roleCode: string) {
    if (!roleCode) return;
    const userNode = this.findUserNode();
    if (!userNode) {
      this.mostrarMensaje('⚠️ No se encontró el nodo del usuario en el motor NGAC', true);
      return;
    }

    this.loading.set(true);
    this.accesosSvc.enlazarNodos(roleCode, userNode.codigo_tecnico).subscribe({
      next: () => {
        this.mostrarMensaje(`✅ Rol de seguridad asignado con éxito`);
        this.cargarDatos();
      },
      error: (err) => {
        this.mostrarMensaje('❌ Error al asignar rol: ' + err.message, true);
        this.loading.set(false);
      }
    });
  }

  revokeRole(roleCode: string) {
    const userNode = this.findUserNode();
    if (!userNode) {
      this.mostrarMensaje('⚠️ No se encontró el nodo del usuario en el motor NGAC', true);
      return;
    }

    this.loading.set(true);
    this.accesosSvc.deleteEnlace(roleCode, userNode.codigo_tecnico).subscribe({
      next: () => {
        this.mostrarMensaje(`✅ Rol de seguridad revocado con éxito`);
        this.cargarDatos();
      },
      error: (err) => {
        this.mostrarMensaje('❌ Error al revocar rol: ' + err.message, true);
        this.loading.set(false);
      }
    });
  }

  private mostrarMensaje(texto: string, error = false) {
    this.snackBar.open(texto, 'Cerrar', {
      duration: 3500,
      panelClass: error ? ['bg-red-600', 'text-white'] : ['bg-slate-800', 'text-white'],
      horizontalPosition: 'end',
      verticalPosition: 'bottom'
    });
  }

  close() {
    this.dialogRef.close();
  }
}
