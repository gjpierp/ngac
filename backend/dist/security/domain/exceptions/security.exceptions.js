"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserNotFoundException = exports.CircularDependencyException = exports.NodeNotFoundException = exports.SecurityException = void 0;
class SecurityException extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.SecurityException = SecurityException;
class NodeNotFoundException extends SecurityException {
    constructor(identifier) {
        super(`El nodo solicitado no fue encontrado en el grafo: ${identifier}`);
    }
}
exports.NodeNotFoundException = NodeNotFoundException;
class CircularDependencyException extends SecurityException {
    constructor(parentId, childId) {
        super(`Se detectó una dependencia circular al enlazar el nodo padre ${parentId} con el nodo hijo ${childId}`);
    }
}
exports.CircularDependencyException = CircularDependencyException;
class UserNotFoundException extends SecurityException {
    constructor(username) {
        super(`El usuario solicitado no fue encontrado en el sistema: ${username}`);
    }
}
exports.UserNotFoundException = UserNotFoundException;
