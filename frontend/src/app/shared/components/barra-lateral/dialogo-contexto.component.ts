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
    MatTooltipModule,
  ],
  templateUrl: './dialogo-contexto.component.html',
  styleUrls: ['./dialogo-contexto.component.css'],
})
export class DialogoContextoComponent implements OnInit {
  private accesosSvc = inject(AccesosService);
  loading = true;
  pageSize = 12; // Aumentamos para la rejilla compacta

  // Catálogos completos
  roles: any[] = [];
  politicas: any[] = [];
  modulos: any[] = [];
  allModulos: any[] = [];
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
    atributos: new FormControl(''),
  });

  constructor(
    public dialogRef: MatDialogRef<DialogoContextoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

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
      },
      error: (err) => {
        console.error('Error filtrando modulos por politicas:', err);
      },
    });
  }

  ngOnInit() {
    forkJoin({
      roles: this.accesosSvc.getRoles(),
      politicas: this.accesosSvc.getPoliticasRaiz(),
      modulos: this.accesosSvc.getModulosRaiz(),
      operaciones: this.accesosSvc.getOperaciones(),
    }).subscribe({
      next: (res) => {
        this.roles = res.roles;
        this.politicas = res.politicas;
        this.allModulos = res.modulos;
        this.modulos = [...this.allModulos];
        this.operaciones = res.operaciones;
        this.loading = false;

        if (this.data) {
          const normalizedRoles = this.normalizeSelection(
            this.data.sujeto?.roles || [],
            this.roles.map((role) => role.codigo || role.nombre),
          );
          const normalizedPoliticas = this.normalizeSelection(
            this.data.contexto?.politicas || [],
            this.politicas.map((policy) => policy.codigo_tecnico),
          );
          const normalizedModulos = this.normalizeSelection(
            this.data.solicitud?.modulos || [],
            this.allModulos.map((module) => module.codigo_tecnico),
          );
          const normalizedOperaciones = this.normalizeSelection(
            this.data.solicitud?.operaciones || [],
            this.operaciones.map((operation) => operation.nombre_op),
          );

          this.form.patchValue({
            usuario_id: this.data.sujeto?.usuario_id || '',
            division: this.data.sujeto?.division || '',
            roles: normalizedRoles,
            politicas: normalizedPoliticas,
            modulos: [],
            operaciones: normalizedOperaciones,
            atributos: (this.data.atributos || this.data.claims || []).join(', '),
          });

          this.applyPolicyScopedModules(normalizedPoliticas, normalizedModulos);
        }
      },
      error: () => (this.loading = false),
    });
  }

  // Lógica de Paginación
  getPagedRoles() {
    const available = this.roles.filter((r) => !this.isSelected('roles', r.codigo || r.nombre));
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
    if (type === 'roles')
      length = this.roles.filter((r) => !this.isSelected('roles', r.codigo || r.nombre)).length;
    if (type === 'politicas') {
      length = this.politicas.length;
      size = 6;
    }
    if (type === 'modulos') {
      length = this.modulos.length;
      size = 6;
    }
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
    return this.roles.filter((r) => selected.includes(r.codigo || r.nombre));
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

  onCancel() {
    this.dialogRef.close();
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
    this.dialogRef.close(formatted);
  }
}
