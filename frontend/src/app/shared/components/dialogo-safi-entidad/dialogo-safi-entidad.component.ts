import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { ISafiEntidad } from '../../../core/models/ngac-admin.models';

@Component({
  selector: 'app-dialogo-safi-entidad',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule
  ],
  templateUrl: './dialogo-safi-entidad.component.html'
})
export class DialogoSafiEntidadComponent implements OnInit {
  form: FormGroup;
  isEdit = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DialogoSafiEntidadComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { entidad?: ISafiEntidad }
  ) {
    this.form = this.fb.group({
      slug_entidad: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_\-]+$/)]],
      nombre_entidad: ['', [Validators.required]],
      tipo_entidad: ['ENTIDAD', [Validators.required]]
    });

    // Auto-completar el slug si no está en modo de edición
    this.form.get('nombre_entidad')?.valueChanges.subscribe(val => {
      if (val && !this.isEdit) {
        const normalized = this.normalizeText(val);
        this.form.get('slug_entidad')?.setValue(normalized, { emitEvent: false });
      }
    });
  }

  ngOnInit() {
    if (this.data.entidad) {
      this.isEdit = true;
      this.form.patchValue({
        slug_entidad: this.data.entidad.slug,
        nombre_entidad: this.data.entidad.nombre,
        tipo_entidad: this.data.entidad.desc || 'ENTIDAD'
      });
      // En edición, no permitimos modificar el slug de la entidad
      this.form.get('slug_entidad')?.disable();
    }
  }

  onSave() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.getRawValue());
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  private normalizeText(text: string): string {
    return text
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_')
      .replace(/[^A-Z0-9_\-]/g, '');
  }
}
