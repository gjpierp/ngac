import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { SafiService } from '../../core/services/safi.service';
import { AccesosService } from '../../core/services/accesos.service';
import { DialogoUsuarioComponent } from '../../shared/components/dialogo-usuario/dialogo-usuario.component';
import { DualListItem } from '../lista-dual/componente-lista-dual.component';
import { DialogoGestorUsuarioComponent } from '../../shared/components/dialogo-gestor-usuario/dialogo-gestor-usuario.component';
import { Router } from '@angular/router';
import {
  ISafiUsuario,
  ISafiEntidad,
  ISafiUnidad,
  ICrearSafiUsuarioDto,
  ICrearSafiUnidadDto,
  ICrearSafiEntidadDto,
  IVinculoUsuarioUnidadDto,
  IVinculoUsuarioEntidadDto,
  IVinculoUnidadEntidadDto
} from '../../core/models/ngac-admin.models';

@Component({
  selector: 'app-gestion-safi',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatDialogModule,
    MatTabsModule,
    DragDropModule,
  ],
  templateUrl: './gestion-safi.component.html',
})
export class GestionSafiComponent implements OnInit {
  // Estado local para tablas
  usuarios = signal<ISafiUsuario[]>([]);
  entidades = signal<ISafiEntidad[]>([]);
  unidades = signal<ISafiUnidad[]>([]);
  
  isUsuariosPage = computed(() => this.router.url.includes('/usuarios'));

  selectedUsuario = signal<ISafiUsuario | null>(null);
  allNodes = signal<any[]>([]);
  allLinks = signal<any[]>([]);
  roles = signal<any[]>([]);

  selectedUsuarioIdForRoles = signal<number | null>(null);
  loadingVinculos = signal<boolean>(false);

  // Vínculos de unidades con entidades
  unidadEntidadLinks = signal<{ id_unidad: number, id_entidad: number }[]>([]);

  // Vínculos del usuario seleccionado
  assignedEntidadIds = signal<number[]>([]);
  assignedUnidadIds = signal<number[]>([]);

  // Selección de Entidades en el Dual List
  availableEntidadesSelected = signal<Set<number>>(new Set());
  assignedEntidadesSelected = signal<Set<number>>(new Set());

  // Selección de Unidades en el Dual List
  availableUnidadesSelected = signal<Set<number>>(new Set());
  assignedUnidadesSelected = signal<Set<number>>(new Set());

  // Entidades disponibles vs asignadas
  availableEntidades = computed(() => {
    const assigned = new Set(this.assignedEntidadIds());
    return this.entidades().filter(e => !assigned.has(e.id));
  });

  assignedEntidades = computed(() => {
    const assigned = new Set(this.assignedEntidadIds());
    return this.entidades().filter(e => assigned.has(e.id));
  });

  // Unidades disponibles vs asignadas agrupadas por entidades
  groupedAvailableUnidades = computed(() => {
    const assignedIds = new Set(this.assignedUnidadIds());
    const availableAll = this.unidades().filter(u => !assignedIds.has(u.id));
    
    // Mapping of unitId -> list of entityIds it belongs to
    const unitToEntities = new Map<number, number[]>();
    for (const link of this.unidadEntidadLinks()) {
      if (!unitToEntities.has(link.id_unidad)) {
        unitToEntities.set(link.id_unidad, []);
      }
      unitToEntities.get(link.id_unidad)!.push(link.id_entidad);
    }

    const groups: { entity: ISafiEntidad | null; units: ISafiUnidad[] }[] = [];

    // Group for each entity
    for (const entity of this.entidades()) {
      const entityUnits = availableAll.filter(u => {
        const entIds = unitToEntities.get(u.id) || [];
        return entIds.includes(entity.id);
      });
      if (entityUnits.length > 0) {
        groups.push({ entity, units: entityUnits });
      }
    }

    // Fallback group for units without any entity
    const noEntityUnits = availableAll.filter(u => {
      const entIds = unitToEntities.get(u.id) || [];
      return entIds.length === 0;
    });
    if (noEntityUnits.length > 0) {
      groups.push({ entity: null, units: noEntityUnits });
    }

    return groups;
  });

  groupedAssignedUnidades = computed(() => {
    const assignedIds = new Set(this.assignedUnidadIds());
    const assignedAll = this.unidades().filter(u => assignedIds.has(u.id));
    
    // Mapping of unitId -> list of entityIds it belongs to
    const unitToEntities = new Map<number, number[]>();
    for (const link of this.unidadEntidadLinks()) {
      if (!unitToEntities.has(link.id_unidad)) {
        unitToEntities.set(link.id_unidad, []);
      }
      unitToEntities.get(link.id_unidad)!.push(link.id_entidad);
    }

    const groups: { entity: ISafiEntidad | null; units: ISafiUnidad[] }[] = [];

    // Group for each entity
    for (const entity of this.entidades()) {
      const entityUnits = assignedAll.filter(u => {
        const entIds = unitToEntities.get(u.id) || [];
        return entIds.includes(entity.id);
      });
      if (entityUnits.length > 0) {
        groups.push({ entity, units: entityUnits });
      }
    }

    // Fallback group for units without any entity
    const noEntityUnits = assignedAll.filter(u => {
      const entIds = unitToEntities.get(u.id) || [];
      return entIds.length === 0;
    });
    if (noEntityUnits.length > 0) {
      groups.push({ entity: null, units: noEntityUnits });
    }

    return groups;
  });

