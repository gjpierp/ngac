import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SafiService } from '../../core/services/safi.service';
import { ISafiUnidad, ICrearSafiUnidadDto } from '../../core/models/ngac-admin.models';
import { DialogoConfirmacionComponent } from '../../shared/components/dialogo-confirmacion/dialogo-confirmacion.component';
import { DialogoSafiUnidadComponent } from '../../shared/components/dialogo-safi-unidad/dialogo-safi-unidad.component';

@Component({
  selector: 'app-gestion-unidades',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatDialogModule,
  ],
  templateUrl: './gestion-unidades.component.html',
})
export class GestionUnidadesComponent implements OnInit {
  unidades = signal<ISafiUnidad[]>([]);
  loading = signal(false);
  filtroUnidad = signal('');

  unidadesFiltradas = computed(() => {
    const q = this.filtroUnidad().toLowerCase().trim();
    return this.unidades().filter(u =>
      u.activo !== 'N' && (
        u.nombre.toLowerCase().includes(q) ||
        u.slug.toLowerCase().includes(q) ||
        (u.desc || '').toLowerCase().includes(q)
      )
    );
  });

  constructor(
    private dialog: MatDialog,
    private safiSvc: SafiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.loading.set(true);
    this.safiSvc.getUnidades().subscribe({
      next: (data) => {
        this.unidades.set(data || []);
        this.loading.set(false);
      },
      error: () => {
        this.mostrarMensaje('❌ Error al cargar unidades SAFI', true);
        this.loading.set(false);
      },
    });
  }

  crearUnidad() {
    const dialogRef = this.dialog.open(DialogoSafiUnidadComponent, {
      width: '500px',
      data: { unidad: undefined }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const dto: ICrearSafiUnidadDto = {
          codigo: result.codigo,
          slug_unidad: result.slug_unidad,
          nombre_unidad: result.nombre_unidad,
          descripcion: result.descripcion
        };
        this.safiSvc.crearUnidad(dto).subscribe({
          next: () => {
            this.mostrarMensaje(`✅ Unidad creada con éxito`);
            this.cargarDatos();
          },
          error: (err) => this.mostrarMensaje('❌ Error: ' + (err.error?.error || err.message), true),
        });
      }
    });
  }

  editUnidad(unidad: ISafiUnidad) {
    const dialogRef = this.dialog.open(DialogoSafiUnidadComponent, {
      width: '500px',
      data: { unidad }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const payload: ISafiUnidad = {
          id: unidad.id,
          codigo: unidad.codigo,
          nombre: result.nombre_unidad,
          slug: unidad.slug,
          desc: result.descripcion,
          activo: unidad.activo
        };
        this.safiSvc.upsertUnidad(payload).subscribe({
          next: () => {
            this.mostrarMensaje('✅ Unidad actualizada con éxito');
            this.cargarDatos();
          },
          error: (err) => this.mostrarMensaje('❌ Error al actualizar: ' + err.message, true)
        });
      }
    });
  }

  eliminarUnidadSafi(unidad: ISafiUnidad) {
    const dialogRef = this.dialog.open(DialogoConfirmacionComponent, {
      width: '450px',
      data: {
        title: 'Eliminar Unidad',
        message: `¿Está seguro de eliminar permanentemente la unidad "${unidad.nombre}"?`
      }
    });

    dialogRef.afterClosed().subscribe(confirm => {
      if (confirm) {
        this.safiSvc.deleteUnidad(unidad.id).subscribe({
          next: () => {
            this.mostrarMensaje('✅ Unidad eliminada con éxito');
            this.cargarDatos();
          },
          error: (err) => this.mostrarMensaje('❌ Error al eliminar: ' + err.message, true),
        });
      }
    });
  }

  private mostrarMensaje(mensaje: string, error = false) {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 4000,
      panelClass: error ? ['bg-red-900', 'text-white'] : ['bg-green-950', 'text-white'],
    });
  }
}
