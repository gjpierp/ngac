import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { INodo } from '../../core/models/ngac-admin.models';
import { AccesosService } from '../../core/services/accesos.service';
import { MenuService } from '../../core/services/menu.service';
import { MenuItem } from '../../core/models/menu-item.model';
import { TreeViewComponent } from '../../shared/components/tree-view/tree-view.component';

interface CloneOption {
  codigo_tecnico: string;
  etiqueta: string;
  tipo_nodo: string;
  alreadyLinked?: boolean;
  isLinked?: boolean;
}

interface TreeNode {
  codigo_tecnico: string;
  etiqueta: string;
  tipo_nodo: string;
  activo: string;
  orden_visual?: number;
  children: TreeNode[];
  isLinked: boolean;
  isInherited: boolean;
  isActive: boolean;
  [key: string]: any;
}

@Component({
  selector: 'app-clonacion-jerarquia',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  templateUrl: './clonacion-jerarquia.component.html',
})
export class ClonacionJerarquiaComponent implements OnInit {
  fullNodes = signal<INodo[]>([]);
  allPolicies = signal<any[]>([]);
  enlaces = signal<Array<{ padre: string; hijo: string }>>([]);

  sourceFolders = signal<MenuItem[]>([]);
  destinationFolders = signal<MenuItem[]>([]);

  selectedPolicyCode = signal<string | null>(null);
  cloneSourcePolicyCode = signal<string | null>(null);
  cloneRootNodeCode = signal<number | null>(null);
  cloneDestinationRootCode = signal<number | null>(null);
  loading = signal(true);

