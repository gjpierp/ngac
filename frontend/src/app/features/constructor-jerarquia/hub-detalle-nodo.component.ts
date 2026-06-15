import { Component, Input, OnInit, signal, effect, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatTabsModule, MatTabChangeEvent } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { INodo } from '../../core/models/ngac-admin.models';
import { AccesosService } from '../../core/services/accesos.service';
import { DialogoNodoComponent } from '../../shared/components/dialogo-nodo/dialogo-nodo.component';
import { DialogoConfirmacionComponent } from '../../shared/components/dialogo-confirmacion/dialogo-confirmacion.component';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-hub-detalle-nodo',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTooltipModule,
    NgxMatSelectSearchModule,
  ],
  templateUrl: './hub-detalle-nodo.component.html',
  styleUrls: ['./hub-detalle-nodo.component.css'],
})
export class HubDetalleNodoComponent implements OnInit {
  nodoSignal = signal<INodo | null>(null);

  @Input() set nodo(val: INodo | null) {
    this.nodoSignal.set(val);
  }
  get nodo() {
    return this.nodoSignal();
  }

  @Input() selectedTreeParentId: number | null = null;
  @Input() parents: any[] = [];
  @Input() allNodes: INodo[] = [];
  @Input() allLinks: any[] = [];
  @Input() roles: any[] = [];
  @Input() operations: any[] = [];

  @Input() onReloadTree?: () => void;
  @Input() onDeleteNode?: (node: INodo) => void;

  searchHijoCtrl = new FormControl('');
  searchFilterCtrl = new FormControl('');
  rolCtrl = new FormControl('');
  selectedMenuToAdd: string | null = null;
  
  get filteredMenusOrPolicies() {
    if (!this.nodo) return [];
    const allMenus = this.nodo['menus'] || [];
    if (!this.selectedTreeParentId) {
      return allMenus;
    }

    // Trace ancestors from selectedTreeParentId to find root menu(s)
    const activeRoots = new Set<string>();
    const findRoots = (id: number) => {
      const parentLinks = this.allLinks.filter(l => Number(l.id_hijo) === id);
      if (parentLinks.length === 0) {
        // It's a root. Find its node to check type.
        const rNode = this.allNodes.find(n => Number(n.id_nodo) === id);
        if (rNode && (rNode.tipo_nodo === 'POLICY' || rNode.tipo_nodo === 'MENU')) {
          activeRoots.add(rNode.codigo_tecnico!);
        }
      } else {
        parentLinks.forEach(l => {
          if (l.id_padre !== undefined && l.id_padre !== null) {
            findRoots(Number(l.id_padre));
          }
        });
      }
    };
    findRoots(this.selectedTreeParentId);

    if (activeRoots.size > 0) {
      // Return menus whose code is in activeRoots, or if it's not a policy/menu we still show it?
      // allMenus are typically just the direct menus. But wait! If `menus` contains the root policies, we filter by activeRoots.
      return allMenus.filter((m: any) => activeRoots.has(m.codigo_tecnico));
    }

    return allMenus;
  }

  private getNodeId(identifier: string | number | null | undefined): number | null {
    if (identifier === null || identifier === undefined || identifier === '') return null;
    const numeric = Number(identifier);
    if (!Number.isNaN(numeric) && numeric > 0) {
      return numeric;
    }

    const normalized = String(identifier).trim().toUpperCase();
    const node = this.allNodes.find(
      (item) => (item.codigo_tecnico || '').trim().toUpperCase() === normalized,
    );
    return node?.id_nodo ? Number(node.id_nodo) : null;
  }

  get filteredLinkableNodes(): INodo[] {
    const term = (this.searchFilterCtrl.value || '').toString().trim().toLowerCase();
    const currentNodeCode = this.nodo?.codigo_tecnico?.trim().toUpperCase();

    return (this.allNodes || []).filter((node) => {
      const nodeCode = node.codigo_tecnico?.trim().toUpperCase();
      if (currentNodeCode && nodeCode === currentNodeCode) {
        return false;
      }

      if (!term) {
        return true;
      }

      return (
        (node.etiqueta || '').toLowerCase().includes(term) ||
        (node.codigo_tecnico || '').toLowerCase().includes(term)
      );
    });
  }

  permisosAsignados = signal<any[]>([]);

  isRootFolder = computed(() => {
    const n = this.nodoSignal();
    return n?.tipo_nodo === 'OBJ_ATTR' && (!this.parents || this.parents.length === 0);
  });

