import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SafiService } from '../../core/services/safi.service';
import { ISafiEntidad, ISafiUnidad, ICrearSafiEntidadDto } from '../../core/models/ngac-admin.models';
import { DialogoConfirmacionComponent } from '../../shared/components/dialogo-confirmacion/dialogo-confirmacion.component';
import { DialogoSafiEntidadComponent } from '../../shared/components/dialogo-safi-entidad/dialogo-safi-entidad.component';

@Component({
  selector: 'app-gestion-entidades',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatDialogModule,
  ],
  templateUrl: './gestion-entidades.component.html',
})
export class GestionEntidadesComponent implements OnInit {
  entidades = signal<ISafiEntidad[]>([]);
  unidades = signal<ISafiUnidad[]>([]);
  loading = signal(false);

  // Estado para la entidad seleccionada y sus unidades asociadas
  selectedEntidad = signal<ISafiEntidad | null>(null);
  unidadesAsociadas = signal<ISafiUnidad[]>([]);
  loadingUnidades = signal(false);

  filtroEntidad = signal('');

  entidadesFiltradas = computed(() => {
    const q = this.filtroEntidad().toLowerCase().trim();
    return this.entidades().filter(e =>
      e.estado !== 0 && (
        e.nombre.toLowerCase().includes(q) ||
        e.slug.toLowerCase().includes(q) ||
        (e.desc || '').toLowerCase().includes(q)
      )
    );
  });

  // Filtrar unidades que NO están asociadas a la entidad seleccionada
  unidadesDisponibles = computed(() => {
    const entidad = this.selectedEntidad();
    if (!entidad) return [];
    const asociadasIds = new Set(this.unidadesAsociadas().map(u => u.id));
    return this.unidades().filter(u => !asociadasIds.has(u.id));
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
    this.safiSvc.getEntidades().subscribe({
      next: (data) => {
        this.entidades.set(data || []);
        this.loading.set(false);
      },
      error: () => {
        this.mostrarMensaje('❌ Error al cargar entidades SAFI', true);
        this.loading.set(false);
      },
    });

    this.safiSvc.getUnidades().subscribe({
      next: (data) => this.unidades.set(data || []),
      error: () => this.mostrarMensaje('❌ Error al cargar unidades SAFI', true),
    });
  }

  selectEntidad(entidad: ISafiEntidad) {
    this.selectedEntidad.set(entidad);
    this.cargarUnidadesDeEntidad(entidad.id);
  }

  volverAListado() {
    this.selectedEntidad.set(null);
    this.unidadesAsociadas.set([]);
    this.cargarDatos();
  }

  cargarUnidadesDeEntidad(entidadId: number) {
    this.loadingUnidades.set(true);
    this.safiSvc.getUnidadesDeEntidad(entidadId).subscribe({
      next: (res) => {
        this.unidadesAsociadas.set(res.data || []);
        this.loadingUnidades.set(false);
      },
      error: () => {
        this.unidadesAsociadas.set([]);
        this.loadingUnidades.set(false);
      }
    });
  }

  vincularUnidadRapido(unidadId: number) {
    const entidad = this.selectedEntidad();
    if (!entidad) return;

    this.loadingUnidades.set(true);
    this.safiSvc.vincularUnidadEntidad({ id_unidad: unidadId, id_entidad: entidad.id }).subscribe({
      next: () => {
        this.mostrarMensaje('✅ Unidad vinculada con éxito');
        this.cargarUnidadesDeEntidad(entidad.id);
      },
      error: (err) => {
        this.mostrarMensaje('❌ Error al vincular: ' + err.message, true);
        this.loadingUnidades.set(false);
      }
    });
  }

  desvincularUnidadRapida(unidadId: number) {
    const entidad = this.selectedEntidad();
    if (!entidad) return;

    const dialogRef = this.dialog.open(DialogoConfirmacionComponent, {
      width: '450px',
      data: {
        title: 'Desvincular Unidad',
        message: '¿Está seguro de desvincular esta unidad de la entidad?'
      }
    });

    dialogRef.afterClosed().subscribe(confirm => {
      if (confirm) {
        this.loadingUnidades.set(true);
        this.safiSvc.desvincularUnidadEntidad({ id_unidad: unidadId, id_entidad: entidad.id }).subscribe({
          next: () => {
            this.mostrarMensaje('✅ Unidad desvinculada con éxito');
            this.cargarUnidadesDeEntidad(entidad.id);
          },
          error: (err) => {
            this.mostrarMensaje('❌ Error al desvincular: ' + err.message, true);
            this.loadingUnidades.set(false);
          }
        });
      }
    });
  }

  crearEntidad() {
    const dialogRef = this.dialog.open(DialogoSafiEntidadComponent, {
      width: '500px',
      data: { entidad: undefined }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const dto: ICrearSafiEntidadDto = {
          slug_entidad: result.slug_entidad,
          nombre_entidad: result.nombre_entidad,
          tipo_entidad: result.tipo_entidad
        };
        this.safiSvc.crearEntidad(dto).subscribe({
          next: () => {
            this.mostrarMensaje(`✅ Entidad creada con éxito`);
            this.cargarDatos();
          },
          error: (err) => this.mostrarMensaje('❌ Error: ' + (err.error?.error || err.message), true),
        });
      }
    });
  }

  editEntidad(entidad: ISafiEntidad) {
    const dialogRef = this.dialog.open(DialogoSafiEntidadComponent, {
      width: '500px',
      data: { entidad }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const payload: ISafiEntidad = {
          id: entidad.id,
          nombre: result.nombre_entidad,
          slug: entidad.slug,
          desc: result.tipo_entidad,
          estado: entidad.estado
        };
        this.safiSvc.upsertEntidad(payload).subscribe({
          next: () => {
            this.mostrarMensaje('✅ Entidad actualizada con éxito');
            this.cargarDatos();
          },
          error: (err) => this.mostrarMensaje('❌ Error al actualizar: ' + err.message, true)
        });
      }
    });
  }

  eliminarEntidadSafi(entidad: ISafiEntidad) {
    const dialogRef = this.dialog.open(DialogoConfirmacionComponent, {
      width: '450px',
      data: {
        title: 'Eliminar Entidad',
        message: `¿Está seguro de eliminar permanentemente la entidad "${entidad.nombre}"?`
      }
    });

    dialogRef.afterClosed().subscribe(confirm => {
      if (confirm) {
        this.safiSvc.deleteEntidad(entidad.id).subscribe({
          next: () => {
            this.mostrarMensaje('✅ Entidad eliminada con éxito');
            this.cargarDatos();
            if (this.selectedEntidad()?.id === entidad.id) {
              this.volverAListado();
            }
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