  // Direct signals from dedicated API — no fuzzy node matching
  assignedRolesData = signal<{ codigo?: string; codigoRol?: string; nombre: string }[]>([]);

  assignedRoles = computed(() =>
    this.assignedRolesData().map(r => ({ id: r.codigo || r.codigoRol || '', label: r.nombre }))
  );

  availableRoles = computed(() => {
    const user = this.selectedUsuario();
    if (!user) return [];
    const assignedCodes = new Set(this.assignedRolesData().map(r => r.codigo || r.codigoRol || ''));
    return this.roles()
      .filter(r => !assignedCodes.has(r.codigo))
      .map(r => ({ id: r.codigo, label: r.nombre }));
  });

  loadRolesForUser(userId: number) {
    this.loadingVinculos.set(true);
    this.accesosSvc.getRolesDeUsuario(userId).subscribe({
      next: (res) => {
        this.assignedRolesData.set(res?.data || []);
        this.loadingVinculos.set(false);
      },
      error: () => {
        this.assignedRolesData.set([]);
        this.loadingVinculos.set(false);
      }
    });
  }

  availableRolesSelected = signal<Set<string>>(new Set());
  assignedRolesSelected = signal<Set<string>>(new Set());

  toggleAvailableRoleSelection(roleCode: string) {
    const s = new Set(this.availableRolesSelected());
    if (s.has(roleCode)) {
      s.delete(roleCode);
    } else {
      s.add(roleCode);
    }
    this.availableRolesSelected.set(s);
  }

  toggleAssignedRoleSelection(roleCode: string) {
    const s = new Set(this.assignedRolesSelected());
    if (s.has(roleCode)) {
      s.delete(roleCode);
    } else {
      s.add(roleCode);
    }
    this.assignedRolesSelected.set(s);
  }

  moveSelectedToAssigned() {
    const selected = Array.from(this.availableRolesSelected());
    if (selected.length === 0) return;
    const user = this.selectedUsuario();
    if (!user) return;

    this.loadingVinculos.set(true);
    let completed = 0;
    const assignNext = () => {
      if (completed >= selected.length) {
        this.mostrarMensaje('✅ Roles asignados con éxito');
        this.availableRolesSelected.set(new Set());
        this.loadRolesForUser(user.id);
        return;
      }
      this.accesosSvc.asignarRolAUsuario(user.id, selected[completed]).subscribe({
        next: () => { completed++; assignNext(); },
        error: (err) => {
          this.mostrarMensaje('❌ Error al asignar algunos roles: ' + (err.error?.detail || err.message), true);
          this.loadRolesForUser(user.id);
        }
      });
    };
    assignNext();
  }

  moveAllToAssigned() {
    const available = this.availableRoles().map(r => r.id);
    if (available.length === 0) return;
    const user = this.selectedUsuario();
    if (!user) return;

    this.loadingVinculos.set(true);
    let completed = 0;
    const assignNext = () => {
      if (completed >= available.length) {
        this.mostrarMensaje('✅ Todos los roles asignados');
        this.availableRolesSelected.set(new Set());
        this.loadRolesForUser(user.id);
        return;
      }
      this.accesosSvc.asignarRolAUsuario(user.id, available[completed]).subscribe({
        next: () => { completed++; assignNext(); },
        error: (err) => {
          this.mostrarMensaje('❌ Error al asignar todos los roles: ' + (err.error?.detail || err.message), true);
          this.loadRolesForUser(user.id);
        }
      });
    };
    assignNext();
  }

  moveSelectedToAvailable() {
    const selected = Array.from(this.assignedRolesSelected());
    if (selected.length === 0) return;
    const user = this.selectedUsuario();
    if (!user) return;

    this.loadingVinculos.set(true);
    let completed = 0;
    const revokeNext = () => {
      if (completed >= selected.length) {
        this.mostrarMensaje('✅ Roles revocados con éxito');
        this.assignedRolesSelected.set(new Set());
        this.loadRolesForUser(user.id);
        return;
      }
      this.accesosSvc.revocarRolDeUsuario(user.id, selected[completed]).subscribe({
        next: () => { completed++; revokeNext(); },
        error: (err) => {
          this.mostrarMensaje('❌ Error al revocar algunos roles: ' + (err.error?.detail || err.message), true);
          this.loadRolesForUser(user.id);
        }
      });
    };
    revokeNext();
  }

