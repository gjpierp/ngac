/**
 * @file        NgacGraphManager.ts
 * @description Gestor Singleton encargado de mantener el Grafo Dirigido Acíclico (DAG) y las políticas en memoria.
 * @author      IA Assistant
 * @date        2026-06-09
 * @version     1.0.0
 * HISTORIAL DE CAMBIOS:
 * -----------------------------------------------------------------------------
 * FECHA        | AUTOR             | VERSIÓN   | DESCRIPCIÓN DEL CAMBIO
 * -----------------------------------------------------------------------------
 * 2026-06-09   | IA Assistant      | 1.0.0     | Creación inicial del archivo.
 */

import {
  DomainNode,
  DomainAssignment,
  DomainAssociation,
  DomainProhibition,
  DomainMenuNode,
  DomainMenuAssignment,
  DomainPolicyMenuRoot
} from "../../domain/models/ngac.models";
import { NgacRepositoryPort } from "../ports/outbound/NgacRepositoryPort";
import { OracleNgacRepositoryAdapter } from "../../infrastructure/adapters/outbound/OracleNgacRepositoryAdapter";
import { NodeNotFoundException } from "../../domain/exceptions/security.exceptions";

export class NgacGraphManager {
  private static instance: NgacGraphManager;

  // Repositorio por defecto
  private repository: NgacRepositoryPort;

  // Estructuras en memoria para el Grafo (DAG)
  public readonly nodes = new Map<number, DomainNode>();
  public readonly nodeIdByCode = new Map<string, number>();
  public readonly parentToChildren = new Map<number, Set<number>>();
  public readonly childToParents = new Map<number, Set<number>>();

  // Estructuras en memoria para Asociaciones y Prohibiciones
  // Llave: "idUsrAttr_idObjAttr"
  public readonly associations = new Map<string, DomainAssociation[]>();
  public readonly prohibitions = new Map<string, DomainProhibition[]>();

  // Estructuras en memoria para el Menú
  public readonly menuNodes = new Map<number, DomainMenuNode>();
  public readonly menuNodeIdByNodeId = new Map<number, number>();
  public readonly menuParentToChildren = new Map<number, Set<number>>();
  public readonly menuChildToParents = new Map<number, Set<number>>();
  public readonly policyMenuRoots = new Map<number, Set<number>>();

  // IDs de tipos de nodo especiales
  public policyTypeId: number = -1;
  public objectTypeId: number = -1;
  public objectAttributeTypeId: number = -1;

  private isInitialized = false;

  private constructor() {
    this.repository = new OracleNgacRepositoryAdapter();
  }

  /**
   * @function    getInstance
   * @description Recupera la instancia única del Singleton.
   */
  public static getInstance(): NgacGraphManager {
    if (!NgacGraphManager.instance) {
      NgacGraphManager.instance = new NgacGraphManager();
    }
    return NgacGraphManager.instance;
  }

  /**
   * @function    setRepository
   * @description Permite inyectar un repositorio mock (útil para pruebas).
   */
  public setRepository(repo: NgacRepositoryPort): void {
    this.repository = repo;
    this.isInitialized = false;
  }

  /**
   * @function    initialize
   * @description Carga el grafo si no está inicializado.
   */
  public async initialize(): Promise<void> {
    if (!this.isInitialized) {
      await this.refreshGraph();
    }
  }

