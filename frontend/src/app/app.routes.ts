import { Routes } from '@angular/router';
import { DisenoComponent } from './core/diseno/diseno.component';

export const routes: Routes = [
  {
    path: '',
    component: DisenoComponent,
    children: [
      { path: '', redirectTo: 'tablero', pathMatch: 'full' },
      {
        path: 'tablero',
        loadComponent: () =>
          import('./features/tablero/tablero.component').then((m) => m.TableroComponent),
      },
      {
        path: 'nodos',
        loadComponent: () =>
          import('./features/gestion-nodos/gestion-nodos.component').then(
            (m) => m.GestionNodosComponent,
          ),
      },
      {
        path: 'tipos-nodo',
        loadComponent: () =>
          import('./features/gestion-tipos-nodo/gestion-tipos-nodo.component').then(
            (m) => m.GestionTiposNodoComponent,
          ),
      },
      {
        path: 'politicas',
        loadComponent: () =>
          import('./features/gestion-politicas/gestion-politicas.component').then(
            (m) => m.GestionPoliticasComponent,
          ),
      },
      {
        path: 'politicas/hub/:id',
        loadComponent: () =>
          import('./features/gestion-politicas/hub-politica.component').then(
            (m) => m.HubPoliticaComponent,
          ),
      },
      {
        path: 'jerarquia',
        loadComponent: () =>
          import('./features/constructor-jerarquia/constructor-jerarquia.component').then(
            (m) => m.ConstructorJerarquiaComponent,
          ),
      },
      {
        path: 'permisos',
        loadComponent: () =>
          import('./features/gestion-permisos/gestion-permisos.component').then(
            (m) => m.GestionPermisosComponent,
          ),
      },
      {
        path: 'matriz-permisos',
        loadComponent: () =>
          import('./features/matriz-permisos/matriz-permisos.page').then(
            (m) => m.PaginaMatrizPermisos,
          ),
      },
      {
        path: 'comparador',
        loadComponent: () =>
          import('./features/comparador-permisos/comparador-permisos.page').then(
            (m) => m.PaginaComparadorPermisos,
          ),
      },
      {
        path: 'operaciones',
        loadComponent: () =>
          import('./features/gestion-operaciones/gestion-operaciones.component').then(
            (m) => m.GestionOperacionesComponent,
          ),
      },
      {
        path: 'roles',
        loadComponent: () =>
          import('./features/gestion-roles/gestion-roles.component').then(
            (m) => m.GestionRolesComponent,
          ),
      },
      {
        path: 'roles/hub/:id',
        loadComponent: () =>
          import('./features/gestion-roles/hub-rol.component').then((m) => m.HubRolComponent),
      },
      {
        path: 'asignar-roles',
        loadComponent: () =>
          import('./features/lista-dual/lista-dual.page').then((m) => m.PaginaListaDual),
      },
      {
        path: 'generador-contexto',
        loadComponent: () =>
          import('./features/generador-contexto/generador-contexto.component').then(
            (m) => m.GeneradorContextoComponent,
          ),
      },
      {
        path: 'safi',
        loadComponent: () =>
          import('./features/gestion-safi/gestion-safi.component').then(
            (m) => m.GestionSafiComponent,
          ),
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./features/gestion-safi/gestion-safi.component').then(
            (m) => m.GestionSafiComponent,
          ),
      },
      {
        path: 'entidades',
        loadComponent: () =>
          import('./features/gestion-entidades/gestion-entidades.component').then(
            (m) => m.GestionEntidadesComponent,
          ),
      },
      {
        path: 'unidades',
        loadComponent: () =>
          import('./features/gestion-unidades/gestion-unidades.component').then(
            (m) => m.GestionUnidadesComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