  moveAllToAvailable() {
    const assigned = this.assignedRoles().map(r => r.id);
    if (assigned.length === 0) return;
    const user = this.selectedUsuario();
    if (!user) return;

    this.loadingVinculos.set(true);
    let completed = 0;
    const revokeNext = () => {
      if (completed >= assigned.length) {
        this.mostrarMensaje('✅ Todos los roles revocados');
        this.assignedRolesSelected.set(new Set());
        this.loadRolesForUser(user.id);
        return;
      }
      this.accesosSvc.revocarRolDeUsuario(user.id, assigned[completed]).subscribe({
        next: () => { completed++; revokeNext(); },
        error: (err) => {
          this.mostrarMensaje('❌ Error al revocar todos los roles: ' + (err.error?.detail || err.message), true);
          this.loadRolesForUser(user.id);
        }
      });
    };
    revokeNext();
  }

  onRoleDrop(event: CdkDragDrop<any[]>) {
    if (event.previousContainer === event.container) return;
    const role = event.item.data;
    if (!role) return;
    if (event.container.id === 'assigned-list') {
      this.assignRole(role.id);
    } else {
      this.revokeRole(role.id);
    }
  }

  // Filtros de búsqueda
  filtroUsuario = signal('');
  filtroEntidad = signal('');
  filtroUnidad = signal('');

  // Listas filtradas reactivas
  usuariosFiltrados = computed(() => {
    const q = this.filtroUsuario().toLowerCase();
    return this.usuarios().filter(u => 
      u.nombre.toLowerCase().includes(q) || 
      u.email.toLowerCase().includes(q) || 
      String(u.id).includes(q)
    );
  });

  entidadesFiltrados = computed(() => {
    const q = this.filtroEntidad().toLowerCase();
    return this.entidades().filter(e => 
      e.nombre.toLowerCase().includes(q) || 
      e.slug.toLowerCase().includes(q) || 
      (e.desc || '').toLowerCase().includes(q)
    );
  });

  unidadesFiltrados = computed(() => {
    const q = this.filtroUnidad().toLowerCase();
    return this.unidades().filter(u => 
      u.nombre.toLowerCase().includes(q) || 
      u.slug.toLowerCase().includes(q) || 
      (u.desc || '').toLowerCase().includes(q)
    );
  });

  // Formularios de Creación / Edición
  usuarioForm: FormGroup;
  entidadForm: FormGroup;
  unidadForm: FormGroup;
  vinculoForm: FormGroup;

  // Modos de formulario
  showUsuarioForm = false;
  showEntidadForm = false;
  showUnidadForm = false;

