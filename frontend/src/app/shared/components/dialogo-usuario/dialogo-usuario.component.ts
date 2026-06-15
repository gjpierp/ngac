import { AfterViewInit, Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { ISafiUsuario, ICrearSafiUsuarioDto } from '../../../core/models/ngac-admin.models';

import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function rutValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;

    const clean = value.replace(/[^0-9kK]/g, '').toUpperCase();
    if (clean.length < 2) return { invalidRut: true };

    const cuerpo = clean.slice(0, -1);
    const dv = clean.slice(-1);

    let suma = 0;
    let multiplo = 2;
    for (let i = cuerpo.length - 1; i >= 0; i--) {
      suma += multiplo * parseInt(cuerpo.charAt(i), 10);
      multiplo = multiplo < 7 ? multiplo + 1 : 2;
    }

    const dvEsperado = 11 - (suma % 11);
    let dvEsperadoStr = '';
    if (dvEsperado === 11) dvEsperadoStr = '0';
    else if (dvEsperado === 10) dvEsperadoStr = 'K';
    else dvEsperadoStr = String(dvEsperado);

    return dv === dvEsperadoStr ? null : { invalidRut: true };
  };
}

@Component({
  selector: 'app-dialogo-usuario',
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
  templateUrl: './dialogo-usuario.component.html',
})
export class DialogoUsuarioComponent implements OnInit, AfterViewInit {
  @ViewChild('rutInput') private rutInput?: ElementRef<HTMLInputElement>;

  form: FormGroup;
  isEdit = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DialogoUsuarioComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { usuario?: ISafiUsuario },
  ) {
    this.isEdit = !!this.data.usuario;

    this.form = this.fb.group({
      rut: ['', this.isEdit ? [] : [Validators.required, rutValidator()]],
      nombres: ['', Validators.required],
      apellidos: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      estado: [1, this.isEdit ? [Validators.required] : []],
    });

    this.form.get('rut')?.valueChanges.subscribe((val) => {
      if (val) {
        const formatted = this.formatRut(val);
        if (val !== formatted) {
          this.form.get('rut')?.setValue(formatted, { emitEvent: false });
        }
      }
    });
  }

  formatRut(value: string): string {
    const cleaned = value.replace(/[^0-9kK]/g, '').toUpperCase();
    if (cleaned.length <= 1) return cleaned;

    const cuerpo = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1);

    let formattedCuerpo = '';
    for (let i = cuerpo.length - 1, j = 0; i >= 0; i--, j++) {
      if (j > 0 && j % 3 === 0) {
        formattedCuerpo = '.' + formattedCuerpo;
      }
      formattedCuerpo = cuerpo[i] + formattedCuerpo;
    }

    return `${formattedCuerpo}-${dv}`;
  }

  ngOnInit() {
    if (this.isEdit && this.data.usuario) {
      const parts = (this.data.usuario.nombre || '').trim().split(' ');
      const nombres = parts[0] || '';
      const apellidos = parts.slice(1).join(' ') || '';

      this.form.patchValue({
        nombres: nombres,
        apellidos: apellidos,
        email: this.data.usuario.email,
        estado: this.data.usuario.estado !== undefined ? this.data.usuario.estado : 1,
      });
    }
  }

  ngAfterViewInit() {
    if (!this.isEdit) {
      queueMicrotask(() => this.rutInput?.nativeElement.focus());
    }
  }

  onRutBlur() {
    if (this.isEdit) {
      return;
    }

    const rutControl = this.form.get('rut');
    rutControl?.markAsTouched();

    if (rutControl?.invalid) {
      queueMicrotask(() => this.rutInput?.nativeElement.focus());
    }
  }

  onSave() {
    if (this.form.valid) {
      if (!this.isEdit) {
        // Separar rut_numero y rut_dv antes de enviar
        const rutRaw = this.form.get('rut')?.value || '';
        const clean = rutRaw.replace(/[^0-9kK]/g, '').toUpperCase();
        const rut_numero = clean.slice(0, -1);
        const rut_dv = clean.slice(-1);
        const dto: ICrearSafiUsuarioDto = {
          slug_usuario: rut_numero + rut_dv,
          rut_numero,
          rut_dv,
          nombres: this.form.get('nombres')?.value,
          apellidos: this.form.get('apellidos')?.value,
          email: this.form.get('email')?.value,
        };
        this.dialogRef.close(dto);
      } else {
        this.dialogRef.close(this.form.getRawValue());
      }
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
