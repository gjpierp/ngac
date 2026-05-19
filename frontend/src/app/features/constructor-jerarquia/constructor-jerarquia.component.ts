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
import { INodo } from '../../core/models/ngac-admin.models';
import { AccesosService } from '../../core/services/accesos.service';
import { DialogoConfirmacionComponent } from '../../shared/components/dialogo-confirmacion/dialogo-confirmacion.component';
import { HubDetalleNodoComponent } from './hub-detalle-nodo.component';

export type AssignFilter = 'all' | 'assigned' | 'unassigned';

export interface TreeNode {
  codigo_tecnico: string;
  etiqueta: string;
  tipo_nodo: string;
  activo: string;
  orden_visual?: number;
  children: TreeNode[];
  isLinked: boolean;     // directamente vinculado a la política seleccionada
  isInherited: boolean;  // heredado de un padre que sí está vinculado
  isActive: boolean;     // isLinked || isInherited
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
    HubDetalleNodoComponent
  ],
  templateUrl: './constructor-jerarquia.component.html',
})
export class ConstructorJerarquiaComponent implements OnInit {
  // Datos brutos
  fullNodes   = signal<INodo[]>([]);
  allPolicies = signal<any[]>([]);
  roles       = signal<any[]>([]);
  operaciones = signal<any[]>([]);
  enlaces     = signal<Array<{ padre: string; hijo: string }>>([]);

  // Estado de selección / filtros
  selectedPolicyCode = signal<string | null>(null);
  searchTerm         = signal('');
  assignFilter       = signal<AssignFilter>('all');

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
  ) {}

  ngOnInit() {
    this.load();
  }

  // ─── Carga principal ──────────────────────────────────────────────────────

  load() {
    this.loading.set(true);
    forkJoin({
      nodes:    this.accesosSvc.getNodos(),
      enlaces:  this.accesosSvc.getEnlaces(),
      politicas: this.accesosSvc.getPoliticasRaiz(),
      roles:    this.accesosSvc.getRoles(),
      ops:      this.accesosSvc.getOperaciones(),
    }).subscribe({
      next: (res: any) => {
        // Normalizar enlaces
        const normalizedLinks: Array<{ padre: string; hijo: string }> = (res.enlaces || []).map((e: any) => ({
          padre: (e.padre || e.PADRE || '').trim().toUpperCase(),
          hijo:  (e.hijo  || e.HIJO  || '').trim().toUpperCase(),
        }));
        this.enlaces.set(normalizedLinks);

        // Normalizar políticas
        const politicas = (res.politicas || []).map((p: any) => {
          const n: any = {};
          Object.keys(p).forEach(k => (n[k.toLowerCase()] = p[k]));
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
    nodes.forEach(n => {
      const code = (n.codigo_tecnico || '').trim().toUpperCase();
      if (code && this.isResourceType(n.tipo_nodo)) {
        resMap.set(code, {
          ...n,
          codigo_tecnico: code,
          etiqueta:  n.etiqueta  ?? '',
          tipo_nodo: n.tipo_nodo ?? '',
          activo:    n.activo    ?? 'S',
          children: [],
          isLinked: false,
          isInherited: false,
          isActive: false,
        });
      }
    });

    const childCodes = new Set<string>();
    links.forEach(e => {
      if (resMap.has(e.padre) && resMap.has(e.hijo)) {
        childCodes.add(e.hijo);
      }
    });

    // Construir de forma recursiva clonando los nodos para multipaternidad
    const buildNode = (code: string, visited: Set<string> = new Set()): TreeNode | null => {
      const original = resMap.get(code);
      if (!original || visited.has(code)) return null;

      const newVisited = new Set(visited);
      newVisited.add(code);

      const childLinks = links.filter(e => e.padre === code);
      const children: TreeNode[] = [];
      childLinks.forEach(cl => {
        const childNode = buildNode(cl.hijo, newVisited);
        if (childNode) {
          children.push(childNode);
        }
      });

      children.sort((a, b) => (a.orden_visual || 0) - (b.orden_visual || 0));

      return {
        ...original,
        children
      };
    };

    // Raíces = nodos de recurso que no son hijos de ningún otro recurso
    return Array.from(resMap.keys())
      .filter(code => !childCodes.has(code))
      .map(code => buildNode(code)!)
      .filter(n => !!n)
      .sort((a, b) => (a.orden_visual || 0) - (b.orden_visual || 0));
  }

  // ─── Árbol anotado con estado de asignación ───────────────────────────────

  /** Set of node codes directly linked to the selected policy */
  private linkedSet = computed(() => {
    const polCode = this.selectedPolicyCode();
    if (!polCode) return new Set<string>();
    const links = this.enlaces();
    return new Set<string>(
      links.filter(e => e.padre === polCode.toUpperCase()).map(e => e.hijo)
    );
  });

  /** Full tree annotated with isLinked / isInherited / isActive */
  private annotatedTree = computed(() => {
    const linked = this.linkedSet();
    const roots = this.buildFullTree();

    const annotate = (node: TreeNode, parentActive: boolean): TreeNode => {
      const isLinked   = linked.has(node.codigo_tecnico);
      const isActive   = isLinked || parentActive;
      const isInherited = !isLinked && parentActive;
      return {
        ...node,
        isLinked,
        isInherited,
        isActive,
        children: node.children.map(c => annotate(c, isActive)),
      };
    };

    return roots.map(r => annotate(r, false));
  });

  /** Tree filtered by search + assigned filter */
  filteredTree = computed(() => {
    const term   = this.searchTerm().trim().toUpperCase();
    const filter = this.assignFilter();
    const tree   = this.annotatedTree();

    const matchesFilter = (n: TreeNode): boolean => {
      if (filter === 'assigned')   return n.isActive;
      if (filter === 'unassigned') return !n.isActive;
      return true;
    };

    const filterNodes = (nodes: TreeNode[]): TreeNode[] =>
      nodes
        .map(n => ({ ...n, children: filterNodes(n.children) }))
        .filter(n => {
          const labelMatch = !term ||
            n.etiqueta.toUpperCase().includes(term) ||
            n.codigo_tecnico.includes(term);
          const filterMatch = matchesFilter(n) || n.children.length > 0;
          return labelMatch && filterMatch;
        });

    return filterNodes(tree);
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
  }

  setFilter(f: AssignFilter) {
    this.assignFilter.set(f);
  }

  selectNode(node: TreeNode) {
    this.selectedNode.set(node as any);
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
    const polCode = this.selectedPolicyCode();
    if (!polCode) return;

    const action$ = node.isLinked
      ? this.accesosSvc.deleteEnlace(polCode, node.codigo_tecnico)
      : this.accesosSvc.enlazarNodos(polCode, node.codigo_tecnico);

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
        this.snackBar.open('Error: ' + (err.error?.detail || err.message), 'Cerrar', { duration: 4000 });
        this.loading.set(false);
      }
    });
  }

  getParentsOf(childCode: string): string[] {
    const code = childCode?.trim().toUpperCase();
    return this.enlaces()
      .filter(e => e.hijo?.trim().toUpperCase() === code)
      .map(e => e.padre);
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
}
