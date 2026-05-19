import { Component, Input, Output, EventEmitter, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

export interface ColumnDef {
  key: string;
  header: string;
  type?: 'text' | 'boolean' | 'date' | 'action';
}

@Component({
  selector: 'app-tabla-generica',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  templateUrl: './tabla-generica.component.html',
})
export class TablaGenericaComponent implements AfterViewInit {
  @Input() set data(value: any[]) {
    this.dataSource.data = value || [];
  }
  @Input() columns: ColumnDef[] = [];
  @Input() total: number = 0;
  @Input() pageSize: number = 5;
  @Input() pageIndex: number = 0;

  @Output() onEdit = new EventEmitter<any>();
  @Output() onDelete = new EventEmitter<any>();
  @Output() onRowClick = new EventEmitter<any>();
  @Output() onToggle = new EventEmitter<any>();
  @Output() pageChange = new EventEmitter<any>();

  @Input() isExpanded?: (code: string) => boolean;

  dataSource = new MatTableDataSource<any>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  get displayedColumns(): string[] {
    return this.columns.map((c) => c.key);
  }

  ngAfterViewInit() {
    // Asignar paginador para paginación local
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    // No reiniciar paginador aquí para paginación remota
  }
}
