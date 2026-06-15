"use strict";
/**
 * @file        OracleNgacRepositoryAdapter.ts
 * @description Implementación del adaptador de persistencia para Oracle DB utilizando consultas seguras.
 * @author      IA Assistant
 * @date        2026-06-09
 * @version     1.0.0
 * HISTORIAL DE CAMBIOS:
 * -----------------------------------------------------------------------------
 * FECHA        | AUTOR             | VERSIÓN   | DESCRIPCIÓN DEL CAMBIO
 * -----------------------------------------------------------------------------
 * 2026-06-09   | IA Assistant      | 1.0.0     | Creación inicial del archivo.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OracleNgacRepositoryAdapter = void 0;
const oracledb_1 = __importDefault(require("oracledb"));
const db_config_1 = require("../../../../config/db.config");
class OracleNgacRepositoryAdapter {
    /**
     * @function    fetchNodes
     * @description Recupera todos los nodos activos de la tabla ACC_NODOS.
     */
    async fetchNodes() {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            const sql = `
        SELECT n.id_nodo, n.codigo_tecnico, n.etiqueta, n.id_tipo_nodo, t.codigo_tipo,
               n.url_ruta, n.slug, n.icono, n.orden_visual, n.activo, n.descripcion
        FROM acc_nodos n
        LEFT JOIN acc_tipos_nodo t ON n.id_tipo_nodo = t.id_tipo_nodo
        WHERE n.activo = 'S'
      `;
            const result = await connection.execute(sql, [], { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
            const rows = (result.rows || []);
            return rows.map((row) => ({
                idNode: Number(row.ID_NODO),
                code: String(row.CODIGO_TECNICO).trim().toUpperCase(),
                label: String(row.ETIQUETA || "").trim(),
                typeId: Number(row.ID_TIPO_NODO),
                typeCode: String(row.CODIGO_TIPO || "").trim().toUpperCase(),
                urlPath: row.URL_RUTA || undefined,
                slug: row.SLUG || undefined,
                icon: row.ICONO || undefined,
                displayOrder: Number(row.ORDEN_VISUAL || 0),
                description: row.DESCRIPCION || undefined,
                active: row.ACTIVO === "S"
            }));
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    fetchAssignments
     * @description Recupera todos los enlaces jerárquicos de asignaciones activos.
     */
    async fetchAssignments() {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            const sql = `
        SELECT a.id_padre, a.id_hijo 
        FROM acc_asignaciones a
        JOIN acc_nodos np ON a.id_padre = np.id_nodo 
        JOIN acc_nodos nh ON a.id_hijo = nh.id_nodo 
        WHERE a.activo = 'S' AND np.activo = 'S' AND nh.activo = 'S'
      `;
            const result = await connection.execute(sql, [], { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
            const rows = (result.rows || []);
            return rows.map((row) => ({
                parentId: Number(row.ID_PADRE),
                childId: Number(row.ID_HIJO)
            }));
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    fetchAssociations
     * @description Recupera los permisos permitidos (asociaciones positivas).
     */
    async fetchAssociations() {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            const sql = `
        SELECT aso.id_asociacion, aso.id_usr_attr, aso.id_obj_attr, aso.id_op, op.nombre_op, aso.condicion_json
        FROM acc_asociaciones aso
        JOIN acc_operaciones op ON aso.id_op = op.id_op
        WHERE aso.activo = 'S' AND op.activo = 'S'
      `;
            const result = await connection.execute(sql, [], { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
            const rows = (result.rows || []);
            return rows.map((row) => ({
                idAssociation: Number(row.ID_ASOCIACION),
                userAttributeId: Number(row.ID_USR_ATTR),
                objectAttributeId: Number(row.ID_OBJ_ATTR),
                operationId: Number(row.ID_OP),
                operationName: String(row.NOMBRE_OP).trim().toUpperCase(),
                conditionJson: row.CONDICION_JSON || undefined
            }));
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    fetchProhibitions
     * @description Recupera las prohibiciones directas (asociaciones negativas).
     */
    async fetchProhibitions() {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            const sql = `
        SELECT p.id_prohibicion, p.id_usr_attr, p.id_obj_attr, p.id_op, op.nombre_op
        FROM acc_prohibiciones p
        JOIN acc_operaciones op ON p.id_op = op.id_op
        WHERE p.activo = 'S' AND op.activo = 'S'
      `;
            const result = await connection.execute(sql, [], { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
            const rows = (result.rows || []);
            return rows.map((row) => ({
                idProhibition: Number(row.ID_PROHIBICION),
                userAttributeId: Number(row.ID_USR_ATTR),
                objectAttributeId: Number(row.ID_OBJ_ATTR),
                operationId: Number(row.ID_OP),
                operationName: String(row.NOMBRE_OP).trim().toUpperCase()
            }));
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    fetchMenuNodes
     * @description Recupera todos los nodos de menú activos.
     */
    async fetchMenuNodes() {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            const sql = `
        SELECT mn.id_menu_nodo, mn.id_nodo, n.codigo_tecnico,
               COALESCE(mn.etiqueta_visible, n.etiqueta) AS etiqueta,
               COALESCE(mn.slug_visible, n.slug) AS slug,
               COALESCE(mn.icono_visible, n.icono) AS icono,
               COALESCE(mn.descripcion_visible, n.descripcion) AS descripcion,
               COALESCE(mn.url_ruta_visible, n.url_ruta) AS ruta,
               COALESCE(mn.orden_visual, n.orden_visual) AS orden,
               mn.activo
        FROM acc_menu_nodos mn
        JOIN acc_nodos n ON mn.id_nodo = n.id_nodo
        WHERE mn.activo = 'S' AND n.activo = 'S'
      `;
            const result = await connection.execute(sql, [], { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
            const rows = (result.rows || []);
            return rows.map((row) => ({
                idMenuNode: Number(row.ID_MENU_NODO),
                idNode: Number(row.ID_NODO),
                code: String(row.CODIGO_TECNICO).trim().toUpperCase(),
                label: String(row.ETIQUETA || "").trim(),
                slug: row.SLUG || undefined,
                icon: row.ICONO || undefined,
                description: row.DESCRIPCION || undefined,
                urlPath: row.RUTA || undefined,
                displayOrder: Number(row.ORDEN || 0),
                active: row.ACTIVO === "S"
            }));
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    fetchMenuAssignments
     * @description Recupera todos los enlaces jerárquicos activos entre menús.
     */
    async fetchMenuAssignments() {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            const sql = `
        SELECT ma.id_menu_padre, ma.id_menu_hijo
        FROM acc_menu_asignaciones ma
        JOIN acc_menu_nodos mp ON ma.id_menu_padre = mp.id_menu_nodo
        JOIN acc_menu_nodos mh ON ma.id_menu_hijo = mh.id_menu_nodo
        WHERE ma.activo = 'S' AND mp.activo = 'S' AND mh.activo = 'S'
      `;
            const result = await connection.execute(sql, [], { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
            const rows = (result.rows || []);
            return rows.map((row) => ({
                parentMenuId: Number(row.ID_MENU_PADRE),
                childMenuId: Number(row.ID_MENU_HIJO)
            }));
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    fetchPolicyMenuRoots
     * @description Recupera la relación de menús raíz permitidos por cada política.
     */
    async fetchPolicyMenuRoots() {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            const sql = `
        SELECT pmr.id_policy, pmr.id_menu_nodo
        FROM acc_policy_menu_raices pmr
        JOIN acc_menu_nodos mn ON pmr.id_menu_nodo = mn.id_menu_nodo
        WHERE pmr.activo = 'S' AND mn.activo = 'S'
      `;
            const result = await connection.execute(sql, [], { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
            const rows = (result.rows || []);
            return rows.map((row) => ({
                policyId: Number(row.ID_POLICY),
                menuNodeId: Number(row.ID_MENU_NODO)
            }));
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    fetchUserContext
     * @description Recupera los contextos organizacionales (entidades, unidades) del usuario de forma atómica en una sola consulta.
     */
    async fetchUserContext(username) {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            const sql = `
        SELECT u.id_usuario, u.email, u.activo,
               (SELECT LISTAGG(e.codigo, ',') WITHIN GROUP (ORDER BY e.codigo) 
                FROM safi_usuarios_entidades ue 
                JOIN safi_entidades e ON ue.id_entidad = e.id_entidad 
                WHERE ue.id_usuario = u.id_usuario AND ue.activo = 'S' AND e.activo = 'S') AS entities,
               (SELECT LISTAGG(un.codigo, ',') WITHIN GROUP (ORDER BY un.codigo) 
                FROM safi_usuarios_unidades uu 
                JOIN safi_unidades un ON uu.id_unidad = un.id_unidad 
                WHERE uu.id_usuario = u.id_usuario AND uu.activo = 'S' AND un.activo = 'S') AS units
        FROM safi_usuarios u
        WHERE UPPER(TRIM(u.slug_usuario)) = :slug AND u.activo = 'S'
      `;
            const normalizedSlug = String(username || "").trim().toUpperCase();
            const result = await connection.execute(sql, { slug: normalizedSlug }, { outFormat: oracledb_1.default.OUT_FORMAT_OBJECT });
            const row = (result.rows && result.rows[0]);
            if (!row) {
                return null;
            }
            const rawEntities = row.ENTITIES ? String(row.ENTITIES).split(",") : [];
            const rawUnits = row.UNITS ? String(row.UNITS).split(",") : [];
            return {
                userId: Number(row.ID_USUARIO),
                email: String(row.EMAIL || "").trim(),
                active: row.ACTIVO === "S",
                entities: rawEntities.map((e) => e.trim().toUpperCase()).filter((e) => !!e),
                units: rawUnits.map((u) => u.trim().toUpperCase()).filter((u) => !!u)
            };
        }
        finally {
            await connection.close();
        }
    }
    /**
     * @function    writeAccessLog
     * @description Inserta registros de auditoría de accesos.
     */
    async writeAccessLog(entry) {
        const connection = await (0, db_config_1.getDbConnection)();
        try {
            const sql = `
        INSERT INTO acc_log_accesos (usuario, codigo_objeto, operaciones, autorizado, json_contexto)
        VALUES (:username, :objectCode, :operations, :authorized, :contextJson)
      `;
            await connection.execute(sql, {
                username: entry.username.substring(0, 50),
                objectCode: entry.objectCode.substring(0, 100),
                operations: entry.operations.substring(0, 256),
                authorized: entry.authorized,
                contextJson: entry.contextJson
            }, { autoCommit: true });
        }
        catch (err) {
            console.error("[OracleNgacRepositoryAdapter] Error al escribir auditoría en acc_log_accesos:", err);
            // No propagamos el error para cumplir con el requerimiento de fail-safe/asincronismo de auditoría.
        }
        finally {
            await connection.close();
        }
    }
}
exports.OracleNgacRepositoryAdapter = OracleNgacRepositoryAdapter;
