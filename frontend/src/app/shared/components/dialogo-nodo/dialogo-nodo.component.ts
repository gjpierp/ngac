import { Component, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { INodo } from '../../../core/models/ngac-admin.models';
import { AccesosService } from '../../../core/services/accesos.service';

@Component({
  selector: 'app-dialogo-nodo',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
  ],
  templateUrl: './dialogo-nodo.component.html',
})
export class DialogoNodoComponent implements OnInit {
  form: FormGroup;
  tipos = signal<any[]>([]);
  private autoSyncFromEtiqueta = true;

  constructor(
    private fb: FormBuilder,
    private accesosSvc: AccesosService,
    private dialogRef: MatDialogRef<DialogoNodoComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { nodo?: INodo; fixedType?: string; allowedTypes?: string[] },
  ) {
    this.form = this.fb.group({
      codigo_tecnico: ['', [Validators.required, Validators.pattern(/^[A-Z0-9_]+$/)]],
      etiqueta: ['', Validators.required],
      tipo: [this.data.fixedType || 'OBJETO', Validators.required],
      icono: [''],
      ruta: [''],
      slug: [''],
      orden: [0],
      activo: ['S', Validators.required],
      descripcion: [''],
    });

    if (this.data.fixedType) {
      this.form.get('tipo')?.disable();
    }

    // Solo sincronizar automáticamente al crear un nodo nuevo
    if (!this.data.nodo) {
      this.form.get('etiqueta')?.valueChanges.subscribe((val) => {
        if (val && this.autoSyncFromEtiqueta) {
          const normalizedCode = this.normalizeCodigoTecnico(val);
          const normalizedPath = this.normalizePath(val);
          const normalizedSlug = this.normalizeSlug(val);
          this.form.patchValue(
            {
              codigo_tecnico: normalizedCode,
              ruta: normalizedPath,
              slug: normalizedSlug,
            },
            { emitEvent: false },
          );
        }
      });
    }

    this.form.get('codigo_tecnico')?.valueChanges.subscribe((value) => {
      const normalized = this.normalizeCodigoTecnico(value || '');
      if (value !== normalized) {
        this.form.get('codigo_tecnico')?.setValue(normalized, { emitEvent: false });
      }
      this.updateAutoSyncState();
    });

    this.form.get('ruta')?.valueChanges.subscribe((value) => {
      const normalized = this.normalizePath(value || '');
      if (value !== normalized) {
        this.form.get('ruta')?.setValue(normalized, { emitEvent: false });
      }
      this.updateAutoSyncState();
    });

    this.form.get('slug')?.valueChanges.subscribe((value) => {
      const normalized = this.normalizeSlug(value || '');
      if (value !== normalized) {
        this.form.get('slug')?.setValue(normalized, { emitEvent: false });
      }
      this.updateAutoSyncState();
    });
  }

  private removeAccents(text: string): string {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  private normalizeCodigoTecnico(text: string): string {
    return this.removeAccents(text || '')
      .toUpperCase()
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^A-Z0-9_]/g, '')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  private normalizeSlug(text: string): string {
    return this.removeAccents(text || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s/-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/\/+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private normalizePath(text: string): string {
    const slug = this.normalizeSlug(text || '');
    return slug ? `/${slug}` : '';
  }

  private updateAutoSyncState(): void {
    const etiqueta = String(this.form.get('etiqueta')?.value || '');
    if (!etiqueta) {
      this.autoSyncFromEtiqueta = true;
      return;
    }

    this.autoSyncFromEtiqueta =
      this.form.get('codigo_tecnico')?.value === this.normalizeCodigoTecnico(etiqueta) &&
      this.form.get('ruta')?.value === this.normalizePath(etiqueta) &&
      this.form.get('slug')?.value === this.normalizeSlug(etiqueta);
  }

  ngOnInit() {
    this.loadTipos();
    if (this.data.nodo) {
      this.form.patchValue({
        codigo_tecnico: this.data.nodo.codigo_tecnico,
        etiqueta: this.data.nodo.etiqueta,
        tipo: this.data.nodo.tipo_nodo || 'OBJETO',
        icono: this.data.nodo.icono,
        ruta: this.data.nodo.url_ruta,
        slug: this.data.nodo.slug,
        orden: this.data.nodo.orden_visual,
        activo: this.data.nodo.activo === 'S' ? 'S' : 'N',
        descripcion: this.data.nodo.descripcion || '',
      });
      if (this.data.fixedType) this.form.get('tipo')?.disable();
    }

    this.updateAutoSyncState();
  }

  loadTipos() {
    this.accesosSvc.getTiposNodo().subscribe((data) => {
      let filtered = data;
      if (this.data.allowedTypes) {
        filtered = data.filter((t: any) => this.data.allowedTypes!.includes(t.codigo));
      }
      this.tipos.set(filtered);
    });
  }

  onSave() {
    if (this.form.valid) {
      const raw = this.form.getRawValue();
      const codigo_tecnico = this.normalizeCodigoTecnico(raw.codigo_tecnico || '');
      const ruta = this.normalizePath(raw.ruta || '');
      const slug = this.normalizeSlug(raw.slug || '');

      this.dialogRef.close({
        ...raw,
        id_nodo: this.data.nodo?.id_nodo,
        codigo_tecnico,
        tipo_nodo: raw.tipo,
        ruta,
        url_ruta: ruta,
        slug,
        orden_visual: raw.orden,
      });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
