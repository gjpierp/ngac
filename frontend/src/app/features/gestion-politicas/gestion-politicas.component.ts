import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AccesosService } from '../../core/services/accesos.service';
import { INodo } from '../../core/models/ngac-admin.models';
import { DialogoNodoComponent } from '../../shared/components/dialogo-nodo/dialogo-nodo.component';
import { DialogoConfirmacionComponent } from '../../shared/components/dialogo-confirmacion/dialogo-confirmacion.component';

@Component({
  selector: 'app-gestion-politicas',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatDialogModule,
    FormsModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatSnackBarModule,
  ],
  templateUrl: './gestion-politicas.component.html',
})
export class GestionPoliticasComponent implements OnInit {
  private accesosSvc = inject(AccesosService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  politicas = signal<INodo[]>([]);
  pageSize = 10;
  pageIndex = 0;
  loading = signal(false);

  filtro = signal('');

  verPoliticaHub(politica: INodo) {
    this.router.navigate(['/politicas/hub', politica.codigo_tecnico]);
  }

  politicasFiltradas = computed(() => {
    const query = this.filtro().toLowerCase();
    const data = this.politicas();
    if (!query) return data;
    return data.filter(
      (p) =>
        (p.codigo_tecnico || '').toLowerCase().includes(query) ||
        (p.etiqueta || '').toLowerCase().includes(query) ||
        (p.descripcion || '').toLowerCase().includes(query),
    );
  });

  get pagedPoliticasFiltradas() {
    const data = this.politicasFiltradas();
    const start = this.pageIndex * this.pageSize;
    return data.slice(start, start + this.pageSize);
  }

  ngOnInit() {
    this.loadPoliticas();
  }

  loadPoliticas() {
    this.loading.set(true);
    this.accesosSvc.getPoliticasRaiz().subscribe({
      next: (data) => {
        const normalized = (data || []).map((n: any) => {
          const obj: any = {};
          Object.keys(n).forEach((key) => (obj[key.toLowerCase()] = (n as any)[key]));
          obj.activo = obj.activo || 'S';
          obj.codigo_tecnico = obj.codigo_tecnico || obj.codigo || n.codigo_tecnico;
          return obj as INodo;
        });
        this.politicas.set(normalized);
        this.loading.set(false);
      },
      error: (err) => {
        this.snackBar.open('Error al cargar las políticas: ' + err.message, 'Cerrar', {
          duration: 4000,
        });
        this.loading.set(false);
      },
    });
  }

  onPageChange(event: any) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  crearPolitica() {
    const dialogRef = this.dialog.open(DialogoNodoComponent, {
      width: '500px',
      data: {
        nodo: undefined,
        fixedType: 'POLICY',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loading.set(true);
        const payload = {
          codigo: result.codigo,
          etiqueta: result.etiqueta,
          tipo: 'POLICY',
          ruta: result.ruta || null,
          slug: result.slug || null,
          icono: result.icono || 'policy',
          descripcion: result.descripcion || null,
          orden: result.orden || 0,
          activo: result.activo || 'S',
        };

        this.accesosSvc.upsertNodo(payload).subscribe({
          next: () => {
            this.snackBar.open('Política creada exitosamente', 'Cerrar', { duration: 3000 });
            this.loadPoliticas();
          },
          error: (err) => {
            this.snackBar.open(
              'Error al crear política: ' + (err.error?.detail || err.message),
              'Cerrar',
              { duration: 5000 },
            );
            this.loading.set(false);
          },
        });
      }
    });
  }

  editPolitica(politica: INodo) {
    const dialogRef = this.dialog.open(DialogoNodoComponent, {
      width: '500px',
      data: {
        nodo: politica,
        fixedType: 'POLICY',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loading.set(true);
        const payload = {
          id_nodo: politica.id_nodo,
          codigo: result.codigo,
          etiqueta: result.etiqueta,
          tipo: 'POLICY',
          ruta: result.ruta || null,
          slug: result.slug || null,
          icono: result.icono || 'policy',
          descripcion: result.descripcion || null,
          orden: result.orden || 0,
          activo: result.activo || 'S',
        };

        this.accesosSvc.upsertNodo(payload).subscribe({
          next: () => {
            this.snackBar.open('Política actualizada exitosamente', 'Cerrar', { duration: 3000 });
            this.loadPoliticas();
          },
          error: (err) => {
            this.snackBar.open(
              'Error al actualizar política: ' + (err.error?.detail || err.message),
              'Cerrar',
              { duration: 5000 },
            );
            this.loading.set(false);
          },
        });
      }
    });
  }

  deletePolitica(politica: INodo) {
    const dialogRef = this.dialog.open(DialogoConfirmacionComponent, {
      width: '450px',
      data: {
        title: 'Eliminar Política',
        message: `¿Confirma la desactivación de la política "${politica.etiqueta}"?`,
      },
    });

    dialogRef.afterClosed().subscribe((confirm) => {
      if (confirm) {
        if (!politica.id_nodo) {
          this.snackBar.open('No se pudo resolver el ID de la política', 'Cerrar', {
            duration: 4000,
          });
          return;
        }
        this.loading.set(true);
        this.accesosSvc.deleteNodo(politica.id_nodo).subscribe({
          next: () => {
            this.snackBar.open('Política desactivada exitosamente', 'Cerrar', { duration: 3000 });
            this.loadPoliticas();
          },
          error: (err) => {
            this.snackBar.open(
              'Error al desactivar política: ' + (err.error?.detail || err.message),
              'Cerrar',
              { duration: 5000 },
            );
            this.loading.set(false);
          },
        });
      }
    });
  }
}
