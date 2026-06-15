import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccesosService } from '../../core/services/accesos.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin, of, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { INodo } from '../../core/models/ngac-admin.models';

export interface ComparisonRow {
  objId: string;
  objLabel: string;
  op: string;
  rolesState: Record<string, boolean>;
  rolesLoading: Record<string, boolean>;
}

@Component({
  selector: 'app-comparador-permisos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSnackBarModule,
    MatIconModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './comparador-permisos.page.html',
  styleUrls: ['./comparador-permisos.page.css'],
})
export class PaginaComparadorPermisos implements OnInit {
  private accesosSvc = inject(AccesosService);
  private snackBar = inject(MatSnackBar);

  // Estados cargados del backend
  roles = signal<any[]>([]);
  politicas = signal<any[]>([]);
  operaciones = signal<string[]>([]);
  nodos = signal<INodo[]>([]);
  nodosRaiz = signal<any[]>([]);
  links = signal<any[]>([]);

  // Filtros y Selección
  selectedRoles = signal<Array<string | number>>([]);
  selectedPolicies = signal<string[]>([]);
  selectedRootNodes = signal<string[]>([]);
  searchQuery = signal<string>('');
  roleSearchQuery = '';
  showOnlyDifferences = signal<boolean>(false);
  loading = signal<boolean>(false);

  // Datos combinados de la matriz
  comparisonRows = signal<ComparisonRow[]>([]);

  ngOnInit() {
    this.loadRoles();
    this.loadPoliticas();
    this.loadOperaciones();
    this.loadNodos();
    this.loadModulosRaiz();
    this.loadEnlaces();
  }

  // Filtrado reactivo de la lista de roles en base al buscador de la tarjeta
  filteredRolesList = computed(() => {
    const roles = this.roles();
    const query = this.roleSearchQuery.toLowerCase().trim();
    if (!query) return roles;
    return roles.filter(
      (r) =>
        (r.nombre && r.nombre.toLowerCase().includes(query)) ||
        (r.codigo && r.codigo.toLowerCase().includes(query)),
    );
  });

  // Conjunto reactivo de objetos permitidos según filtrado de Nodos Raíz
  allowedObjectsSet = computed(() => {
    const selectedRoots = this.selectedRootNodes();
    if (selectedRoots.length === 0) {
      return null;
    }

    const allLinks = this.links();
    const descendants = new Set<string>();

    const collect = (nodeCode: string) => {
      if (descendants.has(nodeCode)) return;
      descendants.add(nodeCode);

      allLinks.forEach((link) => {
        if (String(link.padre) === nodeCode) {
          collect(String(link.hijo));
        }
      });
    };

    selectedRoots.forEach((root) => {
      collect(String(root));
    });

    return descendants;
  });

  // Filtrado reactivo de las filas de comparación
  filteredRows = computed(() => {
    let rows = this.comparisonRows();
    const query = this.searchQuery().toLowerCase().trim();
    const onlyDiffs = this.showOnlyDifferences();
    const activeRoles = this.selectedRoles();
    const allowedObjs = this.allowedObjectsSet();

    // Filtro por Nodos Raíz (ramas jerárquicas)
    if (allowedObjs) {
      rows = rows.filter((r) => allowedObjs.has(String(r.objId)));
    }

    // Filtro por búsqueda de texto — coerce a string para evitar TypeError con IDs numéricos
    if (query) {
      rows = rows.filter(
        (r) =>
          String(r.objId).toLowerCase().includes(query) ||
          String(r.objLabel).toLowerCase().includes(query) ||
          String(r.op).toLowerCase().includes(query),
      );
    }

    // Filtro por diferencias de accesos entre roles
    if (onlyDiffs && activeRoles.length > 1) {
      rows = rows.filter((r) => {
        const firstState = r.rolesState[activeRoles[0]];
        return activeRoles.some((role) => r.rolesState[role] !== firstState);
      });
    }

    return rows;
  });

  loadRoles() {
    this.accesosSvc.getRoles().subscribe({
      next: (data) => this.roles.set(data),
      error: () => this.snackBar.open('Error al cargar roles', 'Cerrar', { duration: 4000 }),
    });
  }

  loadPoliticas() {
    this.accesosSvc.getPoliticasRaiz().subscribe({
      next: (data) => this.politicas.set(data),
      error: () => this.snackBar.open('Error al cargar políticas', 'Cerrar', { duration: 4000 }),
    });
  }

  loadOperaciones() {
    this.accesosSvc.getOperaciones().subscribe({
      next: (ops) => {
        const opNames = (ops || []).map((op: any) => op.nombre_op || op);
        this.operaciones.set(opNames);
      },
      error: () => this.snackBar.open('Error al cargar operaciones', 'Cerrar', { duration: 4000 }),
    });
  }

  loadNodos() {
    this.accesosSvc.getNodos().subscribe({
      next: (data) => this.nodos.set(data),
      error: () =>
        this.snackBar.open('Error al cargar información de módulos', 'Cerrar', { duration: 4000 }),
    });
  }

  loadModulosRaiz() {
    this.accesosSvc.getModulosRaiz().subscribe({
      next: (data) => this.nodosRaiz.set(data),
      error: () => this.snackBar.open('Error al cargar módulos raíz', 'Cerrar', { duration: 4000 }),
    });
  }