  groupedPermissions = computed(() => {
    const raw = this.permisosAsignados();
    const allRoles = this.roles;
    const groups: { [key: string]: any } = {};

    raw.forEach((p) => {
      // Búsqueda exhaustiva de la clave de identidad (Código de Usuario/Rol)
      let userCode =
        p.USUARIO || p.usuario || p.ROL || p.rol || p.USER || p.usuario_codigo || p.codigo_usuario;

      if (!userCode) {
        const fallbackKey = Object.keys(p).find(
          (k) =>
            k.toUpperCase().includes('USUARIO') ||
            k.toUpperCase().includes('ROL') ||
            k.toUpperCase().includes('USER') ||
            k.toUpperCase().includes('CODIGO'),
        );
        if (fallbackKey) userCode = p[fallbackKey];
      }

      userCode = userCode || 'Desconocido';

      // Mapear código técnico a Nombre amigable usando la lista de roles
      const roleObj = allRoles.find(
        (r) => r.codigo === userCode || r.ID === userCode || r.nombre === userCode,
      );
      const displayName = roleObj ? roleObj.nombre : userCode;

      if (!groups[userCode]) {
        groups[userCode] = { userCode, displayName, permissions: [] };
      }
      groups[userCode].permissions.push(p);
    });

    return Object.values(groups);
  });

  // Señales para el flujo de auditoría Drill-down
  rolesConAcceso = signal<any[]>([]);
  selectedAuditRol = signal<number | null>(null);
  permisosDelRol = signal<any[]>([]);
  allOperations = signal<any[]>([]);

  // Matriz de permisos: cruce entre todas las operaciones y las asignadas
  permissionsMatrix = computed(() => {
    const assigned = this.permisosDelRol();
    const ops = this.allOperations();
    return ops.map((op) => ({
      nombre: op.nombre_op || op,
      assigned: assigned.some((p) => p.op === (op.nombre_op || op)),
    }));
  });

  // Roles que aún no tienen ningún permiso asignado en este nodo
  availableRoles = computed(() => {
    const all = this.roles || [];
    const assigned = this.rolesConAcceso() || [];
    return all.filter((r) => !assigned.some((a) => a.codigo === r.codigo || a.nombre === r.nombre));
  });

  constructor(
    private accesosSvc: AccesosService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
  ) {
    // Reactividad: Cuando cambia el nodo, resetear y cargar roles con acceso
    effect(() => {
      const n = this.nodo;
      if (n) {
        this.resetAudit();
        this.loadRolesConAcceso();
      }
    });
  }

  private resetAudit() {
    this.selectedAuditRol.set(null);
    this.rolesConAcceso.set([]);
    this.permisosDelRol.set([]);
  }

  private resolveRoleNodeId(roleIdentifier: string | number | null | undefined): number | null {
    if (roleIdentifier === null || roleIdentifier === undefined || roleIdentifier === '')
      return null;
    const numeric = Number(roleIdentifier);
    if (!Number.isNaN(numeric) && numeric > 0) {
      return numeric;
    }

    const normalized = String(roleIdentifier).trim().toUpperCase();
    const role = (this.roles || []).find(
      (item) =>
        String(item.id_nodo || item.id_rol || '') === normalized ||
        String(item.codigo || item.codigo_tecnico || '')
          .trim()
          .toUpperCase() === normalized ||
        String(item.nombre || item.etiqueta || '')
          .trim()
          .toUpperCase() === normalized,
    );

    return role?.id_nodo ? Number(role.id_nodo) : role?.id_rol ? Number(role.id_rol) : null;
  }

  loadRolesConAcceso() {
    if (!this.nodo || !this.nodo.id_nodo) {
      // Silencioso si no hay nodo, es normal al inicio o cambio de pestaña
      return;
    }
    console.log('[NodeDetailHub] loadRolesConAcceso >> Nodo ID:', this.nodo.id_nodo);

    // Cargar operaciones para la matriz
    this.accesosSvc.getOperaciones().subscribe((ops) => this.allOperations.set(ops));

    this.accesosSvc.getRolesPorNodo(this.nodo.id_nodo).subscribe({
      next: (roles) => {
        console.log('[NodeDetailHub] Roles recibidos:', roles);
        this.rolesConAcceso.set(roles);
      },
    });
  }

