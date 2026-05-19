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
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatButtonModule, MatFormFieldModule, MatInputModule, 
    MatSelectModule, MatIconModule
  ],
  templateUrl: './dialogo-nodo.component.html'
})
export class DialogoNodoComponent implements OnInit {
  form: FormGroup;
  tipos = signal<any[]>([]);

  constructor(
    private fb: FormBuilder,
    private accesosSvc: AccesosService,
    private dialogRef: MatDialogRef<DialogoNodoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { nodo?: INodo, fixedType?: string, allowedTypes?: string[] }
  ) {
    this.form = this.fb.group({
      codigo:   ['', [Validators.required, Validators.pattern(/^[A-Z0-9_]+$/)]],
      etiqueta: ['', Validators.required],
      tipo:     [this.data.fixedType || 'OBJETO', Validators.required],
      icono:    [''],
      ruta:     [''],
      slug:     [''],
      orden:    [0],
      activo:   ['S', Validators.required],
      descripcion: ['']
    });

    if (this.data.fixedType) {
      this.form.get('tipo')?.disable();
    }
    
    this.form.get('etiqueta')?.valueChanges.subscribe(val => {
      if (val && !this.data.nodo) {
        const normalized = this.normalizeText(val);
        this.form.get('codigo')?.setValue(normalized, { emitEvent: false });
      }
    });
  }

  private normalizeText(text: string): string {
    return text
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Eliminar tildes
      .replace(/\s+/g, '_')           // Espacios por guiones bajos
      .replace(/[^A-Z0-9_]/g, '');    // Solo letras, números y guiones bajos
  }

  ngOnInit() {
    this.loadTipos();
    if (this.data.nodo) {
      this.form.get('codigo')?.disable();
      this.form.patchValue({
        codigo:   this.data.nodo.codigo_tecnico,
        etiqueta: this.data.nodo.etiqueta,
        tipo:     this.data.nodo.tipo_nodo || 'OBJETO',
        icono:    this.data.nodo.icono,
        ruta:     this.data.nodo.url_ruta,
        slug:     this.data.nodo.slug,
        orden:    this.data.nodo.orden_visual,
        activo:   this.data.nodo.activo === 'S' ? 'S' : 'N',
        descripcion: this.data.nodo.descripcion || ''
      });
      if (this.data.fixedType) this.form.get('tipo')?.disable();
    }
  }

  loadTipos() {
    this.accesosSvc.getTiposNodo().subscribe(data => {
      let filtered = data;
      if (this.data.allowedTypes) {
        filtered = data.filter((t: any) => this.data.allowedTypes!.includes(t.codigo));
      }
      this.tipos.set(filtered);
    });
  }

  onSave() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.getRawValue());
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
