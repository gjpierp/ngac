"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NgacAdminService = void 0;
const oracledb_1 = __importDefault(require("oracledb"));
const db_config_1 = require("../config/db.config");
const AccessEvaluator_1 = require("../security/application/services/AccessEvaluator");
const NgacGraphManager_1 = require("../security/application/services/NgacGraphManager");
function mapMenuCursorRows(rows) {
    return (rows || []).map((row) => ({
        id: Number(row.ID ?? row.id ?? row.ID_NODO ?? row.id_nodo ?? 0),
        nombre: String(row.NOMBRE ?? row.nombre ?? row.ETIQUETA ?? row.etiqueta ?? ""),
        descripcion: row.DESCRIPCION ?? row.descripcion ?? row.DESC ?? row.desc ?? undefined,
        tieneHijos: Boolean(row.TIENE_HIJOS ?? row.tiene_hijos ?? row.TIENEHIJOS ?? row.tieneHijos),
    }));
}
/**
 * =============================================================================================================
 * @file        ngac-admin.service.ts
 * @description Servicio principal de administración NGAC/SAFI. Expone métodos agrupados por package PL/SQL y funcionalidad.
 * @author      Gerardo Paiva G.
 * @convencion  Cada sección está documentada y separada por package y dominio funcional.
 * =============================================================================================================
 */