  loadEnlaces() {
    this.accesosSvc.getEnlaces().subscribe({
      next: (data) => this.links.set(data),
      error: () =>
        this.snackBar.open('Error al cargar jerarquías de enlaces', 'Cerrar', { duration: 4000 }),
    });
  }

  isRoleSelected(roleId: string | number): boolean {
    return this.selectedRoles().includes(roleId);
  }

  toggleRoleSelection(roleId: string | number) {
    const current = [...this.selectedRoles()];
    const index = current.indexOf(roleId);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(roleId);
    }
    this.selectedRoles.set(current);
  }

  onPoliciesChange(values: string[]) {
    this.selectedPolicies.set(values);
  }

  onRootNodesChange(values: string[]) {
    this.selectedRootNodes.set(values);
  }

  getRoleName(roleId: string | number): string {
    const r = this.roles().find(
      (role) => String(role.id_nodo || role.id_rol || role.codigo) === String(roleId),
    );
    return r ? r.nombre : String(roleId);
  }

  loadComparisonData() {
    const activeRoles = this.selectedRoles();
    const activePols = this.selectedPolicies();

    if (activeRoles.length === 0) {
      this.comparisonRows.set([]);
      return;
    }

    this.loading.set(true);

    // Si no hay políticas seleccionadas, consultamos con vacío (todas)
    const requests: Observable<any>[] = [];

    if (activePols.length === 0) {
      activeRoles.forEach((rol) => {
        requests.push(
          this.accesosSvc
            .getPermissionMatrix(rol, '')
            .pipe(catchError(() => of({ success: false, data: [] }))),
        );
      });
    } else {
      // Combinar roles y políticas
      activeRoles.forEach((rol) => {
        activePols.forEach((pol) => {
          requests.push(
            this.accesosSvc
              .getPermissionMatrix(rol, pol)
              .pipe(catchError(() => of({ success: false, data: [] }))),
          );
        });
      });
    }

    forkJoin(requests).subscribe({
      next: (responses: any[]) => {
        // Mapa temporal para construir combinaciones únicas de objeto y operación
        const uniqueKeys = new Map<string, { objId: string; objLabel: string; op: string }>();

        responses.forEach((resp) => {
          const perms = resp?.data || [];
          perms.forEach((p: any) => {
            const objStr = String(p.obj ?? '');
            const opStr = String(p.op ?? '');
            const key = `${objStr}||${opStr}`;
            if (!uniqueKeys.has(key)) {
              const n = this.nodos().find((node) => node.codigo_tecnico === objStr);
              uniqueKeys.set(key, {
                objId: objStr,
                objLabel: n ? n.etiqueta : String(p.obj_etiqueta ?? objStr),
                op: opStr,
              });
            }
          });
        });

        // Construir filas con el estado para cada rol
        const rows: ComparisonRow[] = [];
        uniqueKeys.forEach((meta) => {
          const rolesState: Record<string, boolean> = {};
          const rolesLoading: Record<string, boolean> = {};

          activeRoles.forEach((rol, rIdx) => {
            rolesLoading[rol] = false;
            let hasPerm = false;

            if (activePols.length === 0) {
              // 1 respuesta por rol
              const perms = responses[rIdx]?.data || [];
              hasPerm = perms.some(
                (p: any) => p.obj === meta.objId && p.op.toUpperCase() === meta.op.toUpperCase(),
              );
            } else {
              // Varias respuestas por rol (una para cada política seleccionada)
              const startIdx = rIdx * activePols.length;
              for (let pIdx = 0; pIdx < activePols.length; pIdx++) {
                const perms = responses[startIdx + pIdx]?.data || [];
                if (
                  perms.some(
                    (p: any) =>
                      p.obj === meta.objId && p.op.toUpperCase() === meta.op.toUpperCase(),
                  )
                ) {
                  hasPerm = true;
                  break;
                }
              }
            }

            rolesState[rol] = hasPerm;
          });

          rows.push({
            objId: meta.objId,
            objLabel: meta.objLabel,
            op: meta.op,
            rolesState,
            rolesLoading,
          });
        });

        // Ordenar filas por Módulo / Objeto
        rows.sort((a, b) => a.objLabel.localeCompare(b.objLabel));

        this.comparisonRows.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Error al procesar la comparación de permisos', 'Cerrar', {
          duration: 4000,
        });
        this.loading.set(false);
      },
    });
  }

  toggleCellPermission(row: ComparisonRow, role: string | number) {
    const isAllowed = row.rolesState[role];

    // Activar loader en la celda
    row.rolesLoading[role] = true;

    // Disparar acción correspondiente
    const action$ = isAllowed
      ? this.accesosSvc.revocarPermiso(role, row.objId, row.op)
      : this.accesosSvc.otorgarPermiso(role, row.objId, role === 'ADMINISTRACION' ? 'VER' : row.op);

    action$.subscribe({
      next: () => {
        row.rolesState[role] = !isAllowed;
        row.rolesLoading[role] = false;
        this.snackBar.open(
          `Permiso ${isAllowed ? 'revocado' : 'otorgado'} con éxito para ${role}`,
          'Cerrar',
          { duration: 2500 },
        );
        // Forzar actualización del signal de filas
        this.comparisonRows.set([...this.comparisonRows()]);
      },
      error: (err) => {
        row.rolesLoading[role] = false;
        const msg = err.error?.detail || err.error?.error || err.message || 'Error desconocido';
        this.snackBar.open(`Error al cambiar permiso: ${msg}`, 'Cerrar', { duration: 4000 });
      },
    });
  }
}
