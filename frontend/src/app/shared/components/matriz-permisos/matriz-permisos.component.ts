import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import Swal from 'sweetalert2';

export interface MatrixCell {
  value: boolean;
  editable: boolean;
  status?: 'ALLOW' | 'DENY' | 'NONE';
  justification?: string;
}

export interface MatrixRow {
  id: string;
  label: string;
  cells: MatrixCell[];
}

@Component({
  selector: 'app-matriz-permisos',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatSelectModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
  ],
  templateUrl: './matriz-permisos.component.html',
  styleUrls: ['./matriz-permisos.component.scss'],
})
export class MatrizPermisosComponent {
  @Input() set columns(val: string[]) { this._columns.set(val); }
  @Input() set rows(val: MatrixRow[]) { this._rows.set(val); }
  @Input() loading = false;
  @Input() roles: any[] = [];
  @Input() politicas: any[] = [];
  @Input() selectedRole: string | number = '';
  @Input() selectedPolicy: string | number = '';
  @Output() cellToggle = new EventEmitter<{ row: MatrixRow; colIndex: number }>();
  @Output() filterChange = new EventEmitter<{ role: string | number; policy: string | number }>();

  private _columns = signal<string[]>([]);
  private _rows = signal<MatrixRow[]>([]);
  private _searchTerm = signal<string>('');

  get columnsArray() { return this._columns(); }

  set searchTerm(val: string) {
    this._searchTerm.set(val);
  }
  get searchTerm() {
    return this._searchTerm();
  }

  filteredRows = computed(() => {
    const term = this._searchTerm().trim().toLowerCase();
    const rows = this._rows();
    if (!term) return rows;
    return rows.filter(
      (row) => row.label.toLowerCase().includes(term) || row.id.toLowerCase().includes(term),
    );
  });

  allColumns = computed(() => ['recurso', ...this._columns()]);

  onCellToggle(row: MatrixRow, colIndex: number) {
    const cell = row.cells[colIndex];
    if (cell.justification) {
      Swal.fire({
        title: 'Análisis de Permiso Efectivo',
        text: cell.justification,
        icon: cell.status === 'ALLOW' ? 'success' : cell.status === 'DENY' ? 'error' : 'info',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Entendido'
      });
    }
    this.cellToggle.emit({ row, colIndex });
  }

  onRoleChange(role: string | number) {
    this.filterChange.emit({ role, policy: this.selectedPolicy });
  }

  onPolicyChange(policy: string | number) {
    this.filterChange.emit({ role: this.selectedRole, policy });
  }
}
