import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { AccesosService } from '../../core/services/accesos.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

interface StatCard {
  title: string;
  value: string;
  icon: string;
  colorClass: string;
  bgClass: string;
}

@Component({
  selector: 'app-tablero',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTabsModule, MatSnackBarModule],
  templateUrl: './tablero.component.html',
})
export class TableroComponent implements OnInit {
  private _lastSync: Date = new Date();

  lastSync(): Date {
    return this._lastSync;
  }
  stats = signal<StatCard[]>([
    {
      title: 'Nodos',
      value: '0',
      icon: 'folder_open',
      colorClass: 'text-blue-600',
      bgClass: 'bg-blue-50',
    },
    {
      title: 'Asignaciones',
      value: '0',
      icon: 'alt_route',
      colorClass: 'text-amber-600',
      bgClass: 'bg-amber-50',
    },
    {
      title: 'Operaciones',
      value: '0',
      icon: 'key',
      colorClass: 'text-emerald-600',
      bgClass: 'bg-emerald-50',
    },
  ]);

  modules = signal<any[]>([]);
  roles = signal<any[]>([]);
  policies = signal<any[]>([]);
  typeStats = signal<any[]>([
    { label: 'Objetos (Menú)', count: 0, percent: 0 },
    { label: 'Roles', count: 0, percent: 0 },
    { label: 'Políticas', count: 0, percent: 0 },
  ]);
  treeLoading = signal<boolean>(false);
  expandedNodes = signal<Set<number>>(new Set());
  parentMap = new Map<number, number | null>();

  constructor(
    private accesosSvc: AccesosService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    // Cargar stats reales
    this.accesosSvc.getDashboardStats().subscribe({
      next: (stats: any) => {
        this.stats.set([
          {
            title: 'Nodos',
            value: (stats.acc_nodos ?? '0').toString(),
            icon: 'folder_open',
            colorClass: 'text-blue-600',
            bgClass: 'bg-blue-50',
          },
          {
            title: 'Roles',
            value: (stats.acc_roles ?? '0').toString(),
            icon: 'security',
            colorClass: 'text-violet-600',
            bgClass: 'bg-violet-50',
          },
          {
            title: 'Asignaciones',
            value: (stats.acc_asignaciones ?? '0').toString(),
            icon: 'alt_route',
            colorClass: 'text-amber-600',
            bgClass: 'bg-amber-50',
          },
          {
            title: 'Asociaciones',
            value: (stats.acc_asociaciones ?? '0').toString(),
            icon: 'link',
            colorClass: 'text-indigo-600',
            bgClass: 'bg-indigo-50',
          },
          {
            title: 'Prohibiciones',
            value: (stats.acc_prohibiciones ?? '0').toString(),
            icon: 'block',
            colorClass: 'text-red-600',
            bgClass: 'bg-red-50',
          },
          {
            title: 'Log de Errores',
            value: (stats.acc_log_errores ?? '0').toString(),
            icon: 'error',
            colorClass: 'text-gray-600',
            bgClass: 'bg-gray-50',
          },
          {
            title: 'Operaciones',
            value: (stats.acc_operaciones ?? '0').toString(),
            icon: 'key',
            colorClass: 'text-emerald-600',
            bgClass: 'bg-emerald-50',
          },
          {
            title: 'Tipos de Nodos',
            value: (stats.acc_tipos_nodo ?? '0').toString(),
            icon: 'category',
            colorClass: 'text-cyan-600',
            bgClass: 'bg-cyan-50',
          },
        ]);
        this.treeLoading.set(false);
      },
      error: (err: any) => {
        console.error('[Dashboard] Error cargando stats:', err);
        this.treeLoading.set(false);
      },
    });

    this.accesosSvc.getModulosRaiz().subscribe({
      next: (modulos: any[]) => {
        // Filtrar solo los módulos activos
        const activos = (modulos || []).filter((m) => m.activo === 'S');
        this.modules.set(activos);
        this.buildParentMap(activos, null);
        this.updateDistribution();
        this._lastSync = new Date();
      },
      error: () => {
        this.modules.set([]);
        this._lastSync = new Date();
        this.snackBar.open('Error al cargar los módulos raíz', 'Cerrar', { duration: 4000 });
      },
    });

    this.accesosSvc.getRoles().subscribe({
      next: (roles: any[]) => {
        // Filtrar solo los roles activos
        const mappedRoles = (roles || [])
          .map((r) => ({
            id_nodo: r.id_rol,
            codigo_tecnico: r.codigo,
            etiqueta: r.nombre || r.codigo,
            tipo_nodo: 'USR_ATTR',
            icono: 'admin_panel_settings',
            activo: r.activo ?? 'S',
            children: [],
          }))
          .filter((r) => r.activo === 'S');
        this.roles.set(mappedRoles);
        this.buildParentMap(mappedRoles, null);
        this.updateDistribution();
        this._lastSync = new Date();
      },
      error: () => {
        this.roles.set([]);
        this._lastSync = new Date();
        this.snackBar.open('Error al cargar los roles', 'Cerrar', { duration: 4000 });
      },
    });

    this.accesosSvc.getPoliticasRaiz().subscribe({
      next: (politicas: any[]) => {
        // Filtrar solo las políticas activas
        const mappedPolicies = (politicas || [])
          .map((p) => ({
            ...p,
            tipo_nodo: p.tipo_nodo || 'POLICY',
          }))
          .filter((p) => p.activo === 'S');
        this.policies.set(mappedPolicies);
        this.buildParentMap(mappedPolicies, null);
        this.updateDistribution();
        this._lastSync = new Date();
      },
      error: () => {
        this.policies.set([]);
        this._lastSync = new Date();
        this.snackBar.open('Error al cargar las políticas', 'Cerrar', { duration: 4000 });
      },
    });
  }

