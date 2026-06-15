import { Component, OnInit, computed, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { of, forkJoin } from 'rxjs';
import { catchError, concatMap, map } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AccesosService } from '../../core/services/accesos.service';
import { RolesService, IRol } from '../../core/services/roles.service';
import { NGAC_OPERATIONS } from '../../core/models/ngac-admin.models';

@Component({
  selector: 'app-hub-rol',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './hub-rol.component.html',
})
export class HubRolComponent implements OnInit {
  @ViewChild('treeScrollContainer') private treeScrollContainer?: ElementRef<HTMLDivElement>;

  private readonly defaultBatchOperations = new Set(['VER', 'CREAR', 'EDITAR', 'ELIMINAR']);
  private readonly defaultPermissionCondition = '{}';

  role = signal<IRol | null>(null);
  allNodes = signal<any[]>([]);
  allEnlaces = signal<any[]>([]);
  politicas = signal<any[]>([]);
  selectedPolicy = signal<string>('');
  fullTree = signal<any[]>([]);
  roleTree = signal<any[]>([]);
  selectedNode = signal<any | null>(null);
  linkedNodeIds = signal<Set<string>>(new Set());
  searchTerm = signal<string>('');
  permisosExistentes = signal<any[]>([]);
  loading = signal(false);
  selectedNodes = signal<Set<string>>(new Set());

  operaciones = NGAC_OPERATIONS;
  selectedNodo = '';
  permissionCondition = this.defaultPermissionCondition;
  batchPermissionCondition = this.defaultPermissionCondition;
  operacionesSeleccionadas: { [key: string]: boolean } = {};
  expandedNodes = new Set<string>();
  expandedSummaryNodes = new Set<string>();

  selectedBatchCount = computed(() => this.selectedNodes().size);
  isBatchMode = computed(() => this.selectedBatchCount() > 1);

  filteredTree = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const roots = this.getPolicyFilteredRoots();

    if (!term) return roots;

    const matches: any[] = [];
    const searchRecursive = (nodes: any[]) => {
      nodes.forEach((node) => {
        if (
          String(node.etiqueta || '')
            .toLowerCase()
            .includes(term) ||
          String(node.codigo_tecnico || '')
            .toLowerCase()
            .includes(term)
        ) {
          matches.push({ ...node, children: [] });
        }
        if (node.children?.length) {
          searchRecursive(node.children);
        }
      });
    };

    searchRecursive(roots);
    return matches;
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private rolesSvc: RolesService,
    private accesosSvc: AccesosService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit() {
    const roleId = this.route.snapshot.paramMap.get('id');
    if (roleId) {
      this.loadRoleData(roleId);
    }
  }

  private getRoleNodeId(): number | null {
    return this.role()?.id_nodo ? Number(this.role()!.id_nodo) : null;
  }

  private getNodeSelectionKey(nodeOrId: any): string | null {
    if (nodeOrId === undefined || nodeOrId === null || nodeOrId === '') {
      return null;
    }

    if (
      typeof nodeOrId === 'object' &&
      nodeOrId.id_nodo !== undefined &&
      nodeOrId.id_nodo !== null
    ) {
      return String(nodeOrId.id_nodo).trim();
    }

    return String(nodeOrId).trim();
  }

