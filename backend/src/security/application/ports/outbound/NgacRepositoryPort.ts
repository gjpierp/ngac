/**
 * @file        NgacRepositoryPort.ts
 * @description Puerto de salida (Outbound Port) que define los métodos de consulta para persistencia NGAC.
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
} from "../../../domain/models/ngac.models";

export interface UserContext {
  readonly userId: number;
  readonly email: string;
  readonly active: boolean;
  readonly entities: string[];
  readonly units: string[];
}

export interface AccessLogEntry {
  readonly username: string;
  readonly objectCode: string;
  readonly operations: string;
  readonly authorized: number;
  readonly contextJson: string | null;
}

export interface NgacRepositoryPort {
  /**
   * @function    fetchNodes
   * @description Recupera todos los nodos activos del grafo de seguridad.
   */
  fetchNodes(): Promise<DomainNode[]>;

  /**
   * @function    fetchAssignments
   * @description Recupera todas las asignaciones o enlaces jerárquicos activos entre nodos.
   */
  fetchAssignments(): Promise<DomainAssignment[]>;

  /**
   * @function    fetchAssociations
   * @description Recupera todas las asociaciones de permisos (asociaciones positivas) activas.
   */
  fetchAssociations(): Promise<DomainAssociation[]>;

  /**
   * @function    fetchProhibitions
   * @description Recupera todas las prohibiciones directas (asociaciones negativas) activas.
   */
  fetchProhibitions(): Promise<DomainProhibition[]>;

  /**
   * @function    fetchMenuNodes
   * @description Recupera todos los nodos de menú activos.
   */
  fetchMenuNodes(): Promise<DomainMenuNode[]>;

  /**
   * @function    fetchMenuAssignments
   * @description Recupera todos los enlaces jerárquicos activos entre nodos de menú.
   */
  fetchMenuAssignments(): Promise<DomainMenuAssignment[]>;

  /**
   * @function    fetchPolicyMenuRoots
   * @description Recupera las relaciones de menú raíz asociadas a cada política.
   */
  fetchPolicyMenuRoots(): Promise<DomainPolicyMenuRoot[]>;

  /**
   * @function    fetchUserContext
   * @description Recupera los contextos organizacionales (entidades, unidades) del usuario de forma atómica.
   * @param       {string} username - Slug o identificador del usuario.
   */
  fetchUserContext(username: string): Promise<UserContext | null>;

  /**
   * @function    writeAccessLog
   * @description Registra un evento de auditoría de acceso en la base de datos de manera asíncrona.
   * @param       {AccessLogEntry} entry - Registro de auditoría.
   */
  writeAccessLog(entry: AccessLogEntry): Promise<void>;
}