  private updateDistribution() {
    const allNodes = [...this.modules(), ...this.roles(), ...this.policies()];
    this.calculateTypeStats(allNodes);
  }

  private buildParentMap(nodes: any[], parentId: number | null) {
    nodes.forEach((n) => {
      this.parentMap.set(n.id_nodo, parentId);
      if (n.children) this.buildParentMap(n.children, n.id_nodo);
    });
  }

  toggleNode(id: number, event?: Event) {
    if (event) event.stopPropagation();

    this.expandedNodes.update((set) => {
      const newSet = new Set(set);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        // Comportamiento Acordeón: Colapsar hermanos
        const parentId = this.parentMap.get(id);

        // Iterar sobre los nodos expandidos y quitar aquellos que tengan el mismo padre
        for (const expId of newSet) {
          if (this.parentMap.get(expId) === parentId) {
            newSet.delete(expId);
          }
        }
        newSet.add(id);
      }
      return newSet;
    });
  }

  isExpanded(id: number): boolean {
    return this.expandedNodes().has(id);
  }

  private countNodes(nodes: any[]): number {
    return nodes.reduce((acc, n) => acc + 1 + this.countNodes(n.children || []), 0);
  }

  private calculateTypeStats(tree: any[]) {
    let counts = { OBJETO: 0, ROL: 0, POLICY: 0 };
    const traverse = (nodes: any[]) => {
      nodes.forEach((n) => {
        if (n.tipo_nodo === 'OBJETO' || n.tipo_nodo === 'MENU' || n.tipo_nodo === 'SUBMENU')
          counts.OBJETO++;
        else if (n.tipo_nodo === 'USR_ATTR' || n.tipo_nodo === 'ROL') counts.ROL++;
        else if (n.tipo_nodo === 'POLICY' || n.tipo_nodo === 'POLITICA') counts.POLICY++;
        if (n.children) traverse(n.children);
      });
    };
    traverse(tree);

    const total = counts.OBJETO + counts.ROL + counts.POLICY || 1;
    this.typeStats.set([
      { label: 'Objetos (Menú)', count: counts.OBJETO, percent: (counts.OBJETO / total) * 100 },
      { label: 'Roles', count: counts.ROL, percent: (counts.ROL / total) * 100 },
      { label: 'Políticas', count: counts.POLICY, percent: (counts.POLICY / total) * 100 },
    ]);
  }
}
