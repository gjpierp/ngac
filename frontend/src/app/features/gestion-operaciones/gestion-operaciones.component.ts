import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import {
  TablaGenericaComponent,
  ColumnDef,
} from '../../shared/components/tabla-generica/tabla-generica.component';
import { AccesosService } from '../../core/services/accesos.service';
import { DialogoOperacionComponent } from '../../shared/components/dialogo-operacion/dialogo-operacion.component';
import { DialogoConfirmacionComponent } from '../../shared/components/dialogo-confirmacion/dialogo-confirmacion.component';
import { Operacion } from '../../core/models/ngac-admin.models';

@Component({
  selector: 'app-gestion-operaciones',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    TablaGenericaComponent,
  ],
  templateUrl: './gestion-operaciones.component.html',
})
export class GestionOperacionesComponent implements OnInit {
  operaciones = signal<any[]>([]);

  columns: ColumnDef[] = [
    { key: 'nombre_op', header: 'Operación' },
    { key: 'descripcion', header: 'Descripción' },
    { key: 'acciones', header: 'Acciones', type: 'action' },
  ];

  constructor(
    private dialog: MatDialog,
    private accesosSvc: AccesosService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit() {
    this.loadOps();
  }

  loadOps() {
    this.accesosSvc.getOperaciones().subscribe({
      next: (data) => {
        const normalized = (data || []).map((op: Operacion) => {
          const obj: Operacion = {} as Operacion;
          Object.keys(op).forEach((key) => (obj[key.toLowerCase()] = op[key]));
          return obj;
        });
        this.operaciones.set(normalized);
      },
      error: (err) => {
        this.snackBar.open('Error al cargar las operaciones', 'Cerrar', { duration: 4000 });
      },
    });
  }

  openDialog(op?: any) {
    const dialogRef = this.dialog.open(DialogoOperacionComponent, {
      width: '600px',
      data: { op },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.saveOp(result);
      }
    });
  }

  saveOp(formData: any) {
    this.accesosSvc.upsertOperacion(formData).subscribe({
      next: () => {
        this.snackBar.open('✅ Operación guardada', 'Cerrar', { duration: 3000 });
        this.loadOps();
      },
      error: (err) => this.snackBar.open('❌ Error: ' + err.message, 'Cerrar', { duration: 4000 }),
    });
  }

  editOp(op: any) {
    this.openDialog(op);
  }

  deleteOp(op: any) {
    const dialogRef = this.dialog.open(DialogoConfirmacionComponent, {
      width: '450px',
      data: {
        title: 'Eliminar operacion',
        message: `Confirma eliminar la operacion "${op.nombre_op}". Solo se eliminara si no esta usada en permisos.`,
      },
    });

    dialogRef.afterClosed().subscribe((confirm) => {
      if (!confirm) return;
      this.accesosSvc.deleteOperacion(op.nombre_op).subscribe({
        next: () => {
          this.snackBar.open('Operacion eliminada', 'Cerrar', { duration: 3000 });
          this.loadOps();
        },
        error: (err) =>
          this.snackBar.open('Error: ' + (err.error?.detail || err.message), 'Cerrar', {
            duration: 5000,
          }),
      });
    });
  }
}
