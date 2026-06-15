/**
 * @file        AccessEvaluator.ts
 * @description Core del motor de decisiones NGAC. Evalúa permisos y genera menús contextuales.
 * @author      IA Assistant
 * @date        2026-06-09
 * @version     1.0.0
 * HISTORIAL DE CAMBIOS:
 * -----------------------------------------------------------------------------
 * FECHA        | AUTOR             | VERSIÓN   | DESCRIPCIÓN DEL CAMBIO
 * -----------------------------------------------------------------------------
 * 2026-06-09   | IA Assistant      | 1.0.0     | Creación inicial del archivo.
 */

import { NgacRepositoryPort, AccessLogEntry } from "../ports/outbound/NgacRepositoryPort";
import { OracleNgacRepositoryAdapter } from "../../infrastructure/adapters/outbound/OracleNgacRepositoryAdapter";
import { NgacGraphManager } from "./NgacGraphManager";

export class AccessEvaluator {
  private static instance: AccessEvaluator;
  private repository: NgacRepositoryPort;

  private constructor() {
    this.repository = new OracleNgacRepositoryAdapter();
  }

  /**
   * @function    getInstance
   * @description Recupera la instancia única del Singleton.
   */
  public static getInstance(): AccessEvaluator {
    if (!AccessEvaluator.instance) {
      AccessEvaluator.instance = new AccessEvaluator();
    }
    return AccessEvaluator.instance;
  }

  /**
   * @function    setRepository
   * @description Permite inyectar un repositorio mock para pruebas.
   */
  public setRepository(repo: NgacRepositoryPort): void {
    this.repository = repo;
  }

