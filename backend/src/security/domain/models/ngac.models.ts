/**
 * @file        ngac.models.ts
 * @description Modelos de dominio e interfaces puras para representar la estructura del grafo NGAC.
 * @author      IA Assistant
 * @date        2026-06-09
 * @version     1.0.0
 * HISTORIAL DE CAMBIOS:
 * -----------------------------------------------------------------------------
 * FECHA        | AUTOR             | VERSIÓN   | DESCRIPCIÓN DEL CAMBIO
 * -----------------------------------------------------------------------------
 * 2026-06-09   | IA Assistant      | 1.0.0     | Creación inicial del archivo.
 */

export interface DomainNode {
  readonly idNode: number;
  readonly code: string;
  readonly label: string;
  readonly typeId: number;
  readonly typeCode: string;
  readonly urlPath?: string;
  readonly slug?: string;
  readonly icon?: string;
  readonly displayOrder: number;
  readonly description?: string;
  readonly active: boolean;
}

export interface DomainAssignment {
  readonly parentId: number;
  readonly childId: number;
}

export interface DomainAssociation {
  readonly idAssociation: number;
  readonly userAttributeId: number;
  readonly objectAttributeId: number;
  readonly operationId: number;
  readonly operationName: string;
  readonly conditionJson?: string;
}

export interface DomainProhibition {
  readonly idProhibition: number;
  readonly userAttributeId: number;
  readonly objectAttributeId: number;
  readonly operationId: number;
  readonly operationName: string;
}

export interface DomainMenuNode {
  readonly idMenuNode: number;
  readonly idNode: number;
  readonly code: string;
  readonly label: string;
  readonly slug?: string;
  readonly icon?: string;
  readonly description?: string;
  readonly urlPath?: string;
  readonly displayOrder: number;
  readonly active: boolean;
}

export interface DomainMenuAssignment {
  readonly parentMenuId: number;
  readonly childMenuId: number;
}

export interface DomainPolicyMenuRoot {
  readonly policyId: number;
  readonly menuNodeId: number;
}
