import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Miga {
  etiqueta: string;
  id: string | number;
}

@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './breadcrumbs.component.html',
  styleUrls: ['./breadcrumbs.component.css'],
})
export class BreadcrumbsComponent {
  @Input() migas: Miga[] = [];
  @Output() migaClick = new EventEmitter<Miga>();

  onMigaClick(miga: Miga, index: number) {
    // Solo emite si no es la última miga (la actual)
    if (index < this.migas.length - 1) {
      this.migaClick.emit(miga);
    }
  }
}
