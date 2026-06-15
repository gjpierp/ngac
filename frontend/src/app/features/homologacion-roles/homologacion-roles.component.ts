import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MatrizPermisosComponent,
  MatrixRow,
  MatrixCell,
} from '../../shared/components/matriz-permisos/matriz-permisos.component';
import { AccesosService } from '../../core/services/accesos.service';
import { INodo, NGAC_OPERATIONS } from '../../core/models/ngac-admin.models';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-homologacion-roles',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatrizPermisosComponent,
  ],
  templateUrl: './homologacion-roles.component.html',
})
export class HomologacionRolesComponent implements OnInit {
  matrixData = signal<MatrixRow[]>([]);
  loading = signal(true);
  roles = signal<any[]>([]);
  nodos = signal<INodo[]>([]);
  operations = NGAC_OPERATIONS;

  simulateForm: FormGroup;
  permisoForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private accesosSvc: AccesosService,
    private snackBar: MatSnackBar,
  ) {
    this.simulateForm = this.fb.group({
      usuario: ['', Validators.required],
      atributos: ['', Validators.required],
    });
    this.permisoForm = this.fb.group({
      usr: ['', Validators.required],
      obj: ['', Validators.required],
      op: ['VER', Validators.required],
      condicion: [''],
    });
  }

  ngOnInit() {
    forkJoin({
      tree: this.accesosSvc.obtenerArbol(undefined, false),
      roles: this.accesosSvc.getRoles(),
      nodos: this.accesosSvc.getNodos(),
    }).subscribe({
      next: ({ tree, roles, nodos }) => {
        this.roles.set(roles || []);
        this.nodos.set(nodos || []);
        this.matrixData.set(this.flattenToMatrix(tree));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private resolveRoleNodeId(value: string | number): number | null {
    const numeric = Number(value);
    if (!Number.isNaN(numeric) && numeric > 0) return numeric;
    const normalized = String(value || '')
      .trim()
      .toUpperCase();
    const role = this.roles().find(
      (item) =>
        String(item.id_nodo || item.id_rol || '') === normalized ||
        String(item.codigo || '')
          .trim()
          .toUpperCase() === normalized,
    );
    return role?.id_nodo ? Number(role.id_nodo) : role?.id_rol ? Number(role.id_rol) : null;
  }

  private resolveNodeId(value: string | number): number | null {
    const numeric = Number(value);
    if (!Number.isNaN(numeric) && numeric > 0) return numeric;
    const normalized = String(value || '')
      .trim()
      .toUpperCase();
    const node = this.nodos().find(
      (item) =>
        String(item.id_nodo || '') === normalized ||
        String(item.codigo_tecnico || '')
          .trim()
          .toUpperCase() === normalized,
    );
    return node?.id_nodo ? Number(node.id_nodo) : null;
  }

  simularTree() {
    this.loading.set(true);
    this.accesosSvc.generarMenuDinamico(this.simulateForm.value).subscribe({
      next: (tree) => {
        this.matrixData.set(this.flattenToMatrix(tree));
        this.loading.set(false);
        this.snackBar.open('✅ Árbol simulado cargado', 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        this.loading.set(false);
        this.snackBar.open('❌ Error: ' + err.message, 'Cerrar', { duration: 4000 });
      },
    });
  }

  otorgar() {
    if (this.permisoForm.invalid) return;
    const { usr, obj, op, condicion } = this.permisoForm.value;
    const roleId = this.resolveRoleNodeId(usr);
    const nodeId = this.resolveNodeId(obj);
    if (!roleId || !nodeId) {
      this.snackBar.open('Usa un ID válido o un valor resoluble para rol y nodo', 'Cerrar', {
        duration: 4000,
      });
      return;
    }
    this.accesosSvc.otorgarPermiso(roleId, nodeId, op, condicion).subscribe({
      next: () => {
        this.snackBar.open('✅ Permiso otorgado', 'Cerrar', { duration: 3000 });
        this.permisoForm.reset({ op: 'VER', condicion: '' });
      },
      error: (err) => this.snackBar.open('❌ Error: ' + err.message, 'Cerrar', { duration: 4000 }),
    });
  }

  formatJSON() {
    const val = this.permisoForm.get('condicion')?.value;
    if (!val) return;
    try {
      const obj = JSON.parse(val);
      const formatted = JSON.stringify(obj, null, 2);
      this.permisoForm.get('condicion')?.setValue(formatted);
      this.snackBar.open('✨ JSON Formateado', 'Cerrar', { duration: 2000 });
    } catch (e) {
      this.snackBar.open('❌ JSON Inválido: no se puede formatear', 'Cerrar', { duration: 3000 });
    }
  }

  onPermissionChanged(evt: { row: MatrixRow; colIndex: number }) {
    const role = this.resolveRoleNodeId(this.permisoForm.get('usr')?.value);
    const row = evt.row;
    const op = NGAC_OPERATIONS[evt.colIndex];
    const cell = row.cells[evt.colIndex];
    const granted = !cell.value;

    if (!role || !row.id) {
      this.snackBar.open(
        'Ingresa un rol en "Rol / Atributo" antes de modificar la matriz',
        'Cerrar',
        { duration: 4000 },
      );
      return;
    }

    const request$ = granted
      ? this.accesosSvc.otorgarPermiso(role, row.id, op)
      : this.accesosSvc.revocarPermiso(role, row.id, op);

    request$.subscribe({
      next: () => {
        cell.value = granted;
        this.matrixData.set([...this.matrixData()]);
        this.snackBar.open(granted ? 'Permiso otorgado' : 'Permiso revocado', 'Cerrar', {
          duration: 2500,
        });
      },
      error: (err) =>
        this.snackBar.open('Error: ' + (err.error?.detail || err.message), 'Cerrar', {
          duration: 5000,
        }),
    });
  }

  /** Aplana árbol jerárquico para la tabla matricial */
  private flattenToMatrix(nodes: INodo[], result: MatrixRow[] = [], level = 0): MatrixRow[] {
    for (const n of nodes) {
      const cells: MatrixCell[] = NGAC_OPERATIONS.map(() => ({
        value: false,
        editable: true,
      }));
      result.push({
        id: String(n.id_nodo || n.codigo_tecnico),
        label: n.etiqueta,
        cells,
      });
      if (n.children?.length) {
        this.flattenToMatrix(n.children, result, level + 1);
      }
    }
    return result;
  }
}
