import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dialogo-operacion',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule
  ],
  templateUrl: './dialogo-operacion.component.html'
})
export class DialogoOperacionComponent implements OnInit {
  form: FormGroup;
  isEdit = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DialogoOperacionComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { op?: any }
  ) {
    this.form = this.fb.group({
      nombre_op: ['', [Validators.required, Validators.pattern(/^[A-Z0-9_]+$/)]],
      descripcion: ['', Validators.required]
    });
  }

  ngOnInit() {
    if (this.data.op) {
      this.isEdit = true;
      this.form.patchValue(this.data.op);
      this.form.get('nombre_op')?.disable();
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
}
