import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DialogoConfirmacionComponent } from '../../shared/components/dialogo-confirmacion/dialogo-confirmacion.component';
import { AccesosService } from '../../core/services/accesos.service';

@Component({
  selector: 'app-gestion-permisos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
  ],
  templateUrl: './gestion-permisos.component.html',
})
export class GestionPermisosComponent implements OnInit {
  permisos = signal<any[]>([]);
  total = signal(0);
  page = signal(1);
  pageSize = signal(5);
  loading = signal(false);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  editMode = signal(false);
  form: FormGroup;


  // Filtrar solo permisos (no asignaciones) al cargar
  private filtrarSoloPermisos(data: any[]): any[] {
    // Si el backend retorna algún tipo de asignación, aquí se filtran
    // Suponemos que los permisos tienen los campos: usr, obj, op
    return data.filter((p) => p.usr && p.obj && p.op);
  }

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private accesosSvc: AccesosService,
    private snackBar: MatSnackBar,
  ) {
    this.form = this.fb.group({
      rol: ['', Validators.required],
      nodo: ['', Validators.required],
      operacion: ['', Validators.required],
      condicion: [''],
    });
  }

  ngOnInit() {
    this.loadPermisos();
  }

  loadPermisos() {
    this.loading.set(true);
    this.accesosSvc.getPermisos(undefined, undefined, this.page(), this.pageSize()).subscribe({
      next: (res) => {
        const soloPermisos = this.filtrarSoloPermisos(res.data || []);
        this.permisos.set(soloPermisos);
        this.total.set(soloPermisos.length); // Solo cuenta los permisos
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.snackBar.open('Error cargando permisos: ' + err.message, 'Cerrar', { duration: 4000 });
      },
    });
  }

  onPageChange(event: any) {
    this.page.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
    this.loadPermisos();
  }

  editPermiso(permiso: any) {
    this.editMode.set(true);
    this.form.patchValue(permiso);
  }

  deletePermiso(permiso: any) {
    const dialogRef = this.dialog.open(DialogoConfirmacionComponent, {
      width: '450px',
      data: {
        title: 'Revocar permiso',
        message: `Confirma revocar el permiso para el rol "${permiso.rol}" sobre el nodo "${permiso.nodo}" y operación "${permiso.operacion}".`,
      },
    });
    dialogRef.afterClosed().subscribe((confirm) => {
      if (!confirm) return;
      this.accesosSvc.revocarPermiso(permiso.rol, permiso.nodo, permiso.operacion).subscribe({
        next: () => {
          this.snackBar.open('Permiso revocado', 'Cerrar', { duration: 3000 });
          this.loadPermisos();
          this.cancel();
        },
        error: (err) =>
          this.snackBar.open('Error: ' + (err.error?.detail || err.message), 'Cerrar', {
            duration: 5000,
          }),
      });
    });
  }

  save() {
    if (this.form.invalid) return;
    this.accesosSvc
      .otorgarPermiso(
        this.form.value.rol,
        this.form.value.nodo,
        this.form.value.operacion,
        this.form.value.condicion,
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Permiso guardado', 'Cerrar', { duration: 3000 });
          this.loadPermisos();
          this.cancel();
        },
        error: (err) =>
          this.snackBar.open('Error: ' + (err.error?.detail || err.message), 'Cerrar', {
            duration: 5000,
          }),
      });
  }

  cancel() {
    this.editMode.set(false);
    this.form.reset({ rol: '', nodo: '', operacion: '', condicion: '' });
  }
}
