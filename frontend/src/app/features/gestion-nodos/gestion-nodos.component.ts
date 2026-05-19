import { Component, OnInit, signal, computed } from '@angular/core';
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
import { INodo } from '../../core/models/ngac-admin.models';
import { DialogoNodoComponent } from '../../shared/components/dialogo-nodo/dialogo-nodo.component';
import { DialogoConfirmacionComponent } from '../../shared/components/dialogo-confirmacion/dialogo-confirmacion.component';
import { HubDetalleNodoComponent } from '../constructor-jerarquia/hub-detalle-nodo.component';

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
  ],
  templateUrl: './gestion-nodos.component.html',
})
export class GestionNodosComponent implements OnInit {
  nodos = signal<INodo[]>([]);
  tipos = signal<any[]>([]);
  roles = signal<any[]>([]);
  operaciones = signal<any[]>([]);
  enlaces = signal<any[]>([]);
  selectedNode = signal<INodo | null>(null);
  loading = signal(false);
  expandedRows = signal<Set<string>>(new Set());



  hierarchicalTree = computed(() => {
    const nodes = this.nodos();
    const links = this.enlaces();
    const nodeMap = new Map<string, any>();

    // Filtro: Excluir explícitamente tipos de seguridad (Roles/Políticas/PC)
    const excludedTypes = ['POLICY', 'USUARIO', 'USR_ATTR'];
    const filteredNodes = nodes.filter(n => {
      const t = n.tipo_nodo?.trim().toUpperCase();
      return !excludedTypes.includes(t || '');
    });

    // Mapear nodos para construcción del árbol
    filteredNodes.forEach(n => {
      const key = n.codigo_tecnico.trim().toUpperCase();
      nodeMap.set(key, { ...n, children: [] });
    });
    
    const childCodes = new Set<string>();
    links.forEach(e => {
      const pKey = e.padre?.trim().toUpperCase();
      const hKey = e.hijo?.trim().toUpperCase();
      const p = nodeMap.get(pKey);
      const h = nodeMap.get(hKey);

      if (p && h) {
        // Evitar duplicados si el backend tiene links repetidos
        if (!p.children.some((c: any) => c.codigo_tecnico.trim().toUpperCase() === hKey)) {
          p.children.push(h);
        }
        childCodes.add(hKey);
      }
    });

    // Ordenación recursiva por orden_visual
    const sortRec = (arr: any[]) => {
      arr.sort((a, b) => (a.orden_visual || 0) - (b.orden_visual || 0));
      arr.forEach(n => {
        if (n.children && n.children.length > 0) sortRec(n.children);
      });
    };

    const roots = Array.from(nodeMap.values())
      .filter(n => !childCodes.has(n.codigo_tecnico.trim().toUpperCase()));
    
    sortRec(roots);
    return roots;
  });

  crearNodo(parent?: INodo) {
    const dialogRef = this.dialog.open(DialogoNodoComponent, {
      width: '500px',
      data: { 
        nodo: undefined,
        fixedType: parent ? undefined : 'OBJ_ATTR',
        allowedTypes: parent ? ['OBJ_ATTR', 'OBJETO'] : ['OBJ_ATTR']
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loading.set(true);
        const payload: Partial<INodo> = {
          codigo_tecnico: result.codigo,
          etiqueta:       result.etiqueta,
          tipo_nodo:      result.tipo,
          url_ruta:       result.ruta,
          slug:           result.slug,
          icono:          result.icono,
          orden_visual:   result.orden,
          activo:         result.activo === 'S' ? 'S' : 'N'
        };

        this.accesosSvc.upsertNodo(payload).subscribe({
          next: () => {
            if (parent) {
              this.accesosSvc.enlazarNodos(parent.codigo_tecnico, payload.codigo_tecnico!).subscribe({
                next: () => {
                  this.snackBar.open('Nodo hijo vinculado', 'Cerrar', { duration: 2000 });
                  this.reloadAll();
                }
              });
            } else {
              this.snackBar.open('Nodo raíz creado', 'Cerrar', { duration: 2000 });
              this.reloadAll();
            }
          },
          error: (err) => {
            this.snackBar.open('Error: ' + err.message, 'Cerrar');
            this.loading.set(false);
          }
        });
      }
    });
  }

