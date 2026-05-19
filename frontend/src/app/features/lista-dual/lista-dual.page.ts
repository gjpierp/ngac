import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComponenteListaDual, DualListItem } from './componente-lista-dual.component';
import { AccesosService } from '../../core/services/accesos.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-pagina-lista-dual',
  standalone: true,
  imports: [CommonModule, ComponenteListaDual, MatSnackBarModule],
  template: `
    <div class="animate-in fade-in duration-1000 flex flex-col h-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <!-- CABECERA PRINCIPAL PREMIUM -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-slate-100 pb-6">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <h1 class="text-3xl font-black text-slate-800 tracking-tight">
              Asignación de <span class="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Roles a Usuarios</span>
            </h1>
          </div>
          <p class="text-slate-500 text-xs font-medium flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            Asigna y revoca roles del sistema de seguridad a usuarios a través de una lista interactiva dual
          </p>
        </div>
      </div>

      <div class="bg-white border border-slate-100 rounded-[32px] shadow-xl shadow-slate-100/50 overflow-hidden p-8">
        <app-componente-lista-dual
          [available]="available()"
          [selected]="selected()"
          titleLeft="Usuarios Disponibles"
          [titleRight]="'Usuarios Asignados'"
          (selectionChange)="onSelectionChange($event)"
        ></app-componente-lista-dual>
      </div>
    </div>
  `,
})
export class PaginaListaDual implements OnInit {
  available = signal<DualListItem[]>([]);
  selected = signal<DualListItem[]>([]);

  constructor(
    private accesosSvc: AccesosService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit() {
    // Simulación: cargar usuarios y asignaciones reales aquí
    this.available.set([
      { id: 'u1', label: 'Usuario 1' },
      { id: 'u2', label: 'Usuario 2' },
      { id: 'u3', label: 'Usuario 3' },
    ]);
    this.selected.set([
      { id: 'u4', label: 'Usuario 4' },
      { id: 'u5', label: 'Usuario 5' },
    ]);
  }

  onSelectionChange(event: { selected: DualListItem[] }) {
    // Aquí se debe llamar al backend para actualizar asignaciones
    this.snackBar.open('Asignaciones actualizadas', 'Cerrar', { duration: 1500 });
  }
}
