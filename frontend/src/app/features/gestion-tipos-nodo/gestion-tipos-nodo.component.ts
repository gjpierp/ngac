import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AccesosService } from '../../core/services/accesos.service';
import { TablaGenericaComponent, ColumnDef } from '../../shared/components/tabla-generica/tabla-generica.component';
import { DialogoConfirmacionComponent } from '../../shared/components/dialogo-confirmacion/dialogo-confirmacion.component';
import { DialogoTipoNodoComponent } from '../../shared/components/dialogo-tipo-nodo/dialogo-tipo-nodo.component';

@Component({
  selector: 'app-gestion-tipos-nodo',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatSnackBarModule,
    MatTooltipModule,
    TablaGenericaComponent
  ],
  templateUrl: './gestion-tipos-nodo.component.html'
})
export class GestionTiposNodoComponent implements OnInit {
  tipos = signal<any[]>([]);

  columns: ColumnDef[] = [
    { key: 'codigo', header: 'Codigo' },
    { key: 'descripcion', header: 'Descripcion' },
    { key: 'acciones', header: 'Acciones', type: 'action' },
  ];

  constructor(
    private dialog: MatDialog,
    private accesosSvc: AccesosService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadTipos();
  }

  loadTipos() {
    this.accesosSvc.getTiposNodo().subscribe({
      next: data => this.tipos.set(data || []),
      error: err => this.snackBar.open('Error cargando tipos: ' + err.message, 'Cerrar', { duration: 4000 })
    });
  }

  crearTipo() {
    const dialogRef = this.dialog.open(DialogoTipoNodoComponent, {
      width: '500px',
      data: { tipo: undefined }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.accesosSvc.upsertTipoNodo(result).subscribe({
          next: () => {
            this.snackBar.open('Tipo guardado', 'Cerrar', { duration: 3000 });
            this.loadTipos();
          },
          error: err => this.snackBar.open('Error: ' + (err.error?.detail || err.message), 'Cerrar', { duration: 5000 })
        });
      }
    });
  }

  editTipo(tipo: any) {
    const dialogRef = this.dialog.open(DialogoTipoNodoComponent, {
      width: '500px',
      data: { tipo }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.accesosSvc.upsertTipoNodo(result).subscribe({
          next: () => {
            this.snackBar.open('Tipo actualizado', 'Cerrar', { duration: 3000 });
            this.loadTipos();
          },
          error: err => this.snackBar.open('Error: ' + (err.error?.detail || err.message), 'Cerrar', { duration: 5000 })
        });
      }
    });
  }

  deleteTipo(tipo: any) {
    const dialogRef = this.dialog.open(DialogoConfirmacionComponent, {
      width: '450px',
      data: {
        title: 'Eliminar tipo de nodo',
        message: `Confirma eliminar el tipo "${tipo.codigo}". Solo se eliminará si no está usado por nodos.`
      }
    });

    dialogRef.afterClosed().subscribe(confirm => {
      if (!confirm) return;
      this.accesosSvc.deleteTipoNodo(tipo.codigo).subscribe({
        next: () => {
          this.snackBar.open('Tipo eliminado', 'Cerrar', { duration: 3000 });
          this.loadTipos();
        },
        error: err => this.snackBar.open('Error: ' + (err.error?.detail || err.message), 'Cerrar', { duration: 5000 })
      });
    });
  }
}
