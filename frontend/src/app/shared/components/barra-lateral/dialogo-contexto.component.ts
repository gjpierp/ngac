import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AccesosService } from '../../../core/services/accesos.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dialogo-contexto',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatTooltipModule
  ],
  template: `
    <div class="flex flex-col h-[85vh] max-h-[750px] w-[850px] overflow-hidden bg-slate-50 rounded-[24px] shadow-2xl border border-white/40">
      
      <!-- Cabecera Compacta -->
      <div class="bg-white px-6 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white flex items-center justify-center shadow-lg shadow-indigo-100">
            <mat-icon class="!text-[20px]">security</mat-icon>
          </div>
          <div>
            <h2 class="text-sm font-black text-slate-900 tracking-tight leading-none">Simulación NGAC</h2>
            <p class="text-slate-400 text-[8px] font-bold uppercase tracking-[0.15em] mt-1">Panel de Auditoría Dinámica</p>
          </div>
        </div>
        <button mat-icon-button (click)="onCancel()" class="text-slate-300 hover:text-slate-600 scale-75">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
        <form [formGroup]="form" class="space-y-6">
          
          <!-- Identidad Compacta -->
          <div class="bg-white rounded-[20px] border border-slate-100 p-4 shadow-sm">
            <div class="grid grid-cols-2 gap-4">
              <mat-form-field appearance="outline" class="custom-field-mini">
                <mat-label class="!text-[10px]">Usuario ID</mat-label>
                <input matInput formControlName="usuario_id" class="!text-[11px] font-bold">
                <mat-icon matPrefix class="text-slate-300 !text-sm mr-1">fingerprint</mat-icon>
              </mat-form-field>
              <mat-form-field appearance="outline" class="custom-field-mini">
                <mat-label class="!text-[10px]">División</mat-label>
                <input matInput formControlName="division" class="!text-[11px] font-bold">
                <mat-icon matPrefix class="text-slate-300 !text-sm mr-1">account_tree</mat-icon>
              </mat-form-field>
            </div>
          </div>

          <!-- SECCIÓN: ROLES (Micro) -->
          <div class="space-y-3">
            <div class="flex items-center justify-between px-1">
              <h3 class="text-[9px] font-black text-indigo-500 uppercase tracking-[0.15em]">Sujeto: Roles Activos ({{ getSelectedCount('roles') }})</h3>
              <button mat-button (click)="toggleAll('roles', false)" class="!h-6 !text-[8px] !font-bold !text-rose-500 !uppercase">Limpiar</button>
            </div>
            <div class="flex flex-wrap gap-1.5 p-3 bg-indigo-50/20 rounded-[18px] border-2 border-dashed border-indigo-100 min-h-[40px]">
              <div *ngFor="let rol of getSelectedRoles()" 
                   (click)="toggleSelection('roles', rol.codigo || rol.nombre)"
                   class="bg-white border-indigo-400 shadow-sm px-2 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 hover:bg-rose-50 hover:border-rose-300 group">
                <mat-icon class="!text-[10px] text-indigo-600 group-hover:hidden">verified</mat-icon>
                <mat-icon class="!text-[10px] text-rose-500 hidden group-hover:block">remove_circle</mat-icon>
                <span class="text-[9px] font-black text-slate-800 uppercase tracking-tight">{{ rol.etiqueta || rol.nombre }}</span>
              </div>
              <div *ngIf="getSelectedCount('roles') === 0" class="w-full text-center py-1 text-[8px] font-bold text-indigo-300 uppercase italic">Sin roles activos</div>
            </div>

            <!-- Catálogo de Roles Mini -->
            <div class="bg-white rounded-[20px] border border-slate-100 p-4 shadow-sm space-y-3">
              <div class="flex items-center justify-between">
                <h3 class="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">Catálogo: Roles</h3>
                <div class="flex items-center gap-1 scale-90">
                  <button mat-icon-button (click)="prevPage('roles')" [disabled]="pageRoles === 0"><mat-icon class="!text-xs">chevron_left</mat-icon></button>
                  <span class="text-[8px] font-black text-slate-400">{{ pageRoles + 1 }}/{{ getTotalPages('roles') }}</span>
                  <button mat-icon-button (click)="nextPage('roles')" [disabled]="pageRoles >= getTotalPages('roles') - 1"><mat-icon class="!text-xs">chevron_right</mat-icon></button>
                </div>
              </div>
              <div class="grid grid-cols-2 md:grid-cols-6 gap-2">
                <div *ngFor="let rol of getPagedRoles()" 
                     (click)="toggleSelection('roles', rol.codigo || rol.nombre)"
                     class="bg-slate-50/50 border-slate-100 hover:border-emerald-400 hover:bg-emerald-50/30 group p-2 rounded-lg border transition-all cursor-pointer flex flex-col items-center text-center gap-1">
                  <mat-icon class="!text-[12px] text-slate-300 group-hover:text-emerald-500">add_moderator</mat-icon>
                  <span class="text-[8px] font-bold text-slate-600 uppercase tracking-tight truncate w-full">{{ rol.etiqueta || rol.nombre }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- SECCIÓN: POLÍTICAS Y MÓDULOS COMPACTOS -->
          <div class="grid grid-cols-2 gap-4">
            <!-- Políticas -->
            <div class="bg-white rounded-[20px] border border-slate-100 p-4 shadow-sm space-y-3">
              <div class="flex items-center justify-between">
                <h3 class="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">Políticas</h3>
                <div class="flex items-center gap-1 scale-75">
                  <button mat-icon-button (click)="prevPage('politicas')" [disabled]="pagePoliticas === 0"><mat-icon class="!text-xs">chevron_left</mat-icon></button>
                  <button mat-icon-button (click)="nextPage('politicas')" [disabled]="pagePoliticas >= getTotalPages('politicas') - 1"><mat-icon class="!text-xs">chevron_right</mat-icon></button>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div *ngFor="let pol of getPagedPoliticas()" 
                     (click)="toggleSelection('politicas', pol.codigo)"
                     [ngClass]="isSelected('politicas', pol.codigo) ? 'bg-amber-500 text-white border-amber-600 shadow-md' : 'bg-slate-50 border-slate-100 text-slate-500'"
                     class="p-2 rounded-lg border transition-all cursor-pointer flex items-center gap-2 group">
                  <mat-icon class="!text-[10px]" [class.text-white]="isSelected('politicas', pol.codigo)">policy</mat-icon>
                  <span class="text-[8px] font-black uppercase tracking-tight truncate">{{ pol.etiqueta }}</span>
                </div>
              </div>
            </div>

            <!-- Módulos -->
            <div class="bg-white rounded-[20px] border border-slate-100 p-4 shadow-sm space-y-3">
              <div class="flex items-center justify-between">
                <h3 class="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">Módulos</h3>
                <div class="flex items-center gap-1 scale-75">
                  <button mat-icon-button (click)="prevPage('modulos')" [disabled]="pageModulos === 0"><mat-icon class="!text-xs">chevron_left</mat-icon></button>
                  <button mat-icon-button (click)="nextPage('modulos')" [disabled]="pageModulos >= getTotalPages('modulos') - 1"><mat-icon class="!text-xs">chevron_right</mat-icon></button>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div *ngFor="let mod of getPagedModulos()" 
                     (click)="toggleSelection('modulos', mod.codigo)"
                     [ngClass]="isSelected('modulos', mod.codigo) ? 'bg-emerald-600 text-white border-emerald-700 shadow-md' : 'bg-slate-50 border-slate-100 text-slate-500'"
                     class="p-2 rounded-lg border transition-all cursor-pointer flex items-center gap-2">
                  <mat-icon class="!text-[10px]" [class.text-white]="isSelected('modulos', mod.codigo)">apps</mat-icon>
                  <span class="text-[8px] font-black uppercase tracking-tight truncate">{{ mod.etiqueta }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Atributos y Operaciones Compactas -->
          <div class="grid grid-cols-3 gap-4">
            <div class="col-span-2 bg-white rounded-[20px] border border-slate-100 p-4 shadow-sm">
              <h3 class="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2">Atributos Especiales</h3>
              <mat-form-field appearance="outline" class="w-full custom-field-mini">
                <input matInput formControlName="atributos" class="!text-[10px]" placeholder="atributo1, atributo2...">
                <mat-icon matSuffix class="text-slate-300 !text-sm">vpn_key</mat-icon>
              </mat-form-field>
            </div>
            <div class="bg-slate-900 rounded-[20px] p-4 text-white">
              <h3 class="text-[8px] font-black text-indigo-400 uppercase tracking-[0.15em] mb-2">Ops</h3>
              <div class="flex flex-wrap gap-1 max-h-20 overflow-y-auto custom-scrollbar pr-1">
                <div *ngFor="let op of operaciones" 
                     (click)="toggleSelection('operaciones', op.nombre)"
                     [ngClass]="isSelected('operaciones', op.nombre) ? 'bg-blue-600 border-blue-400' : 'bg-white/5 border-white/5 text-slate-500'"
                     class="px-1.5 py-0.5 rounded border text-[7px] font-black uppercase cursor-pointer transition-all">
                  {{ op.nombre }}
                </div>
              </div>
            </div>
          </div>

        </form>
      </div>

      <!-- Footer Compacto -->
      <div class="bg-white px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
        <button mat-button (click)="onCancel()" class="!h-9 !text-[9px] !font-bold !uppercase !tracking-widest !text-slate-400">Cancelar</button>
        <button mat-raised-button 
                class="!h-10 !bg-slate-900 !text-white !px-8 !rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-200" 
                (click)="onSave()" 
                [disabled]="loading">
          {{ loading ? 'Sincronizando...' : 'Actualizar' }}
        </button>
      </div>
    </div>

    <style>
      .custom-scrollbar::-webkit-scrollbar { width: 4px; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      ::ng-deep .custom-field-mini .mat-mdc-text-field-wrapper { height: 38px !important; background-color: #f8fafc !important; border-radius: 12px !important; padding: 0 10px !important; }
      ::ng-deep .custom-field-mini .mat-mdc-form-field-flex { height: 38px !important; align-items: center !important; }
      ::ng-deep .custom-field-mini .mat-mdc-form-field-infix { padding-top: 6px !important; padding-bottom: 6px !important; min-height: 38px !important; }
      ::ng-deep .custom-field-mini .mat-mdc-form-field-label-wrapper { top: -14px !important; }
    </style>
  `
})
export class DialogoContextoComponent implements OnInit {
  private accesosSvc = inject(AccesosService);
  loading = true;
  pageSize = 12; // Aumentamos para la rejilla compacta

