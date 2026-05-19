import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface DualListItem {
  id: string;
  label: string;
}

@Component({
  selector: 'app-componente-lista-dual',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './componente-lista-dual.component.html',
  styleUrls: ['./componente-lista-dual.component.scss'],
})
export class ComponenteListaDual {
  @Input() available: DualListItem[] = [];
  @Input() selected: DualListItem[] = [];
  @Input() titleLeft = 'Disponibles';
  @Input() titleRight = 'Seleccionados';
  @Output() selectionChange = new EventEmitter<{ selected: DualListItem[] }>();

  availableSelected: Set<string> = new Set();
  selectedSelected: Set<string> = new Set();

  moveToSelected() {
    const toMove = this.available.filter((i) => this.availableSelected.has(i.id));
    this.selected = [...this.selected, ...toMove];
    this.available = this.available.filter((i) => !this.availableSelected.has(i.id));
    this.availableSelected.clear();
    this.selectionChange.emit({ selected: this.selected });
  }

  moveToAvailable() {
    const toMove = this.selected.filter((i) => this.selectedSelected.has(i.id));
    this.available = [...this.available, ...toMove];
    this.selected = this.selected.filter((i) => !this.selectedSelected.has(i.id));
    this.selectedSelected.clear();
    this.selectionChange.emit({ selected: this.selected });
  }

  moveAllToSelected() {
    this.selected = [...this.selected, ...this.available];
    this.available = [];
    this.availableSelected.clear();
    this.selectionChange.emit({ selected: this.selected });
  }

  moveAllToAvailable() {
    this.available = [...this.available, ...this.selected];
    this.selected = [];
    this.selectedSelected.clear();
    this.selectionChange.emit({ selected: this.selected });
  }
}