  /**
   * @function    refreshGraph
   * @description Carga o recarga la totalidad del grafo en memoria desde la persistencia de forma atómica.
   */
  public async refreshGraph(): Promise<void> {
    const [
      nodes,
      assignments,
      associations,
      prohibitions,
      menuNodes,
      menuAssignments,
      policyMenuRoots
    ] = await Promise.all([
      this.repository.fetchNodes(),
      this.repository.fetchAssignments(),
      this.repository.fetchAssociations(),
      this.repository.fetchProhibitions(),
      this.repository.fetchMenuNodes(),
      this.repository.fetchMenuAssignments(),
      this.repository.fetchPolicyMenuRoots()
    ]);

    // 1. Limpiar estructuras de grafo
    this.nodes.clear();
    this.nodeIdByCode.clear();
    this.parentToChildren.clear();
    this.childToParents.clear();

    // 2. Poblar nodos en memoria
    for (const node of nodes) {
      this.nodes.set(node.idNode, node);
      this.nodeIdByCode.set(node.code, node.idNode);

      // Resolver tipos específicos
      if (node.typeCode === "POLICY") {
        this.policyTypeId = node.typeId;
      } else if (node.typeCode === "OBJETO") {
        this.objectTypeId = node.typeId;
      } else if (node.typeCode === "OBJ_ATTR") {
        this.objectAttributeTypeId = node.typeId;
      }
    }

    // 3. Poblar asignaciones jerárquicas
    for (const edge of assignments) {
      if (!this.parentToChildren.has(edge.parentId)) {
        this.parentToChildren.set(edge.parentId, new Set());
      }
      this.parentToChildren.get(edge.parentId)!.add(edge.childId);

      if (!this.childToParents.has(edge.childId)) {
        this.childToParents.set(edge.childId, new Set());
      }
      this.childToParents.get(edge.childId)!.add(edge.parentId);
    }

    // 4. Poblar asociaciones de permisos
    this.associations.clear();
    for (const aso of associations) {
      const key = `${aso.userAttributeId}_${aso.objectAttributeId}`;
      if (!this.associations.has(key)) {
        this.associations.set(key, []);
      }
      this.associations.get(key)!.push(aso);
    }

    // 5. Poblar prohibiciones
    this.prohibitions.clear();
    for (const pro of prohibitions) {
      const key = `${pro.userAttributeId}_${pro.objectAttributeId}`;
      if (!this.prohibitions.has(key)) {
        this.prohibitions.set(key, []);
      }
      this.prohibitions.get(key)!.push(pro);
    }

    // 6. Limpiar y poblar estructuras de menú
    this.menuNodes.clear();
    this.menuNodeIdByNodeId.clear();
    this.menuParentToChildren.clear();
    this.menuChildToParents.clear();
    this.policyMenuRoots.clear();

    for (const mn of menuNodes) {
      this.menuNodes.set(mn.idMenuNode, mn);
      this.menuNodeIdByNodeId.set(mn.idNode, mn.idMenuNode);
    }

    for (const edge of menuAssignments) {
      if (!this.menuParentToChildren.has(edge.parentMenuId)) {
        this.menuParentToChildren.set(edge.parentMenuId, new Set());
      }
      this.menuParentToChildren.get(edge.parentMenuId)!.add(edge.childMenuId);

      if (!this.menuChildToParents.has(edge.childMenuId)) {
        this.menuChildToParents.set(edge.childMenuId, new Set());
      }
      this.menuChildToParents.get(edge.childMenuId)!.add(edge.parentMenuId);
    }

    for (const root of policyMenuRoots) {
      if (!this.policyMenuRoots.has(root.policyId)) {
        this.policyMenuRoots.set(root.policyId, new Set());
      }
      this.policyMenuRoots.get(root.policyId)!.add(root.menuNodeId);
    }

    this.isInitialized = true;
  }

  /**
   * @function    getAncestors
   * @description Resuelve de forma transitiva todos los ancestros de un nodo (recorrido ascendente).
   * @param       {number} nodeId - ID del nodo inicial.
   * @returns     {Set<number>} Conjunto de IDs de nodos ancestros (incluyendo el nodo inicial).
   */
  public getAncestors(nodeId: number): Set<number> {
    const ancestors = new Set<number>();
    const queue: number[] = [nodeId];
    ancestors.add(nodeId);

    let head = 0;
    while (head < queue.length) {
      const current = queue[head++];
      const parents = this.childToParents.get(current);
      if (parents) {
        for (const parent of parents) {
          if (!ancestors.has(parent)) {
            ancestors.add(parent);
            queue.push(parent);
          }
        }
      }
    }
    return ancestors;
  }

  /**
   * @function    getDescendants
   * @description Resuelve de forma transitiva todos los descendientes de un nodo (recorrido descendente).
   * @param       {number} nodeId - ID del nodo inicial.
   * @returns     {Set<number>} Conjunto de IDs de nodos descendientes (incluyendo el nodo inicial).
   */
  public getDescendants(nodeId: number): Set<number> {
    const descendants = new Set<number>();
    const queue: number[] = [nodeId];
    descendants.add(nodeId);

    let head = 0;
    while (head < queue.length) {
      const current = queue[head++];
      const children = this.parentToChildren.get(current);
      if (children) {
        for (const child of children) {
          if (!descendants.has(child)) {
            descendants.add(child);
            queue.push(child);
          }
        }
      }
    }
    return descendants;
  }

  /**
   * @function    resolveNodeId
   * @description Mapea un string (ID o código) a un ID de nodo numérico existente.
   * @param       {string | number} identifier - ID o código técnico del nodo.
   */
  public resolveNodeId(identifier: string | number): number {
    if (typeof identifier === "number") {
      if (this.nodes.has(identifier)) return identifier;
    } else {
      const trimmed = String(identifier).trim();
      const num = Number(trimmed);
      if (!isNaN(num) && this.nodes.has(num)) return num;

      const codeUpper = trimmed.toUpperCase();
      const resolved = this.nodeIdByCode.get(codeUpper);
      if (resolved !== undefined) return resolved;
    }
    throw new NodeNotFoundException(identifier);
  }
}