  constructor(
    private accesosSvc: AccesosService,
    private menuService: MenuService,
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

  load() {
    this.loading.set(true);
    forkJoin({
      nodes: this.accesosSvc.getNodos(),
      enlaces: this.accesosSvc.getMenuEnlaces(),
      politicas: this.accesosSvc.getPoliticasRaiz(),
    }).subscribe({
      next: (res: any) => {
        const normalizedLinks: Array<{ padre: string; hijo: string }> = (res.enlaces || []).map(
          (e: any) => ({
            padre: (e.padre || e.PADRE || '').trim().toUpperCase(),
            hijo: (e.hijo || e.HIJO || '').trim().toUpperCase(),
          }),
        );
        this.enlaces.set(normalizedLinks);

        const politicas = (res.politicas || []).map((p: any) => {
          const normalized: any = {};
          Object.keys(p).forEach((k) => (normalized[k.toLowerCase()] = p[k]));
          normalized.codigo_tecnico = normalized.codigo_tecnico || normalized.codigo || '';
          return normalized;
        });

        this.allPolicies.set(politicas);
        this.fullNodes.set(res.nodes || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private isResourceType(type: string | undefined): boolean {
    if (!type) return false;
    const t = type.trim().toUpperCase();
    return t === 'OBJ_ATTR' || t === 'OA' || t === 'CARPETA' || t === 'MODULO';
  }

  private getDirectLinkedCodes(policyCode: string): string[] {
    const normalized = policyCode.trim().toUpperCase();
    return this.enlaces()
      .filter((link) => link.padre === normalized)
      .map((link) => link.hijo)
      .filter((code, index, arr) => arr.indexOf(code) === index);
  }

  private buildFullTree(): TreeNode[] {
    const nodes = this.fullNodes();
    const links = this.enlaces();

    const resMap = new Map<string, TreeNode>();
    nodes.forEach((n) => {
      const code = (n.codigo_tecnico || '').trim().toUpperCase();
      if (code && this.isResourceType(n.tipo_nodo)) {
        resMap.set(code, {
          ...n,
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

    const childCodes = new Set<string>();
    links.forEach((e) => {
      if (resMap.has(e.padre) && resMap.has(e.hijo)) childCodes.add(e.hijo);
    });

    const buildNode = (code: string, visited: Set<string> = new Set()): TreeNode | null => {
      const original = resMap.get(code);
      if (!original || visited.has(code)) return null;

      const newVisited = new Set(visited);
      newVisited.add(code);

      const children = links
        .filter((e) => e.padre === code)
        .map((link) => buildNode(link.hijo, newVisited))
        .filter((child): child is TreeNode => !!child)
        .sort((a, b) => (a.orden_visual || 0) - (b.orden_visual || 0));

      return { ...original, children };
    };

    return Array.from(resMap.keys())
      .filter((code) => !childCodes.has(code))
      .map((code) => buildNode(code))
      .filter((node): node is TreeNode => !!node)
      .sort((a, b) => (a.orden_visual || 0) - (b.orden_visual || 0));
  }

  private linkedSet = computed(() => {
    const policyCode = this.selectedPolicyCode();
    if (!policyCode) return new Set<string>();
    return new Set<string>(
      this.enlaces()
        .filter((e) => e.padre === policyCode.toUpperCase())
        .map((e) => e.hijo),
    );
  });

  private annotatedTree = computed(() => {
    const linked = this.linkedSet();
    const roots = this.buildFullTree();

    const annotate = (node: TreeNode, parentActive: boolean): TreeNode => {
      const isLinked = linked.has(node.codigo_tecnico);
      const isActive = isLinked || parentActive;
      const isInherited = !isLinked && parentActive;
      return {
        ...node,
        isLinked,
        isInherited,
        isActive,
        children: node.children.map((child) => annotate(child, isActive)),
      };
    };

    return roots.map((root) => annotate(root, false));
  });

  cloneSourcePolicies = computed(() =>
    this.allPolicies().filter((policy) => policy.codigo_tecnico !== this.selectedPolicyCode()),
  );

  cloneRootOptions = computed<CloneOption[]>(() => {
    const sourcePolicy = this.cloneSourcePolicyCode();
    if (!sourcePolicy) return [];

    const rootCode = sourcePolicy.trim().toUpperCase();
    const sourceCodes = [rootCode, ...this.getDirectLinkedCodes(sourcePolicy)];
    const currentLinked = this.linkedSet();

    return this.fullNodes()
      .filter((node) => sourceCodes.includes((node.codigo_tecnico || '').trim().toUpperCase()))
      .filter((node) => this.isResourceType(node.tipo_nodo))
      .map((node) => ({
        codigo_tecnico: (node.codigo_tecnico || '').trim().toUpperCase(),
        etiqueta: node.etiqueta || node.codigo_tecnico,
        tipo_nodo: node.tipo_nodo || '',
        alreadyLinked: currentLinked.has((node.codigo_tecnico || '').trim().toUpperCase()),
      }))
      .sort((a, b) => a.etiqueta.localeCompare(b.etiqueta));
  });

  cloneSourceNode = computed(() => {
    const rootId = this.cloneRootNodeCode();
    if (!rootId) return null;
    return this.sourceFolders().find((folder) => folder.id === rootId) ?? null;
  });

  cloneDestinationOptions = computed<CloneOption[]>(() =>
    this.annotatedTree()
      .filter((node) => (node.children?.length ?? 0) === 0) // solo raíces sin hijos
      .map((node) => ({
        codigo_tecnico: node.codigo_tecnico,
        etiqueta: node.etiqueta,
        tipo_nodo: node.tipo_nodo,
        isLinked: node.isLinked,
      })),
  );

  cloneDestinationNode = computed(() => {
    const rootId = this.cloneDestinationRootCode();
    if (!rootId) return null;
    return this.destinationFolders().find((folder) => folder.id === rootId) ?? null;
  });

  selectPolicy(code: string) {
    this.selectedPolicyCode.set(code);
    this.cloneRootNodeCode.set(null);
    this.cloneDestinationRootCode.set(null);
    const policyId = this.getPolicyIdByCode(code);
    console.log('Selected policy code:', code, 'Resolved ID:', policyId);
    if (policyId) {
      this.menuService.getCarpetasRaizSinHijos(policyId).subscribe({
        next: (folders) => this.destinationFolders.set(folders),
        error: () => this.destinationFolders.set([]),
      });
    } else {
      this.destinationFolders.set([]);
    }
  }

  selectCloneSource(code: string) {
    this.cloneSourcePolicyCode.set(code);
    this.cloneRootNodeCode.set(null);
    const policyId = this.getPolicyIdByCode(code);
    console.log('Selected clone source policy code:', code, 'Resolved ID:', policyId);
    if (policyId) {
      this.menuService.getCarpetasRaiz(policyId).subscribe({
        next: (folders) => this.sourceFolders.set(folders),
        error: () => this.sourceFolders.set([]),
      });
    } else {
      this.sourceFolders.set([]);
    }
  }

  selectCloneRoot(id: number) {
    this.cloneRootNodeCode.set(id);
  }

  selectCloneDestination(id: number) {
    this.cloneDestinationRootCode.set(id);
  }

  clearCloneSelection() {
    this.cloneSourcePolicyCode.set(null);
    this.cloneRootNodeCode.set(null);
    this.cloneDestinationRootCode.set(null);
  }

  applyCloneSelection() {
    const sourceRootId = this.cloneRootNodeCode();
    const destinationRootId = this.cloneDestinationRootCode();
    if (!sourceRootId) {
      this.snackBar.open('Selecciona una carpeta raíz de origen', 'Cerrar', { duration: 2500 });
      return;
    }
    if (!destinationRootId) {
      this.snackBar.open('Selecciona una carpeta raíz de destino', 'Cerrar', { duration: 2500 });
      return;
    }

    this.loading.set(true);
    this.accesosSvc.clonarMenuJerarquia(destinationRootId, sourceRootId).subscribe({
      next: () => {
        this.snackBar.open('Jerarquía clonada y duplicada correctamente', 'Cerrar', { duration: 2500 });
        this.clearCloneSelection();
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

  goBack() {
    this.router.navigate(['/jerarquia']);
  }

  sourcePolicyTree = computed(() => {
    const sourcePolicy = this.cloneSourcePolicyCode();
    if (!sourcePolicy) return [];
    const directCodes = this.getDirectLinkedCodes(sourcePolicy);
    if (!directCodes.length) return [];
    const nodes = this.fullNodes();
    const links = this.enlaces();

    const resMap = new Map<string, TreeNode>();
    nodes.forEach((n) => {
      const code = (n.codigo_tecnico || '').trim().toUpperCase();
      if (code && this.isResourceType(n.tipo_nodo)) {
        resMap.set(code, {
          ...n,
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

    const buildNode = (code: string, visited: Set<string> = new Set()): TreeNode | null => {
      const original = resMap.get(code);
      if (!original || visited.has(code)) return null;
      const newVisited = new Set(visited);
      newVisited.add(code);
      const children = links
        .filter((e) => e.padre === code)
        .map((link) => buildNode(link.hijo, newVisited))
        .filter((child): child is TreeNode => !!child)
        .sort((a, b) => (a.orden_visual || 0) - (b.orden_visual || 0));
      return { ...original, children };
    };

    return directCodes.map((code) => buildNode(code)).filter((node): node is TreeNode => !!node);
  });
}