  togglePermission(op: string, currentlyAssigned: boolean) {
    const auditRol = this.selectedAuditRol();
    const newAssignRol = this.rolCtrl.value;
    const rolId = this.resolveRoleNodeId(auditRol || newAssignRol);

    if (!rolId || !this.nodo) {
      this.snackBar.open('Selecciona un rol primero', 'Cerrar');
      return;
    }

    const idNodo = this.nodo?.id_nodo;
    if (!idNodo) return;

    if (currentlyAssigned) {
      this.accesosSvc.revocarPermiso(rolId, idNodo, op).subscribe(() => {
        this.snackBar.open(`Permiso ${op} revocado`, 'OK', { duration: 2000 });
        this.loadRolesConAcceso();
        this.selectRolForAudit(rolId);
      });
    } else {
      this.accesosSvc.otorgarPermiso(rolId, idNodo, op).subscribe(() => {
        this.snackBar.open(`Permiso ${op} otorgado`, 'OK', { duration: 2000 });
        this.loadRolesConAcceso();
        this.selectRolForAudit(rolId);
        // Si venía de "Nueva Asignación", ya se seleccionó arriba
      });
    }
  }

  /**
   * Asignación rápida: otorga VER, CREAR, EDITAR y ELIMINAR por defecto
   */
  quickAssign(rol: any) {
    if (!this.nodo?.id_nodo) return;
    const rolId = this.resolveRoleNodeId(rol.id_nodo || rol.id_rol || rol.codigo || rol.nombre);
    if (!rolId) return;

    const DEFAULT_OPS = ['VER', 'CREAR', 'EDITAR', 'ELIMINAR'];
    const grants = DEFAULT_OPS.map(op =>
      this.accesosSvc.otorgarPermiso(rolId, this.nodo!.id_nodo!, op)
    );

    forkJoin(grants).subscribe({
      next: () => {
        this.snackBar.open(
          `Rol ${rol.nombre || rol.codigo} asignado con VER, CREAR, EDITAR y ELIMINAR`,
          'OK',
          { duration: 3000 }
        );
        this.loadRolesConAcceso();
        this.selectRolForAudit(rolId);
      },
      error: (err) => this.snackBar.open('Error al asignar: ' + err.message, 'Cerrar'),
    });
  }

  /**
   * Desasignación rápida: revoca todos los permisos actuales del rol en este nodo
   */
  quickUnassign(roleId: number, event: Event) {
    event.stopPropagation(); // Evitar seleccionar para auditoría al hacer clic en el botón de quitar

    if (!this.nodo?.id_nodo) return;

    const dialogRef = this.dialog.open(DialogoConfirmacionComponent, {
      width: '400px',
      data: {
        title: 'Quitar Acceso Total',
        message: `¿Estás seguro de revocar TODOS los permisos del rol ${roleId} en este recurso?`,
      },
    });

    dialogRef.afterClosed().subscribe((confirm) => {
      if (confirm) {
        // Primero obtenemos los permisos actuales para saber qué revocar
        this.accesosSvc.getPermisos(roleId, this.nodo!.id_nodo, 1, 100).subscribe((res) => {
          const permisos = res.data || [];
          if (permisos.length === 0) {
            this.loadRolesConAcceso();
            return;
          }

          const revocations = permisos.map((p: any) =>
            this.accesosSvc.revocarPermiso(roleId, this.nodo!.id_nodo!, p.op),
          );
          forkJoin(revocations).subscribe({
            next: () => {
              this.snackBar.open(`Accesos revocados para ${roleId}`, 'OK', { duration: 2000 });
              if (this.selectedAuditRol() === roleId) this.selectedAuditRol.set(null);
              this.loadRolesConAcceso();
            },
            error: (err) => this.snackBar.open('Error al revocar: ' + err.message, 'Cerrar'),
          });
        });
      }
    });
  }

  selectRolForAudit(roleId: number | null) {
    this.selectedAuditRol.set(roleId);
    if (roleId && this.nodo) {
      console.log(
        `[NodeDetailHub] Auditando permisos para Rol: ${roleId} y Nodo ID: ${this.nodo.id_nodo}`,
      );
      this.permisosDelRol.set([]); // Limpiar previo para feedback visual
      this.accesosSvc.getPermisos(roleId, this.nodo.id_nodo, 1, 100).subscribe({
        next: (res) => {
          console.log('[NodeDetailHub] Permisos detallados recibidos:', res.data?.length || 0);
          this.permisosDelRol.set(res.data || []);
        },
        error: (err) => {
          console.error('[NodeDetailHub] Error cargando permisos del rol:', err);
          this.snackBar.open('Error al cargar detalle de permisos', 'Cerrar', { duration: 3000 });
        },
      });
    } else {
      this.permisosDelRol.set([]);
    }
  }

