/**
 * @file        security.exceptions.ts
 * @description Excepciones personalizadas para el dominio de seguridad y NGAC.
 * @author      IA Assistant
 * @date        2026-06-09
 * @version     1.0.0
 * HISTORIAL DE CAMBIOS:
 * -----------------------------------------------------------------------------
 * FECHA        | AUTOR             | VERSIÓN   | DESCRIPCIÓN DEL CAMBIO
 * -----------------------------------------------------------------------------
 * 2026-06-09   | IA Assistant      | 1.0.0     | Creación inicial del archivo.
 */

export class SecurityException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NodeNotFoundException extends SecurityException {
  constructor(identifier: string | number) {
    super(`El nodo solicitado no fue encontrado en el grafo: ${identifier}`);
  }
}

export class CircularDependencyException extends SecurityException {
  constructor(parentId: number, childId: number) {
    super(`Se detectó una dependencia circular al enlazar el nodo padre ${parentId} con el nodo hijo ${childId}`);
  }
}

export class UserNotFoundException extends SecurityException {
  constructor(username: string) {
    super(`El usuario solicitado no fue encontrado en el sistema: ${username}`);
  }
}
