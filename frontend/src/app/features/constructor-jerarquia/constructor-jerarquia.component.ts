import { Component, OnInit, signal, computed } from '@angular/core';
import { forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { INodo } from '../../core/models/ngac-admin.models';
import { AccesosService } from '../../core/services/accesos.service';
import { DialogoNodoComponent } from '../../shared/components/dialogo-nodo/dialogo-nodo.component';

export type AssignFilter = 'all' | 'assigned' | 'unassigned';

export interface TreeNode {
  id_nodo?: number;
  codigo_tecnico: string;
  etiqueta: string;
  tipo_nodo: string;
  activo: string;
  orden_visual?: number;
  children: TreeNode[];
  isLinked: boolean; // directamente vinculado a la política seleccionada
  isInherited: boolean; // heredado de un padre que sí está vinculado
  isActive: boolean; // isLinked || isInherited
  [key: string]: any;
}

@Component({
  selector: 'app-constructor-jerarquia',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSnackBarModule,
    MatSelectModule,
    MatTooltipModule,
  ],
  templateUrl: './constructor-jerarquia.component.html',
})
export class ConstructorJerarquiaComponent implements OnInit {
  // Datos brutos
  fullNodes = signal<INodo[]>([]);
  allPolicies = signal<any[]>([]);
  roles = signal<any[]>([]);
  operaciones = signal<any[]>([]);
  enlaces = signal<Array<{ id_padre?: number; id_hijo?: number; padre?: string; hijo?: string }>>(
    [],
  );

  // Estado de selección / filtros
  selectedPolicyCode = signal<string | null>(null);
  searchTerm = signal('');
  assignFilter = signal<AssignFilter>('all');
  clonePanelOpen = signal(false);
  cloneSourcePolicyCode = signal<string | null>(null);
  cloneRootNodeCode = signal<string | null>(null);
  cloneDestinationRootCode = signal<string | null>(null);
  cloneSelectedNodeCodes = signal<string[]>([]);

  // Nodo seleccionado para el panel derecho
  selectedNode = signal<INodo | null>(null);

  // Control de expansión
  expandedNodes = new Set<string>();

  loading = signal(true);

  // Wrapper para recargar desde el hub hijo
  reloadTree = () => this.load();

  constructor(
    private dialog: MatDialog,
    private accesosSvc: AccesosService,
    private snackBar: MatSnackBar,
    private router: Router,
  ) {}

  ngOnInit() {
    this.load();
  }

  private getPolicyIdByCode(policyCode: string | null): number | null {
    if (!policyCode) return null;
    const normalized = policyCode.trim().toUpperCase();
    const policy = this.allPolicies().find(
      (item) => (item.codigo_tecnico || item.codigo || '').trim().toUpperCase() === normalized,
    );
    return policy?.id_nodo ? Number(policy.id_nodo) : null;
  }

  private getNodeIdByCode(nodeCode: string | null): number | null {
    if (!nodeCode) return null;
    const normalized = nodeCode.trim().toUpperCase();
    const node = this.fullNodes().find(
      (item) => (item.codigo_tecnico || '').trim().toUpperCase() === normalized,
    );
    return node?.id_nodo ? Number(node.id_nodo) : null;
  }

