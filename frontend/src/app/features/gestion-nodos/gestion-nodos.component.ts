import { Component, ElementRef, OnInit, ViewChild, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { ReactiveFormsModule, FormsModule, FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AccesosService } from '../../core/services/accesos.service';
import { NgacDraftService } from '../../core/services/ngac-draft.service';
import { INodo } from '../../core/models/ngac-admin.models';
import { DialogoNodoComponent } from '../../shared/components/dialogo-nodo/dialogo-nodo.component';
import { DialogoConfirmacionComponent } from '../../shared/components/dialogo-confirmacion/dialogo-confirmacion.component';
import { HubDetalleNodoComponent } from '../constructor-jerarquia/hub-detalle-nodo.component';
import { TimeTravelDrawerComponent } from '../../shared/components/time-travel-drawer/time-travel-drawer.component';
import { SpotlightSearchComponent } from '../../shared/components/spotlight-search/spotlight-search.component';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-gestion-nodos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDividerModule,
    MatTooltipModule,
    HubDetalleNodoComponent,
    TimeTravelDrawerComponent,
    SpotlightSearchComponent,
    DragDropModule,
  ],
  templateUrl: './gestion-nodos.component.html',
})
export class GestionNodosComponent implements OnInit {
  @ViewChild('treeScrollContainer') private treeScrollContainer?: ElementRef<HTMLDivElement>;

  nodos = signal<INodo[]>([]);
  tipos = signal<any[]>([]);
  roles = signal<any[]>([]);
  operaciones = signal<any[]>([]);
  enlaces = signal<any[]>([]);
  selectedNode = signal<INodo | null>(null);
  loading = signal(false);
  expandedRows = signal<Set<string>>(new Set());
  contextoSimulacion = signal<any>(null);
  selectedParentCode = signal('');
  timeTravelOpen = signal(false);
  draftService = inject(NgacDraftService);