  constructor(
    private fb: FormBuilder,
    private safiSvc: SafiService,
    private accesosSvc: AccesosService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    // Inicialización de formularios reactivos
    this.usuarioForm = this.fb.group({
      slug_usuario: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_\-]+$/)]],
      rut: ['', [Validators.required]],
      nombres: ['', [Validators.required]],
      apellidos: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
    });

    this.entidadForm = this.fb.group({
      slug_entidad: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_\-]+$/)]],
      nombre_entidad: ['', [Validators.required]],
      tipo_entidad: ['ENTIDAD', [Validators.required]],
    });

    this.unidadForm = this.fb.group({
      slug_unidad: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_\-]+$/)]],
      nombre_unidad: ['', [Validators.required]],
      descripcion: ['', [Validators.required]],
    });

    this.vinculoForm = this.fb.group({
      tipo: ['usuario-unidad', [Validators.required]],
      usuario_id: [null],
      unidad_id: [null],
      entidad_id: [null],
    });
  }

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.safiSvc.getUsuarios().subscribe({
      next: (data) => this.usuarios.set(data || []),
      error: () => this.mostrarMensaje('❌ Error al cargar usuarios SAFI', true),
    });

    this.safiSvc.getEntidades().subscribe({
      next: (data) => this.entidades.set(data || []),
      error: () => this.mostrarMensaje('❌ Error al cargar entidades SAFI', true),
    });

    this.safiSvc.getUnidades().subscribe({
      next: (data) => this.unidades.set(data || []),
      error: () => this.mostrarMensaje('❌ Error al cargar unidades SAFI', true),
    });

    this.safiSvc.getUnidadEntidadVinculos().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.unidadEntidadLinks.set(res.data);
        }
      }
    });

    this.accesosSvc.getNodos().subscribe({
      next: (data) => this.allNodes.set(data || []),
    });

    this.accesosSvc.getEnlaces().subscribe({
      next: (data) => this.allLinks.set(data || []),
    });

    this.accesosSvc.getRoles().subscribe({
      next: (data) => this.roles.set(data || []),
    });
  }

  // ==========================================
  // FLUJO DE USUARIOS
  // ==========================================

  abrirDialogoCrearUsuario() {
    const dialogRef = this.dialog.open(DialogoUsuarioComponent, {
      width: '600px',
      data: {}
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        // Generar slug_usuario automáticamente de nombres y apellidos
        const slug = this.normalizeText(`${res.nombres}_${res.apellidos}`);
        const dto: ICrearSafiUsuarioDto = {
          slug_usuario: slug,
          rut: res.rut,
          nombres: res.nombres,
          apellidos: res.apellidos,
          email: res.email
        };

        this.safiSvc.crearUsuario(dto).subscribe({
          next: (response) => {
            this.mostrarMensaje(`✅ Usuario creado con éxito`);
            this.cargarDatos();
          },
          error: (err) => this.mostrarMensaje('❌ Error al crear: ' + (err.error?.error || err.message), true)
        });
      }
    });
  }

  abrirDialogoEditarUsuario(u: ISafiUsuario, event: Event) {
    event.stopPropagation(); // Evitar seleccionar usuario al hacer clic en editar

    const dialogRef = this.dialog.open(DialogoUsuarioComponent, {
      width: '600px',
      data: { usuario: u }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        const fullNombre = `${res.nombres} ${res.apellidos}`;
        const updatedUser = {
          id: u.id,
          nombre: fullNombre,
          email: res.email,
          estado: res.estado
        };

        this.safiSvc.upsertUsuario(updatedUser).subscribe({
          next: () => {
            this.mostrarMensaje(`✅ Usuario actualizado con éxito`);
            this.cargarDatos();
            // Actualizar el seleccionado si era este
            if (this.selectedUsuario()?.id === u.id) {
              this.selectedUsuario.set({ ...u, ...updatedUser });
            }
          },
          error: (err) => this.mostrarMensaje('❌ Error al actualizar: ' + err.message, true)
        });
      }
    });
  }

  desactivarUsuarioSafi(id: number, event: Event) {
    event.stopPropagation(); // Evitar seleccionar el usuario
    if (confirm(`¿Está seguro de desactivar el usuario SAFI con ID ${id}?`)) {
      this.safiSvc.desactivarUsuario(id).subscribe({
        next: () => {
          this.mostrarMensaje('✅ Usuario desactivado con éxito');
          this.cargarDatos();
        },
        error: (err) => this.mostrarMensaje('❌ Error al desactivar: ' + err.message, true),
      });
    }
  }

  selectUsuario(u: ISafiUsuario) {
    this.selectedUsuario.set(u);
    this.selectedUsuarioIdForRoles.set(u.id);
    this.availableRolesSelected.set(new Set());
    this.assignedRolesSelected.set(new Set());
    this.availableEntidadesSelected.set(new Set());
    this.assignedEntidadesSelected.set(new Set());
    this.availableUnidadesSelected.set(new Set());
    this.assignedUnidadesSelected.set(new Set());
    this.assignedRolesData.set([]);

    // Cargar roles desde el endpoint dedicado
    this.loadRolesForUser(u.id);

    // Cargar vínculos comerciales en tiempo real
    this.reloadUserVinculos(u.id);
  }

  volverAlListado() {
    this.selectedUsuario.set(null);
    this.selectedUsuarioIdForRoles.set(null);
    this.assignedEntidadIds.set([]);
    this.assignedUnidadIds.set([]);
    this.availableRolesSelected.set(new Set());
    this.assignedRolesSelected.set(new Set());
    this.availableEntidadesSelected.set(new Set());
    this.assignedEntidadesSelected.set(new Set());
    this.availableUnidadesSelected.set(new Set());
    this.assignedUnidadesSelected.set(new Set());
    this.assignedRolesData.set([]);
    this.cargarDatos();
  }

  reloadUserVinculos(userId: number) {
    this.loadingVinculos.set(true);
    this.safiSvc.getUsuarioVinculos(userId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.assignedEntidadIds.set(res.data.entidadIds || []);
          this.assignedUnidadIds.set(res.data.unidadIds || []);
        } else {
          this.assignedEntidadIds.set([]);
          this.assignedUnidadIds.set([]);
        }
        this.loadingVinculos.set(false);
      },
      error: () => {
        this.assignedEntidadIds.set([]);
        this.assignedUnidadIds.set([]);
        this.loadingVinculos.set(false);
      }
    });
  }

  // --- ENTIDADES DUAL LIST ACTIONS ---
  toggleAvailableEntidadSelection(entidadId: number) {
    const s = new Set(this.availableEntidadesSelected());
    if (s.has(entidadId)) {
      s.delete(entidadId);
    } else {
      s.add(entidadId);
    }
    this.availableEntidadesSelected.set(s);
  }

  toggleAssignedEntidadSelection(entidadId: number) {
    const s = new Set(this.assignedEntidadesSelected());
    if (s.has(entidadId)) {
      s.delete(entidadId);
    } else {
      s.add(entidadId);
    }
    this.assignedEntidadesSelected.set(s);
  }

  moveSelectedEntidadesToAssigned() {
    const selected = Array.from(this.availableEntidadesSelected());
    if (selected.length === 0) return;
    const user = this.selectedUsuario();
    if (!user) return;

    this.loadingVinculos.set(true);
    let completed = 0;
    const assignNext = () => {
      if (completed >= selected.length) {
        this.mostrarMensaje('✅ Entidades asociadas con éxito');
        this.availableEntidadesSelected.set(new Set());
        this.reloadUserVinculos(user.id);
        return;
      }
      this.safiSvc.vincularUsuarioEntidad({ id_usuario: user.id, id_entidad: selected[completed] }).subscribe({
        next: () => { completed++; assignNext(); },
        error: (err) => {
          this.mostrarMensaje('❌ Error al asociar algunas entidades: ' + err.message, true);
          this.reloadUserVinculos(user.id);
        }
      });
    };
    assignNext();
  }

  moveAllEntidadesToAssigned() {
    const available = this.availableEntidades().map(e => e.id);
    if (available.length === 0) return;
    const user = this.selectedUsuario();
    if (!user) return;

    this.loadingVinculos.set(true);
    let completed = 0;
    const assignNext = () => {
      if (completed >= available.length) {
        this.mostrarMensaje('✅ Todas las entidades asociadas');
        this.availableEntidadesSelected.set(new Set());
        this.reloadUserVinculos(user.id);
        return;
      }
      this.safiSvc.vincularUsuarioEntidad({ id_usuario: user.id, id_entidad: available[completed] }).subscribe({
        next: () => { completed++; assignNext(); },
        error: (err) => {
          this.mostrarMensaje('❌ Error al asociar todas las entidades: ' + err.message, true);
          this.reloadUserVinculos(user.id);
        }
      });
    };
    assignNext();
  }

  moveSelectedEntidadesToAvailable() {
    const selected = Array.from(this.assignedEntidadesSelected());
    if (selected.length === 0) return;
    const user = this.selectedUsuario();
    if (!user) return;

    this.loadingVinculos.set(true);
    let completed = 0;
    const revokeNext = () => {
      if (completed >= selected.length) {
        this.mostrarMensaje('✅ Entidades desvinculadas con éxito');
        this.assignedEntidadesSelected.set(new Set());
        this.reloadUserVinculos(user.id);
        return;
      }
      this.safiSvc.desvincularUsuarioEntidad({ id_usuario: user.id, id_entidad: selected[completed] }).subscribe({
        next: () => { completed++; revokeNext(); },
        error: (err) => {
          this.mostrarMensaje('❌ Error al desvincular algunas entidades: ' + err.message, true);
          this.reloadUserVinculos(user.id);
        }
      });
    };
    revokeNext();
  }

  moveAllEntidadesToAvailable() {
    const assigned = this.assignedEntidades().map(e => e.id);
    if (assigned.length === 0) return;
    const user = this.selectedUsuario();
    if (!user) return;

    this.loadingVinculos.set(true);
    let completed = 0;
    const revokeNext = () => {
      if (completed >= assigned.length) {
        this.mostrarMensaje('✅ Todas las entidades desvinculadas');
        this.assignedEntidadesSelected.set(new Set());
        this.reloadUserVinculos(user.id);
        return;
      }
      this.safiSvc.desvincularUsuarioEntidad({ id_usuario: user.id, id_entidad: assigned[completed] }).subscribe({
        next: () => { completed++; revokeNext(); },
        error: (err) => {
          this.mostrarMensaje('❌ Error al desvincular todas las entidades: ' + err.message, true);
          this.reloadUserVinculos(user.id);
        }
      });
    };
    revokeNext();
  }

  // --- UNIDADES DUAL LIST ACTIONS ---
  toggleAvailableUnidadSelection(unidadId: number) {
    const s = new Set(this.availableUnidadesSelected());
    if (s.has(unidadId)) {
      s.delete(unidadId);
    } else {
      s.add(unidadId);
    }
    this.availableUnidadesSelected.set(s);
  }

  toggleAssignedUnidadSelection(unidadId: number) {
    const s = new Set(this.assignedUnidadesSelected());
    if (s.has(unidadId)) {
      s.delete(unidadId);
    } else {
      s.add(unidadId);
    }
    this.assignedUnidadesSelected.set(s);
  }

  moveSelectedUnidadesToAssigned() {
    const selected = Array.from(this.availableUnidadesSelected());
    if (selected.length === 0) return;
    const user = this.selectedUsuario();
    if (!user) return;

    this.loadingVinculos.set(true);
    let completed = 0;
    const assignNext = () => {
      if (completed >= selected.length) {
        this.mostrarMensaje('✅ Unidades asociadas con éxito');
        this.availableUnidadesSelected.set(new Set());
        this.reloadUserVinculos(user.id);
        return;
      }
      this.safiSvc.vincularUsuarioUnidad({ id_usuario: user.id, id_unidad: selected[completed] }).subscribe({
        next: () => { completed++; assignNext(); },
        error: (err) => {
          this.mostrarMensaje('❌ Error al asociar algunas unidades: ' + err.message, true);
          this.reloadUserVinculos(user.id);
        }
      });
    };
    assignNext();
  }

  moveAllUnidadesToAssigned() {
    const assignedIds = new Set(this.assignedUnidadIds());
    const available = this.unidades().filter(u => !assignedIds.has(u.id)).map(u => u.id);
    if (available.length === 0) return;
    const user = this.selectedUsuario();
    if (!user) return;

    this.loadingVinculos.set(true);
    let completed = 0;
    const assignNext = () => {
      if (completed >= available.length) {
        this.mostrarMensaje('✅ Todas las unidades asociadas');
        this.availableUnidadesSelected.set(new Set());
        this.reloadUserVinculos(user.id);
        return;
      }
      this.safiSvc.vincularUsuarioUnidad({ id_usuario: user.id, id_unidad: available[completed] }).subscribe({
        next: () => { completed++; assignNext(); },
        error: (err) => {
          this.mostrarMensaje('❌ Error al asociar todas las unidades: ' + err.message, true);
          this.reloadUserVinculos(user.id);
        }
      });
    };
    assignNext();
  }

  moveSelectedUnidadesToAvailable() {
    const selected = Array.from(this.assignedUnidadesSelected());
    if (selected.length === 0) return;
    const user = this.selectedUsuario();
    if (!user) return;

    this.loadingVinculos.set(true);
    let completed = 0;
    const revokeNext = () => {
      if (completed >= selected.length) {
        this.mostrarMensaje('✅ Unidades desvinculadas con éxito');
        this.assignedUnidadesSelected.set(new Set());
        this.reloadUserVinculos(user.id);
        return;
      }
      this.safiSvc.desvincularUsuarioUnidad({ id_usuario: user.id, id_unidad: selected[completed] }).subscribe({
        next: () => { completed++; revokeNext(); },
        error: (err) => {
          this.mostrarMensaje('❌ Error al desvincular algunas unidades: ' + err.message, true);
          this.reloadUserVinculos(user.id);
        }
      });
    };
    revokeNext();
  }

  moveAllUnidadesToAvailable() {
    const assigned = this.assignedUnidadIds();
    if (assigned.length === 0) return;
    const user = this.selectedUsuario();
    if (!user) return;

    this.loadingVinculos.set(true);
    let completed = 0;
    const revokeNext = () => {
      if (completed >= assigned.length) {
        this.mostrarMensaje('✅ Todas las unidades desvinculadas');
        this.assignedUnidadesSelected.set(new Set());
        this.reloadUserVinculos(user.id);
        return;
      }
      this.safiSvc.desvincularUsuarioUnidad({ id_usuario: user.id, id_unidad: assigned[completed] }).subscribe({
        next: () => { completed++; revokeNext(); },
        error: (err) => {
          this.mostrarMensaje('❌ Error al desvincular todas las unidades: ' + err.message, true);
          this.reloadUserVinculos(user.id);
        }
      });
    };
    revokeNext();
  }

  assignRole(roleCode: string) {
    const user = this.selectedUsuario();
    if (!user) return;

    this.accesosSvc.asignarRolAUsuario(user.id, roleCode).subscribe({
      next: () => {
        this.mostrarMensaje(`✅ Rol asignado con éxito`);
        this.loadRolesForUser(user.id);
      },
      error: (err) => {
        this.mostrarMensaje('❌ Error al asignar rol: ' + (err.error?.detail || err.message), true);
      }
    });
  }

  revokeRole(roleCode: string) {
    const user = this.selectedUsuario();
    if (!user) return;

    this.accesosSvc.revocarRolDeUsuario(user.id, roleCode).subscribe({
      next: () => {
        this.mostrarMensaje(`✅ Rol revocado con éxito`);
        this.loadRolesForUser(user.id);
      },
      error: (err) => {
        this.mostrarMensaje('❌ Error al revocar rol: ' + (err.error?.detail || err.message), true);
      }
    });
  }

  normalizeText(text: string): string {
    return text
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Eliminar tildes
      .replace(/\s+/g, '_')           // Espacios por guiones bajos
      .replace(/[^A-Z0-9_]/g, '');    // Solo letras, números y guiones bajos
  }

  cleanRut(rut: string): string {
    if (!rut) return '';
    return rut.replace(/[^0-9kK]/g, '').toUpperCase();
  }

  findUserNode(user: ISafiUsuario | null): any {
    if (!user) return null;
    const nameLower = user.nombre.toLowerCase().trim();
    // 1. Intentar buscar por etiqueta exacta
    let found = this.allNodes().find(n => n.etiqueta.toLowerCase().trim() === nameLower);
    if (!found) {
      // 2. Intentar buscar por codigo_tecnico normalizado (slug)
      const slugName = this.normalizeText(user.nombre);
      found = this.allNodes().find(n => n.codigo_tecnico.toUpperCase() === slugName);
    }
    if (!found) {
      // 3. Fallback a coincidencia parcial por ID en el código técnico
      const idStr = String(user.id);
      found = this.allNodes().find(n => n.codigo_tecnico.includes(idStr));
    }
    return found;
  }

  getAssignedRolesForSelectedUser(): any[] {
    return []; // Deprecated, left for compatibility if needed elsewhere
  }

  getAvailableRolesForSelectedUser(): any[] {
    return []; // Deprecated, left for compatibility if needed elsewhere
  }

  quickAssignRole(rol: any) {
    // Deprecated
  }

  quickUnassignRole(rol: any) {
    // Deprecated
  }

  onUserRolesSelected(userId: number) {
    this.selectedUsuarioIdForRoles.set(userId);
  }

  assignedRolesDual = computed<DualListItem[]>(() => {
    const userId = this.selectedUsuarioIdForRoles();
    if (!userId) return [];
    const user = this.usuarios().find(u => u.id === userId);
    if (!user) return [];
    const userNode = this.findUserNode(user);
    if (!userNode) return [];

    const assignedCodes = this.allLinks()
      .filter(link => link.id_hijo === userNode.id_nodo || link.hijo === userNode.codigo_tecnico)
      .map(link => link.padre || link.id_padre);

    const assignedRoles = this.roles().filter(r => 
      assignedCodes.includes(r.codigo) || 
      assignedCodes.includes(r.id_rol) ||
      assignedCodes.includes(r.nombre)
    );
    return assignedRoles.map(r => ({ id: r.codigo, label: r.nombre }));
  });

  availableRolesDual = computed<DualListItem[]>(() => {
    const assignedRoles = this.assignedRolesDual();
    const assignedRolesCodes = assignedRoles.map(r => r.id);
    const availableRoles = this.roles().filter(r => !assignedRolesCodes.includes(r.codigo));
    return availableRoles.map(r => ({ id: r.codigo, label: r.nombre }));
  });

  onRolesDualChange(event: { selected: DualListItem[] }) {
    const userId = this.selectedUsuarioIdForRoles();
    if (!userId) return;
    const user = this.usuarios().find(u => u.id === userId);
    if (!user) return;
    const userNode = this.findUserNode(user);
    if (!userNode) {
      this.mostrarMensaje('⚠️ No se encontró el nodo del usuario en NGAC', true);
      return;
    }

    const newSelectedRoleCodes = event.selected.map(item => item.id);
    const currentAssignedRoleCodes = this.assignedRolesDual().map(item => item.id);

    const rolesToAssign = newSelectedRoleCodes.filter(code => !currentAssignedRoleCodes.includes(code));
    const rolesToUnassign = currentAssignedRoleCodes.filter(code => !newSelectedRoleCodes.includes(code));

    let completados = 0;
    const total = rolesToAssign.length + rolesToUnassign.length;
    
    if (total === 0) return;

    const checkComplete = () => {
      completados++;
      if (completados === total) {
        this.mostrarMensaje(`✅ Roles actualizados con éxito`);
        this.cargarDatos(); // Refresh links
      }
    };

    rolesToAssign.forEach(codigo => {
      this.accesosSvc.enlazarNodos(codigo, userNode.codigo_tecnico).subscribe({
        next: () => checkComplete(),
        error: (err) => {
          this.mostrarMensaje('❌ Error al asignar rol: ' + err.message, true);
          checkComplete();
        },
      });
    });

    rolesToUnassign.forEach(codigo => {
      this.accesosSvc.deleteEnlace(codigo, userNode.codigo_tecnico).subscribe({
        next: () => checkComplete(),
        error: (err) => {
          this.mostrarMensaje('❌ Error al revocar rol: ' + err.message, true);
          checkComplete();
        },
      });
    });
  }

  // ==========================================
  // FLUJO DE ENTIDADES
  // ==========================================

  crearEntidadSafi() {
    if (this.entidadForm.invalid) return;
    const dto: ICrearSafiEntidadDto = this.entidadForm.value;

    this.safiSvc.crearEntidad(dto).subscribe({
      next: (res) => {
        this.mostrarMensaje(`✅ Entidad creada con ID: ${res.data?.id_entidad || 'Exitoso'}`);
        this.entidadForm.reset({ tipo_entidad: 'ENTIDAD' });
        this.showEntidadForm = false;
        this.cargarDatos();
      },
      error: (err) => this.mostrarMensaje('❌ Error: ' + (err.error?.error || err.message), true),
    });
  }

  eliminarEntidadSafi(id: number) {
    if (confirm(`¿Está seguro de eliminar permanentemente la entidad SAFI con ID ${id}?`)) {
      this.safiSvc.deleteEntidad(id).subscribe({
        next: () => {
          this.mostrarMensaje('✅ Entidad eliminada con éxito');
          this.cargarDatos();
        },
        error: (err) => this.mostrarMensaje('❌ Error al eliminar: ' + err.message, true),
      });
    }
  }

  // ==========================================
  // FLUJO DE UNIDADES
  // ==========================================

  crearUnidadSafi() {
    if (this.unidadForm.invalid) return;
    const dto: ICrearSafiUnidadDto = this.unidadForm.value;

    this.safiSvc.crearUnidad(dto).subscribe({
      next: (res) => {
        this.mostrarMensaje(`✅ Unidad creada con ID: ${res.data?.id_unidad || 'Exitoso'}`);
        this.unidadForm.reset();
        this.showUnidadForm = false;
        this.cargarDatos();
      },
      error: (err) => this.mostrarMensaje('❌ Error: ' + (err.error?.error || err.message), true),
    });
  }

  eliminarUnidadSafi(id: number) {
    if (confirm(`¿Está seguro de eliminar permanentemente la unidad SAFI con ID ${id}?`)) {
      this.safiSvc.deleteUnidad(id).subscribe({
        next: () => {
          this.mostrarMensaje('✅ Unidad eliminada con éxito');
          this.cargarDatos();
        },
        error: (err) => this.mostrarMensaje('❌ Error al eliminar: ' + err.message, true),
      });
    }
  }

  // ==========================================
  // FLUJO DE VÍNCULOS / ASOCIACIONES
  // ==========================================

  procesarVinculo(accion: 'vincular' | 'desvincular') {
    const vals = this.vinculoForm.value;
    const tipo = vals.tipo;

    if (tipo === 'usuario-unidad') {
      if (!vals.usuario_id || !vals.unidad_id) {
        this.mostrarMensaje('⚠️ Debe seleccionar Usuario y Unidad', true);
        return;
      }
      const dto: IVinculoUsuarioUnidadDto = { id_usuario: vals.usuario_id, id_unidad: vals.unidad_id };
      const obs$ = accion === 'vincular' 
        ? this.safiSvc.vincularUsuarioUnidad(dto) 
        : this.safiSvc.desvincularUsuarioUnidad(dto);

      obs$.subscribe({
        next: () => this.mostrarMensaje(`✅ Éxito al ${accion} Usuario y Unidad`),
        error: (err) => this.mostrarMensaje(`❌ Error al ${accion}: ` + err.message, true),
      });

    } else if (tipo === 'usuario-entidad') {
      if (!vals.usuario_id || !vals.entidad_id) {
        this.mostrarMensaje('⚠️ Debe seleccionar Usuario y Entidad', true);
        return;
      }
      const dto: IVinculoUsuarioEntidadDto = { id_usuario: vals.usuario_id, id_entidad: vals.entidad_id };
      const obs$ = accion === 'vincular' 
        ? this.safiSvc.vincularUsuarioEntidad(dto) 
        : this.safiSvc.desvincularUsuarioEntidad(dto);

      obs$.subscribe({
        next: () => this.mostrarMensaje(`✅ Éxito al ${accion} Usuario y Entidad`),
        error: (err) => this.mostrarMensaje(`❌ Error al ${accion}: ` + err.message, true),
      });

    } else if (tipo === 'unidad-entidad') {
      if (!vals.unidad_id || !vals.entidad_id) {
        this.mostrarMensaje('⚠️ Debe seleccionar Unidad y Entidad', true);
        return;
      }
      const dto: IVinculoUnidadEntidadDto = { id_unidad: vals.unidad_id, id_entidad: vals.entidad_id };
      const obs$ = accion === 'vincular' 
        ? this.safiSvc.vincularUnidadEntidad(dto) 
        : this.safiSvc.desvincularUnidadEntidad(dto);

      obs$.subscribe({
        next: () => this.mostrarMensaje(`✅ Éxito al ${accion} Unidad y Entidad`),
        error: (err) => this.mostrarMensaje(`❌ Error al ${accion}: ` + err.message, true),
      });
    }
  }

  // ==========================================
  // UTILERÍAS
  // ==========================================

  private mostrarMensaje(mensaje: string, error = false) {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 4000,
      panelClass: error ? ['bg-red-900', 'text-white'] : ['bg-green-950', 'text-white'],
    });
  }
}
