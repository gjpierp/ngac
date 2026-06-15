import { Component, OnInit, inject, ChangeDetectorRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AccesosService } from '../../core/services/accesos.service';
import { ContextStateService } from '../../core/services/context-state.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-generador-contexto',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  template: `
    <div class="flex flex-col h-full bg-slate-50 overflow-hidden">
      <!-- Header Estilizado -->
      <div
        class="bg-white px-8 py-4 border-b border-slate-200 flex items-center justify-between shrink-0 shadow-sm z-10"
      >
        <div class="flex items-center gap-4">
          <div
            class="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg"
          >
            <mat-icon class="!text-xl">hub</mat-icon>
          </div>
          <div>
            <h1 class="text-lg font-black text-slate-900 tracking-tight uppercase">
              Generador de Contexto
            </h1>
            <p class="text-slate-400 text-[9px] font-bold uppercase tracking-widest leading-none">
              Configuración de Atributos de Seguridad
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button
            mat-button
            (click)="cancelar()"
            class="!h-10 !px-6 !text-slate-400 font-bold uppercase text-[10px] tracking-widest"
          >
            Descartar
          </button>
          <button
            mat-raised-button
            (click)="onSave()"
            [disabled]="loading"
            class="!h-10 !bg-indigo-600 !text-white !px-8 !rounded-xl shadow-lg shadow-indigo-100 font-black uppercase text-[11px] tracking-tight transition-all hover:scale-105"
          >
            <div class="flex items-center gap-2">
              <mat-icon class="!text-sm">security</mat-icon>
              <span>{{ loading ? 'Generando...' : 'Aplicar y Obtener Menú' }}</span>
            </div>
          </button>
        </div>
      </div>

      <!-- Estado de Carga -->
      <div
        *ngIf="loading"
        class="flex-1 flex flex-col items-center justify-center gap-6 opacity-60"
      >
        <div
          class="w-16 h-16 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"
        ></div>
        <p class="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
          Sincronizando Atributos...
        </p>
      </div>

      <!-- Grid de Tarjetas (Solo visible si no está cargando) -->
      <div *ngIf="!loading" class="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div class="max-w-[1400px] mx-auto grid grid-cols-12 gap-6 pb-20">
          <!-- Fila 1: Identidad y División -->
          <div
            class="col-span-12 lg:col-span-6 bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm"
          >
            <div class="flex items-center gap-3 mb-4 border-b border-slate-50 pb-3">
              <mat-icon class="text-slate-300 !text-lg">fingerprint</mat-icon>
              <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Identidad del Usuario
              </h3>
            </div>
            <mat-form-field appearance="outline" class="w-full custom-field-gen">
              <input
                matInput
                [formControl]="getControl('usuario_id')"
                placeholder="Ingrese ID de Usuario"
                class="font-bold uppercase text-slate-800"
              />
            </mat-form-field>
          </div>

          <div
            class="col-span-12 lg:col-span-6 bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm"
          >
            <div class="flex items-center gap-3 mb-4 border-b border-slate-50 pb-3">
              <mat-icon class="text-slate-300 !text-lg">account_tree</mat-icon>
              <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                División Organizacional
              </h3>
            </div>
            <mat-form-field appearance="outline" class="w-full custom-field-gen">
              <input
                matInput
                [formControl]="getControl('division')"
                placeholder="Ingrese División"
                class="font-bold text-slate-800"
              />
            </mat-form-field>
          </div>

          <!-- Fila 2: Roles (Vista Dual) -->
          <div
            class="col-span-12 bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm space-y-6"
          >
            <div class="flex items-center justify-between border-b border-slate-50 pb-4">
              <div class="flex items-center gap-3">
                <mat-icon class="text-indigo-500 !text-xl">verified_user</mat-icon>
                <h2 class="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">
                  Asignación de Roles
                </h2>
              </div>
              <div class="flex items-center gap-2">
                <button
                  mat-icon-button
                  (click)="prevPage('roles')"
                  [disabled]="pageRoles === 0"
                  class="scale-75"
                >
                  <mat-icon>chevron_left</mat-icon>
                </button>
                <span class="text-[10px] font-black text-slate-400"
                  >{{ pageRoles + 1 }} / {{ getTotalPages('roles') }}</span
                >
                <button
                  mat-icon-button
                  (click)="nextPage('roles')"
                  [disabled]="pageRoles >= getTotalPages('roles') - 1"
                  class="scale-75"
                >
                  <mat-icon>chevron_right</mat-icon>
                </button>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-8 h-[200px]">
              <!-- Columna Izquierda: No Asignados -->
              <div class="flex flex-col gap-3 overflow-hidden">
                <div class="flex items-center justify-between mb-1">
                  <h4 class="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-slate-200"></span> Catálogo Disponible
                  </h4>
                  <input type="text" [ngModel]="filtroRoles()" (ngModelChange)="filtroRoles.set($event)" placeholder="Filtrar..." class="text-[9px] px-2 py-0.5 rounded border border-slate-200 w-24 outline-none focus:border-indigo-400">
                </div>
                <div
                  class="flex-1 overflow-y-auto custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-2 pr-2"
                >
                  <div
                    *ngFor="let rol of getPagedRoles()"
                    (click)="toggleSelection('roles', rol.codigo || rol.nombre)"
                    class="bg-slate-50 border-slate-100 min-h-[64px] py-2.5 px-3 rounded-xl border transition-all cursor-pointer hover:border-indigo-400 group flex items-center justify-between gap-3"
                  >
                    <div class="min-w-0 flex-1 flex flex-col">
                      <span class="text-[9px] font-black text-slate-600 uppercase truncate">{{
                        rol.etiqueta || rol.nombre
                      }}</span>
                      <span
                        class="text-[8px] font-bold text-slate-400 uppercase tracking-wide truncate"
                        >{{ rol.codigo || rol.codigo_tecnico || rol.nombre }}</span
                      >
                    </div>
                    <mat-icon
                      class="!text-[10px] !w-3 !h-3 !leading-none text-slate-300 group-hover:text-indigo-500"
                      >add_circle</mat-icon
                    >
                  </div>
                  <div
                    *ngIf="getPagedRoles().length === 0"
                    class="col-span-full py-20 text-center text-[9px] font-bold uppercase tracking-widest text-slate-300"
                  >
                    No hay roles disponibles
                  </div>
                </div>
              </div>

              <!-- Columna Derecha: Asignados -->
              <div class="flex flex-col gap-3 overflow-hidden border-l border-slate-100 pl-8">
                <h4
                  class="text-[9px] font-bold text-indigo-500 uppercase tracking-widest mb-1 flex items-center gap-2"
                >
                  <span class="w-2 h-2 rounded-full bg-indigo-500"></span> Roles en Contexto ({{
                    getSelectedCount('roles')
                  }})
                </h4>
                <div class="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 pr-2">
                  <div
                    *ngFor="let rol of getSelectedRoles()"
                    (click)="toggleSelection('roles', rol.codigo || rol.nombre)"
                    class="bg-indigo-600 text-white min-h-[64px] py-2.5 px-3 rounded-xl border border-indigo-700 shadow-sm flex items-center justify-between gap-3 cursor-pointer hover:bg-rose-500 hover:border-rose-600 transition-all group"
                  >
                    <div class="min-w-0 flex-1 flex flex-col">
                      <span class="text-[9px] font-black uppercase tracking-tight truncate">{{
                        rol.etiqueta || rol.nombre
                      }}</span>
                      <span
                        class="text-[8px] font-bold text-indigo-200 uppercase tracking-wide truncate"
                        >{{ rol.codigo || rol.codigo_tecnico || rol.nombre }}</span
                      >
                    </div>
                    <mat-icon
                      class="!text-[10px] !w-3 !h-3 !leading-none text-indigo-200 group-hover:text-white"
                      >verified</mat-icon
                    >
                  </div>
                  <div
                    *ngIf="getSelectedCount('roles') === 0"
                    class="h-full flex items-center justify-center opacity-20 italic text-[10px] text-slate-400 uppercase font-black tracking-widest"
                  >
                    Seleccione roles del catálogo
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Fila 3: Políticas y Módulos (Dual) -->
          <!-- Fila 3: Políticas (Unificado) -->
          <div
            class="col-span-12 bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm space-y-6"
          >
            <div class="flex items-center justify-between border-b border-slate-50 pb-4">
              <div class="flex items-center gap-3">
                <mat-icon class="text-amber-500 !text-xl">policy</mat-icon>
                <h2 class="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">
                  Políticas de Acceso (ABAC)
                </h2>
              </div>
              <div class="flex items-center gap-2">
                <button
                  mat-icon-button
                  (click)="prevPage('politicas')"
                  [disabled]="pagePoliticas === 0"
                  class="scale-75"
                >
                  <mat-icon>chevron_left</mat-icon>
                </button>
                <span class="text-[10px] font-black text-slate-400"
                  >{{ pagePoliticas + 1 }} / {{ getTotalPages('politicas') }}</span
                >
                <button
                  mat-icon-button
                  (click)="nextPage('politicas')"
                  [disabled]="pagePoliticas >= getTotalPages('politicas') - 1"
                  class="scale-75"
                >
                  <mat-icon>chevron_right</mat-icon>
                </button>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-8 h-[300px]">
              <div class="flex flex-col gap-3 overflow-hidden">
                <div class="flex items-center justify-between mb-1">
                  <h4 class="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    Catálogo de Políticas
                  </h4>
                  <input type="text" [ngModel]="filtroPoliticas()" (ngModelChange)="filtroPoliticas.set($event)" placeholder="Filtrar..." class="text-[9px] px-2 py-0.5 rounded border border-slate-200 w-24 outline-none focus:border-amber-400">
                </div>
                <div class="flex-1 overflow-y-auto custom-scrollbar grid grid-cols-2 gap-3 pr-2">
                  <div
                    *ngFor="let pol of getPagedPoliticas()"
                    (click)="toggleSelection('politicas', pol['codigo_tecnico'])"
                    class="bg-slate-50 border-slate-100 min-h-[72px] p-4 rounded-2xl border transition-all cursor-pointer hover:border-amber-400 group flex items-center gap-3"
                  >
                    <div
                      class="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-300 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-sm"
                    >
                      <mat-icon class="!text-sm">security_update_good</mat-icon>
                    </div>
                    <div class="min-w-0 flex-1 flex flex-col">
                      <span class="text-[9px] font-black text-slate-600 uppercase truncate">{{
                        pol['etiqueta'] || pol['codigo_tecnico']
                      }}</span>
                      <span
                        class="text-[8px] font-bold text-slate-400 uppercase tracking-wide truncate"
                        >{{ pol['codigo_tecnico'] }}</span
                      >
                    </div>
                  </div>
                </div>
              </div>
              <div class="flex flex-col gap-3 overflow-hidden border-l border-slate-100 pl-8">
                <h4 class="text-[9px] font-bold text-amber-600 uppercase tracking-widest mb-1">
                  Políticas Asignadas ({{ getSelectedCount('politicas') }})
                </h4>
                <div class="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 pr-2">
                  <div
                    *ngFor="let pol of getSelectedPoliticas()"
                    (click)="toggleSelection('politicas', pol['codigo_tecnico'])"
                    class="bg-amber-500 text-white min-h-[64px] p-3 rounded-xl border border-amber-600 shadow-md flex items-center justify-between gap-3 cursor-pointer hover:bg-rose-500 transition-all group"
                  >
                    <div class="min-w-0 flex-1 flex flex-col">
                      <span class="text-[9px] font-black uppercase truncate">{{
                        pol['etiqueta'] || pol['codigo_tecnico']
                      }}</span>
                      <span
                        class="text-[8px] font-bold text-amber-100 uppercase tracking-wide truncate"
                        >{{ pol['codigo_tecnico'] }}</span
                      >
                    </div>
                    <mat-icon class="!text-xs opacity-40 group-hover:opacity-100">close</mat-icon>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Fila 4: Módulos (Unificado) -->
          <div
            class="col-span-12 bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm space-y-6"
          >
            <div class="flex items-center justify-between border-b border-slate-50 pb-4">
              <div class="flex items-center gap-3">
                <mat-icon class="text-emerald-500 !text-xl">extension</mat-icon>
                <h2 class="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">
                  Módulos Raíz del Sistema
                </h2>
              </div>
              <div class="flex items-center gap-2">
                <button
                  mat-icon-button
                  (click)="prevPage('modulos')"
                  [disabled]="pageModulos === 0"
                  class="scale-75"
                >
                  <mat-icon>chevron_left</mat-icon>
                </button>
                <span class="text-[10px] font-black text-slate-400"
                  >{{ pageModulos + 1 }} / {{ getTotalPages('modulos') }}</span
                >
                <button
                  mat-icon-button
                  (click)="nextPage('modulos')"
                  [disabled]="pageModulos >= getTotalPages('modulos') - 1"
                  class="scale-75"
                >
                  <mat-icon>chevron_right</mat-icon>
                </button>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-8 h-[300px]">
              <div class="flex flex-col gap-3 overflow-hidden">
                <div class="flex items-center justify-between mb-1">
                  <h4 class="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    Inventario de Módulos
                  </h4>
                  <input type="text" [ngModel]="filtroModulos()" (ngModelChange)="filtroModulos.set($event)" placeholder="Filtrar..." class="text-[9px] px-2 py-0.5 rounded border border-slate-200 w-24 outline-none focus:border-emerald-400">
                </div>
                <div class="flex-1 overflow-y-auto custom-scrollbar grid grid-cols-2 gap-3 pr-2">
                  <div
                    *ngFor="let mod of getPagedModulos()"
                    (click)="toggleSelection('modulos', mod['codigo_tecnico'])"
                    class="bg-slate-50 border-slate-100 min-h-[72px] p-4 rounded-2xl border transition-all cursor-pointer hover:border-emerald-400 group flex items-center gap-3"
                  >
                    <div
                      class="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-300 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm"
                    >
                      <mat-icon class="!text-sm">apps</mat-icon>
                    </div>
                    <div class="min-w-0 flex-1 flex flex-col">
                      <span class="text-[9px] font-black text-slate-600 uppercase truncate">{{
                        mod['etiqueta'] || mod['codigo_tecnico']
                      }}</span>
                      <span
                        class="text-[8px] font-bold text-slate-400 uppercase tracking-wide truncate"
                        >{{ mod['codigo_tecnico'] }}</span
                      >
                    </div>
                  </div>
                </div>
              </div>
              <div class="flex flex-col gap-3 overflow-hidden border-l border-slate-100 pl-8">
                <h4 class="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mb-1">
                  Módulos en Alcance ({{ getSelectedCount('modulos') }})
                </h4>
                <div class="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 pr-2">
                  <div
                    *ngFor="let mod of getSelectedModulos()"
                    (click)="toggleSelection('modulos', mod['codigo_tecnico'])"
                    class="bg-emerald-600 text-white min-h-[64px] p-3 rounded-xl border border-emerald-700 shadow-md flex items-center justify-between gap-3 cursor-pointer hover:bg-rose-500 transition-all group"
                  >
                    <div class="min-w-0 flex-1 flex flex-col">
                      <span class="text-[9px] font-black uppercase truncate">{{
                        mod['etiqueta'] || mod['codigo_tecnico']
                      }}</span>
                      <span
                        class="text-[8px] font-bold text-emerald-100 uppercase tracking-wide truncate"
                        >{{ mod['codigo_tecnico'] }}</span
                      >
                    </div>
                    <mat-icon class="!text-xs opacity-40 group-hover:opacity-100">close</mat-icon>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Fila 5: Operaciones y Claims -->
          <div
            class="col-span-12 bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm space-y-6"
          >
            <div class="flex items-center justify-between border-b border-slate-50 pb-4">
              <div class="flex items-center gap-3">
                <mat-icon class="text-indigo-500 !text-xl">settings_input_component</mat-icon>
                <h2 class="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">
                  Operaciones y Permisos
                </h2>
              </div>
              <div class="flex items-center gap-2">
                <button
                  mat-icon-button
                  (click)="prevPage('operaciones')"
                  [disabled]="pageOperaciones === 0"
                  class="scale-75"
                >
                  <mat-icon>chevron_left</mat-icon>
                </button>
                <span class="text-[10px] font-black text-slate-400"
                  >{{ pageOperaciones + 1 }} / {{ getTotalPages('operaciones') }}</span
                >
                <button
                  mat-icon-button
                  (click)="nextPage('operaciones')"
                  [disabled]="pageOperaciones >= getTotalPages('operaciones') - 1"
                  class="scale-75"
                >
                  <mat-icon>chevron_right</mat-icon>
                </button>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-8 h-[300px]">
              <div class="flex flex-col gap-3 overflow-hidden">
                <div class="flex items-center justify-between mb-1">
                  <h4 class="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    Catálogo de Acciones
                  </h4>
                  <input type="text" [ngModel]="filtroOperaciones()" (ngModelChange)="filtroOperaciones.set($event)" placeholder="Filtrar..." class="text-[9px] px-2 py-0.5 rounded border border-slate-200 w-24 outline-none focus:border-indigo-400">
                </div>
                <div class="flex-1 overflow-y-auto custom-scrollbar grid grid-cols-2 gap-3 pr-2">
                  <div
                    *ngFor="let op of getPagedOperaciones()"
                    (click)="toggleSelection('operaciones', op['nombre_op'])"
                    class="bg-slate-50 border-slate-100 min-h-[72px] p-4 rounded-2xl border transition-all cursor-pointer hover:border-indigo-400 group flex items-center gap-3"
                  >
                    <div
                      class="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-300 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-sm"
                    >
                      <mat-icon class="!text-sm">bolt</mat-icon>
                    </div>
                    <div class="min-w-0 flex-1 flex flex-col justify-center">
                      <span class="text-[9px] font-black text-slate-600 uppercase truncate">{{
                        op['nombre_op']
                      }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="flex flex-col gap-3 overflow-hidden border-l border-slate-100 pl-8">
                <h4 class="text-[9px] font-bold text-indigo-600 uppercase tracking-widest mb-1">
                  Operaciones Solicitadas ({{ getSelectedCount('operaciones') }})
                </h4>
                <div class="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 pr-2">
                  <div
                    *ngFor="let op of getSelectedOperaciones()"
                    (click)="toggleSelection('operaciones', op['nombre_op'])"
                    class="bg-indigo-600 text-white min-h-[64px] p-3 rounded-xl border border-indigo-700 shadow-md flex items-center justify-between gap-3 cursor-pointer hover:bg-rose-500 transition-all group"
                  >
                    <div class="min-w-0 flex-1 flex flex-col justify-center">
                      <span class="text-[9px] font-black uppercase truncate">{{
                        op['nombre_op']
                      }}</span>
                    </div>
                    <mat-icon class="!text-xs opacity-40 group-hover:opacity-100">close</mat-icon>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Atributos Card -->
          <div class="col-span-12 bg-slate-900 rounded-[40px] p-8 shadow-2xl text-white space-y-6">
            <div class="flex items-center gap-3 border-b border-white/10 pb-4">
              <mat-icon class="text-indigo-400">vpn_key</mat-icon>
              <h2 class="text-sm font-black uppercase tracking-widest">
                Inyección de Atributos Adicionales (ABAC)
              </h2>
            </div>
            <mat-form-field appearance="outline" class="w-full custom-field-gen-dark">
              <textarea
                matInput
                [formControl]="getControl('atributos')"
                rows="3"
                placeholder="Ej: auditor_nacional, departamento_ti, vip_user"
                class="text-[11px] font-bold"
              ></textarea>
            </mat-form-field>
          </div>
        </div>
      </div>
    </div>

    <style>
      .custom-scrollbar::-webkit-scrollbar {
        width: 5px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #e2e8f0;
        border-radius: 10px;
      }
      ::ng-deep .custom-field-gen .mat-mdc-text-field-wrapper {
        background-color: #f8fafc !important;
        border-radius: 16px !important;
        border: 1px solid #f1f5f9 !important;
        height: 50px !important;
      }
      ::ng-deep .custom-field-gen-dark .mat-mdc-text-field-wrapper {
        background-color: rgba(255, 255, 255, 0.05) !important;
        border-radius: 20px !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        color: white !important;
      }
      ::ng-deep .custom-field-gen-dark textarea {
        color: #818cf8 !important;
      }
    </style>
  `,
})
export class GeneradorContextoComponent implements OnInit {
  private contextStateSvc = inject(ContextStateService);
  private accesosSvc = inject(AccesosService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  loading = true;
  pageSize = 12;

  roles: any[] = [];
  politicas: any[] = [];
  modulos: any[] = [];
  operaciones: any[] = [];
  allModulos: any[] = [];

  pageRoles = 0;
  pagePoliticas = 0;
  pageModulos = 0;
  pageOperaciones = 0;

  filtroRoles = signal('');
  filtroPoliticas = signal('');
  filtroModulos = signal('');
  filtroOperaciones = signal('');

  // Inicialización directa
  form = new FormGroup({
    usuario_id: new FormControl('ADMIN'),
    division: new FormControl('CENTRAL'),
    roles: new FormControl<string[]>([]),
    politicas: new FormControl<string[]>([]),
    modulos: new FormControl<string[]>([]),
    operaciones: new FormControl<string[]>([]),
    atributos: new FormControl(''),
  });

  private normalizeSelection(
    values: string[] | null | undefined,
    allowedValues: string[],
  ): string[] {
    if (!Array.isArray(values) || values.length === 0) {
      return [];
    }

    const allowed = new Set(
      allowedValues
        .filter((value) => value !== undefined && value !== null && String(value).trim() !== '')
        .map((value) => String(value).trim().toUpperCase()),
    );

    const seen = new Set<string>();
    const normalized: string[] = [];

    values.forEach((value) => {
      const raw = String(value || '').trim();
      const key = raw.toUpperCase();
      if (!raw || !allowed.has(key) || seen.has(key)) {
        return;
      }
      seen.add(key);
      normalized.push(raw);
    });

    return normalized;
  }

  ngOnInit() {
    this.loading = true;
    console.log('🚀 [GeneradorContexto] Sincronizando catálogos de contexto...');

    forkJoin({
      politicas: this.accesosSvc.getPoliticasRaiz(),
      modulos: this.accesosSvc.getModulosRaiz(),
      roles: this.accesosSvc.getRoles(),
      operaciones: this.accesosSvc.getOperaciones(),
    }).subscribe({
      next: (res) => {
        this.politicas = res.politicas || [];
        this.allModulos = res.modulos || [];
        this.modulos = [...this.allModulos];
        this.roles = res.roles || [];
        this.operaciones = res.operaciones || [];

        console.log(
          `📊 [GeneradorContexto] Mapeo: ${this.politicas.length} Políticas, ${this.modulos.length} Módulos`,
        );

        const initial = this.accesosSvc.getContextoSimulacion();
        if (initial) {
          const normalizedRoles = this.normalizeSelection(
            initial.sujeto?.roles || [],
            this.roles.map((role) => role.codigo || role.nombre),
          );
          const normalizedPoliticas = this.normalizeSelection(
            initial.contexto?.politicas || [],
            this.politicas.map((policy) => policy.codigo_tecnico),
          );
          const normalizedModulos = this.normalizeSelection(
            initial.solicitud?.modulos || [],
            this.modulos.map((module) => module.codigo_tecnico),
          );
          const normalizedOperaciones = this.normalizeSelection(
            initial.solicitud?.operaciones || [],
            this.operaciones.map((operation) => operation.nombre_op),
          );

          this.form.patchValue({
            usuario_id: initial.sujeto?.usuario_id || '',
            division: initial.sujeto?.division || '',
            roles: normalizedRoles,
            politicas: normalizedPoliticas,
            modulos: [],
            operaciones: normalizedOperaciones,
            atributos: (initial.atributos || initial.claims || []).join(', '),
          });

          this.applyPolicyScopedModules(normalizedPoliticas, normalizedModulos);
        } else {
          this.applyPolicyScopedModules([], []);
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ [GeneradorContexto] Error en sincronización:', err);
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private applyPolicyScopedModules(policyCodes: string[], preferredModules?: string[]) {
    const normalizedPolicies = Array.from(
      new Set(
        (policyCodes || [])
          .map((code) =>
            String(code || '')
              .trim()
              .toUpperCase(),
          )
          .filter((code) => !!code),
      ),
    );

    const currentSelection = preferredModules || this.form.get('modulos')?.value || [];

    if (normalizedPolicies.length === 0) {
      this.modulos = [...this.allModulos];
      const normalizedModulos = this.normalizeSelection(
        currentSelection,
        this.modulos.map((module) => module.codigo_tecnico),
      );
      this.form.patchValue({ modulos: normalizedModulos }, { emitEvent: false });
      this.pageModulos = 0;
      this.cdr.detectChanges();
      return;
    }

    this.accesosSvc.getModulosPorPoliticas(normalizedPolicies).subscribe({
      next: (allowedCodes) => {
        const allowed = new Set(
          (allowedCodes || []).map((code) =>
            String(code || '')
              .trim()
              .toUpperCase(),
          ),
        );
        this.modulos = this.allModulos.filter((module) =>
          allowed.has(
            String(module.codigo_tecnico || '')
              .trim()
              .toUpperCase(),
          ),
        );

        const normalizedModulos = this.normalizeSelection(
          currentSelection,
          this.modulos.map((module) => module.codigo_tecnico),
        );

        this.form.patchValue({ modulos: normalizedModulos }, { emitEvent: false });
        this.pageModulos = 0;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ [GeneradorContexto] Error filtrando módulos por políticas:', err);
      },
    });
  }

  // Helper para el template
  getControl(name: string): FormControl {
    return this.form.get(name) as FormControl;
  }

  getPagedRoles() {
    const q = this.filtroRoles().toLowerCase();
    const available = this.roles.filter((r) => !this.isSelected('roles', r.codigo || r.nombre))
                                 .filter(r => (r.etiqueta || r.nombre || r.codigo || '').toLowerCase().includes(q));
    return available.slice(this.pageRoles * this.pageSize, (this.pageRoles + 1) * this.pageSize);
  }

  getPagedPoliticas() {
    const q = this.filtroPoliticas().toLowerCase();
    const available = this.politicas.filter(
      (p) => !this.isSelected('politicas', p['codigo_tecnico']),
    ).filter(p => (p['etiqueta'] || p['codigo_tecnico'] || '').toLowerCase().includes(q));
    return available.slice(this.pagePoliticas * 10, (this.pagePoliticas + 1) * 10);
  }

  getPagedModulos() {
    const q = this.filtroModulos().toLowerCase();
    const available = this.modulos.filter((m) => !this.isSelected('modulos', m['codigo_tecnico']))
                                  .filter(m => (m['etiqueta'] || m['codigo_tecnico'] || '').toLowerCase().includes(q));
    return available.slice(this.pageModulos * 10, (this.pageModulos + 1) * 10);
  }

  getAvailablePoliticas() {
    const selected = this.form.get('politicas')?.value || [];
    return this.politicas.filter((p) => !selected.includes(p['codigo_tecnico']));
  }

  getSelectedPoliticas() {
    const selected = this.form.get('politicas')?.value || [];
    return this.politicas.filter((p) => selected.includes(p['codigo_tecnico']));
  }

  getAvailableModulos() {
    const selected = this.form.get('modulos')?.value || [];
    return this.modulos.filter((m) => !selected.includes(m['codigo_tecnico']));
  }

  getSelectedModulos() {
    const selected = this.form.get('modulos')?.value || [];
    return this.modulos.filter((m) => selected.includes(m['codigo_tecnico']));
  }

  getPagedOperaciones() {
    const q = this.filtroOperaciones().toLowerCase();
    const available = this.operaciones.filter(
      (o) => !this.isSelected('operaciones', o['nombre_op']),
    ).filter(o => (o['nombre_op'] || '').toLowerCase().includes(q));
    return available.slice(
      this.pageOperaciones * this.pageSize,
      (this.pageOperaciones + 1) * this.pageSize,
    );
  }

  getAvailableOperaciones() {
    const selected = this.form.get('operaciones')?.value || [];
    return this.operaciones.filter((o) => !selected.includes(o['nombre_op']));
  }

  getSelectedOperaciones() {
    const selected = this.form.get('operaciones')?.value || [];
    return this.operaciones.filter((o) => selected.includes(o['nombre_op']));
  }

  getTotalPages(type: string): number {
    let length = 0;
    let size = this.pageSize;
    if (type === 'roles') {
      const q = this.filtroRoles().toLowerCase();
      length = this.roles.filter((r) => !this.isSelected('roles', r.codigo || r.nombre))
                         .filter(r => (r.etiqueta || r.nombre || r.codigo || '').toLowerCase().includes(q)).length;
    } else if (type === 'politicas') {
      size = 10;
      const q = this.filtroPoliticas().toLowerCase();
      length = this.politicas.filter((p) => !this.isSelected('politicas', p['codigo_tecnico']))
                             .filter(p => (p['etiqueta'] || p['codigo_tecnico'] || '').toLowerCase().includes(q)).length;
    } else if (type === 'modulos') {
      size = 10;
      const q = this.filtroModulos().toLowerCase();
      length = this.modulos.filter((m) => !this.isSelected('modulos', m['codigo_tecnico']))
                           .filter(m => (m['etiqueta'] || m['codigo_tecnico'] || '').toLowerCase().includes(q)).length;
    } else if (type === 'operaciones') {
      const q = this.filtroOperaciones().toLowerCase();
      length = this.operaciones.filter((o) => !this.isSelected('operaciones', o['nombre_op']))
                               .filter(o => (o['nombre_op'] || '').toLowerCase().includes(q)).length;
    }
    return Math.max(1, Math.ceil(length / size));
  }

  nextPage(type: string) {
    if (type === 'roles') this.pageRoles++;
    if (type === 'politicas') this.pagePoliticas++;
    if (type === 'modulos') this.pageModulos++;
    if (type === 'operaciones') this.pageOperaciones++;
  }

  prevPage(type: string) {
    if (type === 'roles' && this.pageRoles > 0) this.pageRoles--;
    if (type === 'politicas' && this.pagePoliticas > 0) this.pagePoliticas--;
    if (type === 'modulos' && this.pageModulos > 0) this.pageModulos--;
    if (type === 'operaciones' && this.pageOperaciones > 0) this.pageOperaciones--;
  }

  getSelectedRoles(): any[] {
    const selected = this.form.get('roles')?.value || [];
    return this.roles.filter((r) => selected.includes(r['codigo'] || r['nombre']));
  }

  isSelected(field: string, value: string): boolean {
    const current = this.form.get(field)?.value as string[];
    return current?.includes(value);
  }

  toggleSelection(field: string, value: string) {
    let current = [...(this.form.get(field)?.value as string[])];
    if (current.includes(value)) {
      current = current.filter((v) => v !== value);
    } else {
      current.push(value);
    }
    this.form.get(field)?.setValue(current);

    if (field === 'politicas') {
      this.applyPolicyScopedModules(current);
    }
  }

  getSelectedCount(field: string): number {
    return (this.form.get(field)?.value as string[]).length;
  }

  toggleAll(field: string, checked: boolean) {
    let values: string[] = [];
    if (checked) {
      if (field === 'roles') values = this.roles.map((r) => r.codigo || r.nombre);
      if (field === 'politicas') values = this.politicas.map((p) => p.codigo_tecnico);
      if (field === 'modulos') values = this.modulos.map((m) => m.codigo_tecnico);
      if (field === 'operaciones') values = this.operaciones.map((o) => o.nombre_op);
    }
    this.form.get(field)?.setValue(values);

    if (field === 'politicas') {
      this.applyPolicyScopedModules(values);
    }
  }

  cancelar() {
    this.router.navigate(['/tablero']);
  }

  onSave() {
    const raw = this.form.value;
    const normalizedRoles = this.normalizeSelection(
      raw.roles,
      this.roles.map((role) => role.codigo || role.nombre),
    );
    const normalizedPoliticas = this.normalizeSelection(
      raw.politicas,
      this.politicas.map((policy) => policy.codigo_tecnico),
    );
    const normalizedModulos = this.normalizeSelection(
      raw.modulos,
      this.modulos.map((module) => module.codigo_tecnico),
    );
    const normalizedOperaciones = this.normalizeSelection(
      raw.operaciones,
      this.operaciones.map((operation) => operation.nombre_op),
    );

    const formatted = {
      sujeto: {
        usuario_id: raw.usuario_id,
        roles: normalizedRoles,
        division: raw.division,
      },
      contexto: {
        politicas: normalizedPoliticas,
      },
      solicitud: {
        modulos: normalizedModulos,
        operaciones: normalizedOperaciones,
      },
      atributos: (raw.atributos || '')
        .split(',')
        .map((s) => s.trim())
        .filter((s) => !!s),
    };

    this.form.patchValue(
      {
        roles: normalizedRoles,
        politicas: normalizedPoliticas,
        modulos: normalizedModulos,
        operaciones: normalizedOperaciones,
      },
      { emitEvent: false },
    );

    console.info('[GeneradorContexto] Payload normalizado', formatted);

    // Actualizar ContextStateService con el primer elemento de la selección
    const activePol = normalizedPoliticas.length > 0 ? normalizedPoliticas[0] : 'POLICY_MENU';
    const activeApp = normalizedModulos.length > 0 ? normalizedModulos[0] : 'SAFI_APP';
    this.contextStateSvc.setContext(
      activePol,
      activeApp,
      raw.usuario_id || 'ADMIN',
      normalizedRoles.length > 0 ? normalizedRoles : ['ROL_DEV'],
    );

    this.accesosSvc.setContextoSimulacion(formatted);
    this.accesosSvc.recargarMenu();
    this.router.navigate(['/tablero']);
  }
}