  simulateRole(role: string) {
    
    if (!role) {
      this.draftService.setImposterRole(null);
      this.snackBar.open('Modo Admin (Real) restaurado', 'OK', { duration: 2000 });
      // Reset any simulated blocks
      this.nodos.update(ns => ns.map(n => ({ ...n, directiva: undefined })));
      return;
    }

    this.draftService.setImposterRole(role);
    this.snackBar.open(`Simulando impacto para rol: ${role}`, 'OK', { duration: 3000 });
    
    // Llamar al backend para simular
    fetch('http://localhost:3000/api/ngac/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rol: role })
    })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        // Mock impact visualization based on backend response
        this.nodos.update(ns => ns.map(n => {
          if (data.deniedNodes?.includes(n.codigo_tecnico)) {
            return { ...n, directiva: 'DENY' }; // Use DENY to trigger health badge
          }
          return { ...n, directiva: undefined };
        }));
      }
    });
  }

  saveBatch() {
    const payload = this.draftService.getDraftPayload();
    this.snackBar.open('Guardando cambios por lote...', 'OK', { duration: 2000 });
    
    fetch('http://localhost:3000/api/ngac/batch-save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        this.snackBar.open('Lote procesado exitosamente', 'Cerrar', { duration: 3000 });
        this.draftService.clearDrafts();
        this.reloadAll();
      }
    });
  }

  hierarchicalTree = computed(() => {
    const nodes = this.nodos();
    const links = this.enlaces();
    const nodeMap = new Map<string, any>();

    // Filtro: Excluir explícitamente tipos de seguridad (Roles/Políticas/PC)
    const excludedTypes = ['POLICY', 'USUARIO', 'USR_ATTR'];
    const filteredNodes = nodes.filter((n) => {
      const t = n.tipo_nodo?.trim().toUpperCase();
      return !excludedTypes.includes(t || '') && (n.activo || 'S') === 'S';
    });

    // Mapear nodos para construcción del árbol
    filteredNodes.forEach((n) => {
      if (n.id_nodo === undefined || n.id_nodo === null) {
        return;
      }
      const key = String(n.id_nodo).trim();
      nodeMap.set(key, { ...n, children: [] });
    });

    const childIds = new Set<string>();
    links.forEach((e) => {
      const pKey = e.id_padre !== undefined && e.id_padre !== null ? String(e.id_padre).trim() : '';
      const hKey = e.id_hijo !== undefined && e.id_hijo !== null ? String(e.id_hijo).trim() : '';
      const p = nodeMap.get(pKey);
      const h = nodeMap.get(hKey);

      if (p && h) {
        // Evitar duplicados si el backend tiene links repetidos
        if (!p.children.some((c: any) => String(c.id_nodo).trim() === hKey)) {
          p.children.push(h);
        }
        childIds.add(hKey);
      }
    });

    // Ordenación recursiva por orden_visual
    const sortRec = (arr: any[]) => {
      arr.sort((a, b) => (a.orden_visual || 0) - (b.orden_visual || 0));
      arr.forEach((n) => {
        if (n.children && n.children.length > 0) sortRec(n.children);
      });
    };

    const roots = Array.from(nodeMap.values()).filter(
      (n) => !childIds.has(String(n.id_nodo).trim()),
    );

    sortRec(roots);
    return roots;
  });

  assignableParents = computed(() => {
    const currentNodeId = this.selectedNode()?.id_nodo;
    const excludedTypes = ['POLICY', 'USUARIO', 'USR_ATTR'];

    return this.nodos()
      .filter((node) => {
        const type = node.tipo_nodo?.trim().toUpperCase();
        return (
          node.id_nodo !== undefined &&
          node.id_nodo !== null &&
          (node.activo || 'S') === 'S' &&
          !excludedTypes.includes(type || '') &&
          node.id_nodo !== currentNodeId
        );
      })
      .sort((a, b) => (a.etiqueta || '').localeCompare(b.etiqueta || ''));
  });

  selectedNodeParents = computed(() => this.getParentsOf(this.selectedNode()?.id_nodo));

  crearNodo(parent?: INodo) {
    const dialogRef = this.dialog.open(DialogoNodoComponent, {
      width: '500px',
      data: {
        nodo: undefined,
        fixedType: parent ? undefined : 'OBJ_ATTR',
        allowedTypes: parent ? ['OBJ_ATTR', 'OBJETO'] : ['OBJ_ATTR'],
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loading.set(true);
        const payload: Partial<INodo> = {
          id_nodo: result.id_nodo || undefined,
          codigo_tecnico: result.codigo,
          etiqueta: result.etiqueta,
          tipo_nodo: result.tipo_nodo || result.tipo,
          url_ruta: result.ruta,
          slug: result.slug,
          icono: result.icono,
          descripcion: result.descripcion,
          orden_visual: result.orden,
          activo: result.activo === 'S' ? 'S' : 'N',
        };

        const parentId = parent ? parent.id_nodo : undefined;
        this.accesosSvc.crearYEnlazarNodo(payload, parentId).subscribe({
          next: () => {
            this.snackBar.open(
              parent ? 'Nodo hijo creado y vinculado exitosamente' : 'Nodo raíz creado exitosamente',
              'Cerrar',
              { duration: 2000 }
            );
            this.reloadAll();
          },
          error: (err) => {
            this.snackBar.open('Error: ' + err.message, 'Cerrar');
            this.loading.set(false);
          },
        });
      }
    });
  }

  editNodo(nodo: INodo) {
    const dialogRef = this.dialog.open(DialogoNodoComponent, {
      width: '500px',
      data: { nodo },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const payload: Partial<INodo> = {
          id_nodo: result.id_nodo || nodo.id_nodo,
          codigo_tecnico: result.codigo,
          etiqueta: result.etiqueta,
          tipo_nodo: result.tipo_nodo || result.tipo,
          url_ruta: result.ruta,
          slug: result.slug,
          icono: result.icono,
          descripcion: result.descripcion,
          orden_visual: result.orden,
          activo: result.activo === 'S' ? 'S' : 'N',
        };

        this.loading.set(true);
        this.accesosSvc.upsertNodo(payload).subscribe({
          next: () => {
            this.snackBar.open('Nodo actualizado', 'Cerrar', { duration: 2000 });
            this.reloadAll();
          },
          error: (err) => {
            this.snackBar.open('Error: ' + err.message, 'Cerrar');
            this.loading.set(false);
          },
        });
      }
    });
  }

  selectedRoot = signal<string>('ALL');
  rootNodes = computed(() => this.hierarchicalTree());
  selectedType = signal<string>('ALL');

  availableTypes = computed(() => {
    const nodes = this.nodos();
    const excludedTypes = ['POLICY', 'USUARIO', 'USR_ATTR'];
    const typesSet = new Set<string>();
    nodes.forEach((n) => {
      const t = n.tipo_nodo?.trim().toUpperCase();
      if (t && !excludedTypes.includes(t)) {
        typesSet.add(t);
      }
    });
    return Array.from(typesSet).sort();
  });

  private normalizeSearchValue(value: string | undefined | null): string {
    return (value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  displayNodes = computed(() => {
    let tree = this.hierarchicalTree();
    const expanded = this.expandedRows();
    const term = this.normalizeSearchValue((this.tipoSeleccionado || '').trim());
    const rootFilter = this.selectedRoot();
    const typeFilter = this.selectedType();
    const ctx = this.contextoSimulacion();
    const result: any[] = [];

    // Filter roots by active simulation policy context (solicitud.modulos)
    // removed as per user request to not filter by role/policy context

    if (rootFilter !== 'ALL') {
      tree = tree.filter((n) => n.codigo_tecnico === rootFilter);
    }

    const matches = (n: any): boolean => {
      let matchSelf = true;
      if (term) {
        matchSelf =
          this.normalizeSearchValue(n.etiqueta).includes(term) ||
          this.normalizeSearchValue(n.codigo_tecnico).includes(term);
      }
      if (matchSelf && typeFilter !== 'ALL') {
        matchSelf = n.tipo_nodo?.trim().toUpperCase() === typeFilter;
      }

      if (matchSelf) return true;
      return n.children?.some((c: any) => matches(c)) || false;
    };

    const flatten = (nodes: any[], level: number, parentMatched: boolean = false, parentId: number | null = null) => {
      nodes.forEach((n) => {
        let matchSelf = true;
        if (term) {
          matchSelf =
            this.normalizeSearchValue(n.etiqueta).includes(term) ||
            this.normalizeSearchValue(n.codigo_tecnico).includes(term);
        }
        if (matchSelf && typeFilter !== 'ALL') {
          matchSelf = n.tipo_nodo?.trim().toUpperCase() === typeFilter;
        }

        const isMatch = matchSelf || parentMatched || (n.children && n.children.some((c: any) => matches(c)));

        if (isMatch) {
          result.push({ ...n, level, hasChildren: n.children?.length > 0, parentId });
          const isExpanded = (term || typeFilter !== 'ALL') ? true : expanded.has(n.id_nodo!.toString());

          if (isExpanded && n.children?.length > 0) {
            flatten(n.children, level + 1, matchSelf || parentMatched, n.id_nodo);
          }
        }
      });
    };

    flatten(tree, 0, false, null);
    return result;
  });

  toggleRow(nodeId: number, event?: Event) {
    if (event) event.stopPropagation();
    const scrollTop = this.treeScrollContainer?.nativeElement.scrollTop ?? 0;
    const current = new Set(this.expandedRows());
    const isCurrentlyExpanded = current.has(nodeId.toString());

    if (isCurrentlyExpanded) {
      current.delete(nodeId.toString());
    } else {
      // Keep ancestors of this node expanded as well
      const activeIds = this.getAncestorIds(nodeId);
      activeIds.forEach(id => current.add(id));
      current.add(nodeId.toString());
    }
    
    this.expandedRows.set(current);

    requestAnimationFrame(() => {
      if (this.treeScrollContainer?.nativeElement) {
        this.treeScrollContainer.nativeElement.scrollTop = scrollTop;
      }
    });
  }

  isExpanded(nodeId: number) {
    return this.expandedRows().has(nodeId.toString());
  }

  constructor(
    private dialog: MatDialog,
    private accesosSvc: AccesosService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit() {
    this.reloadAll();
    this.loadExtras();
    this.accesosSvc.contextoSimulacion$.subscribe((ctx) => {
      this.contextoSimulacion.set(ctx);
    });
  }

  reloadAll = () => {
    this.loadNodos();
    this.loadEnlaces();
  };

  handleNodeDeleted = (nodo: INodo) => {
    this.selectedNode.set(null);
    this.deleteNodo(nodo);
  };

  loadExtras() {
    forkJoin({
      roles: this.accesosSvc.getRoles(),
      ops: this.accesosSvc.getOperaciones(),
      tipos: this.accesosSvc.getTiposNodo(),
    }).subscribe({
      next: (res: any) => {
        this.roles.set(res.roles);
        this.operaciones.set(res.ops);
        this.tipos.set(res.tipos);
      },
    });
  }

  loadNodos() {
    this.loading.set(true);
    this.accesosSvc.getNodos().subscribe({
      next: (data) => {
        const normalized = (data || []).map((n: any) => {
          const obj: any = {};
          Object.keys(n).forEach((key) => (obj[key.toLowerCase()] = (n as any)[key]));
          obj.activo = obj.activo || 'S'; // Mantener como string 'S'/'N'
          obj.codigo_tecnico = obj.codigo_tecnico || obj.codigo || n.codigo_tecnico;
          return obj as INodo;
        });
        this.nodos.set(normalized);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Error al cargar los nodos', 'Cerrar', { duration: 4000 });
        this.loading.set(false);
      },
    });
  }

  loadEnlaces() {
    this.accesosSvc.getMenuEnlaces().subscribe({
      next: (data) => {
        const normalized = (data || []).map((e: any) => {
          const obj: any = {};
          // Normalizar todas las propiedades a minúsculas para consistencia
          Object.keys(e).forEach((k) => (obj[k.toLowerCase()] = e[k]));
          return obj;
        });
        this.enlaces.set(normalized);
      },
    });
  }

  getParentsOf(childId?: number | string | null): any[] {
    if (childId === undefined || childId === null || childId === '') return [];
    const childKey = String(childId).trim();
    const parentLinks = this.enlaces().filter(
      (e) => e.id_hijo !== undefined && e.id_hijo !== null && String(e.id_hijo).trim() === childKey,
    );
    const allNodes = this.nodos();

    // Construye la cadena de antepasados de un nodo dado (sin incluir el nodo en sí)
    const buildAncestorChain = (nodeId: number, visited = new Set<number>()): any[] => {
      if (visited.has(nodeId)) return [];
      visited.add(nodeId);
      const parentLinksOfNode = this.enlaces().filter(
        (e) => e.id_hijo !== undefined && e.id_hijo !== null && Number(e.id_hijo) === nodeId,
      );
      const ancestors: any[] = [];
      for (const link of parentLinksOfNode) {
        const pId = Number(link.id_padre);
        const pNode = allNodes.find((n) => Number(n.id_nodo) === pId);
        const grandAncestors = buildAncestorChain(pId, visited);
        ancestors.push(...grandAncestors, {
          id_nodo: pNode?.id_nodo || link.id_padre,
          codigo_tecnico: pNode?.codigo_tecnico || link.padre,
          etiqueta: pNode?.etiqueta || pNode?.codigo_tecnico || link.padre,
        });
      }
      return ancestors;
    };

    return parentLinks.map((link) => {
      const parentId =
        link.id_padre !== undefined && link.id_padre !== null ? Number(link.id_padre) : null;
      const pNode = allNodes.find((n) => Number(n.id_nodo) === parentId);
      return {
        id_nodo: pNode?.id_nodo || link.id_padre,
        codigo_tecnico: pNode?.codigo_tecnico || link.padre,
        etiqueta: pNode?.etiqueta || link.padre_etiqueta || pNode?.codigo_tecnico || link.padre,
        ancestors: parentId ? buildAncestorChain(parentId) : [],
      };
    });
  }

  getAncestorIds(nodeId: number): Set<string> {
    const ancestors = new Set<string>();
    const links = this.enlaces();

    const findParents = (id: number) => {
      links.forEach((link) => {
        if (Number(link.id_hijo) === id && link.id_padre !== undefined && link.id_padre !== null) {
          const pId = String(link.id_padre).trim();
          if (!ancestors.has(pId)) {
            ancestors.add(pId);
            findParents(Number(pId));
          }
        }
      });
    };

    findParents(nodeId);
    return ancestors;
  }

  selectedTreeParentId = signal<number | null>(null);

  selectNode(nodo: any) {
    this.selectedNode.set(nodo);
    this.selectedTreeParentId.set(nodo.parentId || null);
    this.selectedParentCode.set('');

    if (nodo.id_nodo !== undefined && nodo.id_nodo !== null) {
      const activeIds = this.getAncestorIds(Number(nodo.id_nodo));
      const current = new Set(this.expandedRows());
      activeIds.forEach(id => current.add(id));
      current.add(String(nodo.id_nodo).trim());
      this.expandedRows.set(current);

      // Desplazar automáticamente el nodo seleccionado a la vista dentro del explorador
      setTimeout(() => {
        const element = document.getElementById('selected-tree-node');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    }
  }

  trackByNode(_: number, node: any): string | number {
    return `${node.id_nodo ?? node.codigo_tecnico}-${node.level ?? 0}-${node.parentId ?? 'root'}`;
  }

  assignSelectedNode() {
    const selectedNode = this.selectedNode();
    const parentId = Number(this.selectedParentCode());

    if (!selectedNode?.id_nodo) {
      this.snackBar.open('Selecciona un nodo para asignar', 'Cerrar', { duration: 2500 });
      return;
    }

    if (!parentId) {
      this.snackBar.open('Selecciona un padre para asignar el nodo', 'Cerrar', { duration: 2500 });
      return;
    }

    const childId = Number(selectedNode.id_nodo);
    const alreadyLinked = this.enlaces().some(
      (link) => Number(link.id_padre) === parentId && Number(link.id_hijo) === childId,
    );

    if (alreadyLinked) {
      this.snackBar.open('El nodo ya está asignado a ese padre', 'Cerrar', { duration: 2500 });
      return;
    }

    this.loading.set(true);
    this.accesosSvc.enlazarMenuNodos(parentId, childId).subscribe({
      next: () => {
        this.snackBar.open('Nodo asignado correctamente', 'Cerrar', { duration: 2500 });
        this.selectedParentCode.set('');
        this.reloadAll();
      },
      error: (err) => {
        this.snackBar.open(
          'Error al asignar nodo: ' + (err.error?.detail || err.message),
          'Cerrar',
          {
            duration: 4000,
          },
        );
        this.loading.set(false);
      },
    });
  }

  unassignSelectedNode(parentId: number | string) {
    const selectedNode = this.selectedNode();
    const normalizedParentId = Number(parentId);
    if (!selectedNode?.id_nodo || !normalizedParentId) {
      return;
    }

    const childId = Number(selectedNode.id_nodo);

    this.loading.set(true);
    this.accesosSvc.deleteMenuEnlace(normalizedParentId, childId).subscribe({
      next: () => {
        this.snackBar.open('Nodo desasignado correctamente', 'Cerrar', { duration: 2500 });
        this.reloadAll();
      },
      error: (err) => {
        this.snackBar.open(
          'Error al desasignar nodo: ' + (err.error?.detail || err.message),
          'Cerrar',
          { duration: 4000 },
        );
        this.loading.set(false);
      },
    });
  }

  tipoSeleccionadoSignal = signal('');
  get tipoSeleccionado() {
    return this.tipoSeleccionadoSignal();
  }
  set tipoSeleccionado(v: string) {
    this.tipoSeleccionadoSignal.set(v);
  }

  deleteNodo(nodo: INodo) {
    const dialogRef = this.dialog.open(DialogoConfirmacionComponent, {
      width: '450px',
      data: { title: 'Eliminar Nodo', message: `Confirma desactivar el nodo "${nodo.etiqueta}".` },
    });

    dialogRef.afterClosed().subscribe((confirm) => {
      if (confirm) {
        if (!nodo.id_nodo) {
          this.snackBar.open('No se pudo resolver el ID del nodo', 'Cerrar', { duration: 4000 });
          return;
        }
        this.accesosSvc.deleteNodo(nodo.id_nodo).subscribe({
          next: () => {
            this.snackBar.open('Nodo desactivado', 'Cerrar', { duration: 3000 });
            this.reloadAll();
          },
        });
      }
    });
  }

  // --- Indicadores de Salud (Health Badges) ---
  getHealthBadges(node: any): { type: string; label: string; color: string; icon: string }[] {
    const badges: { type: string; label: string; color: string; icon: string }[] = [];

    if (node.activo === 'N') {
      badges.push({ type: 'INACTIVO', label: 'Inactivo', color: 'bg-gray-100 text-gray-500 border-gray-300', icon: 'power_off' });
    }
    // Blocked if simulated directive is DENY
    if (node.directiva === 'DENY') {
      badges.push({ type: 'BLOQUEO', label: 'Bloqueado', color: 'bg-red-900 text-white border-red-950', icon: 'block' });
    }
    if (node.level === 0) {
      if (node.tipo_nodo === 'OBJ_ATTR' || node.tipo_nodo === 'OA') {
        badges.push({ type: 'RAÍZ', label: 'Nodo Raíz', color: 'bg-emerald-100 text-emerald-700 border-emerald-300', icon: 'account_tree' });
      } else {
        badges.push({ type: 'HUÉRFANO', label: 'Huérfano (Sin carpeta padre)', color: 'bg-amber-100 text-amber-700 border-amber-300', icon: 'link_off' });
      }
    }

    // Inconsistent if safi_eliminado
    if (node.safi_eliminado === 1) {
      badges.push({ type: 'INCONSISTENCIA', label: 'Safi Inconsistente', color: 'bg-red-100 text-red-700 border-red-300', icon: 'error' });
    }

    return badges;
  }

  onDrop(event: CdkDragDrop<any[]>) {
    const prevIndex = event.previousIndex;
    const currentIndex = event.currentIndex;

    if (prevIndex === currentIndex) return;
    
    const tree = this.displayNodes();
    const item = tree[prevIndex];

    const siblings = tree.filter(n => n.parent_id === item.parent_id);
    moveItemInArray(siblings, siblings.findIndex(s => s.id_nodo === item.id_nodo), currentIndex);
    
    siblings.forEach((s, i) => {
      s.orden_visual = i + 1;
      this.draftService.addChange({
        id: String(s.id_nodo),
        type: 'UPDATE_ORDER',
        payload: { orden_visual: s.orden_visual }
      });
    });

    this.snackBar.open('Orden visual actualizado (Modo Borrador)', 'OK', { duration: 2000 });
  }
}
