import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { of, forkJoin } from 'rxjs';
import { concatMap, map } from 'rxjs/operators';
import { AccesosService } from '../../core/services/accesos.service';
import { RolesService, IRol } from '../../core/services/roles.service';
import { INodo, NGAC_OPERATIONS } from '../../core/models/ngac-admin.models';

@Component({
  selector: 'app-hub-rol',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTableModule,
    MatTooltipModule,
    FormsModule,
  ],
  templateUrl: './hub-rol.component.html',
})
export class HubRolComponent implements OnInit {
  role = signal<IRol | null>(null);
  // Estado del Hub Pro
  fullTree = signal<any[]>([]);
  roleTree = signal<any[]>([]);
  selectedNode = signal<any | null>(null);
  
  // Cache de IDs vinculados para búsqueda rápida
  linkedNodeIds = signal<Set<string>>(new Set());
  searchTerm = signal<string>('');
  
  permisosExistentes = signal<any[]>([]);
  operaciones = NGAC_OPERATIONS;
  loading = signal(false);

  // Form para nuevo permiso
  selectedNodo = '';
  operacionesSeleccionadas: { [key: string]: boolean } = {};
  expandedNodes = new Set<string>();
  expandedSummaryNodes = new Set<string>();
  selectedNodes = new Set<string>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private rolesSvc: RolesService,
    private accesosSvc: AccesosService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    const roleId = this.route.snapshot.paramMap.get('id');
    if (roleId) {
      this.loadRoleData(roleId);
    }
  }

  loadRoleData(roleId: string) {
    this.loading.set(true);
    // 1. Obtener info del rol (buscando por código en este caso)
    this.rolesSvc.getRoles().subscribe(roles => {
      const found = roles.find(r => r.codigo === roleId || r.id_rol?.toString() === roleId);
      if (found) {
        this.role.set(found);
        this.loadAssignments(found.codigo);
      }
      this.loading.set(false);
    });
  }

  filteredTree = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const roots = this.fullTree();
    
    if (!term) return roots;

    // Si hay búsqueda, aplanamos para encontrar coincidencias en cualquier nivel
    const matches: any[] = [];
    const searchRecursive = (nodes: any[]) => {
      nodes.forEach(n => {
        if (n.etiqueta.toLowerCase().includes(term) || n.codigo_tecnico.toLowerCase().includes(term)) {
          matches.push({...n, children: []}); // Mostrar plano en búsqueda para fácil acceso
        }
        if (n.children) searchRecursive(n.children);
      });
    };
    searchRecursive(roots);
    return matches;
  });

  loadAssignments(rolCodigo: string) {
    this.loading.set(true);
    
    // Usar forkJoin para carga paralela y consistente
    forkJoin({
      nodes: this.accesosSvc.getNodos(),
      enlaces: this.accesosSvc.getEnlaces(),
      role: this.accesosSvc.obtenerArbol(rolCodigo),
      perms: this.accesosSvc.getPermisos(rolCodigo)
    }).subscribe({
      next: (res) => {
        // 1. Mapear nodos por código para acceso rápido
        const nodeMap = new Map<string, any>();
        res.nodes.forEach(n => {
          if (n.codigo_tecnico) {
            nodeMap.set(n.codigo_tecnico.trim().toUpperCase(), { ...n, children: [] });
          }
        });

        // 2. Aplicar enlaces jerárquicos
        const oaChildCodes = new Set<string>();
        res.enlaces.forEach(e => {
          const padreCode = e.padre?.trim().toUpperCase();
          const hijoCode = e.hijo?.trim().toUpperCase();
          
          const padre = nodeMap.get(padreCode);
          const hijo = nodeMap.get(hijoCode);
          
          if (padre && hijo) {
            padre.children.push(hijo);
            // Si el padre es un recurso (OA/Carpeta), el hijo no puede ser raíz funcional
            if (this.isResourceType(padre.tipo_nodo) && this.isResourceType(hijo.tipo_nodo)) {
              oaChildCodes.add(hijoCode);
            }
          }
        });

        // 2.5 Ordenar todos los hijos recursivamente
        nodeMap.forEach(n => {
          if (n.children && n.children.length > 0) {
            n.children.sort((a: any, b: any) => {
              const diff = (Number(a.orden_visual) || 0) - (Number(b.orden_visual) || 0);
              return diff !== 0 ? diff : a.etiqueta.localeCompare(b.etiqueta);
            });
          }
        });

        // 3. Identificar Carpetas Raíz (Todos los OA que no son hijos de otro OA)
        const allOA = Array.from(nodeMap.values()).filter(n => this.isResourceType(n.tipo_nodo));
        const entryPoints = allOA
          .filter(oa => !oaChildCodes.has(oa.codigo_tecnico?.trim().toUpperCase()))
          .sort((a, b) => {
            const diff = (Number(a.orden_visual) || 0) - (Number(b.orden_visual) || 0);
            return diff !== 0 ? diff : a.etiqueta.localeCompare(b.etiqueta);
          });

        console.log(`[Hub Debug] Total Nodos: ${res.nodes.length}, OA Detectados: ${allOA.length}, Raíces: ${entryPoints.length}`);
        if (entryPoints.length < 10) {
          console.warn('[Hub Debug] Pocas raíces detectadas. Raíces encontradas:', entryPoints.map(e => e.etiqueta));
        }

        this.fullTree.set(entryPoints);

        // 4. Árbol del Rol (Summary) - Solo con lo que tiene permisos
        const roleNodeMap = new Map<string, any>();
        const roleCodesWithPerms = new Set(this.permisosExistentes().map(p => p.obj?.trim().toUpperCase()));
        
        // Función para aplanar y filtrar el árbol del rol recibido
        const processRoleTree = (nodes: any[]) => {
          nodes.forEach(n => {
            const code = n.codigo_tecnico?.trim().toUpperCase();
            if (code) {
              roleNodeMap.set(code, { ...n, children: [] });
              if (n.children) processRoleTree(n.children);
            }
          });
        };
        processRoleTree(res.role);

        // Re-mapear hijos y filtrar ramas vacías
        const oaChildCodesRole = new Set<string>();
        res.enlaces.forEach(e => {
          const p = roleNodeMap.get(e.padre?.trim().toUpperCase());
          const h = roleNodeMap.get(e.hijo?.trim().toUpperCase());
          if (p && h) {
            p.children.push(h);
            if (this.isResourceType(p.tipo_nodo) && this.isResourceType(h.tipo_nodo)) {
              oaChildCodesRole.add(h.codigo_tecnico?.trim().toUpperCase());
            }
          }
        });

        // Ordenar hijos del árbol del rol recursivamente
        roleNodeMap.forEach(n => {
          if (n.children && n.children.length > 0) {
            n.children.sort((a: any, b: any) => {
              const diff = (Number(a.orden_visual) || 0) - (Number(b.orden_visual) || 0);
              return diff !== 0 ? diff : a.etiqueta.localeCompare(b.etiqueta);
            });
          }
        });

        // Función de poda: Eliminar ramas que no tienen permisos ni hijos con permisos
        const pruneTree = (node: any): boolean => {
          const hasDirectPerm = roleCodesWithPerms.has(node.codigo_tecnico?.trim().toUpperCase());
          if (node.children) {
            node.children = node.children.filter((c: any) => pruneTree(c));
          }
          return hasDirectPerm || (node.children && node.children.length > 0);
        };

        const allRoleOA = Array.from(roleNodeMap.values()).filter(n => this.isResourceType(n.tipo_nodo));
        const roleRoots = allRoleOA
          .filter(oa => !oaChildCodesRole.has(oa.codigo_tecnico?.trim().toUpperCase()))
          .filter(root => pruneTree(root))
          .sort((a, b) => {
            const diff = (Number(a.orden_visual) || 0) - (Number(b.orden_visual || 0));
            return diff !== 0 ? diff : a.etiqueta.localeCompare(b.etiqueta);
          });

        this.roleTree.set(roleRoots);

        // 5. Mapear vinculados - USANDO ENLACES DIRECTOS para mayor exactitud
        const linkedIds = new Set<string>();
        const rolCodeUpper = rolCodigo.trim().toUpperCase();
        
        res.enlaces.forEach(e => {
          if (e.padre?.trim().toUpperCase() === rolCodeUpper) {
            linkedIds.add(e.hijo?.trim().toUpperCase());
          }
        });
        
        this.linkedNodeIds.set(linkedIds);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading assignments:', err);
        this.loading.set(false);
        this.snackBar.open('Error al cargar datos del Hub', 'Cerrar');
      }
    });
  }

  selectNode(nodo: any) {
    this.selectedNode.set(nodo);
    this.selectedNodo = nodo.codigo_tecnico;
    const nodeCode = nodo.codigo_tecnico;
    const rolCod = this.role()?.codigo;

    if (!rolCod || !nodeCode) return;

    // Resetear selecciones
    this.operacionesSeleccionadas = {};
    
    // Si es un nodo final, cargar sus permisos específicos para asegurar exactitud
    if (!nodo.children?.length) {
      this.loading.set(true);
      this.accesosSvc.getPermisos(rolCod, nodeCode, 1, 100).subscribe({
        next: (res) => {
          const perms = res.data || [];
          this.operaciones.forEach(op => {
            this.operacionesSeleccionadas[op] = perms.some(
              p => p.op?.trim().toUpperCase() === op.trim().toUpperCase()
            );
          });
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    }
  }

  selectAll() {
    this.operaciones.forEach(op => this.operacionesSeleccionadas[op] = true);
  }

  clearAll() {
    this.operaciones.forEach(op => this.operacionesSeleccionadas[op] = false);
  }

  enlazarNodos(node: any) {
    if (!this.role()) return;
    this.loading.set(true);
    this.accesosSvc.enlazarNodos(this.role()!.codigo, node.codigo_tecnico).subscribe({
      next: () => {
        this.snackBar.open(`Nodo ${node.etiqueta} vinculado`, 'Cerrar', { duration: 2000 });
        this.loadAssignments(this.role()!.codigo);
      },
      error: (err: any) => {
        this.snackBar.open('Error: ' + err.message, 'Cerrar');
        this.loading.set(false);
      }
    });
  }

  isLinked(nodeCode: string): boolean {
    return this.linkedNodeIds().has(nodeCode);
  }

  vincularYOtorgar() {
    if (!this.selectedNode() || !this.role()) return;
    const node = this.selectedNode()!;
    const rolCod = this.role()!.codigo;
    const nodoCod = node.codigo_tecnico;
    
    this.loading.set(true);

    // 1. Vincular Nodo si no lo está
    const link$ = this.isLinked(nodoCod) 
      ? of({ success: true } as any) 
      : this.accesosSvc.enlazarNodos(rolCod, nodoCod);

    link$.pipe(
      concatMap(() => {
        // 2. Identificar deltas de operaciones
        const opsActuales = this.permisosExistentes()
          .filter(p => p.obj === nodoCod)
          .map(p => p.op);

        const aOtorgar = this.operaciones.filter(op => this.operacionesSeleccionadas[op] && !opsActuales.includes(op));
        const aRevocar = this.operaciones.filter(op => !this.operacionesSeleccionadas[op] && opsActuales.includes(op));

        const tasks = [
          ...aOtorgar.map(op => this.accesosSvc.otorgarPermiso(rolCod, nodoCod, op)),
          ...aRevocar.map(p => {
            const perm = this.permisosExistentes().find(x => x.obj === nodoCod && x.op === p);
            return this.accesosSvc.revocarPermiso(rolCod, nodoCod, p);
          })
        ];

        if (tasks.length === 0) return of({ message: 'Sin cambios', count: 0 });
        
        return forkJoin(tasks).pipe(map(results => ({ message: 'Éxito', count: results.length })));
      })
    ).subscribe({
      next: (res: any) => {
        this.snackBar.open(`Operación completada: ${res.count} cambios aplicados`, 'Cerrar', { duration: 3000 });
        this.loadAssignments(rolCod);
      },
      error: (err: any) => {
        this.snackBar.open('Error: ' + err.message, 'Cerrar');
        this.loading.set(false);
      }
    });
  }

  vincularRaiz() {
    if (!this.selectedNode() || !this.role()) return;
    const node = this.selectedNode()!;
    this.loading.set(true);
    this.accesosSvc.enlazarNodos(this.role()!.codigo, node.codigo_tecnico).subscribe({
      next: () => {
        this.snackBar.open(`Nodo ${node.etiqueta} vinculado`, 'Cerrar', { duration: 2000 });
        this.loadAssignments(this.role()!.codigo);
      },
      error: (err: any) => {
        this.snackBar.open('Error: ' + err.message, 'Cerrar');
        this.loading.set(false);
      }
    });
  }



  onNodoChange(nodeCode: string) {
    this.selectedNodo = nodeCode;
    // Reiniciar selecciones
    this.operacionesSeleccionadas = {};
    this.operaciones.forEach(op => {
      this.operacionesSeleccionadas[op] = this.permisosExistentes().some(
        p => p.obj === nodeCode && p.op === op
      );
    });
  }

  otorgar() {
    const node = this.selectedNode();
    if (!node || !this.role()) {
      this.snackBar.open('Seleccione un recurso para otorgar permisos', 'Cerrar');
      return;
    }
    
    const rolCod = this.role()!.codigo;
    const nodoCod = node.codigo_tecnico;
    
    // 1. Identificar cambios (deltas)
    const opsActuales = this.permisosExistentes()
      .filter(p => p.obj === nodoCod)
      .map(p => p.op);

    const aOtorgar = this.operaciones.filter(op => this.operacionesSeleccionadas[op] && !opsActuales.includes(op));
    const aRevocar = this.operaciones.filter(op => !this.operacionesSeleccionadas[op] && opsActuales.includes(op));

    const totalTasks = aOtorgar.length + aRevocar.length;
    if (totalTasks === 0) {
      this.snackBar.open('Sin cambios detectados', 'Cerrar', { duration: 2000 });
      return;
    }

    this.loading.set(true);
    let completed = 0;

    const checkFinalize = () => {
      completed++;
      if (completed === totalTasks) {
        this.snackBar.open('Permisos actualizados correctamente', 'Cerrar', { duration: 2000 });
        this.loadAssignments(rolCod);
        this.loading.set(false);
      }
    };

    // Procesar otorgamientos
    aOtorgar.forEach(op => {
      this.accesosSvc.otorgarPermiso(rolCod, nodoCod, op).subscribe({
        next: checkFinalize,
        error: checkFinalize
      });
    });

    // Procesar revocaciones
    aRevocar.forEach(op => {
      this.accesosSvc.revocarPermiso(rolCod, nodoCod, op).subscribe({
        next: checkFinalize,
        error: checkFinalize
      });
    });
  }

  revocar(permiso: any) {
    this.accesosSvc.revocarPermiso(this.role()!.codigo, permiso.obj, permiso.op).subscribe({
      next: () => {
        this.snackBar.open('Permiso revocado', 'Cerrar', { duration: 2000 });
        this.loadAssignments(this.role()!.codigo);
      }
    });
  }

  getPermisosForNodo(nodeCode: string): string[] {
    return this.permisosExistentes()
      .filter(p => p.obj?.trim().toUpperCase() === nodeCode.trim().toUpperCase())
      .map(p => p.op);
  }

  hasPermissions(nodeCode: string): boolean {
    return this.permisosExistentes().some(p => p.obj === nodeCode);
  }

  toggleNode(node: any, siblings: any[]) {
    const nodeCode = node.codigo_tecnico;
    const isNowExpanding = !this.expandedNodes.has(nodeCode);
    
    if (isNowExpanding) {
      // Colapsar hermanos
      siblings.forEach(s => {
        if (s.codigo_tecnico !== nodeCode) {
          this.expandedNodes.delete(s.codigo_tecnico);
          // Opcional: Colapsar recursivamente los hijos de los hermanos si se desea un colapso total
          this.collapseRecursive(s);
        }
      });
      this.expandedNodes.add(nodeCode);
    } else {
      this.expandedNodes.delete(nodeCode);
      this.collapseRecursive(node);
    }
  }

  private collapseRecursive(node: any) {
    if (node.children) {
      node.children.forEach((c: any) => {
        this.expandedNodes.delete(c.codigo_tecnico);
        this.collapseRecursive(c);
      });
    }
  }

  toggleSummaryNode(node: any) {
    const nodeCode = node.codigo_tecnico;
    if (this.expandedSummaryNodes.has(nodeCode)) {
      this.expandedSummaryNodes.delete(nodeCode);
    } else {
      this.expandedSummaryNodes.add(nodeCode);
    }
  }

  isSummaryExpanded(nodeCode: string): boolean {
    return this.expandedSummaryNodes.has(nodeCode);
  }

  isExpanded(nodeCode: string): boolean {
    return this.expandedNodes.has(nodeCode);
  }

  toggleNodeSelection(node: any) {
    const code = node.codigo_tecnico;
    if (this.selectedNodes.has(code)) {
      this.selectedNodes.delete(code);
    } else {
      this.selectedNodes.add(code);
    }
  }

  bulkVincular() {
    if (this.selectedNodes.size === 0 || !this.role()) return;
    this.loading.set(true);
    const tasks = Array.from(this.selectedNodes).map(code => this.accesosSvc.enlazarNodos(this.role()!.codigo, code));
    forkJoin(tasks).subscribe({
      next: () => {
        this.snackBar.open(`${this.selectedNodes.size} recursos vinculados`, 'Cerrar', { duration: 2000 });
        this.selectedNodes.clear();
        this.loadAssignments(this.role()!.codigo);
      },
      error: () => {
        this.snackBar.open('Error en vinculación masiva', 'Cerrar');
        this.loading.set(false);
      }
    });
  }

  bulkDesvincular() {
    if (this.selectedNodes.size === 0 || !this.role()) return;
    this.loading.set(true);
    const tasks = Array.from(this.selectedNodes).map(code => this.accesosSvc.deleteEnlace(this.role()!.codigo, code));
    forkJoin(tasks).subscribe({
      next: () => {
        this.snackBar.open(`${this.selectedNodes.size} recursos desvinculados`, 'Cerrar', { duration: 2000 });
        this.selectedNodes.clear();
        this.loadAssignments(this.role()!.codigo);
      },
      error: () => {
        this.snackBar.open('Error en desvinculación masiva', 'Cerrar');
        this.loading.set(false);
      }
    });
  }

  desvincularNodo(nodo: any) {
    if (!this.role()) return;
    this.accesosSvc.deleteEnlace(this.role()!.codigo, nodo.codigo_tecnico).subscribe({
      next: () => {
        this.snackBar.open('Recurso desvinculado', 'Cerrar', { duration: 2000 });
        this.loadAssignments(this.role()!.codigo);
      },
      error: (err) => this.snackBar.open('Error al desvincular: ' + err.message, 'Cerrar')
    });
  }

  isResourceType(type: string | undefined): boolean {
    if (!type) return false;
    const t = type.toUpperCase();
    return ['OBJ_ATTR', 'CARPETA', 'OBJETO', 'OA'].includes(t);
  }

  goBack() {
    this.router.navigate(['/roles']);
  }
}