  /**
   * @function    checkAccess
   * @description Evalúa el acceso de un usuario a un objeto bajo una operación, cruzando datos SAFI.
   * @param       {string} usuarioSlug - Slug del usuario.
   * @param       {string} objetoCodigo - Código del objeto.
   * @param       {string} operacionNombre - Nombre de la operación.
   * @param       {any} [contextoJson] - Contexto dinámico opcional.
   * @returns     {Promise<number>} 1 si se autoriza, 0 si se deniega.
   */
  public async checkAccess(
    usuarioSlug: string,
    objetoCodigo: string,
    operacionNombre: string,
    contextoJson?: any
  ): Promise<number> {
    const graph = NgacGraphManager.getInstance();
    await graph.initialize();

    const normalizedUserSlug = String(usuarioSlug || "").trim().toLowerCase();
    const normalizedOp = String(operacionNombre || "").trim().toUpperCase();

    // 1. Identidad: Cargar datos SAFI del usuario
    const userCtx = await this.repository.fetchUserContext(normalizedUserSlug);
    if (!userCtx || !userCtx.active) {
      await this.logAccessAndAudit("DESCONOCIDO", objetoCodigo, normalizedOp, 0, contextoJson);
      return 0;
    }

    // Inyectar contextos organizacionales en el contexto JSON
    const mergedContext = contextoJson || {};
    if (!mergedContext.sujeto) mergedContext.sujeto = {};
    mergedContext.sujeto.usuario_id = String(userCtx.userId);
    mergedContext.sujeto.email = userCtx.email;
    if (userCtx.units.length > 0) {
      mergedContext.sujeto.division = userCtx.units[0];
    }

    // Resolver el ID del nodo del usuario en el grafo
    let userNodeId: number | undefined;
    try {
      userNodeId = graph.resolveNodeId(`USR_${userCtx.userId}`);
    } catch {
      // Búsqueda de fallback por slug
      for (const [id, node] of graph.nodes.entries()) {
        if (node.slug && node.slug.trim().toLowerCase() === normalizedUserSlug) {
          userNodeId = id;
          break;
        }
      }
    }

    if (!userNodeId) {
      await this.logAccessAndAudit(String(userCtx.userId), objetoCodigo, normalizedOp, 0, mergedContext);
      return 0;
    }

    // 2. Linaje de Usuario: Recolectar atributos de usuario (roles, unidades, entidades)
    const userAttributes = new Set<number>();
    userAttributes.add(userNodeId);

    // Inyectar roles asignados al usuario en el DAG (recorrido ascendente directo)
    const directParents = graph.childToParents.get(userNodeId);
    if (directParents) {
      for (const parentId of directParents) {
        const parent = graph.nodes.get(parentId);
        if (parent && (parent.typeCode === "USR_ATTR" || parent.code.startsWith("ROL_"))) {
          userAttributes.add(parentId);
        }
      }
    }

    // Inyectar entidades asociadas
    for (const entityCode of userCtx.entities) {
      try {
        const entityNodeId = graph.resolveNodeId(entityCode);
        userAttributes.add(entityNodeId);
      } catch {
        // Ignorar si el nodo de entidad no está definido en el grafo
      }
    }

    // Inyectar unidades asociadas
    for (const unitCode of userCtx.units) {
      try {
        const unitNodeId = graph.resolveNodeId(unitCode);
        userAttributes.add(unitNodeId);
      } catch {
        // Ignorar si el nodo de unidad no está definido en el grafo
      }
    }

    // Calcular el linaje completo de todos los ancestros de usuario en el DAG
    const userAncestors = new Set<number>();
    for (const attrId of userAttributes) {
      const ancestors = graph.getAncestors(attrId);
      for (const ancId of ancestors) {
        userAncestors.add(ancId);
      }
    }

    // 3. Resolución de Atributos de Objeto
    let objectNodeId: number;
    try {
      objectNodeId = graph.resolveNodeId(objetoCodigo);
    } catch {
      await this.logAccessAndAudit(String(userCtx.userId), objetoCodigo, normalizedOp, 0, mergedContext);
      return 0;
    }

    // Si el objeto consultado es una política y coincide con el tipo POLICY, se autoriza por defecto (cumple fn_verificar_acceso)
    const objectNode = graph.nodes.get(objectNodeId);
    if (objectNode && objectNode.typeId === graph.policyTypeId) {
      await this.logAccessAndAudit(String(userCtx.userId), objetoCodigo, normalizedOp, 1, mergedContext);
      return 1;
    }

    const objectAncestors = graph.getAncestors(objectNodeId);

    // 4. Evaluación de Excepciones (Prohibiciones - Deny-Overrides)
    // 4.1 Prohibiciones explícitas en ACC_PROHIBICIONES
    for (const usrAncId of userAncestors) {
      for (const objAncId of objectAncestors) {
        const key = `${usrAncId}_${objAncId}`;
        const pros = graph.prohibitions.get(key);
        if (pros) {
          const match = pros.some((pro) => pro.operationName === normalizedOp || pro.operationName === "DENEGAR");
          if (match) {
            await this.logAccessAndAudit(String(userCtx.userId), objetoCodigo, normalizedOp, 0, mergedContext);
            return 0;
          }
        }
      }
    }

    // 4.2 Prohibiciones por operación 'DENEGAR' en ACC_ASOCIACIONES
    for (const usrAncId of userAncestors) {
      for (const objAncId of objectAncestors) {
        const key = `${usrAncId}_${objAncId}`;
        const asos = graph.associations.get(key);
        if (asos) {
          const matchDeny = asos.some((aso) => aso.operationName === "DENEGAR");
          if (matchDeny) {
            await this.logAccessAndAudit(String(userCtx.userId), objetoCodigo, normalizedOp, 0, mergedContext);
            return 0;
          }
        }
      }
    }

    // 5. Evaluación de Políticas (Asociaciones)
    for (const usrAncId of userAncestors) {
      for (const objAncId of objectAncestors) {
        const key = `${usrAncId}_${objAncId}`;
        const asos = graph.associations.get(key);
        if (asos) {
          const matchingAsos = asos.filter((aso) => aso.operationName === normalizedOp);
          for (const aso of matchingAsos) {
            if (this.evaluateCondition(aso.conditionJson, mergedContext)) {
              await this.logAccessAndAudit(String(userCtx.userId), objetoCodigo, normalizedOp, 1, mergedContext);
              return 1;
            }
          }
        }
      }
    }

    // Denegado por defecto
    await this.logAccessAndAudit(String(userCtx.userId), objetoCodigo, normalizedOp, 0, mergedContext);
    return 0;
  }