  private getNodeKey(nodeOrId: any): string | null {
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

  // ─── Carga principal ──────────────────────────────────────────────────────

  load() {
    this.loading.set(true);
    forkJoin({
      nodes: this.accesosSvc.getNodos(),
      enlaces: this.accesosSvc.getEnlaces(),
      politicas: this.accesosSvc.getPoliticasRaiz(),
      roles: this.accesosSvc.getRoles(),
      ops: this.accesosSvc.getOperaciones(),
    }).subscribe({
      next: (res: any) => {
        // Normalizar enlaces
        const normalizedLinks = (res.enlaces || []).map((e: any) => ({
          id_padre: e.id_padre ?? e.ID_PADRE,
          id_hijo: e.id_hijo ?? e.ID_HIJO,
          padre: (e.padre || e.PADRE || '').trim().toUpperCase(),
          hijo: (e.hijo || e.HIJO || '').trim().toUpperCase(),
        }));
        this.enlaces.set(normalizedLinks);

        // Normalizar políticas
        const politicas = (res.politicas || []).map((p: any) => {
          const n: any = {};
          Object.keys(p).forEach((k) => (n[k.toLowerCase()] = p[k]));
          n.codigo_tecnico = n.codigo_tecnico || n.codigo || '';
          return n;
        });
        this.allPolicies.set(politicas);

        this.fullNodes.set(res.nodes || []);
        this.roles.set(res.roles || []);
        this.operaciones.set(res.ops || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  // ─── Árbol de recursos completo (sin política) ────────────────────────────

  private buildFullTree(): TreeNode[] {
    const nodes = this.fullNodes();
    const links = this.enlaces();

    // Solo nodos de tipo recurso
    const resMap = new Map<string, TreeNode>();
    nodes.forEach((n) => {
      const nodeKey = this.getNodeKey(n);
      const code = (n.codigo_tecnico || '').trim().toUpperCase();
      if (nodeKey && code && this.isResourceType(n.tipo_nodo)) {
        resMap.set(nodeKey, {
          ...n,
          id_nodo: n.id_nodo,
          codigo_tecnico: code,
          etiqueta: n.etiqueta ?? '',
          tipo_nodo: n.tipo_nodo ?? '',
          activo: n.activo ?? 'S',
          children: [],
          isLinked: false,
          isInherited: false,
          isActive: false,
        });
      }
    });

    const childIds = new Set<string>();
    links.forEach((e) => {
      const parentKey = this.getNodeKey(e.id_padre);
      const childKey = this.getNodeKey(e.id_hijo);
      if (parentKey && childKey && resMap.has(parentKey) && resMap.has(childKey)) {
        childIds.add(childKey);
      }
    });

    // Construir de forma recursiva clonando los nodos para multipaternidad
    const buildNode = (nodeKey: string, visited: Set<string> = new Set()): TreeNode | null => {
      const original = resMap.get(nodeKey);
      if (!original || visited.has(nodeKey)) return null;

      const newVisited = new Set(visited);
      newVisited.add(nodeKey);

      const childLinks = links.filter(
        (e) => this.getNodeKey(e.id_padre) === nodeKey && this.getNodeKey(e.id_hijo) !== null,
      );
      const children: TreeNode[] = [];
      childLinks.forEach((cl) => {
        const childNode = buildNode(this.getNodeKey(cl.id_hijo)!, newVisited);
        if (childNode) {
          children.push(childNode);
        }
      });

      children.sort((a, b) => (a.orden_visual || 0) - (b.orden_visual || 0));

      return {
        ...original,
        children,
      };
    };

    // Raíces = nodos de recurso que no son hijos de ningún otro recurso
    return Array.from(resMap.keys())
      .filter((nodeKey) => !childIds.has(nodeKey))
      .map((nodeKey) => buildNode(nodeKey)!)
      .filter((n) => !!n)
      .sort((a, b) => (a.orden_visual || 0) - (b.orden_visual || 0));
  }

  // ─── Árbol anotado con estado de asignación ───────────────────────────────

  /** Set of node ids directly linked to the selected policy */
  private linkedSet = computed(() => {
    const policyId = this.getPolicyIdByCode(this.selectedPolicyCode());
    if (!policyId) return new Set<string>();
    const links = this.enlaces();
    return new Set<string>(
      links
        .filter((e) => Number(e.id_padre) === policyId)
        .map((e) => this.getNodeKey(e.id_hijo))
        .filter((key): key is string => !!key),
    );
  });

  /** Full tree annotated with isLinked / isInherited / isActive */
  private annotatedTree = computed(() => {
    const linked = this.linkedSet();
    const roots = this.buildFullTree();

    const annotate = (node: TreeNode, parentActive: boolean): TreeNode => {
      const nodeKey = this.getNodeKey(node);
      const isLinked = !!nodeKey && linked.has(nodeKey);
      const isActive = isLinked || parentActive;
      const isInherited = !isLinked && parentActive;
      return {
        ...node,
        isLinked,
        isInherited,
        isActive,
        children: node.children.map((c) => annotate(c, isActive)),
      };
    };

    return roots.map((r) => annotate(r, false));
  });

  /** Tree filtered by search + assigned filter */
  filteredTree = computed(() => {
    const term = this.searchTerm().trim().toUpperCase();
    const filter = this.assignFilter();
    const tree = this.annotatedTree();

    const matchesFilter = (n: TreeNode): boolean => {
      if (filter === 'assigned') return n.isActive;
      if (filter === 'unassigned') return !n.isActive;
      return true;
    };

    const filterNodes = (nodes: TreeNode[]): TreeNode[] =>
      nodes
        .map((n) => ({ ...n, children: filterNodes(n.children) }))
        .filter((n) => {
          const labelMatch =
            !term || n.etiqueta.toUpperCase().includes(term) || n.codigo_tecnico.includes(term);
          const filterMatch = matchesFilter(n) || n.children.length > 0;
          return labelMatch && filterMatch;
        });

    return filterNodes(tree);
  });

  private filterTreeByAssignment(
    nodes: TreeNode[],
    showAssigned: boolean,
    term: string,
  ): TreeNode[] {
    const matchesTerm = (node: TreeNode) =>
      !term || node.etiqueta.toUpperCase().includes(term) || node.codigo_tecnico.includes(term);

    const walk = (node: TreeNode): TreeNode | null => {
      const children = node.children
        .map((child) => walk(child))
        .filter((child): child is TreeNode => !!child);

      const matchesState = showAssigned ? node.isLinked : !node.isLinked;

      if (!matchesState && children.length === 0) {
        return null;
      }

      if (!matchesTerm(node) && children.length === 0) {
        return null;
      }

      return {
        ...node,
        children,
      };
    };

    return nodes.map((node) => walk(node)).filter((node): node is TreeNode => !!node);
  }

  assignedTree = computed(() => {
    const term = this.searchTerm().trim().toUpperCase();
    return this.filterTreeByAssignment(this.annotatedTree(), true, term);
  });

  unassignedTree = computed(() => {
    const term = this.searchTerm().trim().toUpperCase();
    return this.filterTreeByAssignment(this.annotatedTree(), false, term);
  });

  assignedRootNodes = computed(() => this.annotatedTree().filter((node) => node.isLinked));

  unassignedRootNodes = computed(() => this.annotatedTree().filter((node) => !node.isLinked));

  cloneSourcePolicies = computed(() =>
    this.allPolicies().filter((policy) => policy.codigo_tecnico !== this.selectedPolicyCode()),
  );

  cloneRootOptions = computed(() => {
    const sourcePolicy = this.cloneSourcePolicyCode();
    if (!sourcePolicy) return [];

    const sourceNodeIds = this.getDirectLinkedIds(sourcePolicy);
    const currentLinked = this.linkedSet();

    return this.fullNodes()
      .filter((node) => sourceNodeIds.includes(Number(node.id_nodo)))
      .filter((node) => this.isResourceType(node.tipo_nodo))
      .map((node) => ({
        id_nodo: node.id_nodo,
        codigo_tecnico: (node.codigo_tecnico || '').trim().toUpperCase(),
        etiqueta: node.etiqueta || node.codigo_tecnico,
        tipo_nodo: node.tipo_nodo || '',
        alreadyLinked:
          node.id_nodo !== undefined && node.id_nodo !== null
            ? currentLinked.has(String(node.id_nodo))
            : false,
      }))
      .sort((a, b) => a.etiqueta.localeCompare(b.etiqueta));
  });

  cloneSourceNodes = computed(() => {
    const rootCode = this.cloneRootNodeCode();
    if (!rootCode) return [];

    return this.cloneRootOptions().filter((node) => node.codigo_tecnico === rootCode);
  });

  cloneDestinationOptions = computed(() =>
    this.annotatedTree().map((node) => ({
      codigo_tecnico: node.codigo_tecnico,
      etiqueta: node.etiqueta,
      tipo_nodo: node.tipo_nodo,
      isLinked: node.isLinked,
    })),
  );

  cloneDestinationNode = computed(() => {
    const rootCode = this.cloneDestinationRootCode();
    if (!rootCode) return null;
    return this.cloneDestinationOptions().find((node) => node.codigo_tecnico === rootCode) ?? null;
  });

  // ─── Controles UI ─────────────────────────────────────────────────────────

  isResourceType(type: string | undefined): boolean {
    if (!type) return false;
    const t = type.trim().toUpperCase();
    return t === 'OBJ_ATTR' || t === 'OA' || t === 'CARPETA' || t === 'MODULO';
  }

  selectPolicy(code: string) {
    this.selectedPolicyCode.set(code);
    this.selectedNode.set(null);
    this.expandedNodes.clear();
    this.assignFilter.set('all');
    this.clonePanelOpen.set(false);
    this.cloneSourcePolicyCode.set(null);
    this.cloneRootNodeCode.set(null);
    this.cloneDestinationRootCode.set(null);
    this.cloneSelectedNodeCodes.set([]);
  }

  private getDirectLinkedIds(policyCode: string): number[] {
    const policyId = this.getPolicyIdByCode(policyCode);
    if (!policyId) return [];
    return this.enlaces()
      .filter((link) => Number(link.id_padre) === policyId)
      .map((link) => Number(link.id_hijo))
      .filter((nodeId, index, arr) => !!nodeId && arr.indexOf(nodeId) === index);
  }

  setFilter(f: AssignFilter) {
    this.assignFilter.set(f);
  }

  selectNode(node: TreeNode) {
    this.selectedNode.set(node as any);
  }

  selectRootNode(node: TreeNode) {
    this.selectNode(node);
    this.expandedNodes.add(node.codigo_tecnico);
  }

  goToClonePage() {
    this.router.navigate(['/clonacion']);
  }

  openClonePanel() {
    this.clonePanelOpen.set(true);
  }

  cancelClonePanel() {
    this.clonePanelOpen.set(false);
    this.cloneSourcePolicyCode.set(null);
    this.cloneRootNodeCode.set(null);
    this.cloneDestinationRootCode.set(null);
    this.cloneSelectedNodeCodes.set([]);
  }

  selectCloneSource(policyCode: string) {
    this.cloneSourcePolicyCode.set(policyCode);
    this.cloneRootNodeCode.set(null);
    this.cloneSelectedNodeCodes.set([]);
  }

  selectCloneRoot(code: string) {
    this.cloneRootNodeCode.set(code);
    this.cloneSelectedNodeCodes.set([code]);
  }

  selectCloneDestination(code: string) {
    this.cloneDestinationRootCode.set(code);
  }

  toggleCloneNode(code: string) {
    this.cloneSelectedNodeCodes.update((codes) =>
      codes.includes(code) ? codes.filter((item) => item !== code) : [...codes, code],
    );
  }

  selectAllCloneNodes() {
    const rootCode = this.cloneRootNodeCode();
    this.cloneSelectedNodeCodes.set(rootCode ? [rootCode] : []);
  }

  clearCloneNodes() {
    this.cloneSelectedNodeCodes.set([]);
  }

  clearCloneRoot() {
    this.cloneRootNodeCode.set(null);
    this.clearCloneNodes();
  }

  clearCloneDestination() {
    this.cloneDestinationRootCode.set(null);
  }

  toggleNode(code: string) {
    if (this.expandedNodes.has(code)) {
      this.expandedNodes.delete(code);
    } else {
      this.expandedNodes.add(code);
    }
  }

  isExpanded(code: string): boolean {
    return this.expandedNodes.has(code);
  }

  // ─── Asignación / Desasignación ───────────────────────────────────────────

  toggleAssignment(node: TreeNode) {
    const policyId = this.getPolicyIdByCode(this.selectedPolicyCode());
    const rawNodeId = node['id_nodo'];
    const nodeId = rawNodeId ? Number(rawNodeId) : this.getNodeIdByCode(node.codigo_tecnico);
    if (!policyId || !nodeId) {
      this.snackBar.open('No se pudo resolver el ID del nodo o de la política', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    const action$ = node.isLinked
      ? this.accesosSvc.deleteEnlace(policyId, nodeId)
      : this.accesosSvc.enlazarNodos(policyId, nodeId);

    this.loading.set(true);
    action$.subscribe({
      next: () => {
        const msg = node.isLinked
          ? 'Nodo desvinculado de la política'
          : 'Nodo vinculado a la política';
        this.snackBar.open(msg, 'Cerrar', { duration: 2000 });
        this.load();
      },
      error: (err) => {
        this.snackBar.open('Error: ' + (err.error?.detail || err.message), 'Cerrar', {
          duration: 4000,
        });
        this.loading.set(false);
      },
    });
  }

  createRootNode() {
    const dialogRef = this.dialog.open(DialogoNodoComponent, {
      width: '500px',
      data: {
        nodo: undefined,
        allowedTypes: ['OBJ_ATTR', 'OA', 'CARPETA', 'MODULO'],
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;

      this.loading.set(true);
      this.accesosSvc.upsertNodo(result).subscribe({
        next: () => {
          this.snackBar.open('Nodo raíz creado correctamente', 'Cerrar', { duration: 2000 });
          this.load();
        },
        error: (err) => {
          this.snackBar.open(
            'Error al crear nodo raíz: ' + (err.error?.detail || err.message),
            'Cerrar',
            { duration: 4000 },
          );
          this.loading.set(false);
        },
      });
    });
  }

  applyCloneSelection() {
    const targetPolicyId = this.getPolicyIdByCode(this.selectedPolicyCode());
    if (!targetPolicyId) return;

    const sourceRoot = this.cloneRootNodeCode();
    const destinationRoot = this.cloneDestinationRootCode();
    const sourceRootId = this.getNodeIdByCode(sourceRoot);
    const destinationRootId = this.getNodeIdByCode(destinationRoot);

    if (!sourceRoot) {
      this.snackBar.open('Selecciona una carpeta raíz de origen', 'Cerrar', { duration: 2500 });
      return;
    }

    if (!destinationRoot) {
      this.snackBar.open('Selecciona una carpeta raíz de destino', 'Cerrar', { duration: 2500 });
      return;
    }

    if (!sourceRootId || !destinationRootId) {
      this.snackBar.open('No se pudo resolver el ID de las carpetas seleccionadas', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    const currentLinked = this.linkedSet();

    const tasks = [];
    if (destinationRoot !== sourceRoot && currentLinked.has(String(destinationRootId))) {
      tasks.push(this.accesosSvc.deleteEnlace(targetPolicyId, destinationRootId));
    }
    if (!currentLinked.has(String(sourceRootId))) {
      tasks.push(this.accesosSvc.enlazarNodos(targetPolicyId, sourceRootId));
    }

    if (tasks.length === 0) {
      this.snackBar.open(
        'La combinación origen/destino no genera cambios en la política actual',
        'Cerrar',
        {
          duration: 2500,
        },
      );
      this.cancelClonePanel();
      return;
    }

    this.loading.set(true);
    forkJoin(tasks).subscribe({
      next: () => {
        this.snackBar.open('Jerarquía clonada correctamente', 'Cerrar', { duration: 2500 });
        this.cancelClonePanel();
        this.load();
      },
      error: (err) => {
        this.snackBar.open(
          'Error al clonar jerarquía: ' + (err.error?.detail || err.message),
          'Cerrar',
          {
            duration: 4000,
          },
        );
        this.loading.set(false);
      },
    });
  }

  getParentsOf(childCode: string): string[] {
    const childId = this.getNodeIdByCode(childCode);
    if (!childId) return [];
    return this.enlaces()
      .filter((e) => Number(e.id_hijo) === childId)
      .map((e) => e.padre || '');
  }

  // Estadísticas de asignación
  assignedCount = computed(() => {
    const countLinked = (nodes: TreeNode[]): number =>
      nodes.reduce((acc, n) => acc + (n.isLinked ? 1 : 0) + countLinked(n.children), 0);
    return countLinked(this.annotatedTree());
  });

  totalResourceCount = computed(() => {
    const countAll = (nodes: TreeNode[]): number =>
      nodes.reduce((acc, n) => acc + 1 + countAll(n.children), 0);
    return countAll(this.annotatedTree());
  });

  unassignedCount = computed(() => this.totalResourceCount() - this.assignedCount());
}
