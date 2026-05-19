import { Component, Input, Output, EventEmitter, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AccesosService } from '../../../core/services/accesos.service';
import { INodo } from '../../../core/models/ngac-admin.models';
import { DialogoContextoComponent } from './dialogo-contexto.component';

interface NavItem {
  label: string;
  icon: string;
  route?: string;
  children?: NavItem[];
  expanded?: boolean;
}

@Component({
  selector: 'app-barra-lateral',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule, MatTooltipModule, MatDialogModule],
  templateUrl: './barra-lateral.component.html',
})
export class BarraLateralComponent implements OnInit {
  @Input() collapsed = false;
  @Output() onToggle = new EventEmitter<boolean>();

  private accesosSvc = inject(AccesosService);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  // Todo el menú es dinámico y proviene de la base de datos
  dynamicModules = signal<NavItem[]>([]);
  
  // Contexto actual de simulación (dinámico desde el servicio de accesos)
  get currentContext(): any {
    return this.accesosSvc.getContextoSimulacion();
  }

  // Caché de nodos para enriquecer el menú dinámico
  private nodesMap = new Map<string, INodo>();

  ngOnInit() {
    console.log('🚀 [BarraLateral] Inicializando componente...');
    
    // Cargar todos los nodos para enriquecimiento de metadata
    this.accesosSvc.getNodos().subscribe(nodos => {
      nodos.forEach(n => this.nodesMap.set(n.codigo_tecnico, n));
      console.log('📦 [BarraLateral] Nodos cargados para enriquecimiento:', this.nodesMap.size);
    });

    // Escuchar cambios globales en el árbol
    this.accesosSvc.tree$.subscribe({
      next: (data) => {
        console.log('📡 [BarraLateral] Tree$ emitió:', data);
        this.procesarNodos(data);
      },
      error: (err) => console.error('❌ [BarraLateral] Error en suscripción tree$:', err)
    });

    // Carga inicial utilizando el Motor de Seguridad NGAC
    this.cargarMenu();
  }

  cargarMenu() {
    this.accesosSvc.generarMenuDinamico(this.currentContext).subscribe({
      next: (res) => console.log('✅ [BarraLateral] Motor de Seguridad respondió:', res),
      error: (err) => console.error('❌ [BarraLateral] Error en Motor de Seguridad:', err)
    });
  }

  navegarGeneradorContexto() {
    this.router.navigate(['/generador-contexto']);
  }

  private procesarNodos(data: any) {
    if (!data) return;
    
    // Manejar tanto array directo como objeto con propiedad 'menu'
    const roots: INodo[] = Array.isArray(data) ? data : (data?.menu || []);

    // Mapeo recursivo para mantener la jerarquía
    const mapped = this.mapRecursiveNodes(roots);
    
    console.log('✨ [BarraLateral] Estructura jerárquica mapeada:', mapped);
    this.dynamicModules.set(mapped);
  }

  private mapRecursiveNodes(nodes: INodo[]): NavItem[] {
    return nodes.map(node => {
      const codigo = node['codigo_tecnico'] || node['codigo'];
      const enrichedNode = this.nodesMap.get(codigo);
      
      const hijos = node['hijos'] || node['children'] || [];
      const dbIcon = node['icono'] || node['icon'] || enrichedNode?.icono;
      const tipo = node['tipo_nodo'] || enrichedNode?.tipo_nodo;
      
      let childrenMapped = hijos.length > 0 ? this.mapRecursiveNodes(hijos) : undefined;
      
      if (codigo === 'ADMINISTRACION') {
        childrenMapped = childrenMapped || [];
        const hasPoliticas = childrenMapped.some(c => c.route === '/politicas');
        if (!hasPoliticas) {
          childrenMapped.push({
            label: 'Políticas',
            icon: 'policy',
            route: '/politicas',
            expanded: false
          });
        }
        const hasComparador = childrenMapped.some(c => c.route === '/comparador');
        if (!hasComparador) {
          childrenMapped.push({
            label: 'Comparador de Permisos',
            icon: 'compare_arrows',
            route: '/comparador',
            expanded: false
          });
        }
      }
      
      return {
        label: node['etiqueta'] || enrichedNode?.etiqueta || codigo,
        icon: dbIcon || (tipo === 'OBJ_ATTR' ? 'folder' : (hijos.length > 0 ? 'folder' : 'description')),
        route: node['ruta'] || node['url_ruta'] || enrichedNode?.url_ruta,
        expanded: false,
        children: childrenMapped
      };
    });
  }

  toggleItem(item: NavItem) {
    if (this.collapsed) {
      this.onToggle.emit(false); // Auto-expandir sidebar si está colapsado
    }
    item.expanded = !item.expanded;
    
    // Forzar actualización del signal para que Angular detecte el cambio de estado interno
    this.dynamicModules.set([...this.dynamicModules()]);
  }

  private isResourceType(type: string | undefined): boolean {
    if (!type) return false;
    const t = type.toUpperCase();
    return ['OBJ_ATTR', 'OBJETO' ].includes(t);
  }

  toggle() {
    this.onToggle.emit(!this.collapsed);
  }
}
