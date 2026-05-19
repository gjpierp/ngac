import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AccesosService } from '../../core/services/accesos.service';
import { SafiService } from '../../core/services/safi.service';
import { INodo } from '../../core/models/ngac-admin.models';

@Component({
  selector: 'app-hub-politica',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    FormsModule,
  ],
  templateUrl: './hub-politica.component.html',
})
export class HubPoliticaComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private accesosSvc = inject(AccesosService);
  private safiSvc = inject(SafiService);
  private snackBar = inject(MatSnackBar);

  politica = signal<INodo | null>(null);
  loading = signal(false);

  // Datos globales
  allNodes = signal<INodo[]>([]);
  allUsers = signal<any[]>([]);
  enlaces = signal<any[]>([]);

  // Búsquedas
  nodeSearchQuery = signal('');
  userSearchQuery = signal('');

  // Conjuntos de códigos vinculados
  linkedNodes = signal<Set<string>>(new Set());
  linkedUsers = signal<Set<string>>(new Set());

  ngOnInit() {
    const polId = this.route.snapshot.paramMap.get('id');
    if (polId) {
      this.loadAllData(polId);
    }
  }

  loadAllData(polId: string) {
    this.loading.set(true);

    forkJoin({
      politicas: this.accesosSvc.getPoliticasRaiz(),
      nodos: this.accesosSvc.getNodos(),
      enlaces: this.accesosSvc.getEnlaces(),
      usuarios: this.safiSvc.getUsuarios()
    }).subscribe({
      next: (res) => {
        // 1. Identificar la política
        const polCode = polId.trim().toUpperCase();
        const found = (res.politicas || []).find((p: any) => 
          (p.codigo_tecnico || p.codigo || '').toUpperCase() === polCode
        );

        if (found) {
          const normalized: any = {};
          Object.keys(found).forEach((key) => (normalized[key.toLowerCase()] = (found as any)[key]));
          normalized.codigo_tecnico = normalized.codigo_tecnico || normalized.codigo || found.codigo_tecnico;
          this.politica.set(normalized as INodo);
        } else {
          this.snackBar.open('No se encontró la política solicitada', 'Cerrar', { duration: 4000 });
          this.goBack();
          return;
        }

        // 2. Guardar datos generales
        // Mapear nodos para que tengan estructura homogénea
        const mappedNodos = (res.nodos || []).map((n: any) => {
          const obj: any = {};
          Object.keys(n).forEach((key) => (obj[key.toLowerCase()] = (n as any)[key]));
          obj.codigo_tecnico = obj.codigo_tecnico || obj.codigo || n.codigo_tecnico;
          return obj as INodo;
        });
        
        // Filtrar para no mostrar políticas en la lista de nodos asociables
        this.allNodes.set(mappedNodos.filter(n => n.tipo_nodo !== 'POLICY'));
        this.allUsers.set(res.usuarios || []);
        this.enlaces.set(res.enlaces || []);

        // 3. Procesar enlaces actuales de la política
        const nodesSet = new Set<string>();
        const usersSet = new Set<string>();

        const polKey = (this.politica()?.codigo_tecnico || '').trim().toUpperCase();
        
        res.enlaces.forEach((e: any) => {
          if ((e.padre || '').trim().toUpperCase() === polKey) {
            const childCode = (e.hijo || '').trim().toUpperCase();
            
            // Determinar si es un usuario
            const isUser = (res.usuarios || []).some((u: any) => {
              const uCode = this.getUserNodeCodeInternal(u, mappedNodos).toUpperCase();
              return uCode === childCode;
            });

            if (isUser) {
              usersSet.add(childCode);
            } else {
              nodesSet.add(childCode);
            }
          }
        });

        this.linkedNodes.set(nodesSet);
        this.linkedUsers.set(usersSet);
        this.loading.set(false);
      },
      error: (err) => {
        this.snackBar.open('Error al cargar datos del Hub: ' + err.message, 'Cerrar', { duration: 4000 });
        this.loading.set(false);
      }
    });
  }

  // Helper interno de mapeo a códigos de nodo de usuario
  private getUserNodeCodeInternal(user: any, nodesList: INodo[]): string {
    const email = (user.email || '').trim().toUpperCase();
    const slugName = this.normalizeText(user.nombre).toUpperCase();
    const idStr = String(user.id);
    
    const found = nodesList.find(n => {
      const c = (n.codigo_tecnico || '').trim().toUpperCase();
      const e = (n.etiqueta || '').trim().toUpperCase();
      return c === email || c === slugName || e === user.nombre.trim().toUpperCase() || c.includes(idStr);
    });
    
    return found ? found.codigo_tecnico : (user.email || user.nombre);
  }

  // Helper público de mapeo a códigos de nodo de usuario
  getUserNodeCode(user: any): string {
    return this.getUserNodeCodeInternal(user, this.allNodes());
  }

  // --- CÓMPUTOS PARA LISTAS ASIGNADAS Y NO ASIGNADAS ---


  isResourceType(type: string | undefined): boolean {
    if (!type) return false;
    const t = type.trim().toUpperCase();
    return t === 'OBJ_ATTR' || t === 'OA' || t === 'CARPETA' || t === 'MODULO';
  }

  // MÓDULOS / OBJETOS (Jerarquía y filtrado)
  modulesTree = computed(() => {
    const nodes = this.allNodes();
    const links = this.enlaces();
    const linked = this.linkedNodes(); // Set of uppercase codes linked to policy
    
    // 1. Mapear nodos planos (recursos únicamente)
    const nodeMap = new Map<string, any>();
    nodes.forEach(n => {
      const code = (n.codigo_tecnico || '').trim().toUpperCase();
      if (code && this.isResourceType(n.tipo_nodo)) {
        nodeMap.set(code, { 
          ...n, 
          children: [], 
          isLinked: linked.has(code),
          isInherited: false,
          isActive: false
        });
      }
    });
    
    // 2. Construir jerarquía
    const childCodes = new Set<string>();
    links.forEach(e => {
      const pCode = (e.padre || '').trim().toUpperCase();
      const hCode = (e.hijo || '').trim().toUpperCase();
      const p = nodeMap.get(pCode);
      const h = nodeMap.get(hCode);
      if (p && h) {
        p.children.push(h);
        childCodes.add(hCode);
      }
    });
    
    // 3. Ordenar y calcular herencia
    const sortAndInherit = (node: any, parentActive: boolean) => {
      const active = node.isLinked || parentActive;
      node.isInherited = parentActive;
      node.isActive = active;
      
      if (node.children && node.children.length > 0) {
        node.children.sort((a: any, b: any) => (a.orden_visual || 0) - (b.orden_visual || 0));
        node.children.forEach((child: any) => sortAndInherit(child, active));
      }
    };
    
    // 4. Obtener raíces de recursos
    const roots = Array.from(nodeMap.values())
      .filter(n => {
        const code = (n.codigo_tecnico || '').trim().toUpperCase();
        return !childCodes.has(code);
      })
      .sort((a, b) => (a.orden_visual || 0) - (b.orden_visual || 0));
      
    roots.forEach(root => sortAndInherit(root, false));
    return roots;
  });

  filteredModulesTree = computed(() => {
    const term = this.nodeSearchQuery().trim().toUpperCase();
    const tree = this.modulesTree();
    if (!term) return tree;

    const filterNode = (nodes: any[]): any[] => {
      return nodes
        .map((n: any) => ({ ...n }))
        .filter((n: any) => {
          const matches = (n.etiqueta || '').toUpperCase().includes(term) || 
                          (n.codigo_tecnico || '').toUpperCase().includes(term);
          if (n.children) {
            n.children = filterNode(n.children);
          }
          return matches || (n.children && n.children.length > 0);
        });
    };

    return filterNode(tree);
  });

  // USUARIOS
  assignedUsersFiltered = computed(() => {
    const query = this.userSearchQuery().toLowerCase().trim();
    const list = this.allUsers().filter(u => {
      const code = this.getUserNodeCode(u).toUpperCase();
      return this.linkedUsers().has(code);
    });
    if (!query) return list;
    return list.filter(u => 
      (u.nombre || '').toLowerCase().includes(query) ||
      (u.email || '').toLowerCase().includes(query)
    );
  });

  unassignedUsersFiltered = computed(() => {
    const query = this.userSearchQuery().toLowerCase().trim();
    const list = this.allUsers().filter(u => {
      const code = this.getUserNodeCode(u).toUpperCase();
      return !this.linkedUsers().has(code);
    });
    if (!query) return list;
    return list.filter(u => 
      (u.nombre || '').toLowerCase().includes(query) ||
      (u.email || '').toLowerCase().includes(query)
    );
  });


  // Métodos de Vinculación / Desvinculación de Nodos (Módulos/Objetos)
  toggleNodeAssociation(nodeCodigo: string) {
    if (!this.politica()) return;

    const polCode = this.politica()!.codigo_tecnico;
    const isLinked = this.linkedNodes().has(nodeCodigo.toUpperCase());

    this.loading.set(true);

    const action$ = isLinked 
      ? this.accesosSvc.deleteEnlace(polCode, nodeCodigo)
      : this.accesosSvc.enlazarNodos(polCode, nodeCodigo);

    action$.subscribe({
      next: () => {
        const text = isLinked ? 'Módulo/Objeto desvinculado de la política' : 'Módulo/Objeto vinculado a la política';
        this.snackBar.open(text, 'Cerrar', { duration: 2500 });
        this.loadAllData(polCode);
      },
      error: (err) => {
        const msg = err.error?.detail || err.error?.error || err.message || 'Error desconocido';
        this.snackBar.open(`Error en vinculación: ${msg}`, 'Cerrar', { duration: 4000 });
        this.loading.set(false);
      }
    });
  }

  // Métodos de Vinculación / Desvinculación de Usuarios
  toggleUserAssociation(user: any) {
    if (!this.politica()) return;

    const polCode = this.politica()!.codigo_tecnico;
    const userCode = this.getUserNodeCode(user);
    const isLinked = this.linkedUsers().has(userCode.toUpperCase());

    this.loading.set(true);

    const action$ = isLinked 
      ? this.accesosSvc.deleteEnlace(polCode, userCode)
      : this.accesosSvc.enlazarNodos(polCode, userCode);

    action$.subscribe({
      next: () => {
        const text = isLinked ? 'Usuario desvinculado de la política' : 'Usuario vinculado a la política';
        this.snackBar.open(text, 'Cerrar', { duration: 2500 });
        this.loadAllData(polCode);
      },
      error: (err) => {
        const msg = err.error?.detail || err.error?.error || err.message || 'Error desconocido';
        this.snackBar.open(`Error en vinculación: ${msg}`, 'Cerrar', { duration: 4000 });
        this.loading.set(false);
      }
    });
  }

  normalizeText(text: string): string {
    return text
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Eliminar tildes
      .replace(/\s+/g, '_')           // Espacios por guiones bajos
      .replace(/[^A-Z0-9_]/g, '');    // Solo letras, números y guiones bajos
  }

  goBack() {
    this.router.navigate(['/politicas']);
  }
}
