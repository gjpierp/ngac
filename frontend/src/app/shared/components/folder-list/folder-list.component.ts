import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuService } from '../../../core/services/menu.service';
import { MenuItem } from '../../../core/models/menu-item.model';

@Component({
  selector: 'app-folder-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './folder-list.component.html',
  styleUrls: ['./folder-list.component.css'],
})
export class FolderListComponent implements OnInit, OnChanges {
  @Input() userId!: number;
  carpetasRaiz: MenuItem[] = [];
  carpetasRaizSinHijos: MenuItem[] = [];

  constructor(private menuService: MenuService) {}

  ngOnInit(): void {
    this.loadFolders();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userId']) {
      this.loadFolders();
    }
  }

  private loadFolders(): void {
    if (!this.userId) {
      this.carpetasRaiz = [];
      this.carpetasRaizSinHijos = [];
      return;
    }

    this.menuService.getCarpetasRaiz(this.userId).subscribe((data) => {
      this.carpetasRaiz = data;
    });
    this.menuService.getCarpetasRaizSinHijos(this.userId).subscribe((data) => {
      this.carpetasRaizSinHijos = data;
    });
  }
}
