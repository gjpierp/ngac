import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkTreeModule } from '@angular/cdk/tree';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatIconModule } from '@angular/material/icon';

export interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
  icon?: string;
}

@Component({
  selector: 'app-gestion-arbol',
  standalone: true,
  imports: [CommonModule, CdkTreeModule, MatIconModule],
  templateUrl: './gestion-arbol.component.html',
  styleUrls: ['./gestion-arbol.component.scss'],
})
export class GestionArbolComponent {
  @Input() nodes: TreeNode[] = [];
  @Output() nodeDrop = new EventEmitter<{ node: TreeNode; newParent: TreeNode | null }>();
  @Output() nodeEdit = new EventEmitter<TreeNode>();
  @Output() nodeCreate = new EventEmitter<TreeNode>();
  
  // Accesor para hijos en CdkTree
  childrenAccessor = (node: TreeNode) => node.children ?? [];

  onDrop(event: CdkDragDrop<TreeNode[]>, parent: TreeNode | null = null) {
    moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    this.nodeDrop.emit({ node: event.item.data, newParent: parent });
  }

  onEdit(node: TreeNode) {
    this.nodeEdit.emit(node);
  }

  onCreate(parent: TreeNode | null) {
    this.nodeCreate.emit(parent || undefined);
  }
}