  private loadPermisos() {
    // Sobreescribimos la carga anterior para que use el nuevo flujo si hay un rol seleccionado
    if (this.selectedAuditRol()) {
      this.selectRolForAudit(this.selectedAuditRol());
    } else {
      this.loadRolesConAcceso();
    }
  }

  ngOnInit() {
    console.log('>>> [NodeDetailHub] VERSION: V-UNIFIED-SECURITY-MATRIX-01');
    // Cargar catálogo de operaciones siempre al inicio
    this.accesosSvc.getOperaciones().subscribe((ops) => {
      console.log('[NodeDetailHub] Operaciones cargadas en el catálogo:', ops.length);
      this.allOperations.set(ops);
    });
    this.loadPermisos();

    // Sincronizar dropdown de "Nueva Asignación" con la matriz de seguridad
    this.rolCtrl.valueChanges.subscribe((val) => {
      if (val) {
        this.selectRolForAudit(this.resolveRoleNodeId(val));
      }
    });
  }

  onTabChange(event: MatTabChangeEvent) {
    if (event.index === 1) { // 1 = Seguridad y Roles
      this.loadPermisos();
    }
  }

  onEdit() {
    if (!this.nodo) return;
    const dialogRef = this.dialog.open(DialogoNodoComponent, {
      width: '500px',
      data: { nodo: this.nodo, title: 'Editar Nodo' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const payload = {
          ...result,
          id_nodo: result.id_nodo || this.nodo?.id_nodo,
          tipo_nodo: result.tipo_nodo || result.tipo,
        };

        this.accesosSvc.upsertNodo(payload).subscribe({
          next: () => {
            this.snackBar.open('Nodo actualizado', 'Cerrar', { duration: 2000 });
            this.onReloadTree?.();
          },
        });
      }
    });
  }

  onAddChild() {
    if (!this.nodo) return;
    const dialogRef = this.dialog.open(DialogoNodoComponent, {
      width: '500px',
      data: { nodo: undefined, title: 'Crear Nodo Hijo' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // El diálogo devuelve: { codigo, etiqueta, tipo, ruta, slug, icono, descripcion, orden, activo }
        const payload = {
          ...result,
          tipo_nodo: result.tipo_nodo || result.tipo,
        };

        this.accesosSvc.upsertNodo(payload).subscribe({
          next: (response) => {
            const parentId = this.nodo?.id_nodo ? Number(this.nodo.id_nodo) : null;
            const childId = response.data?.id_nodo;
            if (!parentId || !childId) {
              this.snackBar.open('No se pudo resolver el ID del vínculo', 'Cerrar');
              return;
            }
            this.accesosSvc.enlazarMenuNodos(parentId, childId).subscribe({
              next: () => {
                this.snackBar.open('Hijo creado y vinculado correctamente', 'Cerrar', {
                  duration: 2000,
                });
                this.onReloadTree?.();
              },
              error: (err) => this.snackBar.open('Error al vincular: ' + err.message, 'Cerrar'),
            });
          },
          error: (err) => this.snackBar.open('Error al crear nodo: ' + err.message, 'Cerrar'),
        });
      }
    });
  }

  onDelete() {
    if (!this.nodo) return;

    if (this.onDeleteNode) {
      this.onDeleteNode(this.nodo);
      return;
    }

    if (!this.nodo.id_nodo) {
      this.snackBar.open('No se pudo resolver el ID del nodo', 'Cerrar', { duration: 4000 });
      return;
    }

    const dialogRef = this.dialog.open(DialogoConfirmacionComponent, {
      width: '450px',
      data: {
        title: 'Eliminar Nodo',
        message: `Confirma desactivar el nodo "${this.nodo.etiqueta}".`,
      },
    });

    dialogRef.afterClosed().subscribe((confirm) => {
      if (confirm) {
        this.accesosSvc.deleteNodo(this.nodo!.id_nodo!).subscribe({
          next: () => {
            this.snackBar.open('Nodo desactivado', 'Cerrar', { duration: 3000 });
            this.onReloadTree?.();
          },
        });
      }
    });
  }

  linkMode = signal<'hijo' | 'padre'>('hijo');

  onLink() {
    if (!this.nodo || !this.searchHijoCtrl.value) return;
    const targetCode = this.searchHijoCtrl.value;

    // Identificar quién es el hijo y quién es el padre en esta operación
    const childCode = this.linkMode() === 'hijo' ? targetCode : this.nodo.codigo_tecnico;
    const parentCode = this.linkMode() === 'hijo' ? this.nodo.codigo_tecnico : targetCode;

    // Multiparenting: enlazar directamente sin eliminar vínculos de padres preexistentes
    this.executeLinking(parentCode, childCode);
  }

