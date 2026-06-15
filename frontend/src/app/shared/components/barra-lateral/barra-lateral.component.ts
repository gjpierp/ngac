import { Component, Input, Output, EventEmitter, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AccesosService } from '../../../core/services/accesos.service';
import { INodo } from '../../../core/models/ngac-admin.models';

interface NavItem {
  label: string;
  icon: string;
  route?: string;
  children?: NavItem[];
  expanded?: boolean;
  _orden?: number;
}

@Component({
  selector: 'app-barra-lateral',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule, MatTooltipModule],
  templateUrl: './barra-lateral.component.html',
})
export class BarraLateralComponent implements OnInit {
  @Input() collapsed = false;
  @Output() onToggle = new EventEmitter<boolean>();

  private accesosSvc = inject(AccesosService);
  private router = inject(Router);

  // Todo el menú es dinámico y proviene de la base de datos
  dynamicModules = signal<NavItem[]>([]);

  get currentContext(): any {
    return this.accesosSvc.getContextoSimulacion();
  }

  private nodesMap = new Map<string, INodo>();

  ngOnInit() {
    console.log('🚀 [BarraLateral] Inicializando componente...');

    this.accesosSvc.getNodos().subscribe((nodos) => {
      nodos.forEach((n) => this.nodesMap.set(n.codigo_tecnico, n));
      console.log('📦 [BarraLateral] Nodos cargados para enriquecimiento:', this.nodesMap.size);
    });

    this.accesosSvc.menu$.subscribe({
      next: (data) => {
        console.log('📡 [BarraLateral] Menu$ emitió:', data);
        this.procesarNodos(data);
      },
      error: (err) => console.error('❌ [BarraLateral] Error en suscripción menu$:', err),
    });

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        setTimeout(() => this.scrollToActive(), 300);
      }
    });

    this.accesosSvc.contextoSimulacion$.subscribe((ctx) => {
      console.log('🔄 [BarraLateral] Contexto de simulación actualizado, recargando menú...', ctx);
      this.cargarMenu();
    });
  }

  private scrollToActive() {
    const activeEl = document.querySelector('app-barra-lateral .is-active');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  cargarMenu() {
    this.accesosSvc.generarMenuDinamico(this.currentContext).subscribe({
      next: (res) => console.log('✅ [BarraLateral] Motor de Seguridad respondió:', res),
      error: (err) => console.error('❌ [BarraLateral] Error en Motor de Seguridad:', err),
    });
  }

  private procesarNodos(data: any) {
    if (!data) return;

    const roots: INodo[] = Array.isArray(data) ? data : data?.menu || [];
    const mapped = this.mapRecursiveNodes(roots);
    
    // Auto-expand path for current route so the active element is rendered
    this.autoExpandCurrentRoute(mapped);

    // Sort by _orden only (immutable visual order)
    mapped.sort((a, b) => (a._orden as number) - (b._orden as number));

    console.log('✨ [BarraLateral] Estructura jerárquica mapeada:', mapped);
    this.dynamicModules.set(mapped);

    // Scroll to the active item after rendering
    setTimeout(() => {
      const activeEl = document.querySelector('app-barra-lateral .is-active');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
  }

  private mapRecursiveNodes(nodes: INodo[]): NavItem[] {
    const mappedNodes = nodes.map((node) => {
      const codigo = node['codigo_tecnico'] || node['codigo'];
      const enrichedNode = this.nodesMap.get(codigo);

      const hijos = node['hijos'] || node['children'] || [];
      const dbIcon = node['icono'] || node['icon'] || enrichedNode?.icono;
      const tipo = node['tipo_nodo'] || enrichedNode?.tipo_nodo;
      const orden = node['orden_visual'] || enrichedNode?.orden_visual || 0;

      const childrenMapped = hijos.length > 0 ? this.mapRecursiveNodes(hijos) : undefined;

      return {
        label: node['etiqueta'] || enrichedNode?.etiqueta || codigo,
        icon:
          dbIcon || (tipo === 'OBJ_ATTR' ? 'folder' : hijos.length > 0 ? 'folder' : 'description'),
        route: node['ruta'] || node['url_ruta'] || enrichedNode?.url_ruta,
        expanded: false,
        children: childrenMapped,
        _orden: orden // Internal use for sorting
      };
    });

    // Sort by _orden
    return mappedNodes.sort((a, b) => (a._orden as number) - (b._orden as number));
  }

  private autoExpandCurrentRoute(items: NavItem[]) {
    const currentUrl = this.router.url;
    
    const findAndExpand = (nodes: NavItem[], path: NavItem[]): boolean => {
      for (const node of nodes) {
        if (node.route && currentUrl.includes(node.route)) {
          // Found target! Expand all parents in path
          path.forEach(p => p.expanded = true);
          return true;
        }
        if (node.children && node.children.length > 0) {
          if (findAndExpand(node.children, [...path, node])) {
            return true;
          }
        }
      }
      return false;
    };
    
    findAndExpand(items, []);
  }

  toggleItem(item: NavItem) {
    const items = this.dynamicModules();

    // Find the full path from root to this item
    const path = this.getPathToTarget(items, item, []);

    if (!path) {
      item.expanded = !item.expanded;
      this.dynamicModules.set([...items]);
      return;
    }

    const isFolder = !!(item.children && item.children.length > 0);
    const isCurrentlyExpanded = item.expanded;

    if (isFolder) {
      item.expanded = !isCurrentlyExpanded;

      if (item.expanded) {
        this.applyAccordion(items, path);
      } else {
        this.collapseAll(item.children!);
      }
    } else {
      this.applyAccordion(items, path);
    }

    if (this.collapsed) {
      this.onToggle.emit(false);
    }

    this.dynamicModules.set([...items]);
  }

  private getPathToTarget(items: NavItem[], target: NavItem, currentPath: NavItem[]): NavItem[] | null {
    for (const item of items) {
      if (item === target) {
        return [...currentPath, item];
      }
      if (item.children) {
        const path = this.getPathToTarget(item.children, target, [...currentPath, item]);
        if (path) return path;
      }
    }
    return null;
  }

  private applyAccordion(items: NavItem[], activePath: NavItem[]) {
    const activeSet = new Set<NavItem>(activePath);
    const traverse = (nodes: NavItem[]) => {
      for (const node of nodes) {
        if (!activeSet.has(node)) {
          node.expanded = false;
        }
        if (node.children) {
          traverse(node.children);
        }
      }
    };
    traverse(items);
  }

  private collapseAll(items: NavItem[]) {
    for (const item of items) {
      item.expanded = false;
      if (item.children) {
        this.collapseAll(item.children);
      }
    }
  }

  toggle() {
    this.onToggle.emit(!this.collapsed);
  }
}