  /**
   * @function    verificarAcceso
   * @description Método legacy para soportar compatibilidad con el array de atributos del frontend/controlador.
   */
  public async verificarAcceso(
    atributos: string[],
    operaciones: string[],
    objeto: string,
    contextoJson?: any
  ): Promise<number> {
    const graph = NgacGraphManager.getInstance();
    await graph.initialize();

    const normalizedOps = operaciones.map((op) => String(op || "").trim().toUpperCase()).filter((op) => !!op);
    const normalizedObject = String(objeto || "").trim();

    // Resolver atributos a IDs de nodos en el grafo
    const attrNodeIds = new Set<number>();
    for (const attr of atributos) {
      try {
        attrNodeIds.add(graph.resolveNodeId(attr));
      } catch {
        // Atributo no existente en el grafo, se ignora
      }
    }

    // Obtener ancestros acumulados de los atributos
    const userAncestors = new Set<number>();
    for (const attrId of attrNodeIds) {
      const ancestors = graph.getAncestors(attrId);
      for (const ancId of ancestors) {
        userAncestors.add(ancId);
      }
    }

    // Resolver objeto
    let objectNodeId: number;
    try {
      objectNodeId = graph.resolveNodeId(normalizedObject);
    } catch {
      await this.logAccessAndAudit("LEGACY_USER", normalizedObject, normalizedOps.join(","), 0, contextoJson);
      return 0;
    }

    const objectNode = graph.nodes.get(objectNodeId);
    if (objectNode && objectNode.typeId === graph.policyTypeId) {
      await this.logAccessAndAudit("LEGACY_USER", normalizedObject, normalizedOps.join(","), 1, contextoJson);
      return 1;
    }

    const objectAncestors = graph.getAncestors(objectNodeId);

    // Evaluar prohibiciones primero
    for (const usrAncId of userAncestors) {
      for (const objAncId of objectAncestors) {
        const key = `${usrAncId}_${objAncId}`;
        const pros = graph.prohibitions.get(key);
        if (pros) {
          const hasProh = pros.some((pro) => normalizedOps.includes(pro.operationName) || pro.operationName === "DENEGAR");
          if (hasProh) {
            await this.logAccessAndAudit("LEGACY_USER", normalizedObject, normalizedOps.join(","), 0, contextoJson);
            return 0;
          }
        }
      }
    }

    // Denegación implícita en asociaciones por operación DENEGAR
    for (const usrAncId of userAncestors) {
      for (const objAncId of objectAncestors) {
        const key = `${usrAncId}_${objAncId}`;
        const asos = graph.associations.get(key);
        if (asos) {
          const hasDeny = asos.some((aso) => aso.operationName === "DENEGAR");
          if (hasDeny) {
            await this.logAccessAndAudit("LEGACY_USER", normalizedObject, normalizedOps.join(","), 0, contextoJson);
            return 0;
          }
        }
      }
    }

    // Evaluar asociaciones positivas
    for (const usrAncId of userAncestors) {
      for (const objAncId of objectAncestors) {
        const key = `${usrAncId}_${objAncId}`;
        const asos = graph.associations.get(key);
        if (asos) {
          const matchingAsos = asos.filter((aso) => normalizedOps.includes(aso.operationName));
          for (const aso of matchingAsos) {
            if (this.evaluateCondition(aso.conditionJson, contextoJson)) {
              await this.logAccessAndAudit("LEGACY_USER", normalizedObject, normalizedOps.join(","), 1, contextoJson);
              return 1;
            }
          }
        }
      }
    }

    await this.logAccessAndAudit("LEGACY_USER", normalizedObject, normalizedOps.join(","), 0, contextoJson);
    return 0;
  }