  editNodo(nodo: INodo) {
    const dialogRef = this.dialog.open(DialogoNodoComponent, {
      width: '500px',
      data: { nodo }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const payload: Partial<INodo> = {
          codigo_tecnico: result.codigo,
          etiqueta:       result.etiqueta,
          tipo_nodo:      result.tipo,
          url_ruta:       result.ruta,
          slug:           result.slug,
          icono:          result.icono,
          orden_visual:   result.orden,
          activo:         result.activo === 'S' ? 'S' : 'N'
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
          }
        });
      }
    });
  }

  selectedRoot = signal<string>('ALL');
  rootNodes = computed(() => this.hierarchicalTree());

  displayNodes = computed(() => {
    let tree = this.hierarchicalTree();
    const expanded = this.expandedRows();
    const term = (this.tipoSeleccionado || '').trim().toLowerCase();
    const rootFilter = this.selectedRoot();
    const result: any[] = [];

    if (rootFilter !== 'ALL') {
      tree = tree.filter(n => n.codigo_tecnico === rootFilter);
    }

    const matches = (n: any): boolean => {
      if (!term) return true;
      const matchSelf = n.etiqueta?.toLowerCase().includes(term) || 
                        n.codigo_tecnico?.toLowerCase().includes(term);
      if (matchSelf) return true;
      return n.children?.some((c: any) => matches(c)) || false;
    };

    const flatten = (nodes: any[], level: number) => {
      nodes.forEach(n => {
        if (matches(n)) {
          result.push({ ...n, level, hasChildren: n.children?.length > 0 });
          const isExpanded = term ? true : expanded.has(n.id_nodo!.toString());
          
          if (isExpanded && n.children?.length > 0) {
            flatten(n.children, level + 1);
          }
        }
      });
    };

    flatten(tree, 0);
    return result;
  });

  toggleRow(nodeId: number, event?: Event) {
    if (event) event.stopPropagation();
    const current = new Set(this.expandedRows());
    if (current.has(nodeId.toString())) current.delete(nodeId.toString());
    else current.add(nodeId.toString());
    this.expandedRows.set(current);
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
  }

  reloadAll = () => {
    this.loadNodos();
    this.loadEnlaces();
  };

  loadExtras() {
    forkJoin({
      roles: this.accesosSvc.getRoles(),
      ops: this.accesosSvc.getOperaciones(),
      tipos: this.accesosSvc.getTiposNodo()
    }).subscribe({
      next: (res: any) => {
        this.roles.set(res.roles);
        this.operaciones.set(res.ops);
        this.tipos.set(res.tipos);
      }
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
    this.accesosSvc.getEnlaces().subscribe({
      next: (data) => {
        const normalized = (data || []).map((e: any) => {
          const obj: any = {};
          // Normalizar todas las propiedades a minúsculas para consistencia
          Object.keys(e).forEach(k => obj[k.toLowerCase()] = e[k]);
          return obj;
        });
        this.enlaces.set(normalized);
      }
    });
  }

  getParentsOf(childCode: string): any[] {
    if (!childCode) return [];
    const childKey = childCode.trim().toUpperCase();
    const parentLinks = this.enlaces().filter(e => e.hijo?.trim().toUpperCase() === childKey);
    const allNodes = this.nodos();
    
    return parentLinks.map(link => {
      const pKey = link.padre?.trim().toUpperCase();
      const pNode = allNodes.find(n => n.codigo_tecnico?.trim().toUpperCase() === pKey);
      return { 
        codigo_tecnico: link.padre, 
        etiqueta: pNode?.etiqueta || link.padre_etiqueta || pNode?.codigo_tecnico || link.padre 
      };
    });
  }

  selectNode(nodo: INodo) {
    this.selectedNode.set(nodo);
  }

  tipoSeleccionadoSignal = signal('');
  get tipoSeleccionado() { return this.tipoSeleccionadoSignal(); }
  set tipoSeleccionado(v: string) { this.tipoSeleccionadoSignal.set(v); }

  deleteNodo(nodo: INodo) {
    const dialogRef = this.dialog.open(DialogoConfirmacionComponent, {
      width: '450px',
      data: { title: 'Eliminar Nodo', message: `Confirma desactivar el nodo "${nodo.etiqueta}".` }
    });

    dialogRef.afterClosed().subscribe(confirm => {
      if (confirm) {
        this.accesosSvc.deleteNodo(nodo.codigo_tecnico).subscribe({
          next: () => {
            this.snackBar.open('Nodo desactivado', 'Cerrar', { duration: 3000 });
            this.reloadAll();
          }
        });
      }
    });
  }
}