  private executeLinking(padre: string, hijo: string) {
    const padreId = this.getNodeId(padre);
    const hijoId = this.getNodeId(hijo);
    if (!padreId || !hijoId) {
      this.snackBar.open('No se pudo resolver el ID del vínculo', 'Cerrar');
      return;
    }

    this.accesosSvc.enlazarMenuNodos(padreId, hijoId).subscribe({
      next: () => {
        const msg =
          this.linkMode() === 'hijo'
            ? 'Hijo movido correctamente'
            : 'Padre actualizado correctamente';
        this.snackBar.open(msg, 'Cerrar', { duration: 2000 });
        this.searchHijoCtrl.reset();
        this.onReloadTree?.();
      },
      error: (err) => this.snackBar.open('Error al vincular: ' + err.message, 'Cerrar'),
    });
  }

  onRemoveLink(p: string, h: string) {
    const dialogRef = this.dialog.open(DialogoConfirmacionComponent, {
      width: '400px',
      data: { title: 'Quitar Vínculo', message: `¿Eliminar relación entre ${p} y ${h}?` },
    });

    dialogRef.afterClosed().subscribe((confirm) => {
      if (confirm) {
        console.log(`📡 [NodeDetailHub] Eliminando vínculo: Padre=${p}, Hijo=${h}`);
        const padreId = this.getNodeId(p);
        const hijoId = this.getNodeId(h);
        if (!padreId || !hijoId) {
          this.snackBar.open('No se pudo resolver el ID del vínculo', 'Cerrar');
          return;
        }

        this.accesosSvc.deleteEnlace(padreId, hijoId).subscribe({
          next: () => {
            console.log('✅ [NodeDetailHub] Vínculo eliminado en servidor');
            this.snackBar.open('Vínculo eliminado', 'Cerrar', { duration: 2000 });
            this.onReloadTree?.();
          },
          error: (err) => {
            console.error('❌ [NodeDetailHub] Error al eliminar vínculo:', err);
            this.snackBar.open('Error al eliminar vínculo: ' + err.message, 'Cerrar');
          },
        });
      }
    });
  }

  onGrantPermission(op: string) {
    const rol = this.rolCtrl.value;
    const nodeId = this.nodo?.id_nodo;
    if (!rol || !nodeId) {
      this.snackBar.open('Selecciona un rol primero', 'Cerrar');
      return;
    }
    this.accesosSvc.otorgarPermiso(rol, nodeId, op).subscribe({
      next: () => {
        this.snackBar.open(`Permiso ${op} otorgado al rol ${rol}`, 'Cerrar', { duration: 2000 });
        this.loadPermisos();
      },
      error: (err) => this.snackBar.open('Error: ' + err.message, 'Cerrar'),
    });
  }

  onRevokePermission(usr: string, obj: string, op: string) {
    const dialogRef = this.dialog.open(DialogoConfirmacionComponent, {
      width: '400px',
      data: {
        title: 'Revocar Permiso',
        message: `¿Confirma revocar el permiso ${op} para ${usr}?`,
      },
    });

    dialogRef.afterClosed().subscribe((confirm) => {
      if (confirm) {
        this.accesosSvc.revocarPermiso(usr, obj, op).subscribe({
          next: () => {
            this.snackBar.open('Permiso revocado', 'Cerrar', { duration: 2000 });
            this.loadPermisos();
          },
        });
      }
    });
  }

  onAddMenuToNode() {
    if (!this.selectedMenuToAdd || !this.nodo?.codigo_tecnico) return;
    const padreId = this.getNodeId(this.selectedMenuToAdd);
    const hijoId = this.getNodeId(this.nodo.codigo_tecnico);
    if (!padreId || !hijoId) {
      this.snackBar.open('No se pudo resolver el ID del menú/política o nodo', 'Cerrar');
      return;
    }
    this.accesosSvc.enlazarMenuNodos(padreId, hijoId).subscribe({
      next: () => {
        this.snackBar.open('Nodo asociado correctamente', 'Cerrar', { duration: 2000 });
        this.selectedMenuToAdd = null;
        this.onReloadTree?.();
      },
      error: (err) => this.snackBar.open('Error al asociar: ' + err.message, 'Cerrar'),
    });
  }
}