  /**
   * @function    getMenuByContext
   * @description Reemplaza a pkg_seguridad_ngac.fn_obtener_menu_json. Genera el menú dinámico recursivamente.
   */
  public async getMenuByContext(atributosContext: string): Promise<any> {
    const graph = NgacGraphManager.getInstance();
    await graph.initialize();

    let contextPayload: any;
    try {
      contextPayload = JSON.parse(atributosContext);
    } catch {
      return { error: "JSON Inválido", detalle: "Error al parsear atributosContext" };
    }

    // 1. Extraer atributos, operaciones y políticas
    const extractedAttributes = this.extractAttributesFromContext(contextPayload);
    const operationNames = new Set<string>();
    const isRequestEmptyOps = !contextPayload.solicitud?.operaciones;

    if (contextPayload.solicitud?.operaciones) {
      const ops = Array.isArray(contextPayload.solicitud.operaciones)
        ? contextPayload.solicitud.operaciones
        : [contextPayload.solicitud.operaciones];
      for (const op of ops) {
        if (op) operationNames.add(String(op).trim().toUpperCase());
      }
    }

    const policyNodeIds = new Set<number>();
    if (contextPayload.contexto?.politicas) {
      const pols = Array.isArray(contextPayload.contexto.politicas)
        ? contextPayload.contexto.politicas
        : [contextPayload.contexto.politicas];
      for (const pol of pols) {
        if (pol) {
          try {
            policyNodeIds.add(graph.resolveNodeId(pol));
          } catch {
            // Ignorar políticas que no existan
          }
        }
      }
    }

    // 2. Resolver los IDs de nodos de los atributos ingresados
    const attrNodeIds = new Set<number>();
    for (const attr of extractedAttributes) {
      try {
        attrNodeIds.add(graph.resolveNodeId(attr));
      } catch {
        // Ignorar atributos no cargados en el grafo
      }
    }

    // 3. Determinar los roles inyectados desde el sujeto (sujeto.roles)
    const roleNodeIds = new Set<number>();
    if (contextPayload.sujeto?.roles) {
      const roles = Array.isArray(contextPayload.sujeto.roles) ? contextPayload.sujeto.roles : [contextPayload.sujeto.roles];
      for (const role of roles) {
        if (role) {
          try {
            roleNodeIds.add(graph.resolveNodeId(role));
          } catch {
            // Ignorar roles no existentes
          }
        }
      }
    }

    // 4. Precalcular permisos (nodos autorizados) propagados en memoria
    const userAncestors = new Set<number>();
    for (const attrId of attrNodeIds) {
      const ancestors = graph.getAncestors(attrId);
      for (const ancId of ancestors) {
        userAncestors.add(ancId);
      }
    }

    // Precalcular denegaciones
    const deniedObjectAttributeIds = new Set<number>();
    for (const attrId of attrNodeIds) {
      for (const [key, asos] of graph.associations.entries()) {
        if (key.startsWith(`${attrId}_`)) {
          const hasDeny = asos.some((aso) => aso.operationName === "DENEGAR");
          if (hasDeny) {
            const objAttrId = Number(key.split("_")[1]);
            deniedObjectAttributeIds.add(objAttrId);
          }
        }
      }
    }

    const verifyNodeAccessInMemory = (nodeId: number, isPolicy: boolean): boolean => {
      if (isPolicy) return true;
      const objectAncestors = graph.getAncestors(nodeId);

      // Deny-Overrides
      for (const objAncId of objectAncestors) {
        if (deniedObjectAttributeIds.has(objAncId)) return false;
      }
      for (const usrAncId of userAncestors) {
        for (const objAncId of objectAncestors) {
          const key = `${usrAncId}_${objAncId}`;
          const pros = graph.prohibitions.get(key);
          if (pros) {
            const hasProh = pros.some((pro) => operationNames.has(pro.operationName) || pro.operationName === "DENEGAR");
            if (hasProh) return false;
          }
        }
      }

      // Asociaciones positivas
      for (const usrAncId of userAncestors) {
        for (const objAncId of objectAncestors) {
          const key = `${usrAncId}_${objAncId}`;
          const asos = graph.associations.get(key);
          if (asos) {
            const matchingAsos = isRequestEmptyOps
              ? asos
              : asos.filter((aso) => operationNames.has(aso.operationName));
            for (const aso of matchingAsos) {
              if (this.evaluateCondition(aso.conditionJson, contextPayload)) {
                return true;
              }
            }
          }
        }
      }
      return false;
    };

    const permittedNodeIds = new Set<number>();
    for (const [nodeId, node] of graph.nodes.entries()) {
      const isPolicy = node.typeId === graph.policyTypeId;
      if (isRequestEmptyOps || verifyNodeAccessInMemory(nodeId, isPolicy)) {
        permittedNodeIds.add(nodeId);
      }
    }

    // Propagar permisos hacia arriba (si el hijo está permitido, el padre también)
    let changed = true;
    while (changed) {
      changed = false;
      for (const [parentId, childSet] of graph.parentToChildren.entries()) {
        if (graph.nodes.has(parentId) && !permittedNodeIds.has(parentId)) {
          for (const childId of childSet) {
            if (permittedNodeIds.has(childId)) {
              permittedNodeIds.add(parentId);
              changed = true;
              break;
            }
          }
        }
      }
    }

    // 5. Resolver la raíces de menú permitidas por el contexto
    const rootMenuIds = new Set<number>();
    const requestModules = contextPayload.solicitud?.modulos;

    if (Array.isArray(requestModules) && requestModules.length > 0) {
      // Filtrar menús cuyo nodo técnico coincida con los módulos solicitados y estén permitidos
      const matchClaims = (menuNode: any, claim: string): boolean => {
        const trimmed = claim.trim();
        if (/^[0-9]+$/.test(trimmed)) {
          const num = Number(trimmed);
          return menuNode.idMenuNode === num || menuNode.idNode === num;
        }
        return menuNode.code.toUpperCase() === trimmed.toUpperCase();
      };

      for (const [menuId, mn] of graph.menuNodes.entries()) {
        if (permittedNodeIds.has(mn.idNode)) {
          const matches = requestModules.some((moduleCode) => matchClaims(mn, String(moduleCode)));
          if (matches) {
            rootMenuIds.add(menuId);
          }
        }
      }
    } else if (policyNodeIds.size > 0) {
      // Menú raíz según las políticas del contexto
      for (const policyId of policyNodeIds) {
        const roots = graph.policyMenuRoots.get(policyId);
        if (roots) {
          for (const rootMenuId of roots) {
            rootMenuIds.add(rootMenuId);
          }
        }
      }
    } else {
      // Sin filtros: Menús que no tienen padre en la estructura de menú
      for (const [menuId, mn] of graph.menuNodes.entries()) {
        const parents = graph.menuChildToParents.get(menuId);
        if (!parents || parents.size === 0) {
          rootMenuIds.add(menuId);
        }
      }
    }

    // 6. Construcción recursiva del árbol de menú JSON
    const checkDirectMenuPermission = (nodeId: number): boolean => {
      const objectAncestors = graph.getAncestors(nodeId);
      for (const objAncId of objectAncestors) {
        if (deniedObjectAttributeIds.has(objAncId)) return false;
      }

      const activeAttributes = roleNodeIds.size > 0 ? roleNodeIds : attrNodeIds;
      for (const attrId of activeAttributes) {
        const key = `${attrId}_${nodeId}`;
        const asos = graph.associations.get(key);
        if (asos) {
          const matchingAsos = isRequestEmptyOps
            ? asos
            : asos.filter((aso) => operationNames.has(aso.operationName));
          for (const aso of matchingAsos) {
            if (aso.operationName === "DENEGAR") return false;
            if (this.evaluateCondition(aso.conditionJson, contextPayload)) {
              return true;
            }
          }
        }
      }
      return false;
    };

    const visitedMenuIds = new Set<number>();

    const buildMenuJson = (menuId: number, forceInclude: boolean = false): any | null => {
      if (visitedMenuIds.has(menuId)) return null;
      visitedMenuIds.add(menuId);

      const mn = graph.menuNodes.get(menuId);
      if (!mn) return null;

      const hasDirectPermission = checkDirectMenuPermission(mn.idNode);
      const childMenuIds = graph.menuParentToChildren.get(menuId);
      const builtChildren: any[] = [];

      if (childMenuIds) {
        const sortedChildren = Array.from(childMenuIds).map((cId) => graph.menuNodes.get(cId)).filter((node) => !!node) as any[];
        sortedChildren.sort((a, b) => a.displayOrder - b.displayOrder);

        for (const childNode of sortedChildren) {
          const childJson = buildMenuJson(childNode.idMenuNode);
          if (childJson !== null) {
            builtChildren.push(childJson);
          }
        }
      }

      const hasChildren = builtChildren.length > 0;
      if (hasDirectPermission || hasChildren || forceInclude) {
        const menuObj: any = {
          id: mn.idNode,
          codigo: mn.code,
          etiqueta: mn.label,
          slug: mn.slug || "",
          icono: mn.icon || "",
          descripcion: mn.description || "",
          ruta: mn.urlPath || "",
          orden: mn.displayOrder,
          activo: mn.active ? "S" : "N"
        };
        if (hasChildren) {
          menuObj.hijos = builtChildren;
        }
        return menuObj;
      }

      return null;
    };

    const finalMenuTree: any[] = [];
    const forceIncludeRoots = Array.isArray(requestModules) && requestModules.length > 0;

    // Ordenar raíces
    const sortedRoots = Array.from(rootMenuIds).map((rId) => graph.menuNodes.get(rId)).filter((node) => !!node) as any[];
    sortedRoots.sort((a, b) => a.displayOrder - b.displayOrder);

    for (const root of sortedRoots) {
      const rootJson = buildMenuJson(root.idMenuNode, forceIncludeRoots);
      if (rootJson !== null) {
        finalMenuTree.push(rootJson);
      }
    }

    // Registrar logs de auditoría de generación
    const username = contextPayload.sujeto?.usuario_id || contextPayload.sujeto?.username || "SYSTEM";
    await this.logAccessAndAudit(String(username), "MENU_GENERATION", "VER", 1, contextPayload);

    return {
      ...contextPayload,
      menu: finalMenuTree
    };
  }