class NgacAdminService {
    /**
     * @function    verificarAcceso
     * @description  Llama a la función fn_verificar_acceso con operaciones como JSON Array.
     * @param       {string[]} atributos - Array de atributos (ej: ["unidad:HOSP"])
     * @param       {string[]} operaciones - Array de operaciones (ej: ["VER", "CREAR"])
     * @param       {string} objeto - Objeto de acceso
     * @param       {object} [contextoJson] - Contexto adicional (opcional)
     * @returns     {Promise<number>} Resultado de acceso (0 = denegado, 1 = permitido)
     */
    static async verificarAcceso(atributos, operaciones, objeto, contextoJson) {
        return await AccessEvaluator_1.AccessEvaluator.getInstance().verificarAcceso(atributos, operaciones, objeto, contextoJson);
    }
    /**
     * =============================================================================================
     * 1. FUNCIONES Y PROCEDIMIENTOS: PKG_SEGURIDAD_NGAC
     * ---------------------------------------------------------------------------------------------
     * Motor de decisión central para la gestión de accesos y generación dinámica de menús JSON.
     * Toda lógica de autorización y menú debe invocar primero el package PL/SQL correspondiente.
     * =============================================================================================
     */
    /**
     * @function    getMenuByContext
     * @description Genera el menú dinámico en formato JSON según el contexto recibido.
     * @param       {string} atributosContext - Contexto de usuario y políticas en formato JSON (CLOB).
     * @returns     {Promise<any>} Menú generado en formato JSON.
     */
    static async getMenuByContext(atributosContext) {
        return await AccessEvaluator_1.AccessEvaluator.getInstance().getMenuByContext(atributosContext);
    }
    /**
     * =============================================================================================
     * 2. FUNCIONES Y PROCEDIMIENTOS: PKG_SEGURIDAD_ADMIN
     * ---------------------------------------------------------------------------------------------
     * Gestión de nodos, roles, permisos, logs, operaciones, tipos de nodo, enlaces y políticas.
     * Toda manipulación de la estructura de seguridad debe pasar por este package.
     * =============================================================================================
     */
    /**
     * @function    getDashboardStats
     * @description Obtiene estadísticas globales del dashboard de seguridad desde el package PL/SQL.
     * @returns     {Promise<any>} Objeto con los conteos de nodos, asignaciones, asociaciones, prohibiciones, logs, operaciones y tipos de nodo.
     */
    static async getDashboardStats() {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            const result = await connection.execute(`BEGIN :cursor := pkg_seguridad_admin.fn_get_dashboard_stats(); END;`, { cursor: { type: oracledb_1.default.CURSOR, dir: oracledb_1.default.BIND_OUT } }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
            const rs = result.outBinds.cursor;
            const rows = await rs.getRows();
            await rs.close();
            const dbRow = rows && rows[0] ? rows[0] : {};
            const normalizedRow = {};
            for (const key of Object.keys(dbRow)) {
                normalizedRow[key.toUpperCase()] = dbRow[key];
            }
            return {
                acc_nodos: normalizedRow.TOTAL_NODOS ?? normalizedRow.ACC_NODOS ?? 0,
                acc_roles: normalizedRow.ACC_ROLES ?? 0,
                acc_asignaciones: normalizedRow.ASIGNACIONES_JERARQUICAS ??
                    normalizedRow.ACC_ASIGNACIONES ??
                    0,
                acc_asociaciones: normalizedRow.ASOCIACIONES_PERMISOS ??
                    normalizedRow.ACC_ASOCIACIONES ??
                    0,
                acc_prohibiciones: normalizedRow.ACC_PROHIBICIONES ?? 0,
                acc_log_errores: normalizedRow.ERRORES_RECIENTES ?? normalizedRow.ACC_LOG_ERRORES ?? 0,
                acc_operaciones: normalizedRow.TOTAL_OPERACIONES ?? 0,
                acc_tipos_nodo: normalizedRow.TOTAL_TIPOS_NODO ?? 0,
            };
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    getTree
     * @description Obtiene el árbol de nodos y enlaces, filtrando por rol base si corresponde.
     * @param       {string} [rolBase] - Rol base para filtrar los nodos permitidos (opcional).
     * @returns     {Promise<AccNodo[]>} Árbol de nodos estructurado.
     */
    static async getTree(rolBase) {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            const nodosResult = await connection.execute(`BEGIN :cursor := pkg_seguridad_admin.fn_get_modulos_raiz_nodos(); END;`, { cursor: { type: oracledb_1.default.CURSOR, dir: oracledb_1.default.BIND_OUT } }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
            const rsNodos = nodosResult.outBinds.cursor;
            const nodos = (await rsNodos.getRows()) || [];
            await rsNodos.close();
            const linksResult = await connection.execute(`BEGIN :cursor := pkg_seguridad_admin.fn_get_modulos_raiz_links(); END;`, { cursor: { type: oracledb_1.default.CURSOR, dir: oracledb_1.default.BIND_OUT } }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
            const rsLinks = linksResult.outBinds.cursor;
            const links = (await rsLinks.getRows()) || [];
            await rsLinks.close();
            let allowedIds = null;
            if (rolBase) {
                const resolvedRolBase = await this.resolveNodeCode(rolBase);
                const permisosResult = await connection.execute(`BEGIN :cursor := pkg_seguridad_admin.fn_get_permisos_rol(:rolBase); END;`, {
                    rolBase: resolvedRolBase,
                    cursor: { type: oracledb_1.default.CURSOR, dir: oracledb_1.default.BIND_OUT },
                }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
                const rsPermisos = permisosResult.outBinds.cursor;
                const permisos = (await rsPermisos.getRows()) || [];
                await rsPermisos.close();
                allowedIds = new Set(permisos.map((r) => r.ID_OBJ_ATTR));
            }
            const nodoMap = new Map();
            const childIds = new Set();
            nodos.forEach((n) => {
                nodoMap.set(n.ID_NODO, {
                    id_nodo: n.ID_NODO,
                    codigo_tecnico: n.CODIGO_TECNICO,
                    etiqueta: n.ETIQUETA,
                    id_tipo_nodo: n.ID_TIPO_NODO,
                    tipo_nodo: n.TIPO_NODO,
                    url_ruta: n.URL_RUTA,
                    slug: n.SLUG,
                    icono: n.ICONO,
                    orden_visual: n.ORDEN_VISUAL,
                    activo: n.ACTIVO,
                    children: [],
                });
            });
            links.forEach((l) => {
                const padre = nodoMap.get(l.ID_PADRE);
                const hijo = nodoMap.get(l.ID_HIJO);
                if (padre && hijo) {
                    padre.children.push(hijo);
                    childIds.add(hijo.id_nodo);
                }
            });
            const pruneTree = (node) => {
                if (!node.children)
                    return false;
                node.children = node.children.filter((child) => pruneTree(child));
                return ((allowedIds !== null && allowedIds.has(node.id_nodo)) ||
                    node.children.length > 0);
            };
            let roots = [];
            nodoMap.forEach((nodo) => {
                if (nodo.children && nodo.children.length > 0) {
                    nodo.children.sort((a, b) => (a.orden_visual || 0) - (b.orden_visual || 0));
                }
                if (!childIds.has(nodo.id_nodo)) {
                    roots.push(nodo);
                }
            });
            if (allowedIds !== null) {
                roots = roots.filter((root) => pruneTree(root));
            }
            roots.sort((a, b) => (a.orden_visual || 0) - (b.orden_visual || 0));
            return roots;
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    upsertNodo
     * @description Inserta o actualiza un nodo en la estructura de seguridad.
     * @param       {UpsertNodoDto} dto - Datos del nodo a insertar o actualizar.
     * @returns     {Promise<void>}
     */
    static async upsertNodo(dto) {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            const idTipoNodo = dto.id_tipo_nodo
                ? dto.id_tipo_nodo
                : await this.resolveTypeId(dto.tipo);
            await connection.execute(`BEGIN pkg_seguridad_admin.p_upsert_nodo(:id_nodo, :codigo, :etiqueta, :id_tipo_nodo, :ruta, :slug, :icono, :descripcion, :orden, :activo); END;`, {
                id_nodo: dto.id_nodo || null,
                codigo: dto.codigo,
                etiqueta: dto.etiqueta,
                id_tipo_nodo: idTipoNodo,
                ruta: dto.ruta || null,
                slug: dto.slug || null,
                icono: dto.icono || null,
                descripcion: dto.descripcion || null,
                orden: dto.orden || 0,
                activo: dto.activo || "S",
            }, { autoCommit: true });
            const id_nodo = dto.id_nodo || (await this.resolveNodeId(dto.codigo));
            return { id_nodo };
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    crearYEnlazarNodo
     * @description Crea o actualiza un nodo y opcionalmente lo enlaza a un padre en el menú en una sola transacción atómica.
     * @param       {UpsertNodoDto} dto - Datos del nodo a procesar.
     * @param       {number | string} [padre] - Identificador (ID o código) del nodo padre.
     * @returns     {Promise<{ id_nodo: number }>} ID del nodo procesado.
     */
    static async crearYEnlazarNodo(dto, padre) {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            const idTipoNodo = dto.id_tipo_nodo
                ? dto.id_tipo_nodo
                : await this.resolveTypeId(dto.tipo);
            // 1. Ejecutar upsert del nodo (sin autoCommit)
            await connection.execute(`BEGIN pkg_seguridad_admin.p_upsert_nodo(:id_nodo, :codigo, :etiqueta, :id_tipo_nodo, :ruta, :slug, :icono, :descripcion, :orden, :activo); END;`, {
                id_nodo: dto.id_nodo || null,
                codigo: dto.codigo,
                etiqueta: dto.etiqueta,
                id_tipo_nodo: idTipoNodo,
                ruta: dto.ruta || null,
                slug: dto.slug || null,
                icono: dto.icono || null,
                descripcion: dto.descripcion || null,
                orden: dto.orden || 0,
                activo: dto.activo || "S",
            }, { autoCommit: false });
            // 2. Obtener el ID del nodo procesado
            let id_nodo = dto.id_nodo;
            if (!id_nodo) {
                const resId = await connection.execute(`BEGIN :id := pkg_seguridad_admin.fn_resolve_node_id(:code); END;`, {
                    code: String(dto.codigo).trim().toUpperCase(),
                    id: { type: oracledb_1.default.NUMBER, dir: oracledb_1.default.BIND_OUT },
                });
                id_nodo = resId.outBinds.id || 0;
            }
            if (!id_nodo) {
                throw new Error("No se pudo resolver el ID del nodo creado");
            }
            // 3. Enlazar al padre si existe
            if (padre) {
                let padreId;
                const numPadre = Number(padre);
                if (!isNaN(numPadre)) {
                    padreId = numPadre;
                }
                else {
                    const resPadre = await connection.execute(`BEGIN :id := pkg_seguridad_admin.fn_resolve_node_id(:code); END;`, {
                        code: String(padre).trim().toUpperCase(),
                        id: { type: oracledb_1.default.NUMBER, dir: oracledb_1.default.BIND_OUT },
                    });
                    padreId = resPadre.outBinds.id || 0;
                }
                if (!padreId) {
                    throw new Error(`No se pudo resolver el ID del nodo padre: ${padre}`);
                }
                await connection.execute(`BEGIN pkg_seguridad_admin.p_enlazar_menu_nodos(:padre, :hijo); END;`, { padre: padreId, hijo: id_nodo }, { autoCommit: false });
            }
            // 4. Confirmar transacción
            await connection.commit();
            return { id_nodo };
        }
        catch (err) {
            // Rollback en caso de error
            await connection.rollback();
            throw err;
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    deactivateNodo
     * @description Desactiva un nodo por su identificador.
     * @param       {number} id - ID del nodo a desactivar.
     * @returns     {Promise<void>}
     */
    static async deactivateNodo(id) {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            await connection.execute(`BEGIN pkg_seguridad_admin.p_desactivar_nodo(:id); END;`, { id }, { autoCommit: true });
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    enlazarNodos
     * @description Crea un enlace (asignación) entre dos nodos (padre e hijo).
     * @param       {EnlazarNodoDto} dto - Datos de los nodos a enlazar (padre e hijo).
     * @returns     {Promise<void>}
     */
    static async enlazarNodos(dto) {
        const padreId = await this.resolveNodeId(dto.padre);
        const hijoId = await this.resolveNodeId(dto.hijo);
        if (!padreId || !hijoId) {
            throw new Error(`No se pudo resolver el ID del nodo para uno de los elementos: padre=${dto.padre} (ID: ${padreId}), hijo=${dto.hijo} (ID: ${hijoId})`);
        }
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            await connection.execute(`BEGIN pkg_seguridad_admin.p_enlazar_nodos(:padre, :hijo); END;`, { padre: padreId, hijo: hijoId }, { autoCommit: true });
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    getEnlaces
     * @description Obtiene todos los enlaces (asignaciones/asociaciones) entre nodos.
     * @returns     {Promise<any[]>} Lista de enlaces entre nodos.
     */
    static async getEnlaces() {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            const result = await connection.execute(`BEGIN :cursor := pkg_seguridad_admin.fn_get_enlaces(); END;`, { cursor: { type: oracledb_1.default.CURSOR, dir: oracledb_1.default.BIND_OUT } }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
            const rs = result.outBinds.cursor;
            const rows = await rs.getRows();
            await rs.close();
            const enlaces = (rows || []).map((row) => ({
                id_asignacion: row.ID_ASIGNACION || row.id_asignacion,
                id_padre: row.ID_PADRE || row.id_padre,
                id_hijo: row.ID_HIJO || row.id_hijo,
                padre: row.PADRE || row.padre,
                hijo: row.HIJO || row.hijo,
            }));
            // Agregar enlaces estructurales de Política -> Nodos Raíz
            const policyRootsResult = await connection.execute(`
        SELECT pmr.id_policy as ID_PADRE, mn.id_nodo as ID_HIJO
        FROM acc_policy_menu_raices pmr
        JOIN acc_menu_nodos mn ON mn.id_menu_nodo = pmr.id_menu_nodo
        WHERE pmr.activo = 'S'
      `, [], { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
            const policyRoots = (policyRootsResult.rows || []).map((row) => ({
                id_asignacion: null,
                id_padre: row.ID_PADRE,
                id_hijo: row.ID_HIJO,
                padre: null,
                hijo: null
            }));
            return [...enlaces, ...policyRoots];
        }
        finally {
            await connection.close();
        }
    }
    static async getMenuEnlaces() {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            const result = await connection.execute(`BEGIN :cursor := pkg_seguridad_admin.fn_get_menu_enlaces(); END;`, { cursor: { type: oracledb_1.default.CURSOR, dir: oracledb_1.default.BIND_OUT } }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
            const rs = result.outBinds.cursor;
            const rows = await rs.getRows();
            await rs.close();
            return (rows || []).map((row) => ({
                id_menu_asignacion: row.ID_MENU_ASIGNACION || row.id_menu_asignacion,
                id_padre: row.ID_PADRE || row.id_padre,
                id_hijo: row.ID_HIJO || row.id_hijo,
                padre: row.PADRE || row.padre,
                hijo: row.HIJO || row.hijo,
                padre_etiqueta: row.PADRE_ETIQUETA || row.padre_etiqueta,
                hijo_etiqueta: row.HIJO_ETIQUETA || row.hijo_etiqueta,
            }));
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    deleteEnlace
     * @description Elimina un enlace (asignación) entre dos nodos.
     * @param       {EnlazarNodoDto} dto - Datos de los nodos a desenlazar (padre e hijo).
     * @returns     {Promise<void>}
     */
    static async deleteEnlace(dto) {
        const padreId = await this.resolveNodeId(dto.padre);
        const hijoId = await this.resolveNodeId(dto.hijo);
        if (!padreId || !hijoId) {
            throw new Error(`No se pudo resolver el ID del nodo a desenlazar: padre=${dto.padre} (ID: ${padreId}), hijo=${dto.hijo} (ID: ${hijoId})`);
        }
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            try {
                await connection.execute(`BEGIN pkg_seguridad_admin.p_eliminar_enlace(:padre, :hijo); END;`, { padre: padreId, hijo: hijoId }, { autoCommit: true });
            }
            catch (err) {
                const message = String(err?.message || "");
                if (message.includes("ORA-20002") ||
                    message.includes("Vínculo no encontrado")) {
                    return;
                }
                throw err;
            }
        }
        finally {
            await connection.close();
        }
    }
    static async enlazarMenuNodos(dto) {
        const padreId = await this.resolveNodeId(dto.padre);
        const hijoId = await this.resolveNodeId(dto.hijo);
        if (!padreId || !hijoId) {
            throw new Error(`No se pudo resolver el ID del nodo de menú: padre=${dto.padre} (ID: ${padreId}), hijo=${dto.hijo} (ID: ${hijoId})`);
        }
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            await connection.execute(`BEGIN pkg_seguridad_admin.p_enlazar_menu_nodos(:padre, :hijo); END;`, { padre: padreId, hijo: hijoId }, { autoCommit: true });
        }
        finally {
            await connection.close();
        }
    }
    static async clonarMenuJerarquia(dto) {
        const padreId = await this.resolveNodeId(dto.padre);
        const hijoId = await this.resolveNodeId(dto.hijo);
        if (!padreId || !hijoId) {
            throw new Error(`No se pudo resolver el ID del nodo para clonar: padre=${dto.padre} (ID: ${padreId}), hijo=${dto.hijo} (ID: ${hijoId})`);
        }
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            await connection.execute(`BEGIN pkg_seguridad_admin.p_clonar_jerarquia(:padre, :hijo); END;`, { padre: padreId, hijo: hijoId }, { autoCommit: true });
        }
        finally {
            await connection.close();
        }
    }
    static async deleteMenuEnlace(dto) {
        const padreId = await this.resolveNodeId(dto.padre);
        const hijoId = await this.resolveNodeId(dto.hijo);
        if (!padreId || !hijoId) {
            throw new Error(`No se pudo resolver el ID del vínculo de menú: padre=${dto.padre} (ID: ${padreId}), hijo=${dto.hijo} (ID: ${hijoId})`);
        }
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            try {
                await connection.execute(`BEGIN pkg_seguridad_admin.p_eliminar_menu_enlace(:padre, :hijo); END;`, { padre: padreId, hijo: hijoId }, { autoCommit: true });
            }
            catch (err) {
                const message = String(err?.message || "");
                if (message.includes("ORA-20002") ||
                    message.includes("Vínculo de menú no encontrado")) {
                    return;
                }
                throw err;
            }
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    otorgarPermiso
     * @description Otorga un permiso a un usuario/rol sobre un objeto y operación.
     * @param       {OtorgarPermisoDto} dto - Datos del permiso a otorgar.
     * @returns     {Promise<void>}
     */
    static async otorgarPermiso(dto) {
        const usrId = await this.resolveNodeId(dto.usr);
        const objId = await this.resolveNodeId(dto.obj);
        const opId = await this.resolveOperationId(dto.op);
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            await connection.execute(`BEGIN pkg_seguridad_admin.p_otorgar_permiso(:usr, :obj, :opId, :condicion); END;`, {
                usr: usrId,
                obj: objId,
                opId,
                condicion: dto.condicion_js || null,
            }, { autoCommit: true });
        }
        catch (err) {
            const message = String(err?.message || "");
            if (message.includes("ORA-00001") ||
                message.toUpperCase().includes("UNIQUE CONSTRAINT") ||
                message.toUpperCase().includes("YA EXISTE") ||
                message.toUpperCase().includes("ALREADY EXISTS")) {
                return;
            }
            throw err;
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    denegarPermiso
     * @author      Gerardo Paiva G.
     * @description Deniega un permiso a un usuario/rol sobre un objeto y operación.
     * @param       {OtorgarPermisoDto} dto - Datos del permiso a denegar.
     * @returns     {Promise<void>}
     */
    static async denegarPermiso(dto) {
        const usrId = await this.resolveNodeId(dto.usr);
        const objId = await this.resolveNodeId(dto.obj);
        const opId = await this.resolveOperationId(dto.op);
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            await connection.execute(`BEGIN pkg_seguridad_admin.p_denegar_permiso(:usr, :obj, :opId); END;`, { usr: usrId, obj: objId, opId }, { autoCommit: true });
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    revocarPermiso
     * @author      Gerardo Paiva G.
     * @description Revoca un permiso previamente otorgado a un usuario/rol.
     * @param       {OtorgarPermisoDto} dto - Datos del permiso a revocar.
     * @returns     {Promise<void>}
     */
    static async revocarPermiso(dto) {
        const usrId = await this.resolveNodeId(dto.usr);
        const objId = await this.resolveNodeId(dto.obj);
        const opId = await this.resolveOperationId(dto.op);
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            await connection.execute(`BEGIN pkg_seguridad_admin.p_revocar_permiso(:usr, :obj, :opId); END;`, { usr: usrId, obj: objId, opId }, { autoCommit: true });
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    getPermisos
     * @author      Gerardo Paiva G.
     * @description Obtiene la lista de permisos, con filtros y paginación.
     * @param       {string} [usr] - Usuario a filtrar (opcional).
     * @param       {number} [obj] - Objeto a filtrar (opcional).
     * @param       {number} [page=1] - Página de resultados (opcional).
     * @param       {number} [pageSize=5] - Tamaño de página (opcional).
     * @returns     {Promise<{total: number, data: any[]}>}
     */
    static async getPermisos(usr, obj, page = 1, pageSize = 5) {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            const result = await connection.execute(`BEGIN :cursor := pkg_seguridad_admin.fn_get_permisos(); END;`, { cursor: { type: oracledb_1.default.CURSOR, dir: oracledb_1.default.BIND_OUT } }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
            const rs = result.outBinds.cursor;
            const rows = (await rs.getRows()) || [];
            await rs.close();
            let data = (rows || []).map((row) => ({
                id_asociacion: row.ID_ASOCIACION || row.id_asociacion,
                usr: row.USR || row.usr,
                usr_codigo: row.USR_CODIGO || row.usr_codigo,
                usr_etiqueta: row.USR_ETIQUETA || row.usr_etiqueta || row.USR || row.usr,
                obj: row.OBJ || row.obj,
                obj_codigo: row.OBJ_CODIGO || row.obj_codigo,
                obj_etiqueta: row.OBJ_ETIQUETA || row.obj_etiqueta || row.OBJ || row.obj,
                op: row.OP || row.op,
                condicion_json: row.CONDICION_JSON || row.condicion_json,
                fecha_registro: row.FECHA_REGISTRO || row.fecha_registro,
            }));
            if (usr) {
                data = data.filter((d) => {
                    const uSearch = usr.toUpperCase().trim();
                    const dUsr = d.usr !== undefined && d.usr !== null
                        ? String(d.usr).toUpperCase().trim()
                        : "";
                    const dEtq = d.usr_etiqueta !== undefined && d.usr_etiqueta !== null
                        ? String(d.usr_etiqueta).toUpperCase().trim()
                        : "";
                    const dCodigo = d.usr_codigo !== undefined && d.usr_codigo !== null
                        ? String(d.usr_codigo).toUpperCase().trim()
                        : "";
                    return dUsr === uSearch || dEtq === uSearch || dCodigo === uSearch;
                });
            }
            if (obj) {
                data = data.filter((d) => {
                    const oSearch = String(obj).toUpperCase().trim();
                    const dObj = d.obj !== undefined && d.obj !== null
                        ? String(d.obj).toUpperCase().trim()
                        : "";
                    const dEtq = d.obj_etiqueta !== undefined && d.obj_etiqueta !== null
                        ? String(d.obj_etiqueta).toUpperCase().trim()
                        : "";
                    const dCodigo = d.obj_codigo !== undefined && d.obj_codigo !== null
                        ? String(d.obj_codigo).toUpperCase().trim()
                        : "";
                    return dObj === oSearch || dEtq === oSearch || dCodigo === oSearch;
                });
            }
            const total = data.length;
            const offset = (page - 1) * pageSize;
            const paginatedData = data.slice(offset, offset + pageSize);
            return { total, data: paginatedData };
        }
        finally {
            await connection.close();
        }
    }
    static async getPermisosMatrix(rol, politica) {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            const normalizedRole = String(rol || "")
                .trim()
                .toUpperCase();
            const policyId = Number(politica);
            if (!normalizedRole || !Number.isFinite(policyId) || policyId <= 0) {
                return { total: 0, data: [] };
            }
            const result = await connection.execute(`BEGIN :cursor := pkg_seguridad_admin.fn_get_permisos_matrix(:rol, :politica); END;`, {
                rol: normalizedRole,
                politica: policyId,
                cursor: { type: oracledb_1.default.CURSOR, dir: oracledb_1.default.BIND_OUT },
            }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
            const rs = result.outBinds.cursor;
            const rows = (await rs.getRows()) || [];
            await rs.close();
            const data = rows.map((row) => ({
                id_asociacion: row.ID_ASOCIACION || row.id_asociacion,
                usr: row.USR || row.usr,
                usr_codigo: row.USR_CODIGO || row.usr_codigo,
                usr_etiqueta: row.USR_ETIQUETA || row.usr_etiqueta || row.USR || row.usr,
                obj: row.OBJ || row.obj,
                obj_codigo: row.OBJ_CODIGO || row.obj_codigo,
                obj_etiqueta: row.OBJ_ETIQUETA || row.obj_etiqueta || row.OBJ || row.obj,
                op: row.OP || row.op,
                condicion_json: row.CONDICION_JSON || row.condicion_json,
                fecha_registro: row.FECHA_REGISTRO || row.fecha_registro,
            }));
            return {
                total: data.length,
                data,
            };
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    getRolesPorNodo
     * @author      Gerardo Paiva G.
     * @description Obtiene los roles asociados a un nodo específico.
     * @param       {number} id - ID del nodo.
     * @returns     {Promise<any[]>} Lista de roles asociados.
     */
    static async getRolesPorNodo(id) {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            const result = await connection.execute(`BEGIN :cursor := pkg_seguridad_admin.fn_get_roles_por_nodo(:id); END;`, {
                id,
                cursor: { type: oracledb_1.default.CURSOR, dir: oracledb_1.default.BIND_OUT },
            }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
            const rs = result.outBinds.cursor;
            const rows = (await rs.getRows()) || [];
            await rs.close();
            return (rows || []).map((row) => ({
                id_rol: row.ID_ROL || row.id_rol,
                codigo: row.CODIGO || row.codigo,
                nombre: row.NOMBRE || row.nombre,
            }));
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    getNodos
     * @author      Gerardo Paiva G.
     * @description Obtiene la lista de nodos existentes en la estructura de seguridad.
     * @returns     {Promise<any[]>} Lista de nodos.
     */
    static async getNodos() {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            const result = await connection.execute(`BEGIN :cursor := pkg_seguridad_admin.fn_get_nodos_lista(); END;`, { cursor: { type: oracledb_1.default.CURSOR, dir: oracledb_1.default.BIND_OUT } }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
            const rs = result.outBinds.cursor;
            const rows = await rs.getRows();
            await rs.close();
            return (rows || []).map((n) => ({
                id_nodo: n.ID_NODO || n.id_nodo,
                codigo_tecnico: n.CODIGO_TECNICO || n.codigo_tecnico,
                etiqueta: n.ETIQUETA || n.etiqueta,
                tipo_nodo: n.TIPO_NODO || n.tipo_nodo,
                url_ruta: n.URL_RUTA || n.url_ruta,
                slug: n.SLUG || n.slug,
                icono: n.ICONO || n.icono,
                descripcion: n.DESCRIPCION || n.descripcion,
                orden_visual: n.ORDEN_VISUAL || n.orden_visual,
                activo: n.ACTIVO || n.activo,
            }));
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    getOperaciones
     * @author      Gerardo Paiva G.
     * @description Obtiene la lista de operaciones registradas en el sistema.
     * @returns     {Promise<any[]>} Lista de operaciones.
     */
    static async getOperaciones() {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            const result = await connection.execute(`BEGIN :cursor := pkg_seguridad_admin.fn_get_operaciones(); END;`, { cursor: { type: oracledb_1.default.CURSOR, dir: oracledb_1.default.BIND_OUT } }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
            const rs = result.outBinds.cursor;
            const rows = await rs.getRows();
            await rs.close();
            return (rows || []).map((op) => ({
                nombre_op: op.NOMBRE_OP || op.nombre_op,
                descripcion: op.DESCRIPCION || op.descripcion,
            }));
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    upsertOperacion
     * @author      Gerardo Paiva G.
     * @description Inserta o actualiza una operación en el sistema.
     * @param       {string} nombre - Nombre de la operación.
     * @param       {string} [desc] - Descripción de la operación (opcional).
     * @returns     {Promise<void>}
     */
    static async upsertOperacion(nombre, desc) {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            await connection.execute(`BEGIN pkg_seguridad_admin.p_upsert_operacion(:nombre, :desc); END;`, { nombre, desc: desc || null }, { autoCommit: true });
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    deleteOperacion
     * @author      Gerardo Paiva G.
     * @description Elimina una operación del sistema.
     * @param       {string} nombre - Nombre de la operación a eliminar.
     * @returns     {Promise<void>}
     */
    static async deleteOperacion(nombre) {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            await connection.execute(`BEGIN pkg_seguridad_admin.p_eliminar_operacion(:nombre); END;`, { nombre }, { autoCommit: true });
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    getTiposNodo
     * @author      Gerardo Paiva G.
     * @description Obtiene la lista de tipos de nodo registrados.
     * @returns     {Promise<any[]>} Lista de tipos de nodo.
     */
    static async getTiposNodo() {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            const result = await connection.execute(`BEGIN :cursor := pkg_seguridad_admin.fn_get_tipos_nodo(); END;`, { cursor: { type: oracledb_1.default.CURSOR, dir: oracledb_1.default.BIND_OUT } }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
            const rs = result.outBinds.cursor;
            const rows = await rs.getRows();
            await rs.close();
            return (rows || []).map((t) => ({
                codigo: t.CODIGO_TIPO || t.codigo_tipo || t.CODIGO || t.codigo,
                descripcion: t.DESCRIPCION || t.descripcion,
            }));
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    upsertTipoNodo
     * @author      Gerardo Paiva G.
     * @description Inserta o actualiza un tipo de nodo.
     * @param       {UpsertTipoNodoDto} dto - Datos del tipo de nodo a insertar o actualizar.
     * @returns     {Promise<void>}
     */
    static async upsertTipoNodo(dto) {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            await connection.execute(`BEGIN pkg_seguridad_admin.p_upsert_tipo_nodo(:codigo, :descripcion); END;`, { codigo: dto.codigo, descripcion: dto.descripcion || null }, { autoCommit: true });
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    deleteTipoNodo
     * @author      Gerardo Paiva G.
     * @description Elimina un tipo de nodo del sistema.
     * @param       {string} codigo - Código del tipo de nodo a eliminar.
     * @returns     {Promise<void>}
     */
    static async deleteTipoNodo(codigo) {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            await connection.execute(`BEGIN pkg_seguridad_admin.p_eliminar_tipo_nodo(:codigo); END;`, { codigo }, { autoCommit: true });
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    getModulosRaiz
     * @author      Gerardo Paiva G.
     * @description Obtiene los nodos raíz de tipo módulo.
     * @returns     {Promise<AccNodo[]>} Lista de nodos raíz tipo módulo.
     */
    static async getModulosRaiz() {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            const nodosResult = await connection.execute(`BEGIN :cursor := pkg_seguridad_admin.fn_get_modulos_raiz_nodos(); END;`, { cursor: { type: oracledb_1.default.CURSOR, dir: oracledb_1.default.BIND_OUT } }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
            const rsNodos = nodosResult.outBinds.cursor;
            const nodos = (await rsNodos.getRows()) || [];
            await rsNodos.close();
            const linksResult = await connection.execute(`BEGIN :cursor := pkg_seguridad_admin.fn_get_modulos_raiz_links(); END;`, { cursor: { type: oracledb_1.default.CURSOR, dir: oracledb_1.default.BIND_OUT } }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
            const rsLinks = linksResult.outBinds.cursor;
            const links = (await rsLinks.getRows()) || [];
            await rsLinks.close();
            const nodoMap = new Map();
            const childIds = new Set();
            nodos.forEach((n) => {
                nodoMap.set(n.ID_NODO, {
                    id_nodo: n.ID_NODO,
                    codigo_tecnico: n.CODIGO_TECNICO,
                    etiqueta: n.ETIQUETA,
                    tipo_nodo: n.TIPO_NODO,
                    url_ruta: n.URL_RUTA,
                    slug: n.SLUG,
                    icono: n.ICONO,
                    descripcion: n.DESCRIPCION,
                    orden_visual: n.ORDEN_VISUAL,
                    activo: n.ACTIVO,
                    children: [],
                });
            });
            links.forEach((l) => {
                const padre = nodoMap.get(l.ID_PADRE);
                const hijo = nodoMap.get(l.ID_HIJO);
                if (padre && hijo) {
                    padre.children.push(hijo);
                    childIds.add(hijo.id_nodo);
                }
            });
            let roots = [];
            nodoMap.forEach((nodo) => {
                if (nodo.children && nodo.children.length > 0) {
                    nodo.children.sort((a, b) => (a.orden_visual || 0) - (b.orden_visual || 0));
                }
                if (!childIds.has(nodo.id_nodo)) {
                    roots.push(nodo);
                }
            });
            roots.sort((a, b) => (a.orden_visual || 0) - (b.orden_visual || 0));
            return roots;
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    getModulosPorPoliticas
     * @description Obtiene los códigos de módulos raíz permitidos para una o más políticas.
     * @param       {string[]} policyCodes - Códigos de políticas seleccionadas.
     * @returns     {Promise<string[]>} Lista de códigos técnicos de módulos válidos para esas políticas.
     */
    static async getModulosPorPoliticas(policyCodes) {
        const normalizedCodes = Array.from(new Set((policyCodes || [])
            .map((code) => String(code || "")
            .trim()
            .toUpperCase())
            .filter((code) => !!code)));
        if (normalizedCodes.length === 0) {
            return [];
        }
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            const result = await connection.execute(`BEGIN :cursor := pkg_seguridad_admin.fn_get_modulos_por_politicas(:policyCodes); END;`, {
                policyCodes: normalizedCodes.join(","),
                cursor: { type: oracledb_1.default.CURSOR, dir: oracledb_1.default.BIND_OUT },
            }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
            const rs = result.outBinds.cursor;
            const rows = (await rs.getRows()) || [];
            await rs.close();
            return rows
                .map((row) => String(row.CODIGO_TECNICO || row.codigo_tecnico || "").trim())
                .filter((code) => !!code);
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    getPoliticasRaiz
     * @author      Gerardo Paiva G.
     * @description Obtiene los nodos raíz de tipo política.
     * @returns     {Promise<AccNodo[]>} Lista de nodos raíz tipo política.
     */
    static async getPoliticasRaiz() {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            const result = await connection.execute(`BEGIN :cursor := pkg_seguridad_admin.fn_get_politicas_raiz(); END;`, { cursor: { type: oracledb_1.default.CURSOR, dir: oracledb_1.default.BIND_OUT } }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
            const rs = result.outBinds.cursor;
            const rows = await rs.getRows();
            await rs.close();
            return (rows || []).map((n) => ({
                id_nodo: n.ID_NODO,
                codigo_tecnico: n.CODIGO_TECNICO,
                etiqueta: n.ETIQUETA,
                tipo_nodo: n.TIPO_NODO,
                url_ruta: n.URL_RUTA,
                slug: n.SLUG,
                icono: n.ICONO,
                descripcion: n.DESCRIPCION,
                orden_visual: n.ORDEN_VISUAL,
                activo: n.ACTIVO,
                children: [],
            }));
        }
        finally {
            await connection.close();
        }
    }
    static async getCarpetasRaiz(id) {
        console.log(`getCarpetasRaiz (Memoria) - ID de política seleccionado: ${id}`);
        try {
            const graph = NgacGraphManager_1.NgacGraphManager.getInstance();
            await graph.initialize();
            const roots = graph.policyMenuRoots.get(id);
            if (!roots)
                return [];
            const result = [];
            for (const menuNodeId of roots) {
                const mn = graph.menuNodes.get(menuNodeId);
                if (mn && mn.active) {
                    const parents = graph.menuChildToParents.get(menuNodeId);
                    if (!parents || parents.size === 0) {
                        const children = graph.menuParentToChildren.get(menuNodeId);
                        const hasChildren = !!children && children.size > 0;
                        result.push({
                            id: mn.idNode,
                            nombre: mn.label,
                            descripcion: mn.description,
                            tieneHijos: hasChildren,
                            displayOrder: mn.displayOrder
                        });
                    }
                }
            }
            result.sort((a, b) => a.displayOrder - b.displayOrder);
            return result.map(({ id, nombre, descripcion, tieneHijos }) => ({ id, nombre, descripcion, tieneHijos }));
        }
        catch (error) {
            console.error("Error en getCarpetasRaiz (Memoria):", error);
            return null;
        }
    }
    static async getCarpetasRaizSinHijos(id) {
        console.log(`getCarpetasRaizSinHijos (Memoria) - ID de política seleccionado: ${id}`);
        try {
            const graph = NgacGraphManager_1.NgacGraphManager.getInstance();
            await graph.initialize();
            const roots = graph.policyMenuRoots.get(id);
            if (!roots)
                return [];
            const result = [];
            for (const menuNodeId of roots) {
                const mn = graph.menuNodes.get(menuNodeId);
                if (mn && mn.active) {
                    const parents = graph.menuChildToParents.get(menuNodeId);
                    if (!parents || parents.size === 0) {
                        const children = graph.menuParentToChildren.get(menuNodeId);
                        const hasChildren = !!children && children.size > 0;
                        if (!hasChildren) {
                            result.push({
                                id: mn.idNode,
                                nombre: mn.label,
                                descripcion: mn.description,
                                tieneHijos: false,
                                displayOrder: mn.displayOrder
                            });
                        }
                    }
                }
            }
            result.sort((a, b) => a.displayOrder - b.displayOrder);
            return result.map(({ id, nombre, descripcion, tieneHijos }) => ({ id, nombre, descripcion, tieneHijos }));
        }
        catch (error) {
            console.error("Error en getCarpetasRaizSinHijos (Memoria):", error);
            return null;
        }
    }
    /**
     * @function    getRoles
     * @author      Gerardo Paiva G.
     * @description Obtiene la lista de roles registrados en el sistema.
     * @returns     {Promise<AccRol[]>} Lista de roles.
     */
    static async getRoles() {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            const result = await connection.execute(`BEGIN :cursor := pkg_seguridad_admin.fn_get_roles(); END;`, { cursor: { type: oracledb_1.default.CURSOR, dir: oracledb_1.default.BIND_OUT } }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
            const rs = result.outBinds.cursor;
            const rows = await rs.getRows();
            await rs.close();
            const roles = (rows || []).map((row) => ({
                id_rol: row.ID_ROL || row.id_rol,
                id_nodo: row.ID_NODO || row.id_nodo,
                codigo: row.CODIGO || row.codigo,
                nombre: row.NOMBRE || row.nombre,
                descripcion: row.DESCRIPCION || row.descripcion,
                id_tipo_nodo: row.ID_TIPO_NODO || row.id_tipo_nodo,
                url_ruta: row.URL_RUTA || row.url_ruta,
                slug: row.SLUG || row.slug,
                icono: row.ICONO || row.icono,
                orden_visual: row.ORDEN_VISUAL || row.orden_visual,
                activo: row.ACTIVO || row.activo || "S",
            }));
            return roles;
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    upsertRol
     * @author      Gerardo Paiva G.
     * @description Inserta o actualiza un rol en el sistema.
     * @param       {AccRol} rol - Datos del rol a insertar o actualizar.
     * @returns     {Promise<void>}
     */
    static async upsertRol(rol) {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            await connection.execute(`BEGIN
           pkg_seguridad_admin.p_upsert_rol(
             :id_rol,
             :codigo,
             :nombre,
             :descripcion,
             :url_ruta,
             :slug,
             :icono,
             :orden_visual,
             :activo
           );
         END;`, {
                id_rol: rol.id_nodo ?? rol.id_rol ?? null,
                codigo: rol.codigo,
                nombre: rol.nombre,
                descripcion: rol.descripcion ?? null,
                url_ruta: rol.url_ruta ?? null,
                slug: rol.slug ?? null,
                icono: rol.icono ?? null,
                orden_visual: rol.orden_visual ?? null,
                activo: rol.activo ?? "S",
            }, { autoCommit: true });
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    deleteRol
     * @author      Gerardo Paiva G.
     * @description Elimina un rol del sistema por su ID.
     * @param       {number} id_rol - ID del rol a eliminar.
     * @returns     {Promise<void>}
     */
    static async deleteRol(id_rol) {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            await connection.execute(`BEGIN pkg_seguridad_admin.p_delete_rol(:id_rol); END;`, { id_rol }, { autoCommit: true });
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    getLogs
     * @author      Gerardo Paiva G.
     * @description Obtiene los logs de seguridad registrados en el sistema.
     * @returns     {Promise<any[]>} Lista de logs.
     */
    static async getLogs() {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            const result = await connection.execute(`BEGIN :cursor := pkg_seguridad_admin.fn_get_logs(); END;`, { cursor: { type: oracledb_1.default.CURSOR, dir: oracledb_1.default.BIND_OUT } }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
            const rs = result.outBinds.cursor;
            const rows = await rs.getRows();
            await rs.close();
            return rows || [];
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    clearLogs
     * @author      Gerardo Paiva G.
     * @description Elimina todos los logs de seguridad del sistema.
     * @returns     {Promise<void>}
     */
    static async clearLogs() {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            await connection.execute(`BEGIN pkg_seguridad_admin.p_limpiar_logs(); END;`, [], { autoCommit: true });
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    getProhibiciones
     * @author      Gerardo Paiva G.
     * @description Obtiene la lista de prohibiciones activas en el sistema.
     * @returns     {Promise<any[]>} Lista de prohibiciones.
     */
    static async getProhibiciones() {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            const result = await connection.execute(`BEGIN :cursor := pkg_seguridad_admin.fn_get_prohibiciones(); END;`, { cursor: { type: oracledb_1.default.CURSOR, dir: oracledb_1.default.BIND_OUT } }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
            const rs = result.outBinds.cursor;
            const rows = await rs.getRows();
            await rs.close();
            return (rows || []).map((row) => ({
                id_prohibicion: row.ID_PROHIBICION || row.id_prohibicion,
                usr: row.USR || row.usr,
                obj: row.OBJ || row.obj,
                op: row.OP || row.op,
                fecha_registro: row.FECHA_REGISTRO || row.fecha_registro,
                creado_por: row.CREADO_POR || row.creado_por,
            }));
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    revocarProhibicion
     * @author      Gerardo Paiva G.
     * @description Revoca una prohibición por su ID.
     * @param       {number} id - ID de la prohibición a revocar.
     * @returns     {Promise<void>}
     */
    static async revocarProhibicion(id) {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            await connection.execute(`BEGIN pkg_seguridad_admin.p_revocar_prohibicion(:id); END;`, { id }, { autoCommit: true });
        }
        finally {
            await connection.close();
        }
    }
    /**
     * =============================================================================================
     * 3. FUNCIONES Y PROCEDIMIENTOS: PKG_SAFI_ADMIN
     * ---------------------------------------------------------------------------------------------
     * Gestión de usuarios, entidades, unidades y sus vínculos. Toda lógica CRUD de SAFI debe pasar
     * por este package antes de exponer endpoints en backend/frontend.
     * =============================================================================================
     */
    /**
     * @function    getUsuarios
     * @author      Gerardo Paiva G.
     * @version     1.0.0
     * @date        18/05/2026
     * @description Obtiene la lista de usuarios SAFI registrados en el sistema.
     * @returns     {Promise<SafiUsuario[]>} Lista de usuarios SAFI.
     * @throws      Error en la conexión o consulta a la base de datos.
     */
    static async getUsuarios() {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            const result = await connection.execute(`BEGIN :cursor := pkg_safi_admin.fn_get_safi_usuarios(); END;`, { cursor: { type: oracledb_1.default.CURSOR, dir: oracledb_1.default.BIND_OUT } }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
            const rs = result.outBinds.cursor;
            const rows = await rs.getRows();
            await rs.close();
            return (rows || []).map((row) => ({
                id: row.ID !== undefined ? row.ID : row.id,
                rut_numero: row.RUT_NUMERO !== undefined ? row.RUT_NUMERO : row.rut_numero,
                rut_dv: row.RUT_DV !== undefined ? row.RUT_DV : row.rut_dv,
                nombre: row.NOMBRE !== undefined ? row.NOMBRE : row.nombre,
                email: row.EMAIL !== undefined ? row.EMAIL : row.email,
                estado: row.ESTADO !== undefined ? row.ESTADO : row.estado,
            }));
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    upsertUsuario
     * @author      Gerardo Paiva G.
     * @version     1.0.0
     * @date        18/05/2026
     * @description Inserta o actualiza un usuario SAFI en el sistema.
     * @param       {SafiUsuario} dto - Datos del usuario a insertar o actualizar.
     * @returns     {Promise<void>}
     * @throws      Error en la conexión o consulta a la base de datos.
     */
    static async upsertUsuario(dto) {
        // Validar rut_numero y rut_dv
        if (!dto.rut_numero || !dto.rut_dv) {
            throw new Error("RUT incompleto");
        }
        if (!/^[0-9]{7,8}$/.test(dto.rut_numero)) {
            throw new Error("El número de RUT debe tener 7 u 8 dígitos");
        }
        if (!/^\d|k|K$/.test(dto.rut_dv)) {
            throw new Error("Dígito verificador inválido");
        }
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            await connection.execute(`BEGIN pkg_safi_admin.p_upsert_safi_usuario(:id, :rut_numero, :rut_dv, :nombre, :email, :estado); END;`, {
                id: dto.id,
                rut_numero: dto.rut_numero,
                rut_dv: dto.rut_dv.toUpperCase(),
                nombre: dto.nombre,
                email: dto.email,
                estado: dto.estado || 1,
            }, { autoCommit: true });
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    deleteUsuario
     * @author      Gerardo Paiva G.
     * @version     1.0.0
     * @date        18/05/2026
     * @description Elimina un usuario SAFI por su ID.
     * @param       {number} id - ID del usuario a eliminar.
     * @returns     {Promise<void>}
     * @throws      Error en la conexión o consulta a la base de datos.
     */
    static async deleteUsuario(id) {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            await connection.execute(`BEGIN pkg_safi_admin.p_delete_safi_usuario(:id); END;`, { id }, { autoCommit: true });
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    getEntidades
     * @author      Gerardo Paiva G.
     * @version     1.0.0
     * @date        18/05/2026
     * @description Obtiene la lista de entidades SAFI registradas en el sistema.
     * @returns     {Promise<SafiEntidad[]>} Lista de entidades SAFI.
     * @throws      Error en la conexión o consulta a la base de datos.
     */
    static async getEntidades() {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            const result = await connection.execute(`BEGIN :cursor := pkg_safi_admin.fn_get_safi_entidades(); END;`, { cursor: { type: oracledb_1.default.CURSOR, dir: oracledb_1.default.BIND_OUT } }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
            const rs = result.outBinds.cursor;
            const rows = await rs.getRows();
            await rs.close();
            return (rows || []).map((row) => ({
                id: row.ID !== undefined ? row.ID : row.id,
                codigo: row.CODIGO !== undefined ? row.CODIGO : row.codigo,
                nombre: row.NOMBRE !== undefined ? row.NOMBRE : row.nombre,
                slug: row.SLUG !== undefined ? row.SLUG : row.slug,
                desc: row.DESC !== undefined
                    ? row.DESC
                    : row.DESCRIPCION !== undefined
                        ? row.DESCRIPCION
                        : row.desc,
                activo: row.ACTIVO !== undefined ? row.ACTIVO : row.activo,
            }));
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    upsertEntidad
     * @author      Gerardo Paiva G.
     * @version     1.0.0
     * @date        18/05/2026
     * @description Inserta o actualiza una entidad SAFI en el sistema.
     * @param       {SafiEntidad} dto - Datos de la entidad a insertar o actualizar.
     * @returns     {Promise<void>}
     * @throws      Error en la conexión o consulta a la base de datos.
     */
    static async upsertEntidad(dto) {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            await connection.execute(`BEGIN pkg_safi_admin.p_upsert_safi_entidad(:id, :codigo, :nombre, :slug, :desc); END;`, {
                id: dto.id,
                codigo: dto.codigo,
                nombre: dto.nombre,
                slug: dto.slug,
                desc: dto.desc || null,
            }, { autoCommit: true });
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    deleteEntidad
     * @author      Gerardo Paiva G.
     * @version     1.0.0
     * @date        18/05/2026
     * @description Elimina una entidad SAFI por su ID.
     * @param       {number} id - ID de la entidad a eliminar.
     * @returns     {Promise<void>}
     * @throws      Error en la conexión o consulta a la base de datos.
     */
    static async deleteEntidad(id) {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            await connection.execute(`BEGIN pkg_safi_admin.p_delete_safi_entidad(:id); END;`, { id }, { autoCommit: true });
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    getUnidades
     * @author      Gerardo Paiva G.
     * @version     1.0.0
     * @date        18/05/2026
     * @description Obtiene la lista de unidades SAFI registradas en el sistema.
     * @returns     {Promise<SafiUnidad[]>} Lista de unidades SAFI.
     * @throws      Error en la conexión o consulta a la base de datos.
     */
    static async getUnidades() {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            const result = await connection.execute(`BEGIN :cursor := pkg_safi_admin.fn_get_safi_unidades(); END;`, { cursor: { type: oracledb_1.default.CURSOR, dir: oracledb_1.default.BIND_OUT } }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
            const rs = result.outBinds.cursor;
            const rows = await rs.getRows();
            await rs.close();
            return (rows || []).map((row) => ({
                id: row.ID !== undefined ? row.ID : row.id,
                codigo: row.CODIGO !== undefined ? row.CODIGO : row.codigo,
                nombre: row.NOMBRE !== undefined ? row.NOMBRE : row.nombre,
                slug: row.SLUG !== undefined ? row.SLUG : row.slug,
                desc: row.DESC !== undefined
                    ? row.DESC
                    : row.DESCRIPCION !== undefined
                        ? row.DESCRIPCION
                        : row.desc,
                activo: row.ACTIVO !== undefined ? row.ACTIVO : row.activo,
            }));
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    upsertUnidad
     * @author      Gerardo Paiva G.
     * @version     1.0.0
     * @date        18/05/2026
     * @description Inserta o actualiza una unidad SAFI en el sistema.
     * @param       {SafiUnidad} dto - Datos de la unidad a insertar o actualizar.
     * @returns     {Promise<void>}
     * @throws      Error en la conexión o consulta a la base de datos.
     */
    static async upsertUnidad(dto) {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            await connection.execute(`BEGIN pkg_safi_admin.p_upsert_safi_unidad(:id, :codigo, :nombre, :slug, :desc); END;`, {
                id: dto.id,
                codigo: dto.codigo,
                nombre: dto.nombre,
                slug: dto.slug,
                desc: dto.desc || null,
            }, { autoCommit: true });
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    deleteUnidad
     * @author      Gerardo Paiva G.
     * @version     1.0.0
     * @date        18/05/2026
     * @description Elimina una unidad SAFI por su ID.
     * @param       {number} id - ID de la unidad a eliminar.
     * @returns     {Promise<void>}
     * @throws      Error en la conexión o consulta a la base de datos.
     */
    static async deleteUnidad(id) {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            await connection.execute(`BEGIN pkg_safi_admin.p_delete_safi_unidad(:id); END;`, { id }, { autoCommit: true });
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    crearUsuario
     * @author      Gerardo Paiva G.
     * @date        18/05/2026
     * @description Crea un usuario SAFI y retorna su ID generado.
     * @param       {CrearSafiUsuarioDto} dto - Datos del usuario a crear.
     * @returns     {Promise<number>} ID generado del usuario.
     * @throws      Error en la conexión o consulta a la base de datos.
     */
    static async crearUsuario(dto) {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            const result = await connection.execute(`BEGIN pkg_safi_admin.crear_usuario(:slug_usuario, :rut_numero, :rut_dv, :nombres, :apellidos, :email, :out_id); END;`, {
                slug_usuario: dto.slug_usuario,
                rut_numero: Number(dto.rut_numero),
                rut_dv: dto.rut_dv,
                nombres: dto.nombres,
                apellidos: dto.apellidos,
                email: dto.email,
                out_id: { type: oracledb_1.default.NUMBER, dir: oracledb_1.default.BIND_OUT },
            }, { autoCommit: true });
            return result.outBinds.out_id;
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    desactivarUsuario
     * @author      Gerardo Paiva G.
     * @date        18/05/2026
     * @description Desactiva un usuario SAFI por su ID.
     * @param       {number} idUsuario - ID del usuario a desactivar.
     * @returns     {Promise<void>}
     * @throws      Error en la conexión o consulta a la base de datos.
     */
    static async desactivarUsuario(idUsuario) {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            await connection.execute(`BEGIN pkg_safi_admin.desactivar_usuario(:id_usuario); END;`, { id_usuario: idUsuario }, { autoCommit: true });
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    crearUnidad
     * @author      Gerardo Paiva G.
     * @date        18/05/2026
     * @description Crea una unidad SAFI y retorna su ID generado.
     * @param       {CrearSafiUnidadDto} dto - Datos de la unidad a crear.
     * @returns     {Promise<number>} ID generado de la unidad.
     * @throws      Error en la conexión o consulta a la base de datos.
     */
    static async crearUnidad(dto) {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            const result = await connection.execute(`BEGIN pkg_safi_admin.crear_unidad(:codigo, :slug, :nombre, :descripcion, :out_id); END;`, {
                codigo: dto.codigo,
                slug: dto.slug_unidad,
                nombre: dto.nombre_unidad,
                descripcion: dto.descripcion,
                out_id: { type: oracledb_1.default.NUMBER, dir: oracledb_1.default.BIND_OUT },
            }, { autoCommit: true });
            return result.outBinds.out_id;
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    crearEntidad
     * @author      Gerardo Paiva G.
     * @date        18/05/2026
     * @description Crea una entidad SAFI y retorna su ID generado.
     * @param       {CrearSafiEntidadDto} dto - Datos de la entidad a crear.
     * @returns     {Promise<number>} ID generado de la entidad.
     * @throws      Error en la conexión o consulta a la base de datos.
     */
    static async crearEntidad(dto) {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            const result = await connection.execute(`BEGIN pkg_safi_admin.crear_entidad(:codigo, :slug, :nombre, :tipo, :out_id); END;`, {
                codigo: dto.codigo,
                slug: dto.slug_entidad,
                nombre: dto.nombre_entidad,
                tipo: dto.tipo_entidad,
                out_id: { type: oracledb_1.default.NUMBER, dir: oracledb_1.default.BIND_OUT },
            }, { autoCommit: true });
            return result.outBinds.out_id;
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    vincularUsuarioUnidad
     * @author      Gerardo Paiva G.
     * @date        18/05/2026
     * @description Vincula un usuario SAFI a una unidad.
     * @param       {VinculoUsuarioUnidadDto} dto - Datos del vínculo usuario-unidad.
     * @returns     {Promise<void>}
     * @throws      Error en la conexión o consulta a la base de datos.
     */
    static async vincularUsuarioUnidad(dto) {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            await connection.execute(`BEGIN pkg_safi_admin.vincular_usuario_unidad(:id_usuario, :id_unidad); END;`, { id_usuario: dto.id_usuario, id_unidad: dto.id_unidad }, { autoCommit: true });
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    desvincularUsuarioUnidad
     * @author      Gerardo Paiva G.
     * @date        18/05/2026
     * @description Desvincula un usuario SAFI de una unidad.
     * @param       {VinculoUsuarioUnidadDto} dto - Datos del vínculo usuario-unidad a eliminar.
     * @returns     {Promise<void>}
     * @throws      Error en la conexión o consulta a la base de datos.
     */
    static async desvincularUsuarioUnidad(dto) {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            await connection.execute(`BEGIN pkg_safi_admin.desvincular_usuario_unidad(:id_usuario, :id_unidad); END;`, { id_usuario: dto.id_usuario, id_unidad: dto.id_unidad }, { autoCommit: true });
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    vincularUsuarioEntidad
     * @author      Gerardo Paiva G.
     * @date        18/05/2026
     * @description Vincula un usuario SAFI a una entidad.
     * @param       {VinculoUsuarioEntidadDto} dto - Datos del vínculo usuario-entidad.
     * @returns     {Promise<void>}
     * @throws      Error en la conexión o consulta a la base de datos.
     */
    static async vincularUsuarioEntidad(dto) {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            await connection.execute(`BEGIN pkg_safi_admin.vincular_usuario_entidad(:id_usuario, :id_entidad); END;`, { id_usuario: dto.id_usuario, id_entidad: dto.id_entidad }, { autoCommit: true });
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    desvincularUsuarioEntidad
     * @author      Gerardo Paiva G.
     * @date        18/05/2026
     * @description Desvincula un usuario SAFI de una entidad.
     * @param       {VinculoUsuarioEntidadDto} dto - Datos del vínculo usuario-entidad a eliminar.
     * @returns     {Promise<void>}
     * @throws      Error en la conexión o consulta a la base de datos.
     */
    static async desvincularUsuarioEntidad(dto) {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            await connection.execute(`BEGIN pkg_safi_admin.desvincular_usuario_entidad(:id_usuario, :id_entidad); END;`, { id_usuario: dto.id_usuario, id_entidad: dto.id_entidad }, { autoCommit: true });
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    vincularUnidadEntidad
     * @author      Gerardo Paiva G.
     * @date        18/05/2026
     * @description Vincula una unidad SAFI a una entidad.
     * @param       {VinculoUnidadEntidadDto} dto - Datos del vínculo unidad-entidad.
     * @returns     {Promise<void>}
     * @throws      Error en la conexión o consulta a la base de datos.
     */
    static async vincularUnidadEntidad(dto) {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            await connection.execute(`BEGIN pkg_safi_admin.vincular_unidad_entidad(:id_unidad, :id_entidad); END;`, { id_unidad: dto.id_unidad, id_entidad: dto.id_entidad }, { autoCommit: true });
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    getRolesDeUsuario
     * @author      Gerardo Paiva G.
     * @date        18/05/2026
     * @description Obtiene los roles asignados a un usuario NGAC.
     * @param       {number} userId - ID del usuario
     * @returns     {Promise<any[]>} Lista de roles asignados.
     */
    static async getRolesDeUsuario(userId) {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            const result = await connection.execute(`BEGIN :cursor := pkg_seguridad_admin.fn_get_roles_de_usuario(:userId); END;`, {
                userId,
                cursor: { type: oracledb_1.default.CURSOR, dir: oracledb_1.default.BIND_OUT },
            }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
            const cursor = result.outBinds.cursor;
            const rows = await cursor.getRows(100);
            await cursor.close();
            return rows.map((row) => ({
                id_rol: row.ID_ROL !== undefined
                    ? row.ID_ROL
                    : row.id_rol !== undefined
                        ? row.id_rol
                        : null,
                codigo: row.CODIGO !== undefined
                    ? row.CODIGO
                    : row.codigo !== undefined
                        ? row.codigo
                        : null,
                nombre: row.NOMBRE !== undefined
                    ? row.NOMBRE
                    : row.nombre !== undefined
                        ? row.nombre
                        : null,
                descripcion: row.DESCRIPCION !== undefined
                    ? row.DESCRIPCION
                    : row.descripcion !== undefined
                        ? row.descripcion
                        : null,
            }));
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    asignarRolAUsuario
     * @author      Gerardo Paiva G.
     * @date        18/05/2026
     * @description Asigna un rol a un usuario NGAC.
     * @param       {number} userId - ID del usuario.
     * @param       {number} idRol - ID del rol.
     * @returns     {Promise<void>}
     */
    static async asignarRolAUsuario(userId, idRol) {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            await connection.execute(`BEGIN pkg_seguridad_admin.p_asignar_rol_a_usuario(:userId, :idRol); END;`, { userId, idRol }, { autoCommit: true });
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    desvincularUnidadEntidad
     * @author      Gerardo Paiva G.
     * @date        18/05/2026
     * @description Desvincula una unidad SAFI de una entidad.
     * @param       {VinculoUnidadEntidadDto} dto - Datos del vínculo unidad-entidad a eliminar.
     * @returns     {Promise<void>}
     * @throws      Error en la conexión o consulta a la base de datos.
     */
    static async desvincularUnidadEntidad(dto) {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            await connection.execute(`BEGIN pkg_safi_admin.desvincular_unidad_entidad(:id_unidad, :id_entidad); END;`, { id_unidad: dto.id_unidad, id_entidad: dto.id_entidad }, { autoCommit: true });
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    revocarRolDeUsuario
     * @description Revoca la asignación de un rol específico a un usuario en el sistema.
     * @param       {number} userId - ID del usuario.
     * @param       {number} idRol - ID del rol a revocar.
     * @returns     {Promise<void>}
     */
    static async revocarRolDeUsuario(userId, idRol) {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            await connection.execute(`BEGIN pkg_seguridad_admin.p_revocar_rol_de_usuario(:userId, :idRol); END;`, { userId, idRol }, { autoCommit: true });
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    getUsuarioVinculos
     * @description Obtiene los IDs de las entidades y unidades asociadas a un usuario específico.
     * @param       {number} userId - ID del usuario.
     * @returns     {Promise<{ entidadIds: number[]; unidadIds: number[] }>} Listas de IDs de entidades y unidades.
     */
    static async getUsuarioVinculos(userId) {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            const entResult = await connection.execute(`BEGIN :cursor := pkg_safi_admin.fn_get_entidades_usuario(:userId); END;`, {
                userId,
                cursor: { type: oracledb_1.default.CURSOR, dir: oracledb_1.default.BIND_OUT },
            }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
            const entCursor = entResult.outBinds.cursor;
            const entRows = await entCursor.getRows(100);
            await entCursor.close();
            const uniResult = await connection.execute(`BEGIN :cursor := pkg_safi_admin.fn_get_unidades_usuario(:userId); END;`, {
                userId,
                cursor: { type: oracledb_1.default.CURSOR, dir: oracledb_1.default.BIND_OUT },
            }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
            const uniCursor = uniResult.outBinds.cursor;
            const uniRows = await uniCursor.getRows(100);
            await uniCursor.close();
            return {
                entidadIds: entRows.map((r) => r.ID_ENTIDAD || r.id_entidad),
                unidadIds: uniRows.map((r) => r.ID_UNIDAD || r.id_unidad),
            };
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    getUnidadesDeEntidad
     * @description Obtiene la lista de unidades organizacionales vinculadas a una entidad específica.
     * @param       {number} entidadId - ID de la entidad.
     * @returns     {Promise<any[]>} Lista de unidades vinculadas.
     */
    static async getUnidadesDeEntidad(entidadId) {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            const result = await connection.execute(`BEGIN :cursor := pkg_safi_admin.fn_get_unidades_de_entidad(:entidadId); END;`, {
                entidadId,
                cursor: { type: oracledb_1.default.CURSOR, dir: oracledb_1.default.BIND_OUT },
            }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
            const cursor = result.outBinds.cursor;
            const rows = await cursor.getRows(100);
            await cursor.close();
            return rows.map((row) => ({
                id: row.ID !== undefined ? row.ID : row.id,
                nombre: row.NOMBRE !== undefined ? row.NOMBRE : row.nombre,
                slug: row.SLUG !== undefined ? row.SLUG : row.slug,
                desc: row.DESC !== undefined ? row.DESC : row.desc,
                estado: row.ESTADO !== undefined ? row.ESTADO : row.estado,
            }));
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    getUnidadEntidadVinculos
     * @description Obtiene todos los vínculos de relación existentes entre unidades y entidades.
     * @returns     {Promise<any[]>} Lista de vínculos unidad-entidad.
     */
    static async getUnidadEntidadVinculos() {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            const result = await connection.execute(`BEGIN :cursor := pkg_safi_admin.fn_get_unidad_entidad_vinculos(); END;`, {
                cursor: { type: oracledb_1.default.CURSOR, dir: oracledb_1.default.BIND_OUT },
            }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
            const cursor = result.outBinds.cursor;
            const rows = await cursor.getRows(100);
            await cursor.close();
            return rows.map((row) => ({
                id_unidad: row.ID_UNIDAD !== undefined ? row.ID_UNIDAD : row.id_unidad,
                id_entidad: row.ID_ENTIDAD !== undefined ? row.ID_ENTIDAD : row.id_entidad,
            }));
        }
        finally {
            await connection.close();
        }
    }
    /**
     * =============================================================================================
     * 5. INTERNOS AUXILIARES
     * ---------------------------------------------------------------------------------------------
     * Métodos privados de utilidad para resolución de nodos y lógica interna.
     * =============================================================================================
     */
    /**
     * @function    resolveNodeId
     * @description Resuelve el identificador de un nodo, obteniendo su ID numérico a partir de su código técnico si es necesario.
     * @param       {string | number} identifier - Código técnico o ID numérico del nodo.
     * @returns     {Promise<number>} ID numérico del nodo resuelto.
     */
    static async resolveNodeId(identifier) {
        if (!identifier)
            return 0;
        const num = Number(identifier);
        if (!isNaN(num))
            return num;
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            const result = await connection.execute(`BEGIN :id := pkg_seguridad_admin.fn_resolve_node_id(:code); END;`, {
                code: String(identifier).trim().toUpperCase(),
                id: { type: oracledb_1.default.NUMBER, dir: oracledb_1.default.BIND_OUT },
            });
            return result.outBinds.id || 0;
        }
        finally {
            await connection.close();
        }
    }
    static async resolveNodeCode(identifier) {
        if (!identifier)
            return "";
        const num = Number(identifier);
        if (isNaN(num)) {
            return String(identifier).trim().toUpperCase();
        }
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            const result = await connection.execute(`BEGIN :code := pkg_seguridad_admin.fn_resolve_node_code(:id); END;`, {
                id: num,
                code: { type: oracledb_1.default.STRING, dir: oracledb_1.default.BIND_OUT },
            });
            return String(result.outBinds.code || "")
                .trim()
                .toUpperCase();
        }
        finally {
            await connection.close();
        }
    }
    static async resolveTypeId(identifier) {
        if (!identifier)
            return 0;
        const num = Number(identifier);
        if (!isNaN(num))
            return num;
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            const result = await connection.execute(`BEGIN :id := pkg_seguridad_admin.fn_resolve_tipo_nodo_id(:codigo); END;`, {
                codigo: String(identifier).trim().toUpperCase(),
                id: { type: oracledb_1.default.NUMBER, dir: oracledb_1.default.BIND_OUT },
            });
            const id = result.outBinds.id || 0;
            if (!id) {
                throw new Error(`Tipo de nodo inexistente: ${identifier}`);
            }
            return id;
        }
        finally {
            await connection.close();
        }
    }
    static async resolveOperationId(identifier) {
        if (!identifier)
            return 0;
        const num = Number(identifier);
        if (!isNaN(num))
            return num;
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            const result = await connection.execute(`BEGIN :id := pkg_seguridad_admin.fn_resolve_operacion_id(:nombre); END;`, {
                nombre: String(identifier).trim().toUpperCase(),
                id: { type: oracledb_1.default.NUMBER, dir: oracledb_1.default.BIND_OUT },
            });
            const id = result.outBinds.id || 0;
            if (!id) {
                throw new Error(`Operacion inexistente: ${identifier}`);
            }
            return id;
        }
        finally {
            await connection.close();
        }
    }
    // --- SAFI MODULOS METHODS ---
    static async getSafiModulos() {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            const res = await connection.execute(`SELECT id_modulo, codigo, nombre, descripcion, activo 
         FROM safi_modulos 
         WHERE activo = 'S' 
         ORDER BY nombre`, [], { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
            const modulos = (res.rows || []);
            for (let mod of modulos) {
                const nodesRes = await connection.execute(`SELECT n.id_nodo, n.codigo_tecnico, n.etiqueta, tn.codigo_tipo as tipo_nodo,
                  n.url_ruta, n.slug, n.icono, n.descripcion, n.orden_visual, n.activo
           FROM safi_modulo_nodos smn 
           JOIN acc_nodos n ON smn.id_nodo = n.id_nodo 
           JOIN acc_tipos_nodo tn ON n.id_tipo_nodo = tn.id_tipo_nodo 
           WHERE smn.id_modulo = :id_modulo 
             AND smn.activo = 'S' 
             AND n.activo = 'S'`, { id_modulo: mod.ID_MODULO || mod.id_modulo }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
                mod.nodos = (nodesRes.rows || []).map((row) => ({
                    id_nodo: row.ID_NODO !== undefined ? row.ID_NODO : row.id_nodo,
                    codigo_tecnico: row.CODIGO_TECNICO !== undefined ? row.CODIGO_TECNICO : row.codigo_tecnico,
                    etiqueta: row.ETIQUETA !== undefined ? row.ETIQUETA : row.etiqueta,
                    tipo_nodo: row.TIPO_NODO !== undefined ? row.TIPO_NODO : row.tipo_nodo,
                    url_ruta: row.URL_RUTA !== undefined ? row.URL_RUTA : row.url_ruta,
                    slug: row.SLUG !== undefined ? row.SLUG : row.slug,
                    icono: row.ICONO !== undefined ? row.ICONO : row.icono,
                    descripcion: row.DESCRIPCION !== undefined ? row.DESCRIPCION : row.descripcion,
                    orden_visual: row.ORDEN_VISUAL !== undefined ? row.ORDEN_VISUAL : row.orden_visual,
                    activo: row.ACTIVO !== undefined ? row.ACTIVO : row.activo,
                }));
            }
            return modulos.map((mod) => ({
                id_modulo: mod.ID_MODULO !== undefined ? mod.ID_MODULO : mod.id_modulo,
                codigo: mod.CODIGO !== undefined ? mod.CODIGO : mod.codigo,
                nombre: mod.NOMBRE !== undefined ? mod.NOMBRE : mod.nombre,
                descripcion: mod.DESCRIPCION !== undefined ? mod.DESCRIPCION : mod.descripcion,
                activo: mod.ACTIVO !== undefined ? mod.ACTIVO : mod.activo,
                nodos: mod.nodos,
            }));
        }
        finally {
            await connection.close();
        }
    }
    static async upsertSafiModulo(dto) {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            if (dto.id_modulo) {
                await connection.execute(`UPDATE safi_modulos 
           SET codigo = :codigo, nombre = :nombre, descripcion = :descripcion, activo = :activo,
               fecha_modificacion = SYSDATE, modificado_por = USER 
           WHERE id_modulo = :id_modulo`, {
                    id_modulo: dto.id_modulo,
                    codigo: dto.codigo.trim().toUpperCase(),
                    nombre: dto.nombre,
                    descripcion: dto.descripcion || null,
                    activo: dto.activo || 'S',
                });
            }
            else {
                await connection.execute(`INSERT INTO safi_modulos (codigo, nombre, descripcion, activo) 
           VALUES (:codigo, :nombre, :descripcion, :activo)`, {
                    codigo: dto.codigo.trim().toUpperCase(),
                    nombre: dto.nombre,
                    descripcion: dto.descripcion || null,
                    activo: dto.activo || 'S',
                });
            }
            await connection.commit();
        }
        finally {
            await connection.close();
        }
    }
    static async deleteSafiModulo(idModulo) {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            await connection.execute(`UPDATE safi_modulos 
         SET activo = 'N', fecha_eliminacion = SYSDATE, eliminado_por = USER 
         WHERE id_modulo = :id_modulo`, { id_modulo: idModulo });
            await connection.commit();
        }
        finally {
            await connection.close();
        }
    }
    static async vincularModuloNodo(idModulo, idNodo) {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            // Validar que el nodo sea de tipo OBJETO o OBJ_ATTR y que sea nodo raíz (sin padres de tipo OBJETO o OBJ_ATTR)
            const checkResult = await connection.execute(`SELECT 1
         FROM acc_nodos n
         JOIN acc_tipos_nodo tn ON n.id_tipo_nodo = tn.id_tipo_nodo
         WHERE n.id_nodo = :idNodo
           AND tn.codigo_tipo IN ('OBJ_ATTR', 'OBJETO')
           AND n.activo = 'S'
           AND NOT EXISTS (
             SELECT 1 
             FROM acc_asignaciones a
             JOIN acc_nodos p ON a.id_padre = p.id_nodo
             JOIN acc_tipos_nodo tp ON p.id_tipo_nodo = tp.id_tipo_nodo
             WHERE a.id_hijo = n.id_nodo
               AND a.activo = 'S'
               AND tp.codigo_tipo IN ('OBJ_ATTR', 'OBJETO')
           )`, { idNodo });
            if (!checkResult.rows || checkResult.rows.length === 0) {
                throw new Error("El nodo seleccionado no es un nodo raíz válido de tipo OBJETO o OBJ_ATTR.");
            }
            await connection.execute(`MERGE INTO safi_modulo_nodos dest
         USING (SELECT :idModulo AS id_modulo, :idNodo AS id_nodo FROM DUAL) src
         ON (dest.id_modulo = src.id_modulo AND dest.id_nodo = src.id_nodo)
         WHEN MATCHED THEN
           UPDATE SET dest.activo = 'S', dest.fecha_modificacion = SYSDATE, dest.modificado_por = USER
         WHEN NOT MATCHED THEN
           INSERT (id_modulo, id_nodo, activo) VALUES (src.id_modulo, src.id_nodo, 'S')`, { idModulo, idNodo });
            await connection.commit();
        }
        finally {
            await connection.close();
        }
    }
    static async desvincularModuloNodo(idModulo, idNodo) {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            await connection.execute(`UPDATE safi_modulo_nodos 
         SET activo = 'N', fecha_modificacion = SYSDATE, modificado_por = USER 
         WHERE id_modulo = :idModulo AND id_nodo = :idNodo`, { idModulo, idNodo });
            await connection.commit();
        }
        finally {
            await connection.close();
        }
    }
}
exports.NgacAdminService = NgacAdminService;