  private getTreeNodeId(nodeOrId: any): number | null {
    if (nodeOrId?.id_nodo !== undefined && nodeOrId?.id_nodo !== null) {
      return Number(nodeOrId.id_nodo);
    }
    if (typeof nodeOrId === 'number') {
      return nodeOrId;
    }
    if (typeof nodeOrId === 'string' && nodeOrId.trim() !== '') {
      const parsed = Number(nodeOrId);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  }

  private logRoleLink(action: string, detail: Record<string, unknown>) {
    console.log(`[HubRol] ${action}`, {
      timestamp: new Date().toISOString(),
      ...detail,
    });
  }

  private getNormalizedCondition(condition?: string | null): string {
    const normalized = String(condition ?? '').trim();
    return normalized || this.defaultPermissionCondition;
  }

  private injectPolicyIntoCondition(condition: string): string {
    const policyId = this.selectedPolicy().trim();
    if (!policyId) return condition;

    // Remove any existing policy check
    let cleanCondition = condition.replace(/\/\*POL:.*?\*\/\s*JSON_EXISTS\(v_ctx,\s*'\$\.contexto\.politicas\[\*\]\?\(@ == .*?\)'\)(?:\s*(?:AND|OR)\s*)?/g, '').trim();
    if (cleanCondition.startsWith('AND ')) cleanCondition = cleanCondition.substring(4).trim();

    const policyStr = `/*POL:${policyId}*/ JSON_EXISTS(v_ctx, '$.contexto.politicas[*]?(@ == "${policyId}" || @ == ${policyId})')`;
    
    if (cleanCondition) {
      return `${policyStr} AND (${cleanCondition})`;
    }
    return policyStr;
  }

  private permissionMatchesPolicy(permiso: any): boolean {
    const policyId = this.selectedPolicy().trim();
    if (!policyId) return true;

    const cond = permiso.condicion_json;
    if (!cond) return true; // Global

    // Check if the condition contains the specific policy ID
    const match = cond.match(/\/\*POL:(.*?)\*\//);
    if (match && match[1]) {
      return match[1].trim() === policyId;
    }
    
    return true; // No policy restriction found
  }

  private getPolicySelectionValue(policy: any): string {
    if (policy?.id_nodo !== undefined && policy?.id_nodo !== null) {
      return String(policy.id_nodo).trim();
    }
    return '';
  }

  private initializeSelectedPolicy(policies: any[]) {
    if (this.selectedPolicy()) {
      return;
    }

    const activePolicies =
      this.accesosSvc.getContextoSimulacion()?.contexto?.politicas?.map((code: any) =>
        String(code || '')
          .trim()
          .toUpperCase(),
      ) || [];

    const matchingPolicy = policies.find((policy) =>
      activePolicies.includes(
        String(policy?.codigo_tecnico || '')
          .trim()
          .toUpperCase(),
      ),
    );

    if (matchingPolicy) {
      this.selectedPolicy.set(this.getPolicySelectionValue(matchingPolicy));
    }
  }

  private getSelectedPolicyResourceIds(): Set<string> | null {
    const selectedPolicy = this.selectedPolicy().trim();
    if (!selectedPolicy) {
      return null;
    }

    const adjacency = new Map<string, string[]>();
    this.allEnlaces().forEach((link) => {
      const parentKey = this.getNodeSelectionKey(link.id_padre);
      const childKey = this.getNodeSelectionKey(link.id_hijo);
      if (!parentKey || !childKey) {
        return;
      }

      const children = adjacency.get(parentKey) || [];
      children.push(childKey);
      adjacency.set(parentKey, children);
    });

    const nodeById = new Map<string, any>();
    this.allNodes().forEach((node) => {
      const nodeKey = this.getNodeSelectionKey(node);
      if (nodeKey) {
        nodeById.set(nodeKey, node);
      }
    });

    const allowedIds = new Set<string>();
    const visited = new Set<string>([selectedPolicy]);
    const queue = [selectedPolicy];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const children = adjacency.get(current) || [];

      children.forEach((childKey) => {
        if (visited.has(childKey)) {
          return;
        }

        visited.add(childKey);
        queue.push(childKey);
        allowedIds.add(childKey); // Add all reachable nodes (folders and leaves)
      });
    }

    return allowedIds;
  }

  private filterTreeByAllowedIds(nodes: any[], allowedIds: Set<string>): any[] {
    return nodes
      .filter((node) => {
        const nodeKey = this.getNodeSelectionKey(node);
        return !!nodeKey && allowedIds.has(nodeKey);
      })
      .map((node) => {
        const filteredChildren = node.children?.length
          ? this.filterTreeByAllowedIds(node.children, allowedIds)
          : [];
        return {
          ...node,
          children: filteredChildren,
        };
      });
  }

  private getPolicyFilteredRoots(): any[] {
    const allowedIds = this.getSelectedPolicyResourceIds();
    if (!allowedIds) {
      return this.fullTree();
    }

    return this.filterTreeByAllowedIds(this.fullTree(), allowedIds);
  }

  onPolicyChange(policyValue: string) {
    this.selectedPolicy.set(String(policyValue || '').trim());
    this.clearSelectedNodes();

    const selectedNode = this.selectedNode();
    const allowedIds = this.getSelectedPolicyResourceIds();
    const selectedKey = this.getNodeSelectionKey(selectedNode);
    if (allowedIds && selectedKey && !allowedIds.has(selectedKey)) {
      this.selectedNode.set(null);
      this.selectedNodo = '';
      this.operacionesSeleccionadas = {};
      this.permissionCondition = this.defaultPermissionCondition;
    }

    if (this.role()) {
      this.loadAssignments(this.role()!.codigo);
    }
  }

  loadRoleData(roleId: string) {
    this.loading.set(true);
    this.rolesSvc.getRoles().subscribe({
      next: (roles) => {
        const found = roles.find(
          (role) => role.codigo === roleId || role.id_rol?.toString() === roleId,
        );
        if (found) {
          this.role.set(found);
          this.loadAssignments(found.codigo);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Error al cargar el rol', 'Cerrar');
      },
    });
  }

  loadAssignments(rolCodigo: string) {
    this.loading.set(true);
    const roleNodeId = this.getRoleNodeId();
    const roleIdentifier = roleNodeId ?? rolCodigo;

    forkJoin({
      nodes: this.accesosSvc.getNodos(),
      enlaces: this.accesosSvc.getEnlaces(),
      menuEnlaces: this.accesosSvc.getMenuEnlaces(),
      politicas: this.accesosSvc.getPoliticasRaiz(),
      role: this.accesosSvc.obtenerArbol(roleIdentifier, false),
      perms: this.accesosSvc.getPermisos(roleIdentifier, undefined, 1, 500),
    }).subscribe({
      next: (res) => {
        this.allNodes.set(res.nodes || []);
        this.allEnlaces.set(res.enlaces || []);
        this.politicas.set(res.politicas || []);
        this.initializeSelectedPolicy(res.politicas || []);

        const permisos = res.perms?.data || [];
        this.permisosExistentes.set(permisos);

        // 1. Build menu-based hierarchy for explorer tree (excluding security nodes)
        const nodeIdMap = new Map<string, any>();
        const excludedTypes = ['POLICY', 'USUARIO', 'USR_ATTR'];

        res.nodes.forEach((node) => {
          const type = node.tipo_nodo?.trim().toUpperCase();
          if (excludedTypes.includes(type || '')) {
            return;
          }
          const nodeRef = { ...node, children: [] as any[] };
          if (node.id_nodo !== undefined && node.id_nodo !== null) {
            nodeIdMap.set(String(node.id_nodo).trim(), nodeRef);
          }
        });

        const oaChildIds = new Set<string>();
        res.menuEnlaces.forEach((link) => {
          const pKey = link.id_padre !== undefined && link.id_padre !== null ? String(link.id_padre).trim() : '';
          const hKey = link.id_hijo !== undefined && link.id_hijo !== null ? String(link.id_hijo).trim() : '';
          const parent = nodeIdMap.get(pKey);
          const child = nodeIdMap.get(hKey);

          if (parent && child) {
            // Avoid duplicates
            if (!parent.children.some((c: any) => String(c.id_nodo).trim() === hKey)) {
              parent.children.push(child);
            }
            oaChildIds.add(hKey);
          }
        });

        // Recursively sort children of the menu tree
        const sortMenuChildren = (arr: any[]) => {
          arr.sort(this.compareNodes);
          arr.forEach((n) => {
            if (n.children && n.children.length > 0) sortMenuChildren(n.children);
          });
        };

        const entryPoints = Array.from(nodeIdMap.values())
          .filter((node) => !oaChildIds.has(String(node.id_nodo).trim()));

        sortMenuChildren(entryPoints);
        entryPoints.sort(this.compareNodes);
        this.fullTree.set(entryPoints);

        // 2. Build role tree (assigned nodes pruned to show only paths to active permissions)
        const roleNodeMap = new Map<string, any>();
        const roleNodeIdsWithPerms = new Set(
          permisos
            .filter((p: any) => this.permissionMatchesPolicy(p))
            .map((permiso: any) => this.getNodeSelectionKey(permiso.obj))
            .filter((key): key is string => !!key),
        );

        const processRoleTree = (nodes: any[]) => {
          nodes.forEach((node) => {
            const nodeKey = this.getNodeSelectionKey(node);
            if (nodeKey) {
              roleNodeMap.set(nodeKey, { ...node, children: [] as any[] });
            }
            if (node.children?.length) {
              processRoleTree(node.children);
            }
          });
        };
        processRoleTree(res.role || []);

        const roleChildIds = new Set<string>();
        res.enlaces.forEach((link) => {
          const parentKey = this.getNodeSelectionKey(link.id_padre);
          const childKey = this.getNodeSelectionKey(link.id_hijo);
          const parent = parentKey ? roleNodeMap.get(parentKey) : null;
          const child = childKey ? roleNodeMap.get(childKey) : null;

          if (parent && child) {
            if (!parent.children.some((c: any) => this.getNodeSelectionKey(c) === childKey)) {
              parent.children.push(child);
            }
            if (this.isResourceType(parent.tipo_nodo) && this.isResourceType(child.tipo_nodo)) {
              const roleChildKey = this.getNodeSelectionKey(child);
              if (roleChildKey) {
                roleChildIds.add(roleChildKey);
              }
            }
          }
        });

        roleNodeMap.forEach((node) => this.sortChildrenRecursive(node));

        const pruneTree = (node: any): boolean => {
          const nodeKey = this.getNodeSelectionKey(node);
          const hasDirectPerm = !!nodeKey && roleNodeIdsWithPerms.has(nodeKey);
          if (node.children?.length) {
            node.children = node.children.filter((child: any) => pruneTree(child));
          }
          return hasDirectPerm || !!node.children?.length;
        };

        const roleRoots = Array.from(roleNodeMap.values())
          .filter((node) => this.isResourceType(node.tipo_nodo))
          .filter((node) => {
            const nodeKey = this.getNodeSelectionKey(node);
            return !nodeKey || !roleChildIds.has(nodeKey);
          })
          .filter((node) => pruneTree(node))
          .sort(this.compareNodes);

        this.roleTree.set(roleRoots);

        // 3. Collect linked node IDs for active highlight/status
        const linkedIds = new Set<string>();
        const roleNodeKey = this.getNodeSelectionKey(this.role()?.id_nodo);

        res.enlaces.forEach((link) => {
          const parentMatches =
            roleNodeKey !== null && this.getNodeSelectionKey(link.id_padre) === roleNodeKey;
          if (!parentMatches) return;
          const childNode =
            link.id_hijo !== undefined && link.id_hijo !== null
              ? nodeIdMap.get(String(link.id_hijo).trim())
              : null;
          const childKey = this.getNodeSelectionKey(childNode);
          if (childKey && this.canAssociateNode(childNode)) {
            linkedIds.add(childKey);
          }
        });

        const collectLinkedRoleNodes = (nodes: any[]) => {
          nodes.forEach((node) => {
            const nodeKey = this.getNodeSelectionKey(node);
            if (nodeKey && this.canAssociateNode(node)) {
              linkedIds.add(nodeKey);
            }
            if (node.children?.length) {
              collectLinkedRoleNodes(node.children);
            }
          });
        };
        collectLinkedRoleNodes(res.role || []);

        permisos
          .filter((p: any) => this.permissionMatchesPolicy(p))
          .forEach((permiso: any) => {
            const key = this.getNodeSelectionKey(permiso.obj);
            const permissionNode = key ? nodeIdMap.get(key) : null;
            if (key && this.canAssociateNode(permissionNode)) {
              linkedIds.add(key);
            }
          });

        this.linkedNodeIds.set(linkedIds);
        this.selectedNodes.set(new Set());
        this.batchPermissionCondition = this.defaultPermissionCondition;
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading assignments:', err);
        this.loading.set(false);
        this.snackBar.open('Error al cargar datos del Hub', 'Cerrar');
      },
    });
  }

  selectNode(node: any) {
    this.selectedNode.set(node);
    this.selectedNodo = node.codigo_tecnico;
    const nodeId = this.getTreeNodeId(node);
    const roleCode = this.role()?.codigo;

    this.operacionesSeleccionadas = {};
    this.permissionCondition = this.defaultPermissionCondition;

    const isFolder = !!(node.children?.length);

    if (!isFolder && node.id_nodo != null) {
      // Leaf node: expand ancestor path so the leaf is visible in the tree
      const activeIds = this.getAncestorIds(node.id_nodo);
      this.expandedNodes.clear();
      activeIds.forEach((id) => this.expandedNodes.add(id));
    }
    // Folder nodes: expansion is exclusively managed by toggleNode

    // Auto-scroll logic: scrollTo selected node
    setTimeout(() => {
      const el = document.getElementById('node-' + node.id_nodo);
      if (el && this.treeScrollContainer?.nativeElement) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    if (!roleCode || !nodeId || !this.canAssociateNode(node)) {
      return;
    }

    if (this.isLinked(node)) {
      this.loadNodePermissions(roleCode, nodeId);
    }
  }

  private loadNodePermissions(roleCode: string, nodeId: number) {
    this.loading.set(true);
    this.accesosSvc.getPermisos(roleCode, nodeId, 1, 100).subscribe({
      next: (res) => {
        const perms = (res.data || []).filter((p: any) => this.permissionMatchesPolicy(p));
        this.operaciones.forEach((op) => {
          this.operacionesSeleccionadas[op] = perms.some(
            (permiso: any) =>
              String(permiso.op || '')
                .trim()
                .toUpperCase() === op.trim().toUpperCase(),
          );
        });
        const existingCondition = perms.find(
          (permiso: any) => permiso.condicion_json,
        )?.condicion_json;
        this.permissionCondition = this.getNormalizedCondition(existingCondition);
        this.loading.set(false);
      },
      error: () => {
        this.permissionCondition = this.defaultPermissionCondition;
        this.loading.set(false);
      },
    });
  }

  selectAll() {
    this.operaciones.forEach((op) => {
      this.operacionesSeleccionadas[op] = true;
    });
  }

  clearAll() {
    this.operaciones.forEach((op) => {
      this.operacionesSeleccionadas[op] = false;
    });
  }

  enlazarNodos(node: any) {
    const roleNodeId = this.getRoleNodeId();
    const nodeId = this.getTreeNodeId(node);
    if (!this.canAssociateNode(node)) {
      this.snackBar.open('Solo los nodos finales se pueden asociar al rol', 'Cerrar', {
        duration: 2500,
      });
      return;
    }
    if (!this.role() || !roleNodeId || !nodeId) return;

    this.loading.set(true);
    this.logRoleLink('Vinculacion manual iniciada', {
      roleCode: this.role()!.codigo,
      roleNodeId,
      nodeCode: node?.codigo_tecnico,
      nodeId,
      trigger: 'enlazarNodos',
    });

    this.accesosSvc.enlazarNodos(roleNodeId, nodeId).subscribe({
      next: () => {
        this.snackBar.open(`Nodo ${node.etiqueta} vinculado`, 'Cerrar', { duration: 2000 });
        this.loadAssignments(this.role()!.codigo);
      },
      error: (err: any) => {
        this.logRoleLink('Vinculacion manual fallida', {
          roleCode: this.role()!.codigo,
          roleNodeId,
          nodeCode: node?.codigo_tecnico,
          nodeId,
          trigger: 'enlazarNodos',
          error: err?.message || err,
        });
        this.snackBar.open('Error: ' + err.message, 'Cerrar');
        this.loading.set(false);
      },
    });
  }

  isLinked(nodeOrId: any): boolean {
    const nodeKey = this.getNodeSelectionKey(nodeOrId);
    return !!nodeKey && this.linkedNodeIds().has(nodeKey);
  }

  hasLinkedDescendant(node: any): boolean {
    if (!node || !node.children) return false;
    let hasLinked = false;
    const checkChildren = (children: any[]) => {
      for (const child of children) {
        if (this.isLinked(child)) {
          hasLinked = true;
          return;
        }
        if (child.children?.length) {
          checkChildren(child.children);
        }
      }
    };
    checkChildren(node.children);
    return hasLinked;
  }

  isNodeSelected(nodeOrId: any): boolean {
    const nodeKey = this.getNodeSelectionKey(nodeOrId);
    return !!nodeKey && this.selectedNodes().has(nodeKey);
  }

  isMarkedInTree(nodeOrId: any): boolean {
    return this.isNodeSelected(nodeOrId);
  }

  private syncBatchPermissionsFromSelection(selectedKeys: Set<string>) {
    if (selectedKeys.size <= 1) {
      return;
    }

    this.batchPermissionCondition = this.defaultPermissionCondition;
    this.operaciones.forEach((op) => {
      const normalized = op.trim().toUpperCase();
      this.operacionesSeleccionadas[op] = Array.from(selectedKeys).every((nodeKey) =>
        this.permisosExistentes()
          .filter((p: any) => this.permissionMatchesPolicy(p))
          .some(
            (permiso) =>
              String(permiso.obj) === String(nodeKey) &&
              String(permiso.op).trim().toUpperCase() === normalized,
          ),
      );
    });
  }

  vincularYOtorgar() {
    if (!this.selectedNode() || !this.role()) return;
    const node = this.selectedNode()!;
    if (!this.canAssociateNode(node)) {
      this.snackBar.open('Solo los nodos finales se pueden asociar al rol', 'Cerrar', {
        duration: 2500,
      });
      return;
    }

    const roleCode = this.role()!.codigo;
    const roleNodeId = this.getRoleNodeId();
    const nodeId = this.getTreeNodeId(node);
    if (!roleNodeId || !nodeId) return;

    const permissionCondition = this.injectPolicyIntoCondition(
      this.getNormalizedCondition(this.permissionCondition)
    );
    this.loading.set(true);

    const link$ = this.isLinked(node)
      ? of({ success: true })
      : this.accesosSvc.enlazarNodos(roleNodeId, nodeId);

    link$
      .pipe(
        concatMap(() => {
          const currentOps = this.permisosExistentes()
            .filter((p: any) => this.permissionMatchesPolicy(p))
            .filter((permiso) => String(permiso.obj) === String(nodeId))
            .map((permiso) => String(permiso.op));

          const toGrant = this.operaciones.filter(
            (op) => this.operacionesSeleccionadas[op] && !currentOps.includes(op),
          );
          const toRevoke = this.operaciones.filter(
            (op) => !this.operacionesSeleccionadas[op] && currentOps.includes(op),
          );

          const tasks = [
            ...toGrant.map((op) =>
              this.accesosSvc.otorgarPermiso(roleNodeId, nodeId, op, permissionCondition),
            ),
            ...toRevoke.map((op) => this.accesosSvc.revocarPermiso(roleNodeId, nodeId, op)),
          ];

          return tasks.length ? forkJoin(tasks).pipe(map((results) => results.length)) : of(0);
        }),
      )
      .subscribe({
        next: (count) => {
          this.snackBar.open(`Operación completada: ${count} cambios aplicados`, 'Cerrar', {
            duration: 3000,
          });
          this.loadAssignments(roleCode);
        },
        error: (err: any) => {
          this.snackBar.open('Error: ' + err.message, 'Cerrar');
          this.loading.set(false);
        },
      });
  }

  vincularRaiz() {
    if (!this.selectedNode() || !this.role()) return;
    const node = this.selectedNode()!;
    if (!this.canAssociateNode(node)) {
      this.snackBar.open('Las carpetas o nodos padre no se asocian al rol', 'Cerrar', {
        duration: 2500,
      });
      return;
    }

    const roleNodeId = this.getRoleNodeId();
    const nodeId = this.getTreeNodeId(node);
    if (!roleNodeId || !nodeId) return;

    this.loading.set(true);
    this.accesosSvc.enlazarNodos(roleNodeId, nodeId).subscribe({
      next: () => {
        this.snackBar.open(`Nodo ${node.etiqueta} vinculado`, 'Cerrar', { duration: 2000 });
        this.loadAssignments(this.role()!.codigo);
      },
      error: (err: any) => {
        this.snackBar.open('Error: ' + err.message, 'Cerrar');
        this.loading.set(false);
      },
    });
  }

  otorgar() {
    const node = this.selectedNode();
    if (!node || !this.role()) {
      this.snackBar.open('Seleccione un recurso para otorgar permisos', 'Cerrar');
      return;
    }

    if (!this.canAssociateNode(node)) {
      this.snackBar.open('Solo los nodos finales admiten permisos directos', 'Cerrar', {
        duration: 2500,
      });
      return;
    }

    const roleCode = this.role()!.codigo;
    const roleNodeId = this.getRoleNodeId();
    const nodeId = this.getTreeNodeId(node);
    if (!roleNodeId || !nodeId) return;

    const permissionCondition = this.getNormalizedCondition(this.permissionCondition);
    const currentOps = this.permisosExistentes()
      .filter((permiso) => String(permiso.obj) === String(nodeId))
      .map((permiso) => String(permiso.op));

    const toGrant = this.operaciones.filter(
      (op) => this.operacionesSeleccionadas[op] && !currentOps.includes(op),
    );
    const toRevoke = this.operaciones.filter(
      (op) => !this.operacionesSeleccionadas[op] && currentOps.includes(op),
    );

    const tasks = [
      ...toGrant.map((op) =>
        this.accesosSvc.otorgarPermiso(roleNodeId, nodeId, op, permissionCondition),
      ),
      ...toRevoke.map((op) => this.accesosSvc.revocarPermiso(roleNodeId, nodeId, op)),
    ];

    if (!tasks.length) {
      this.snackBar.open('Sin cambios detectados', 'Cerrar', { duration: 2000 });
      return;
    }

    this.loading.set(true);
    forkJoin(tasks).subscribe({
      next: () => {
        this.snackBar.open('Permisos actualizados correctamente', 'Cerrar', { duration: 2000 });
        this.loadAssignments(roleCode);
      },
      error: () => {
        this.snackBar.open('Error al actualizar permisos', 'Cerrar');
        this.loading.set(false);
      },
    });
  }

  revocar(permiso: any) {
    const roleNodeId = this.getRoleNodeId();
    if (!roleNodeId) return;
    this.accesosSvc.revocarPermiso(roleNodeId, permiso.obj, permiso.op).subscribe({
      next: () => {
        this.snackBar.open('Permiso revocado', 'Cerrar', { duration: 2000 });
        this.loadAssignments(this.role()!.codigo);
      },
    });
  }

  getPermisosForNodo(nodeCode: string): string[] {
    const nodeId = this.getTreeNodeId(nodeCode);
    if (!nodeId) return [];
    return this.permisosExistentes()
      .filter((permiso) => String(permiso.obj) === String(nodeId))
      .map((permiso) => permiso.op);
  }

  hasPermissions(nodeCode: string): boolean {
    const nodeId = this.getTreeNodeId(nodeCode);
    return (
      !!nodeId &&
      this.permisosExistentes().some((permiso) => String(permiso.obj) === String(nodeId))
    );
  }

  /**
   * Returns a Set of id_nodo (as string) for all ancestors of the given node
   * by traversing the in-memory fullTree recursively.
   */
  getAncestorIds(targetId: any): Set<string> {
    const ancestors = new Set<string>();
    const normalizedTarget = String(targetId ?? '').trim();
    if (!normalizedTarget) return ancestors;

    const findPath = (nodes: any[], path: string[]): boolean => {
      for (const node of nodes) {
        const id = String(node.id_nodo ?? '').trim();
        if (id === normalizedTarget) {
          path.forEach((c) => ancestors.add(c));
          return true;
        }
        if (node.children?.length) {
          if (findPath(node.children, [...path, id])) {
            return true;
          }
        }
      }
      return false;
    };

    findPath(this.fullTree(), []);
    return ancestors;
  }

  toggleNode(node: any, _siblings: any[]) {
    const nodeId = String(node.id_nodo ?? '').trim();
    const isNowExpanding = !this.expandedNodes.has(nodeId);

    if (isNowExpanding) {
      // Keep only the ancestors + the node itself expanded (accordion)
      const activeIds = this.getAncestorIds(node.id_nodo);
      activeIds.add(nodeId);

      this.expandedNodes.clear();
      activeIds.forEach((id) => this.expandedNodes.add(id));
    } else {
      // Collapse the node and all its descendants
      this.expandedNodes.delete(nodeId);
      this.collapseRecursive(node);
    }
  }

  private collapseRecursive(node: any) {
    if (!node.children?.length) return;
    node.children.forEach((child: any) => {
      this.expandedNodes.delete(String(child.id_nodo ?? '').trim());
      this.collapseRecursive(child);
    });
  }

  toggleSummaryNode(node: any) {
    const nodeId = String(node.id_nodo ?? '').trim();
    if (this.expandedSummaryNodes.has(nodeId)) {
      this.expandedSummaryNodes.delete(nodeId);
    } else {
      this.expandedSummaryNodes.add(nodeId);
    }
  }

  isSummaryExpanded(nodeId: any): boolean {
    return this.expandedSummaryNodes.has(String(nodeId ?? '').trim());
  }

  isExpanded(nodeId: any): boolean {
    return this.expandedNodes.has(String(nodeId ?? '').trim());
  }

  canAssociateNode(node: any): boolean {
    return !!node && !node.children?.length;
  }

  canSelectInBatch(node: any): boolean {
    return this.canAssociateNode(node);
  }

  clearSelection() {
    this.selectedNodes.set(new Set());
  }

  toggleNodeSelection(node: any) {
    if (!this.canSelectInBatch(node)) return;

    const nodeKey = this.getNodeSelectionKey(node);
    if (!nodeKey) return;

    const nextSelected = new Set(this.selectedNodes());
    if (nextSelected.has(nodeKey)) {
      nextSelected.delete(nodeKey);
    } else {
      nextSelected.add(nodeKey);
    }

    this.selectedNodes.set(nextSelected);

    if (nextSelected.size > 1) {
      this.syncBatchPermissionsFromSelection(nextSelected);
    } else if (nextSelected.size === 1) {
      this.applyDefaultBatchOperations();
    } else {
      this.batchPermissionCondition = this.defaultPermissionCondition;
    }
  }

  clearSelectedNodes() {
    this.selectedNodes.set(new Set());
    this.batchPermissionCondition = this.defaultPermissionCondition;
  }

  bulkVincular() {
    const selectedNodeIds = Array.from(this.selectedNodes());
    const roleNodeId = this.getRoleNodeId();
    if (selectedNodeIds.length === 0 || !this.role() || !roleNodeId) return;

    const selectedOps = this.operaciones.filter((op) => this.operacionesSeleccionadas[op]);
    const batchCondition = this.getNormalizedCondition(this.batchPermissionCondition);
    this.loading.set(true);

    const tasks = selectedNodeIds.map((nodeKey) => {
      const nodeId = Number(nodeKey);
      if (!nodeId) {
        return of({ count: 0, failed: true, nodeId: 0, error: 'ID de nodo inválido' });
      }

      const alreadyLinked = this.isLinked(nodeKey);
      const currentOps = new Set(
        this.permisosExistentes()
          .filter((permiso) => String(permiso.obj) === String(nodeId))
          .map((permiso) => String(permiso.op).trim().toUpperCase()),
      );

      const toGrant = selectedOps.filter((op) => !currentOps.has(op.trim().toUpperCase()));
      const toRevoke = this.operaciones.filter(
        (op) => !this.operacionesSeleccionadas[op] && currentOps.has(op.trim().toUpperCase()),
      );

      const permissionTasks = [
        ...toGrant.map((op) =>
          this.accesosSvc.otorgarPermiso(roleNodeId, nodeId, op, batchCondition),
        ),
        ...toRevoke.map((op) => this.accesosSvc.revocarPermiso(roleNodeId, nodeId, op)),
      ];

      const task$: any = alreadyLinked
        ? permissionTasks.length
          ? forkJoin(permissionTasks)
          : of([])
        : forkJoin([
            this.accesosSvc.enlazarNodos(roleNodeId, nodeId),
            ...(permissionTasks.length ? permissionTasks : []),
          ]);

      return task$.pipe(
        map((results: any[]) => ({ count: results.length, failed: false, nodeId, error: null })),
        catchError((err) =>
          of({
            count: 0,
            failed: true,
            nodeId,
            error: (err as any)?.error?.detail || (err as any)?.message || 'Error desconocido',
          }),
        ),
      );
    });

    forkJoin(tasks)
      .pipe(
        catchError((err) => {
          const detail =
            (err as any)?.error?.detail || (err as any)?.message || 'Error desconocido';
          this.logRoleLink('Vinculacion masiva fallida', {
            roleCode: this.role()!.codigo,
            roleNodeId,
            selectedNodeIds,
            selectedOperations: selectedOps,
            trigger: 'bulkVincular',
            error: detail,
          });
          this.snackBar.open(`Error en vinculación masiva: ${detail}`, 'Cerrar', {
            duration: 5000,
          });
          this.loading.set(false);
          return of([] as any[]);
        }),
      )
      .subscribe({
        next: (results: any[]) => {
          if (!results.length) {
            return;
          }

          const failedResults = results.filter((result) => result.failed);
          const totalChanges = results.reduce((sum, result) => sum + result.count, 0);

          this.logRoleLink('Vinculacion masiva completada', {
            roleCode: this.role()!.codigo,
            roleNodeId,
            selectedNodeIds,
            selectedOperations: selectedOps,
            totalChanges,
            failedNodes: failedResults,
            trigger: 'bulkVincular',
          });

          const firstError = failedResults[0]?.error;
          const message = failedResults.length
            ? `${selectedNodeIds.length - failedResults.length} nodos procesados, ${failedResults.length} con error${firstError ? `: ${firstError}` : ''}`
            : totalChanges > 0
              ? `${selectedNodeIds.length} nodos vinculados/actualizados`
              : 'Sin cambios detectados en la selección múltiple';

          this.snackBar.open(message, 'Cerrar', { duration: 3000 });
          this.clearSelectedNodes();
          this.loadAssignments(this.role()!.codigo);
        },
      });
  }

  bulkDesvincular() {
    const selectedNodeIds = Array.from(this.selectedNodes());
    const roleNodeId = this.getRoleNodeId();
    if (selectedNodeIds.length === 0 || !this.role() || !roleNodeId) return;

    this.loading.set(true);
    const tasks = selectedNodeIds
      .map((nodeKey) => {
        const nodeId = Number(nodeKey);
        return nodeId ? this.accesosSvc.deleteEnlace(roleNodeId, nodeId) : null;
      })
      .filter((task): task is ReturnType<AccesosService['deleteEnlace']> => !!task);

    forkJoin(tasks).subscribe({
      next: () => {
        this.snackBar.open(`${selectedNodeIds.length} recursos desvinculados`, 'Cerrar', {
          duration: 2000,
        });
        this.clearSelectedNodes();
        this.loadAssignments(this.role()!.codigo);
      },
      error: () => {
        this.snackBar.open('Error en desvinculación masiva', 'Cerrar');
        this.loading.set(false);
      },
    });
  }

  desvincularNodo(node: any) {
    const roleNodeId = this.getRoleNodeId();
    const nodeId = this.getTreeNodeId(node);
    if (!this.role() || !roleNodeId || !nodeId) return;

    this.accesosSvc.deleteEnlace(roleNodeId, nodeId).subscribe({
      next: () => {
        this.snackBar.open('Recurso desvinculado', 'Cerrar', { duration: 2000 });
        this.loadAssignments(this.role()!.codigo);
      },
      error: (err: any) => {
        this.snackBar.open('Error al desvincular: ' + err.message, 'Cerrar');
      },
    });
  }

  isResourceType(type: string | undefined): boolean {
    if (!type) return false;
    const normalized = type.toUpperCase();
    return ['OBJ_ATTR', 'CARPETA', 'OBJETO', 'OA'].includes(normalized);
  }

  goBack() {
    this.router.navigate(['/roles']);
  }

  private sortChildrenRecursive(node: any) {
    if (!node.children?.length) return;
    node.children.sort(this.compareNodes);
    node.children.forEach((child: any) => this.sortChildrenRecursive(child));
  }

  private compareNodes(a: any, b: any): number {
    const orderDiff = (Number(a?.orden_visual) || 0) - (Number(b?.orden_visual) || 0);
    return orderDiff !== 0
      ? orderDiff
      : String(a?.etiqueta || '').localeCompare(String(b?.etiqueta || ''));
  }

  private applyDefaultBatchOperations() {
    this.operaciones.forEach((op) => {
      this.operacionesSeleccionadas[op] = this.defaultBatchOperations.has(op.trim().toUpperCase());
    });
  }
}
