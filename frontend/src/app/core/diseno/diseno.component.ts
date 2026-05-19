import { Component, signal, computed, inject } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd, RouterOutlet, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BarraLateralComponent } from '../../shared/components/barra-lateral/barra-lateral.component';
import { ContextStateService } from '../services/context-state.service';
import { AccesosService } from '../services/accesos.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-diseno',
  standalone: true,
  imports: [RouterOutlet, RouterLink, MatIconModule, CommonModule, BarraLateralComponent, FormsModule],
  templateUrl: './diseno.component.html',
})
export class DisenoComponent {
  collapsed = signal(false);

  breadcrumbs: Array<{ label: string; url: string }> = [];

  contextStateSvc = inject(ContextStateService);
  accesosSvc = inject(AccesosService);

  contexts = [
    { label: 'Portal Corporativo', policy: 'POLICY_MENU', appId: 'SAFI_APP' },
    { label: 'Portal Hospital', policy: 'POLICY_HOSP', appId: 'HOSP_APP' },
    { label: 'Portal Finanzas', policy: 'POLICY_FIN', appId: 'FIN_APP' },
  ];

  selectedContextIndex = 0;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.breadcrumbs = this.buildBreadcrumbs(this.route.root);
    });
    // Inicializar
    this.breadcrumbs = this.buildBreadcrumbs(this.route.root);

    // Sincronizar el dropdown con el estado inicial
    const active = this.contextStateSvc.getContext();
    const idx = this.contexts.findIndex(c => c.policy === active.politicaActiva && c.appId === active.appIdActiva);
    if (idx !== -1) {
      this.selectedContextIndex = idx;
    }
  }

  onContextChange(index: any) {
    const numericIndex = Number(index);
    this.selectedContextIndex = numericIndex;
    const ctx = this.contexts[numericIndex];
    
    // Actualizar estado del contexto
    this.contextStateSvc.setContext(ctx.policy, ctx.appId);
    
    // Recargar menú
    this.accesosSvc.recargarMenu();
  }

  private buildBreadcrumbs(
    route: ActivatedRoute,
    url: string = '',
    breadcrumbs: Array<{ label: string; url: string }> = [],
  ): Array<{ label: string; url: string }> {
    const children = route.children;
    if (children.length === 0) {
      return breadcrumbs;
    }
    for (const child of children) {
      // Validación para evitar error si snapshot o url es undefined
      const routeURL = child?.snapshot?.url
        ? child.snapshot.url.map((segment) => segment.path).join('/')
        : '';
      if (routeURL !== '') {
        url += `/${routeURL}`;
        const label = child.snapshot.data['breadcrumb'] || this.formatLabel(routeURL);
        breadcrumbs.push({ label, url });
      }
      return this.buildBreadcrumbs(child, url, breadcrumbs);
    }
    return breadcrumbs;
  }

  private formatLabel(str: string): string {
    // Convierte 'tipos-nodo' en 'Tipos de Nodo', etc.
    return str.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }
}
