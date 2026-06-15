import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreadcrumbsComponent } from './components/breadcrumbs/breadcrumbs.component';
import { BarraLateralComponent } from './components/barra-lateral/barra-lateral.component';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { FolderListComponent } from './components/folder-list/folder-list.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    MatIconModule,
    MatTooltipModule,
    RouterModule,
    BarraLateralComponent,
    FolderListComponent,
  ],
  exports: [
    FolderListComponent,
    BarraLateralComponent,
    MatIconModule,
    MatTooltipModule,
    RouterModule,
  ],
})
export class SharedModule {}