  // Catálogos completos
  roles: any[] = [];
  politicas: any[] = [];
  modulos: any[] = [];
  operaciones: any[] = [];

  // Paginadores
  pageRoles = 0;
  pagePoliticas = 0;
  pageModulos = 0;

  form = new FormGroup({
    usuario_id: new FormControl(''),
    division: new FormControl(''),
    roles: new FormControl([] as string[]),
    politicas: new FormControl([] as string[]),
    modulos: new FormControl([] as string[]),
    operaciones: new FormControl([] as string[]),
    atributos: new FormControl('')
  });

  constructor(
    public dialogRef: MatDialogRef<DialogoContextoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit() {
    forkJoin({
      roles: this.accesosSvc.getRoles(),
      politicas: this.accesosSvc.getPoliticasRaiz(),
      modulos: this.accesosSvc.getModulosRaiz(),
      operaciones: this.accesosSvc.getOperaciones()
    }).subscribe({
      next: (res) => {
        this.roles = res.roles;
        this.politicas = res.politicas;
        this.modulos = res.modulos;
        this.operaciones = res.operaciones;
        this.loading = false;
        
        if (this.data) {
          this.form.patchValue({
            usuario_id: this.data.sujeto?.usuario_id || '',
            division: this.data.sujeto?.division || '',
            roles: this.data.sujeto?.roles || [],
            politicas: this.data.contexto?.politicas || [],
            modulos: this.data.solicitud?.modulos || [],
            operaciones: this.data.solicitud?.operaciones || [],
            atributos: (this.data.atributos || this.data.claims || []).join(', ')
          });
        }
      },
      error: () => this.loading = false
    });
  }

  // Lógica de Paginación
  getPagedRoles() {
    const available = this.roles.filter(r => !this.isSelected('roles', r.codigo || r.nombre));
    return available.slice(this.pageRoles * this.pageSize, (this.pageRoles + 1) * this.pageSize);
  }

  getPagedPoliticas() {
    const size = 6; // Más compactas para políticas
    return this.politicas.slice(this.pagePoliticas * size, (this.pagePoliticas + 1) * size);
  }

  getPagedModulos() {
    const size = 6;
    return this.modulos.slice(this.pageModulos * size, (this.pageModulos + 1) * size);
  }

  getTotalPages(type: string): number {
    let length = 0;
    let size = this.pageSize;
    if (type === 'roles') length = this.roles.filter(r => !this.isSelected('roles', r.codigo || r.nombre)).length;
    if (type === 'politicas') { length = this.politicas.length; size = 6; }
    if (type === 'modulos') { length = this.modulos.length; size = 6; }
    return Math.ceil(length / size) || 1;
  }

  nextPage(type: string) {
    if (type === 'roles') this.pageRoles++;
    if (type === 'politicas') this.pagePoliticas++;
    if (type === 'modulos') this.pageModulos++;
  }

  prevPage(type: string) {
    if (type === 'roles' && this.pageRoles > 0) this.pageRoles--;
    if (type === 'politicas' && this.pagePoliticas > 0) this.pagePoliticas--;
    if (type === 'modulos' && this.pageModulos > 0) this.pageModulos--;
  }

  getSelectedRoles(): any[] {
    const selected = this.form.get('roles')?.value || [];
    return this.roles.filter(r => selected.includes(r.codigo || r.nombre));
  }

  isSelected(field: string, value: string): boolean {
    const current = this.form.get(field)?.value as string[];
    return current?.includes(value);
  }

  toggleSelection(field: string, value: string) {
    let current = [...(this.form.get(field)?.value as string[])];
    if (current.includes(value)) {
      current = current.filter(v => v !== value);
    } else {
      current.push(value);
    }
    this.form.get(field)?.setValue(current);
  }

  getSelectedCount(field: string): number {
    return (this.form.get(field)?.value as string[]).length;
  }

  toggleAll(field: string, checked: boolean) {
    let values: string[] = [];
    if (checked) {
      if (field === 'roles') values = this.roles.map(r => r.codigo || r.nombre);
      if (field === 'politicas') values = this.politicas.map(p => p.codigo);
      if (field === 'modulos') values = this.modulos.map(m => m.codigo);
      if (field === 'operaciones') values = this.operaciones.map(o => o.nombre);
    }
    this.form.get(field)?.setValue(values);
  }

  onCancel() {
    this.dialogRef.close();
  }

  onSave() {
    const raw = this.form.value;
    const formatted = {
      sujeto: {
        usuario_id: raw.usuario_id,
        roles: raw.roles,
        division: raw.division
      },
      contexto: {
        politicas: raw.politicas
      },
      solicitud: {
        modulos: raw.modulos,
        operaciones: raw.operaciones
      },
      atributos: (raw.atributos || '').split(',').map(s => s.trim()).filter(s => !!s)
    };
    this.dialogRef.close(formatted);
  }
}
