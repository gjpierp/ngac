import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface MatrixCell {
  value: boolean;
  editable: boolean;
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
  @Input() columns: string[] = [];
  @Input() rows: MatrixRow[] = [];
  @Input() loading = false;
  @Input() roles: any[] = [];
  @Input() politicas: any[] = [];
  @Input() selectedRole = '';
  @Input() selectedPolicy = '';
  @Output() cellToggle = new EventEmitter<{ row: MatrixRow; colIndex: number }>();
  @Output() filterChange = new EventEmitter<{ role: string; policy: string }>();

  searchTerm = '';

  get filteredRows(): MatrixRow[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.rows;
    return this.rows.filter((row) =>
      row.label.toLowerCase().includes(term) ||
      row.id.toLowerCase().includes(term)
    );
  }
  
  get allColumns(): string[] {
    return ['recurso', ...this.columns];
  }

  onCellToggle(row: MatrixRow, colIndex: number) {
    this.cellToggle.emit({ row, colIndex });
  }

  onRoleChange(role: string) {
    this.filterChange.emit({ role, policy: this.selectedPolicy });
  }

  onPolicyChange(policy: string) {
    this.filterChange.emit({ role: this.selectedRole, policy });
  }
}
