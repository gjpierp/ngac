import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dialogo-tipo-nodo',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule
  ],
  templateUrl: './dialogo-tipo-nodo.component.html'
})
export class DialogoTipoNodoComponent implements OnInit {
  form: FormGroup;
  isEdit = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DialogoTipoNodoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { tipo?: any }
  ) {
    this.form = this.fb.group({
      codigo: ['', [Validators.required, Validators.pattern(/^[A-Z0-9_]+$/)]],
      descripcion: ['']
    });

    this.form.get('codigo')?.valueChanges.subscribe(value => {
      if (!value) return;
      const normalized = this.normalizeCode(value);
      if (value !== normalized) {
        this.form.get('codigo')?.setValue(normalized, { emitEvent: false });
      }
    });
  }

  ngOnInit() {
    if (this.data.tipo) {
      this.isEdit = true;
      this.form.patchValue(this.data.tipo);
      this.form.get('codigo')?.disable();
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

  private normalizeCode(value: string): string {
    return value
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_')
      .replace(/[^A-Z0-9_]/g, '');
  }
}
