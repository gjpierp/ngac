import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
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
  IVinculoUnidadEntidadDto,
  ISafiModulo,
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
  get usuariosConRutFormateado() {
    return this.usuarios().map((u) => ({
      ...u,
      rut_formateado: (u.rut_numero || '') + '-' + (u.rut_dv || ''),
    }));
  }
  usuarios = signal<ISafiUsuario[]>([]);
  entidades = signal<ISafiEntidad[]>([]);
  unidades = signal<ISafiUnidad[]>([]);

  // BUGS CRITICOS: Añadir usuariosFiltrados para evitar error 500/crash de frontend
  usuariosFiltrados = computed(() => {
    const q = this.filtroUsuario().toLowerCase();
    return this.usuarios().filter(
      (u) =>
        (u.rut_numero && u.rut_dv ? u.rut_numero + '-' + u.rut_dv : '').toLowerCase().includes(q) ||
        u.nombre.toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        String(u.id).includes(q),
    );
  });

  isUsuariosPage = computed(() => this.router.url.includes('/usuarios'));
  selectedUsuario = signal<ISafiUsuario | null>(null);
  allNodes = signal<any[]>([]);
  allLinks = signal<any[]>([]);
  roles = signal<any[]>([]);
  selectedUsuarioIdForRoles = signal<number | null>(null);
  loadingVinculos = signal<boolean>(false);
  unidadEntidadLinks = signal<{ id_unidad: number; id_entidad: number }[]>([]);
  assignedEntidadIds = signal<number[]>([]);
  assignedUnidadIds = signal<number[]>([]);
  availableEntidadesSelected = signal<Set<number>>(new Set());
  assignedEntidadesSelected = signal<Set<number>>(new Set());
  availableUnidadesSelected = signal<Set<number>>(new Set());
  assignedUnidadesSelected = signal<Set<number>>(new Set());
  availableRolesSelected = signal<Set<number>>(new Set());
  assignedRolesSelected = signal<Set<number>>(new Set());
  filtroUsuario = signal('');
  filtroEntidad = signal('');
  filtroUnidad = signal('');
  
  // --- Módulos de Negocio SAFI ---
  modulos = signal<ISafiModulo[]>([]);
  selectedModulo = signal<ISafiModulo | null>(null);
  filtroModulo = signal('');
  filtroModuloNode = signal('');
  assignedNodeIds = signal<number[]>([]);
  availableNodesSelected = signal<Set<number>>(new Set());
  assignedNodesSelected = signal<Set<number>>(new Set());
  showModuloForm = false;
  editingModulo = signal<ISafiModulo | null>(null);
  editingEntidad = signal<ISafiEntidad | null>(null);
  editingUnidad = signal<ISafiUnidad | null>(null);

  modulosFiltrados = computed(() => {
    const q = this.filtroModulo().toLowerCase();
    return this.modulos().filter(
      (m) =>
        m.codigo.toLowerCase().includes(q) ||
        m.nombre.toLowerCase().includes(q) ||
        (m.descripcion || '').toLowerCase().includes(q)
    );
  });

  availableNodes = computed(() => {
    const assigned = new Set(this.assignedNodeIds());
    const q = this.filtroModuloNode().toLowerCase();

    // Map to quickly look up the tipo_nodo of any parent node in allNodes()
    const nodeTypesMap = new Map<number, string>();
    for (const n of this.allNodes()) {
      if (n.id_nodo !== undefined && n.id_nodo !== null) {
        nodeTypesMap.set(n.id_nodo, n.tipo_nodo?.trim().toUpperCase() || '');
      }
    }

    // Build the set of nodes that have a parent of type OBJETO or OBJ_ATTR
    const nonRootNodeIds = new Set<number>();
    for (const link of this.allLinks()) {
      const childId = Number(link.id_hijo);
      const parentId = Number(link.id_padre);
      if (!isNaN(childId) && !isNaN(parentId)) {
        const parentType = nodeTypesMap.get(parentId) || '';
        if (parentType === 'OBJETO' || parentType === 'OBJ_ATTR') {
          nonRootNodeIds.add(childId);
        }
      }
    }

    return this.allNodes().filter((n) => {
      const t = n.tipo_nodo?.trim().toUpperCase();
      const isCompatible = t === 'OBJETO' || t === 'OBJ_ATTR';
      const isRoot = !nonRootNodeIds.has(n.id_nodo);
      const matchesFilter =
        (n.etiqueta || '').toLowerCase().includes(q) ||
        (n.codigo_tecnico || '').toLowerCase().includes(q);
      return isCompatible && isRoot && !assigned.has(n.id_nodo) && matchesFilter;
    }).sort((a, b) => (a.etiqueta || '').localeCompare(b.etiqueta || ''));
  });

  assignedNodes = computed(() => {
    const assigned = new Set(this.assignedNodeIds());
    return this.allNodes().filter((n) => assigned.has(n.id_nodo))
      .sort((a, b) => (a.etiqueta || '').localeCompare(b.etiqueta || ''));
  });

  usuarioForm: FormGroup;
  entidadForm: FormGroup;
  unidadForm: FormGroup;
  vinculoForm: FormGroup;
  moduloForm: FormGroup;
  showUsuarioForm = false;
  showEntidadForm = false;
  showUnidadForm = false;

  // Signal para los datos de roles asignados al usuario seleccionado
  assignedRolesData = signal<{ id_rol?: number; codigo?: string; nombre: string }[]>([]);

  constructor(
    private fb: FormBuilder,
    private safiSvc: SafiService,
    private accesosSvc: AccesosService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
  ) {
    this.usuarioForm = this.fb.group({
      slug_usuario: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_\-]+$/)]],
      rut_numero: ['', [Validators.required]],
      rut_dv: ['', [Validators.required]],
      nombres: ['', [Validators.required]],
      apellidos: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
    });
    this.entidadForm = this.fb.group({
      codigo: ['', [Validators.required]],
      slug_entidad: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_\-]+$/)]],
      nombre_entidad: ['', [Validators.required]],
      tipo_entidad: ['ENTIDAD', [Validators.required]],
    });
    this.unidadForm = this.fb.group({
      codigo: ['', [Validators.required]],
      slug_unidad: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_\-]+$/)]],
      nombre_unidad: ['', [Validators.required]],
      descripcion: ['', [Validators.required]],
    });
    this.moduloForm = this.fb.group({
      codigo: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_\-]+$/)]],
      nombre: ['', [Validators.required]],
      descripcion: [''],
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
    this.setupModuloFormSubscriptions();
  }

  setupModuloFormSubscriptions() {
    this.moduloForm.get('codigo')?.valueChanges.subscribe((codigoVal) => {
      if (codigoVal) {
        const cleanedCode = this.cleanAndFormatCode(codigoVal);
        if (cleanedCode !== codigoVal) {
          this.moduloForm.get('codigo')?.setValue(cleanedCode, { emitEvent: false });
        }
      }
    });
  }

  cleanAndFormatCode(code: string): string {
    if (!code) return '';
    return code
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .trim()
      .replace(/[\s\-]+/g, '_')
      .replace(/[^A-Z0-9_]/g, '');
  }

  // 7. Métodos de carga y utilidades generales
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
      },
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

    this.safiSvc.getModulos().subscribe({
      next: (data) => this.modulos.set(data || []),
      error: () => this.mostrarMensaje('❌ Error al cargar módulos SAFI', true),
    });
  }

  abrirDialogoCrearUsuario() {
    const dialogRef = this.dialog.open(DialogoUsuarioComponent, {
      width: '600px',
      data: {},
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        // Validar que los campos requeridos existen
        if (!res.rut_numero || !res.rut_dv || !res.nombres || !res.apellidos || !res.email) {
          this.mostrarMensaje('❌ Faltan datos obligatorios para crear el usuario', true);
          return;
        }
        const slug = this.normalizeText(`${res.nombres} ${res.apellidos}`);
        const dto: ICrearSafiUsuarioDto = {
          slug_usuario: slug,
          rut_numero: res.rut_numero,
          rut_dv: res.rut_dv,
          nombres: res.nombres,
          apellidos: res.apellidos,
          email: res.email,
        };
        console.log('Enviando usuario al backend:', dto);
        this.safiSvc.crearUsuario(dto).subscribe({
          next: (response) => {
            this.mostrarMensaje(`✅ Usuario creado con éxito`);
            this.cargarDatos();
          },
          error: (err) =>
            this.mostrarMensaje('❌ Error al crear: ' + (err.error?.error || err.message), true),
        });
      }
    });
  }
  abrirDialogoEditarUsuario(u: ISafiUsuario, event: Event) {
    event.stopPropagation(); // Evitar seleccionar usuario al hacer clic en editar

    const dialogRef = this.dialog.open(DialogoUsuarioComponent, {
      width: '600px',
      data: { usuario: u },
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        const fullNombre = `${res.nombres} ${res.apellidos}`;

        const updatedUser: ISafiUsuario = {
          id: u.id,
          rut_numero: u.rut_numero,
          rut_dv: u.rut_dv,
          nombre: fullNombre,
          email: res.email,
          estado: res.estado,
        };

        this.safiSvc.upsertUsuario(updatedUser).subscribe({
          next: () => {
            this.mostrarMensaje(`✅ Usuario actualizado con éxito`);
            this.cargarDatos();
            if (this.selectedUsuario()?.id === u.id) {
              this.selectedUsuario.set({ ...u, ...updatedUser });
            }
          },
          error: (err) => this.mostrarMensaje('❌ Error al actualizar: ' + err.message, true),
        });
      }
    });
  }
  desactivarUsuarioSafi(id: number, event: Event) {
    event.stopPropagation();
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
    this.availableRolesSelected.set(new Set());
    this.assignedRolesSelected.set(new Set());
    this.assignedRolesData.set([]);

    this.loadRolesForUser(u.id);

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
      },
    });
  }

  // 9. Métodos de entidades (CRUD)
  guardarEntidadSafi() {
    if (this.entidadForm.invalid) return;
    const vals = this.entidadForm.value;
    const editing = this.editingEntidad();

    if (editing) {
      const entidad: ISafiEntidad = {
        id: editing.id,
        codigo: vals.codigo,
        nombre: vals.nombre_entidad,
        slug: vals.slug_entidad,
        desc: vals.tipo_entidad
      };
      this.safiSvc.upsertEntidad(entidad).subscribe({
        next: () => {
          this.mostrarMensaje('✅ Entidad actualizada con éxito');
          this.cancelarFormEntidad();
          this.cargarDatos();
        },
        error: (err) => this.mostrarMensaje('❌ Error: ' + (err.error?.error || err.message), true),
      });
    } else {
      const dto: ICrearSafiEntidadDto = {
        codigo: vals.codigo,
        slug_entidad: vals.slug_entidad,
        nombre_entidad: vals.nombre_entidad,
        tipo_entidad: vals.tipo_entidad
      };
      this.safiSvc.crearEntidad(dto).subscribe({
        next: (res) => {
          this.mostrarMensaje(`✅ Entidad creada con ID: ${res.data?.id_entidad || 'Exitoso'}`);
          this.cancelarFormEntidad();
          this.cargarDatos();
        },
        error: (err) => this.mostrarMensaje('❌ Error: ' + (err.error?.error || err.message), true),
      });
    }
  }

  abrirEditarEntidad(entidad: ISafiEntidad, event: Event) {
    event.stopPropagation();
    this.editingEntidad.set(entidad);
    this.entidadForm.patchValue({
      codigo: entidad.codigo,
      slug_entidad: entidad.slug,
      nombre_entidad: entidad.nombre,
      tipo_entidad: entidad.desc || 'ENTIDAD'
    });
    this.showEntidadForm = true;
  }

  cancelarFormEntidad() {
    this.showEntidadForm = false;
    this.editingEntidad.set(null);
    this.entidadForm.reset({ tipo_entidad: 'ENTIDAD' });
  }

  toggleEntidadForm() {
    if (this.showEntidadForm) {
      this.cancelarFormEntidad();
    } else {
      this.showEntidadForm = true;
      this.editingEntidad.set(null);
      this.entidadForm.reset({ tipo_entidad: 'ENTIDAD' });
    }
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

  // 10. Métodos de unidades (CRUD)
  guardarUnidadSafi() {
    if (this.unidadForm.invalid) return;
    const vals = this.unidadForm.value;
    const editing = this.editingUnidad();

    if (editing) {
      const unidad: ISafiUnidad = {
        id: editing.id,
        codigo: vals.codigo,
        nombre: vals.nombre_unidad,
        slug: vals.slug_unidad,
        desc: vals.descripcion
      };
      this.safiSvc.upsertUnidad(unidad).subscribe({
        next: () => {
          this.mostrarMensaje('✅ Unidad actualizada con éxito');
          this.cancelarFormUnidad();
          this.cargarDatos();
        },
        error: (err) => this.mostrarMensaje('❌ Error: ' + (err.error?.error || err.message), true),
      });
    } else {
      const dto: ICrearSafiUnidadDto = {
        codigo: vals.codigo,
        slug_unidad: vals.slug_unidad,
        nombre_unidad: vals.nombre_unidad,
        descripcion: vals.descripcion
      };
      this.safiSvc.crearUnidad(dto).subscribe({
        next: (res) => {
          this.mostrarMensaje(`✅ Unidad creada con ID: ${res.data?.id_unidad || 'Exitoso'}`);
          this.cancelarFormUnidad();
          this.cargarDatos();
        },
        error: (err) => this.mostrarMensaje('❌ Error: ' + (err.error?.error || err.message), true),
      });
    }
  }

  abrirEditarUnidad(unidad: ISafiUnidad, event: Event) {
    event.stopPropagation();
    this.editingUnidad.set(unidad);
    this.unidadForm.patchValue({
      codigo: unidad.codigo,
      slug_unidad: unidad.slug,
      nombre_unidad: unidad.nombre,
      descripcion: unidad.desc || ''
    });
    this.showUnidadForm = true;
  }

  cancelarFormUnidad() {
    this.showUnidadForm = false;
    this.editingUnidad.set(null);
    this.unidadForm.reset();
  }

  toggleUnidadForm() {
    if (this.showUnidadForm) {
      this.cancelarFormUnidad();
    } else {
      this.showUnidadForm = true;
      this.editingUnidad.set(null);
      this.unidadForm.reset();
    }
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

  // 11. Métodos de vínculos/relaciones
  procesarVinculo(accion: 'vincular' | 'desvincular') {
    const vals = this.vinculoForm.value;
    const tipo = vals.tipo;

    if (tipo === 'usuario-unidad') {
      if (!vals.usuario_id || !vals.unidad_id) {
        this.mostrarMensaje('⚠️ Debe seleccionar Usuario y Unidad', true);
        return;
      }
      const dto: IVinculoUsuarioUnidadDto = {
        id_usuario: vals.usuario_id,
        id_unidad: vals.unidad_id,
      };
      const obs$ =
        accion === 'vincular'
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
      const dto: IVinculoUsuarioEntidadDto = {
        id_usuario: vals.usuario_id,
        id_entidad: vals.entidad_id,
      };
      const obs$ =
        accion === 'vincular'
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
      const dto: IVinculoUnidadEntidadDto = {
        id_unidad: vals.unidad_id,
        id_entidad: vals.entidad_id,
      };
      const obs$ =
        accion === 'vincular'
          ? this.safiSvc.vincularUnidadEntidad(dto)
          : this.safiSvc.desvincularUnidadEntidad(dto);

      obs$.subscribe({
        next: () => this.mostrarMensaje(`✅ Éxito al ${accion} Unidad y Entidad`),
        error: (err) => this.mostrarMensaje(`❌ Error al ${accion}: ` + err.message, true),
      });
    }
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
      this.safiSvc
        .vincularUsuarioEntidad({ id_usuario: user.id, id_entidad: selected[completed] })
        .subscribe({
          next: () => {
            completed++;
            assignNext();
          },
          error: (err) => {
            this.mostrarMensaje('❌ Error al asociar algunas entidades: ' + err.message, true);
            this.reloadUserVinculos(user.id);
          },
        });
    };
    assignNext();
  }
  moveAllEntidadesToAssigned() {
    const available = this.availableEntidades().map((e) => e.id);
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
      this.safiSvc
        .vincularUsuarioEntidad({ id_usuario: user.id, id_entidad: available[completed] })
        .subscribe({
          next: () => {
            completed++;
            assignNext();
          },
          error: (err) => {
            this.mostrarMensaje('❌ Error al asociar todas las entidades: ' + err.message, true);
            this.reloadUserVinculos(user.id);
          },
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
      this.safiSvc
        .desvincularUsuarioEntidad({ id_usuario: user.id, id_entidad: selected[completed] })
        .subscribe({
          next: () => {
            completed++;
            revokeNext();
          },
          error: (err) => {
            this.mostrarMensaje('❌ Error al desvincular algunas entidades: ' + err.message, true);
            this.reloadUserVinculos(user.id);
          },
        });
    };
    revokeNext();
  }
  moveAllEntidadesToAvailable() {
    const assigned = this.assignedEntidades().map((e) => e.id);
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
      this.safiSvc
        .desvincularUsuarioEntidad({ id_usuario: user.id, id_entidad: assigned[completed] })
        .subscribe({
          next: () => {
            completed++;
            revokeNext();
          },
          error: (err) => {
            this.mostrarMensaje(
              '❌ Error al desvincular todas las entidades: ' + err.message,
              true,
            );
            this.reloadUserVinculos(user.id);
          },
        });
    };
    revokeNext();
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
      this.safiSvc
        .vincularUsuarioUnidad({ id_usuario: user.id, id_unidad: selected[completed] })
        .subscribe({
          next: () => {
            completed++;
            assignNext();
          },
          error: (err) => {
            this.mostrarMensaje('❌ Error al asociar algunas unidades: ' + err.message, true);
            this.reloadUserVinculos(user.id);
          },
        });
    };
    assignNext();
  }
  moveAllUnidadesToAssigned() {
    const assignedIds = new Set(this.assignedUnidadIds());
    const available = this.unidades()
      .filter((u) => !assignedIds.has(u.id))
      .map((u) => u.id);
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
      this.safiSvc
        .vincularUsuarioUnidad({ id_usuario: user.id, id_unidad: available[completed] })
        .subscribe({
          next: () => {
            completed++;
            assignNext();
          },
          error: (err) => {
            this.mostrarMensaje('❌ Error al asociar todas las unidades: ' + err.message, true);
            this.reloadUserVinculos(user.id);
          },
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
      this.safiSvc
        .desvincularUsuarioUnidad({ id_usuario: user.id, id_unidad: selected[completed] })
        .subscribe({
          next: () => {
            completed++;
            revokeNext();
          },
          error: (err) => {
            this.mostrarMensaje('❌ Error al desvincular algunas unidades: ' + err.message, true);
            this.reloadUserVinculos(user.id);
          },
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
      this.safiSvc
        .desvincularUsuarioUnidad({ id_usuario: user.id, id_unidad: assigned[completed] })
        .subscribe({
          next: () => {
            completed++;
            revokeNext();
          },
          error: (err) => {
            this.mostrarMensaje('❌ Error al desvincular todas las unidades: ' + err.message, true);
            this.reloadUserVinculos(user.id);
          },
        });
    };
    revokeNext();
  }

  // 12. Métodos de roles
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
      },
    });
  }
  assignRole(roleId: number) {
    const user = this.selectedUsuario();
    if (!user) return;

    this.accesosSvc.asignarRolAUsuario(user.id, roleId).subscribe({
      next: () => {
        this.mostrarMensaje(`✅ Rol asignado con éxito`);
        this.loadRolesForUser(user.id);
      },
      error: (err) => {
        this.mostrarMensaje('❌ Error al asignar rol: ' + (err.error?.detail || err.message), true);
      },
    });
  }
  revokeRole(roleId: number) {
    const user = this.selectedUsuario();
    if (!user) return;

    this.accesosSvc.revocarRolDeUsuario(user.id, roleId).subscribe({
      next: () => {
        this.mostrarMensaje(`✅ Rol revocado con éxito`);
        this.loadRolesForUser(user.id);
      },
      error: (err) => {
        this.mostrarMensaje('❌ Error al revocar rol: ' + (err.error?.detail || err.message), true);
      },
    });
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
        next: () => {
          completed++;
          assignNext();
        },
        error: (err) => {
          this.mostrarMensaje(
            '❌ Error al asignar algunos roles: ' + (err.error?.detail || err.message),
            true,
          );
          this.loadRolesForUser(user.id);
        },
      });
    };
    assignNext();
  }
  moveAllToAssigned() {
    const available = this.availableRoles().map((r) => r.id);
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
        next: () => {
          completed++;
          assignNext();
        },
        error: (err) => {
          this.mostrarMensaje(
            '❌ Error al asignar todos los roles: ' + (err.error?.detail || err.message),
            true,
          );
          this.loadRolesForUser(user.id);
        },
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
        next: () => {
          completed++;
          revokeNext();
        },
        error: (err) => {
          this.mostrarMensaje(
            '❌ Error al revocar algunos roles: ' + (err.error?.detail || err.message),
            true,
          );
          this.loadRolesForUser(user.id);
        },
      });
    };
    revokeNext();
  }
  moveAllToAvailable() {
    const assigned = this.assignedRoles().map((r) => r.id);
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
        next: () => {
          completed++;
          revokeNext();
        },
        error: (err) => {
          this.mostrarMensaje(
            '❌ Error al revocar todos los roles: ' + (err.error?.detail || err.message),
            true,
          );
          this.loadRolesForUser(user.id);
        },
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
  onUserRolesSelected(userId: number) {
    this.selectedUsuarioIdForRoles.set(userId);
  }
  assignedRolesDual = computed<DualListItem[]>(() => {
    const userId = this.selectedUsuarioIdForRoles();
    if (!userId) return [];
    const user = this.usuarios().find((u) => u.id === userId);
    if (!user) return [];
    const userNode = this.findUserNode(user);
    if (!userNode) return [];

    const assignedCodes = this.allLinks()
      .filter((link) => link.id_hijo === userNode.id_nodo || link.hijo === userNode.codigo_tecnico)
      .map((link) => link.padre || link.id_padre);

    const assignedRoles = this.roles().filter(
      (r) =>
        assignedCodes.includes(r.codigo) ||
        assignedCodes.includes(r.id_rol) ||
        assignedCodes.includes(r.nombre),
    );
    return assignedRoles.map((r) => ({ id: r.codigo, label: r.nombre }));
  });
  availableRolesDual = computed<DualListItem[]>(() => {
    const assignedRoles = this.assignedRolesDual();
    const assignedRolesCodes = assignedRoles.map((r) => r.id);
    const availableRoles = this.roles().filter((r) => !assignedRolesCodes.includes(r.codigo));
    return availableRoles.map((r) => ({ id: r.codigo, label: r.nombre }));
  });
  onRolesDualChange(event: { selected: DualListItem[] }) {
    const userId = this.selectedUsuarioIdForRoles();
    if (!userId) return;
    const user = this.usuarios().find((u) => u.id === userId);
    if (!user) return;
    const userNode = this.findUserNode(user);
    if (!userNode) {
      this.mostrarMensaje('⚠️ No se encontró el nodo del usuario en NGAC', true);
      return;
    }

    const newSelectedRoleCodes = event.selected.map((item) => item.id);
    const currentAssignedRoleCodes = this.assignedRolesDual().map((item) => item.id);

    const rolesToAssign = newSelectedRoleCodes.filter(
      (code) => !currentAssignedRoleCodes.includes(code),
    );
    const rolesToUnassign = currentAssignedRoleCodes.filter(
      (code) => !newSelectedRoleCodes.includes(code),
    );

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

    rolesToAssign.forEach((codigo) => {
      const roleNodeId = this.roles().find((role) => role.codigo === codigo)?.id_nodo;
      if (!roleNodeId || !userNode.id_nodo) {
        this.mostrarMensaje('❌ No se pudo resolver el ID del rol o del usuario', true);
        checkComplete();
        return;
      }

      this.accesosSvc.enlazarNodos(roleNodeId, userNode.id_nodo).subscribe({
        next: () => checkComplete(),
        error: (err) => {
          this.mostrarMensaje('❌ Error al asignar rol: ' + err.message, true);
          checkComplete();
        },
      });
    });

    rolesToUnassign.forEach((codigo) => {
      const roleNodeId = this.roles().find((role) => role.codigo === codigo)?.id_nodo;
      if (!roleNodeId || !userNode.id_nodo) {
        this.mostrarMensaje('❌ No se pudo resolver el ID del rol o del usuario', true);
        checkComplete();
        return;
      }

      this.accesosSvc.deleteEnlace(roleNodeId, userNode.id_nodo).subscribe({
        next: () => checkComplete(),
        error: (err) => {
          this.mostrarMensaje('❌ Error al revocar rol: ' + err.message, true);
          checkComplete();
        },
      });
    });
  }

  // 13. Métodos de filtrado y helpers

  entidadesFiltrados = computed(() => {
    const q = this.filtroEntidad().toLowerCase();
    return this.entidades().filter(
      (e) =>
        e.nombre.toLowerCase().includes(q) ||
        e.slug.toLowerCase().includes(q) ||
        (e.desc || '').toLowerCase().includes(q),
    );
  });
  unidadesFiltrados = computed(() => {
    const q = this.filtroUnidad().toLowerCase();
    return this.unidades().filter(
      (u) =>
        u.nombre.toLowerCase().includes(q) ||
        u.slug.toLowerCase().includes(q) ||
        (u.desc || '').toLowerCase().includes(q),
    );
  });
  toggleAvailableRoleSelection(roleId: number) {
    const s = new Set(this.availableRolesSelected());
    if (s.has(roleId)) {
      s.delete(roleId);
    } else {
      s.add(roleId);
    }
    this.availableRolesSelected.set(s);
  }
  toggleAssignedRoleSelection(roleId: number) {
    const s = new Set(this.assignedRolesSelected());
    if (s.has(roleId)) {
      s.delete(roleId);
    } else {
      s.add(roleId);
    }
    this.assignedRolesSelected.set(s);
  }
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

  // 14. Utilidades generales
  normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }
  cleanRut(rut: string): string {
    if (!rut) return '';
    return rut.replace(/[^0-9kK]/g, '').toUpperCase();
  }
  findUserNode(user: ISafiUsuario | null): any {
    if (!user) return null;
    const nameLower = user.nombre.toLowerCase().trim();
    let found = this.allNodes().find((n) => n.etiqueta.toLowerCase().trim() === nameLower);
    if (!found) {
      const slugName = this.normalizeText(user.nombre);
      found = this.allNodes().find((n) => n.codigo_tecnico.toUpperCase() === slugName);
    }
    if (!found) {
      const idStr = String(user.id);
      found = this.allNodes().find((n) => n.codigo_tecnico.includes(idStr));
    }
    return found;
  }
  getAssignedRolesForSelectedUser(): any[] {
    return [];
  }
  getAvailableRolesForSelectedUser(): any[] {
    return [];
  }
  quickAssignRole(rol: any) {}
  quickUnassignRole(rol: any) {}

  // 15. Computed avanzados y agrupadores
  availableEntidades = computed(() => {
    const assigned = new Set(this.assignedEntidadIds());
    return this.entidades().filter((e) => !assigned.has(e.id));
  });
  assignedEntidades = computed(() => {
    const assigned = new Set(this.assignedEntidadIds());
    return this.entidades().filter((e) => assigned.has(e.id));
  });
  groupedAvailableUnidades = computed(() => {
    const assignedIds = new Set(this.assignedUnidadIds());
    const availableAll = this.unidades().filter((u) => !assignedIds.has(u.id));

    const unitToEntities = new Map<number, number[]>();
    for (const link of this.unidadEntidadLinks()) {
      if (!unitToEntities.has(link.id_unidad)) {
        unitToEntities.set(link.id_unidad, []);
      }
      unitToEntities.get(link.id_unidad)!.push(link.id_entidad);
    }

    const groups: { entity: ISafiEntidad | null; units: ISafiUnidad[] }[] = [];

    for (const entity of this.entidades()) {
      const entityUnits = availableAll.filter((u) => {
        const entIds = unitToEntities.get(u.id) || [];
        return entIds.includes(entity.id);
      });
      if (entityUnits.length > 0) {
        groups.push({ entity, units: entityUnits });
      }
    }

    const noEntityUnits = availableAll.filter((u) => {
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
    const assignedAll = this.unidades().filter((u) => assignedIds.has(u.id));

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
      const entityUnits = assignedAll.filter((u) => {
        const entIds = unitToEntities.get(u.id) || [];
        return entIds.includes(entity.id);
      });
      if (entityUnits.length > 0) {
        groups.push({ entity, units: entityUnits });
      }
    }

    const noEntityUnits = assignedAll.filter((u) => {
      const entIds = unitToEntities.get(u.id) || [];
      return entIds.length === 0;
    });
    if (noEntityUnits.length > 0) {
      groups.push({ entity: null, units: noEntityUnits });
    }

    return groups;
  });
  assignedRoles = computed(() =>
    this.assignedRolesData()
      .filter((r) => r.id_rol !== undefined && r.id_rol !== null)
      .map((r) => ({ id: Number(r.id_rol), label: r.nombre })),
  );
  availableRoles = computed(() => {
    const user = this.selectedUsuario();
    if (!user) return [];
    const assignedRoleIds = new Set(
      this.assignedRolesData()
        .map((r) => (r.id_rol !== undefined && r.id_rol !== null ? Number(r.id_rol) : null))
        .filter((id): id is number => id !== null),
    );
    return this.roles()
      .filter(
        (r) => r.id_nodo !== undefined && r.id_nodo !== null && !assignedRoleIds.has(r.id_nodo),
      )
      .map((r) => ({ id: Number(r.id_nodo), label: r.nombre, codigo: r.codigo }));
  });
  // --- MÉTODOS DE MÓDULOS DE NEGOCIO SAFI ---
  selectModulo(modulo: ISafiModulo) {
    this.selectedModulo.set(modulo);
    this.availableNodesSelected.set(new Set());
    this.assignedNodesSelected.set(new Set());
    this.filtroModuloNode.set('');
    
    // Cargar ids de los nodos asociados al modulo
    const nodeIds = (modulo.nodos || []).map(n => n.id_nodo as number);
    this.assignedNodeIds.set(nodeIds);
  }

  deseleccionarModulo() {
    this.selectedModulo.set(null);
    this.assignedNodeIds.set([]);
    this.availableNodesSelected.set(new Set());
    this.assignedNodesSelected.set(new Set());
    this.filtroModuloNode.set('');
    this.cargarDatos();
  }

  guardarModulo() {
    if (this.moduloForm.invalid) return;
    const formVals = this.moduloForm.value;
    const editing = this.editingModulo();
    const modulo: ISafiModulo = {
      id_modulo: editing ? editing.id_modulo : undefined,
      codigo: formVals.codigo,
      nombre: formVals.nombre,
      descripcion: formVals.descripcion,
      activo: editing ? editing.activo : 'S'
    };

    this.safiSvc.upsertModulo(modulo).subscribe({
      next: () => {
        this.mostrarMensaje(editing ? '✅ Módulo de negocio actualizado con éxito' : '✅ Módulo de negocio creado con éxito');
        this.moduloForm.reset();
        this.showModuloForm = false;
        this.editingModulo.set(null);
        this.cargarDatos();
      },
      error: (err) => this.mostrarMensaje('❌ Error al guardar módulo: ' + err.message, true)
    });
  }

  abrirEditarModulo(modulo: ISafiModulo, event: Event) {
    event.stopPropagation();
    this.editingModulo.set(modulo);
    this.moduloForm.patchValue({
      codigo: modulo.codigo,
      nombre: modulo.nombre,
      descripcion: modulo.descripcion || ''
    });
    this.showModuloForm = true;
  }

  cancelarFormModulo() {
    this.showModuloForm = false;
    this.editingModulo.set(null);
    this.moduloForm.reset();
  }

  toggleModuloForm() {
    if (this.showModuloForm) {
      this.cancelarFormModulo();
    } else {
      this.showModuloForm = true;
      this.editingModulo.set(null);
      this.moduloForm.reset();
    }
  }

  eliminarModulo(id: number, event: Event) {
    event.stopPropagation();
    if (confirm(`¿Está seguro de eliminar permanentemente el módulo con ID ${id}?`)) {
      this.safiSvc.deleteModulo(id).subscribe({
        next: () => {
          this.mostrarMensaje('✅ Módulo eliminado con éxito');
          if (this.selectedModulo()?.id_modulo === id) {
            this.deseleccionarModulo();
          } else {
            this.cargarDatos();
          }
        },
        error: (err) => this.mostrarMensaje('❌ Error al eliminar: ' + err.message, true)
      });
    }
  }

  toggleAvailableNodeSelection(id: number) {
    this.availableNodesSelected.update((set) => {
      const newSet = new Set(set);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  }

  toggleAssignedNodeSelection(id: number) {
    this.assignedNodesSelected.update((set) => {
      const newSet = new Set(set);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  }

  moveSelectedNodesToAssigned() {
    const selected = Array.from(this.availableNodesSelected());
    if (selected.length === 0) return;
    const modulo = this.selectedModulo();
    if (!modulo || !modulo.id_modulo) return;

    this.loadingVinculos.set(true);
    let completed = 0;
    const assignNext = () => {
      if (completed >= selected.length) {
        this.mostrarMensaje('✅ Nodos vinculados con éxito');
        this.availableNodesSelected.set(new Set());
        this.reloadModuloNodos(modulo.id_modulo!);
        return;
      }
      this.safiSvc
        .vincularModuloNodo(modulo.id_modulo!, selected[completed])
        .subscribe({
          next: () => {
            completed++;
            assignNext();
          },
          error: (err) => {
            this.mostrarMensaje('❌ Error al vincular algunos nodos: ' + err.message, true);
            this.reloadModuloNodos(modulo.id_modulo!);
          },
        });
    };
    assignNext();
  }

  moveAllNodesToAssigned() {
    const available = this.availableNodes().map((n) => n.id_nodo as number);
    if (available.length === 0) return;
    const modulo = this.selectedModulo();
    if (!modulo || !modulo.id_modulo) return;

    this.loadingVinculos.set(true);
    let completed = 0;
    const assignNext = () => {
      if (completed >= available.length) {
        this.mostrarMensaje('✅ Todos los nodos vinculados');
        this.availableNodesSelected.set(new Set());
        this.reloadModuloNodos(modulo.id_modulo!);
        return;
      }
      this.safiSvc
        .vincularModuloNodo(modulo.id_modulo!, available[completed])
        .subscribe({
          next: () => {
            completed++;
            assignNext();
          },
          error: (err) => {
            this.mostrarMensaje('❌ Error al vincular todos los nodos: ' + err.message, true);
            this.reloadModuloNodos(modulo.id_modulo!);
          },
        });
    };
    assignNext();
  }

  moveSelectedNodesToAvailable() {
    const selected = Array.from(this.assignedNodesSelected());
    if (selected.length === 0) return;
    const modulo = this.selectedModulo();
    if (!modulo || !modulo.id_modulo) return;

    this.loadingVinculos.set(true);
    let completed = 0;
    const revokeNext = () => {
      if (completed >= selected.length) {
        this.mostrarMensaje('✅ Nodos desvinculados con éxito');
        this.assignedNodesSelected.set(new Set());
        this.reloadModuloNodos(modulo.id_modulo!);
        return;
      }
      this.safiSvc
        .desvincularModuloNodo(modulo.id_modulo!, selected[completed])
        .subscribe({
          next: () => {
            completed++;
            revokeNext();
          },
          error: (err) => {
            this.mostrarMensaje('❌ Error al desvincular algunos nodos: ' + err.message, true);
            this.reloadModuloNodos(modulo.id_modulo!);
          },
        });
    };
    revokeNext();
  }

  moveAllNodesToAvailable() {
    const assigned = this.assignedNodeIds();
    if (assigned.length === 0) return;
    const modulo = this.selectedModulo();
    if (!modulo || !modulo.id_modulo) return;

    this.loadingVinculos.set(true);
    let completed = 0;
    const revokeNext = () => {
      if (completed >= assigned.length) {
        this.mostrarMensaje('✅ Todos los nodos desvinculados');
        this.assignedNodesSelected.set(new Set());
        this.reloadModuloNodos(modulo.id_modulo!);
        return;
      }
      this.safiSvc
        .desvincularModuloNodo(modulo.id_modulo!, assigned[completed])
        .subscribe({
          next: () => {
            completed++;
            revokeNext();
          },
          error: (err) => {
            this.mostrarMensaje('❌ Error al desvincular todos los nodos: ' + err.message, true);
            this.reloadModuloNodos(modulo.id_modulo!);
          },
        });
    };
    revokeNext();
  }

  reloadModuloNodos(idModulo: number) {
    this.safiSvc.getModulos().subscribe({
      next: (data) => {
        this.modulos.set(data || []);
        const found = (data || []).find((m) => m.id_modulo === idModulo);
        if (found) {
          const nodeIds = (found.nodos || []).map((n) => n.id_nodo as number);
          this.assignedNodeIds.set(nodeIds);
          this.selectedModulo.set(found);
        }
        this.loadingVinculos.set(false);
      },
      error: () => {
        this.loadingVinculos.set(false);
      }
    });
  }

  // Utilidad para mostrar mensajes en snackbar
  mostrarMensaje(mensaje: string, error = false) {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 4000,
      panelClass: error ? ['bg-red-900', 'text-white'] : ['bg-green-950', 'text-white'],
    });
  }
}
