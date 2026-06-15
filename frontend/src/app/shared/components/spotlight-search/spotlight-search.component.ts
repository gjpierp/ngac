import { Component, HostListener, signal, computed, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { INodo } from '../../../core/models/ngac-admin.models';

@Component({
  selector: 'app-spotlight-search',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  template: `
    <div *ngIf="isOpen()" class="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] sm:pt-[15vh]">
      <!-- Backdrop -->
      <div 
        class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        (click)="close()"
      ></div>

      <!-- Modal -->
      <div 
        class="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 transition-all"
        (click)="$event.stopPropagation()"
      >
        <div class="flex items-center px-4 py-3 border-b border-slate-100">
          <mat-icon class="text-slate-400 mr-3">search</mat-icon>
          <input
            #searchInput
            type="text"
            class="flex-1 bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none sm:text-lg"
            placeholder="Busca por código, etiqueta, o política..."
            [ngModel]="query()"
            (ngModelChange)="setQuery($event)"
            (keydown)="handleKeydown($event)"
            autofocus
          >
          <div class="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span class="px-1.5 py-0.5 rounded-md border border-slate-200 shadow-sm">ESC</span> para cerrar
          </div>
        </div>

        <!-- Results -->
        <div class="max-h-96 overflow-y-auto p-2" *ngIf="filteredResults().length > 0">
          <div 
            *ngFor="let res of filteredResults(); let i = index"
            class="flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors"
            [class.bg-indigo-50]="i === selectedIndex()"
            [class.text-indigo-900]="i === selectedIndex()"
            (mouseenter)="selectedIndex.set(i)"
            (click)="executeAction(res)"
          >
            <div class="flex items-center gap-3">
              <div 
                class="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm"
                [ngClass]="getIconBg(res.tipo_nodo)"
              >
                <mat-icon class="text-[18px] w-[18px] h-[18px] text-white">{{ getIcon(res.tipo_nodo) }}</mat-icon>
              </div>
              <div>
                <p class="text-sm font-bold m-0" [class.text-indigo-900]="i === selectedIndex()">{{ res.etiqueta }}</p>
                <p class="text-[10px] uppercase font-bold text-slate-400 m-0 tracking-wider flex items-center gap-2">
                  <span>{{ res.tipo_nodo }}</span>
                  <span *ngIf="res.codigo_tecnico">&bull; {{ res.codigo_tecnico }}</span>
                </p>
              </div>
            </div>
            
            <div class="opacity-0 transition-opacity" [class.opacity-100]="i === selectedIndex()">
              <span class="text-xs font-semibold text-indigo-600 bg-indigo-100/50 px-2 py-1 rounded">Presiona ENTER</span>
            </div>
          </div>
        </div>

        <div *ngIf="query() && filteredResults().length === 0" class="p-12 text-center text-slate-500">
          <mat-icon class="text-4xl mb-3 opacity-20">search_off</mat-icon>
          <p class="text-sm">No se encontraron resultados para "{{ query() }}"</p>
        </div>

        <!-- Default State -->
        <div *ngIf="!query()" class="p-6">
          <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Sugerencias</p>
          <div class="flex gap-2">
            <button (click)="setQuery('POLICY')" class="text-xs px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 font-medium hover:bg-slate-200">Ver Políticas</button>
            <button (click)="setQuery('MODULO')" class="text-xs px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 font-medium hover:bg-slate-200">Ver Módulos</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SpotlightSearchComponent implements OnInit {
  @Input() nodes: INodo[] = [];
  @Output() nodeSelected = new EventEmitter<INodo>();
  
  isOpen = signal(false);
  query = signal('');
  selectedIndex = signal(0);

  filteredResults = computed(() => {
    const q = this.query().toLowerCase().trim();
    if (!q) return [];
    
    return this.nodes.filter(n => 
      n.etiqueta?.toLowerCase().includes(q) ||
      n.codigo_tecnico?.toLowerCase().includes(q) ||
      n.tipo_nodo?.toLowerCase().includes(q)
    ).slice(0, 10); // Limit to 10 results for performance
  });

  ngOnInit() {}

  @HostListener('window:keydown', ['$event'])
  handleGlobalShortcut(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.open();
    }
    
    if (this.isOpen() && event.key === 'Escape') {
      this.close();
    }
  }

  handleKeydown(event: KeyboardEvent) {
    const max = this.filteredResults().length - 1;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.selectedIndex.set(Math.min(this.selectedIndex() + 1, max));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.selectedIndex.set(Math.max(this.selectedIndex() - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const results = this.filteredResults();
      if (results[this.selectedIndex()]) {
        this.executeAction(results[this.selectedIndex()]);
      }
    }
  }

  open() {
    this.isOpen.set(true);
    this.query.set('');
    this.selectedIndex.set(0);
  }

  close() {
    this.isOpen.set(false);
  }

  setQuery(q: string) {
    this.query.set(q);
    this.selectedIndex.set(0);
  }

  executeAction(node: INodo) {
    this.nodeSelected.emit(node);
    this.close();
  }

  getIcon(tipo?: string): string {
    switch (tipo) {
      case 'POLICY': return 'policy';
      case 'PC': return 'category';
      case 'MODULO': return 'view_module';
      case 'PAGINA': return 'web';
      case 'SECCION': return 'view_agenda';
      default: return 'token';
    }
  }

  getIconBg(tipo?: string): string {
    switch (tipo) {
      case 'POLICY': return 'bg-purple-500';
      case 'PC': return 'bg-indigo-500';
      case 'MODULO': return 'bg-blue-500';
      case 'PAGINA': return 'bg-emerald-500';
      case 'SECCION': return 'bg-amber-500';
      default: return 'bg-slate-500';
    }
  }
}
