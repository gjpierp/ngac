import { Component, OnInit, ViewChild, ChangeDetectorRef, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { RolesService, IRol } from '../../core/services/roles.service';
import { AccesosService } from '../../core/services/accesos.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-gestion-roles',
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
  ],
  templateUrl: './gestion-roles.component.html',
})
export class GestionRolesComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  roles = signal<any[]>([]);
  pageSize = signal(10);
  pageIndex = signal(0);
  loading = false;
  editingRole: any | null = null;
  newRole: any = {
    codigo: '',
    nombre: '',
    descripcion: '',
    id_tipo_nodo: 2,
    icono: 'admin_panel_settings',
    url_ruta: '',
    slug: '',
    orden_visual: 0,
    activo: true,
  };
  showForm = false;

  filtro = signal('');

  rolesFiltrados = computed(() => {
    const query = this.filtro().toLowerCase();
    const data = this.roles();
    if (!query) return data;
    return data.filter(
      (r) =>
        String(r?.codigo ?? '')
          .toLowerCase()
          .includes(query) ||
        String(r?.nombre ?? '')
          .toLowerCase()
          .includes(query) ||
        String(r?.descripcion ?? '')
          .toLowerCase()
          .includes(query),
    );
  });

  pagedRolesFiltrados = computed(() => {
    const data = this.rolesFiltrados();
    const size = this.pageSize();
    const index = this.pageIndex();
    const start = index * size;
    return data.slice(start, start + size);
  });

  constructor(
    private rolesService: RolesService,
    private accesosService: AccesosService,
    private cdRef: ChangeDetectorRef,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles() {
    this.loading = true;
    this.rolesService.getRoles().subscribe({
      next: (roles) => {
        this.roles.set(roles || []);
        this.loading = false;
      },
      error: () => {
        this.roles.set([]);
        this.loading = false;
      },
    });
  }

  onPageChange(event: any) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  openForm(role?: any) {
    if (role) {
      this.editingRole = { ...role };
      this.newRole = {
        ...role,
        activo: role.activo === 'S' || role.activo === true || role.activo === 1,
      };
    } else {
      this.editingRole = null;
      this.newRole = {
        codigo: '',
        nombre: '',
        descripcion: '',
        id_tipo_nodo: 2,
        icono: 'admin_panel_settings',
        url_ruta: '',
        slug: '',
        orden_visual: this.roles().length + 1,
        activo: true,
      };
    }
    this.showForm = true;
  }

  selectRole(role: IRol) {
    this.router.navigate(['/roles/hub', role.codigo]);
  }

  saveRole() {
    console.log('[RolesManager] saveRole - Iniciando guardado...', this.newRole);
    if (!this.newRole.codigo || !this.newRole.nombre) {
      console.warn('[RolesManager] saveRole - Faltan campos obligatorios');
      return;
    }

    this.loading = true;
    const payload = {
      ...this.newRole,
      id_rol: this.editingRole?.id_rol || this.newRole.id_rol,
      activo: this.newRole.activo ? 'S' : 'N',
    };

    console.log('[RolesManager] saveRole - Enviando payload:', payload);

    this.rolesService.upsertRol(payload).subscribe({
      next: (res) => {
        console.log('[RolesManager] saveRole - Éxito:', res);
        this.loadRoles();
        this.showForm = false;
        this.loading = false;
      },
      error: (err) => {
        console.error('[RolesManager] saveRole - Error:', err);
        this.loading = false;
      },
    });
  }

  deleteRole(role: IRol) {
    if (!role.id_rol) return;
    this.rolesService.deleteRol(role.id_rol).subscribe({
      next: () => this.loadRoles(),
    });
  }

  cancel() {
    this.showForm = false;
  }
}
