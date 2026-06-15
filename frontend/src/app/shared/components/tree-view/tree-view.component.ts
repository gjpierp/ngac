import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-tree-view',
  standalone: true,
  templateUrl: './tree-view.component.html',
  styleUrls: ['./tree-view.component.css'],
  imports: [CommonModule, MatIconModule],
})
export class TreeViewComponent {
  @Input() node: any;
  @Input() selected: string | null = null;
  @Output() selectNode = new EventEmitter<string>();
}