  /**
   * @function    evaluateCondition
   * @description Evalúa de forma segura la expresión boolean ABAC mapeando los parámetros dinámicos.
   */
  private evaluateCondition(condition: string | undefined, context: any): boolean {
    if (!condition || !condition.trim()) return true;

    let evalExpr = condition;
    evalExpr = evalExpr.replace(/:([a-zA-Z0-9_]+)/g, (match, paramName) => {
      if (context?.sujeto && paramName in context.sujeto) {
        const val = context.sujeto[paramName];
        return typeof val === "string" ? `'${val}'` : String(val);
      }
      if (context?.contexto && paramName in context.contexto) {
        const val = context.contexto[paramName];
        return typeof val === "string" ? `'${val}'` : String(val);
      }
      if (context?.solicitud && paramName in context.solicitud) {
        const val = context.solicitud[paramName];
        return typeof val === "string" ? `'${val}'` : String(val);
      }
      return "undefined";
    });

    try {
      const fn = new Function("return " + evalExpr);
      return !!fn();
    } catch {
      console.error(`[AccessEvaluator] Error evaluando la expresión ABAC "${condition}". Evaluada como: "${evalExpr}"`);
      return false;
    }
  }

  /**
   * @function    extractAttributesFromContext
   * @description Extrae recursivamente todos los atributos declarados en el JSON de contexto.
   */
  private extractAttributesFromContext(context: any): string[] {
    const attrs: string[] = [];
    if (!context) return attrs;

    if (context.sujeto) {
      if (context.sujeto.usuario_id) attrs.push(String(context.sujeto.usuario_id));
      if (Array.isArray(context.sujeto.roles)) {
        attrs.push(...context.sujeto.roles.map((r: any) => String(r)));
      }
    }
    if (context.contexto) {
      if (Array.isArray(context.contexto.politicas)) {
        attrs.push(...context.contexto.politicas.map((p: any) => String(p)));
      }
    }
    if (context.solicitud) {
      if (Array.isArray(context.solicitud.modulos)) {
        attrs.push(...context.solicitud.modulos.map((m: any) => String(m)));
      }
    }
    if (Array.isArray(context.atributos)) {
      attrs.push(...context.atributos.map((a: any) => String(a)));
    }
    return attrs.map((a) => a.trim()).filter((a) => !!a);
  }

  /**
   * @function    logAccessAndAudit
   * @description Encapsula y delega el registro asíncrono en acc_log_accesos sin bloquear.
   */
  private async logAccessAndAudit(
    username: string,
    objectCode: string,
    operations: string,
    authorized: number,
    context: any
  ): Promise<void> {
    const entry: AccessLogEntry = {
      username,
      objectCode,
      operations,
      authorized,
      contextJson: context ? JSON.stringify(context) : null
    };

    // Ejecución asíncrona no bloqueante
    this.repository.writeAccessLog(entry).catch((err) => {
      console.error("[AccessEvaluator] Error al escribir auditoría asíncrona:", err);
    });
  }
}
