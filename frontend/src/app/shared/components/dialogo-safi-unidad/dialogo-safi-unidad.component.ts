import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { ISafiUnidad } from '../../../core/models/ngac-admin.models';

@Component({
  selector: 'app-dialogo-safi-unidad',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule
  ],
  templateUrl: './dialogo-safi-unidad.component.html'
})
export class DialogoSafiUnidadComponent implements OnInit {
  form: FormGroup;
  isEdit = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DialogoSafiUnidadComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { unidad?: ISafiUnidad }
  ) {
    this.form = this.fb.group({
      slug_unidad: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_\-]+$/)]],
      nombre_unidad: ['', [Validators.required]],
      descripcion: ['', [Validators.required]]
    });

    // Auto-completar el slug si no está en modo de edición
    this.form.get('nombre_unidad')?.valueChanges.subscribe(val => {
      if (val && !this.isEdit) {
        const normalized = this.normalizeText(val);
        this.form.get('slug_unidad')?.setValue(normalized, { emitEvent: false });
      }
    });
  }

  ngOnInit() {
    if (this.data.unidad) {
      this.isEdit = true;
      this.form.patchValue({
        slug_unidad: this.data.unidad.slug,
        nombre_unidad: this.data.unidad.nombre,
        descripcion: this.data.unidad.desc || ''
      });
      // En edición, no permitimos modificar el slug de la unidad
      this.form.get('slug_unidad')?.disable();
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
