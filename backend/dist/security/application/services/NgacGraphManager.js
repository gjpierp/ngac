"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NgacGraphManager = void 0;
const OracleNgacRepositoryAdapter_1 = require("../../infrastructure/adapters/outbound/OracleNgacRepositoryAdapter");
const security_exceptions_1 = require("../../domain/exceptions/security.exceptions");
class NgacGraphManager {
    static instance;
    // Repositorio por defecto
    repository;
    // Estructuras en memoria para el Grafo (DAG)
    nodes = new Map();
    nodeIdByCode = new Map();
    parentToChildren = new Map();
    childToParents = new Map();
    // Estructuras en memoria para Asociaciones y Prohibiciones
    // Llave: "idUsrAttr_idObjAttr"
    associations = new Map();
    prohibitions = new Map();
    // Estructuras en memoria para el Menú
    menuNodes = new Map();
    menuNodeIdByNodeId = new Map();
    menuParentToChildren = new Map();
    menuChildToParents = new Map();
    policyMenuRoots = new Map();
    // IDs de tipos de nodo especiales
    policyTypeId = -1;
    objectTypeId = -1;
    objectAttributeTypeId = -1;
    isInitialized = false;
    constructor() {
        this.repository = new OracleNgacRepositoryAdapter_1.OracleNgacRepositoryAdapter();
    }
    /**
     * @function    getInstance
     * @description Recupera la instancia única del Singleton.
     */
    static getInstance() {
        if (!NgacGraphManager.instance) {
            NgacGraphManager.instance = new NgacGraphManager();
        }
        return NgacGraphManager.instance;
    }
    /**
     * @function    setRepository
     * @description Permite inyectar un repositorio mock (útil para pruebas).
     */
    setRepository(repo) {
        this.repository = repo;
        this.isInitialized = false;
    }
    /**
     * @function    initialize
     * @description Carga el grafo si no está inicializado.
     */
    async initialize() {
        if (!this.isInitialized) {
            await this.refreshGraph();
        }
    }
    /**
     * @function    refreshGraph
     * @description Carga o recarga la totalidad del grafo en memoria desde la persistencia de forma atómica.
     */
    async refreshGraph() {
        const [nodes, assignments, associations, prohibitions, menuNodes, menuAssignments, policyMenuRoots] = await Promise.all([
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
            }
            else if (node.typeCode === "OBJETO") {
                this.objectTypeId = node.typeId;
            }
            else if (node.typeCode === "OBJ_ATTR") {
                this.objectAttributeTypeId = node.typeId;
            }
        }
        // 3. Poblar asignaciones jerárquicas
        for (const edge of assignments) {
            if (!this.parentToChildren.has(edge.parentId)) {
                this.parentToChildren.set(edge.parentId, new Set());
            }
            this.parentToChildren.get(edge.parentId).add(edge.childId);
            if (!this.childToParents.has(edge.childId)) {
                this.childToParents.set(edge.childId, new Set());
            }
            this.childToParents.get(edge.childId).add(edge.parentId);
        }
        // 4. Poblar asociaciones de permisos
        this.associations.clear();
        for (const aso of associations) {
            const key = `${aso.userAttributeId}_${aso.objectAttributeId}`;
            if (!this.associations.has(key)) {
                this.associations.set(key, []);
            }
            this.associations.get(key).push(aso);
        }
        // 5. Poblar prohibiciones
        this.prohibitions.clear();
        for (const pro of prohibitions) {
            const key = `${pro.userAttributeId}_${pro.objectAttributeId}`;
            if (!this.prohibitions.has(key)) {
                this.prohibitions.set(key, []);
            }
            this.prohibitions.get(key).push(pro);
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
            this.menuParentToChildren.get(edge.parentMenuId).add(edge.childMenuId);
            if (!this.menuChildToParents.has(edge.childMenuId)) {
                this.menuChildToParents.set(edge.childMenuId, new Set());
            }
            this.menuChildToParents.get(edge.childMenuId).add(edge.parentMenuId);
        }
        for (const root of policyMenuRoots) {
            if (!this.policyMenuRoots.has(root.policyId)) {
                this.policyMenuRoots.set(root.policyId, new Set());
            }
            this.policyMenuRoots.get(root.policyId).add(root.menuNodeId);
        }
        this.isInitialized = true;
    }
    /**
     * @function    getAncestors
     * @description Resuelve de forma transitiva todos los ancestros de un nodo (recorrido ascendente).
     * @param       {number} nodeId - ID del nodo inicial.
     * @returns     {Set<number>} Conjunto de IDs de nodos ancestros (incluyendo el nodo inicial).
     */
    getAncestors(nodeId) {
        const ancestors = new Set();
        const queue = [nodeId];
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
    getDescendants(nodeId) {
        const descendants = new Set();
        const queue = [nodeId];
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
    resolveNodeId(identifier) {
        if (typeof identifier === "number") {
            if (this.nodes.has(identifier))
                return identifier;
        }
        else {
            const trimmed = String(identifier).trim();
            const num = Number(trimmed);
            if (!isNaN(num) && this.nodes.has(num))
                return num;
            const codeUpper = trimmed.toUpperCase();
            const resolved = this.nodeIdByCode.get(codeUpper);
            if (resolved !== undefined)
                return resolved;
        }
        throw new security_exceptions_1.NodeNotFoundException(identifier);
    }
}
exports.NgacGraphManager = NgacGraphManager;
