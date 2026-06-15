"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const ngac_admin_service_1 = require("../services/ngac-admin.service");
class AdminController {
    // --- ENDPOINTS PARA DASHBOARD ---
    static async getModulosRaiz(req, res) {
        try {
            const modulos = await ngac_admin_service_1.NgacAdminService.getModulosRaiz();
            res.json(modulos);
        }
        catch (err) {
            console.error("[AdminController] Error obteniendo módulos raíz:", err);
            res
                .status(500)
                .json({ error: "Error interno del servidor", detail: err.message });
        }
    }
    static async getPoliticasRaiz(req, res) {
        try {
            const politicas = await ngac_admin_service_1.NgacAdminService.getPoliticasRaiz();
            res.json(politicas);
        }
        catch (err) {
            console.error("[AdminController] Error obteniendo políticas raíz:", err);
            res
                .status(500)
                .json({ error: "Error interno del servidor", detail: err.message });
        }
    }
    // --- ENDPOINTS DE ROLES ---
    static async getRoles(req, res) {
        try {
            const roles = await ngac_admin_service_1.NgacAdminService.getRoles();
            res.json(roles);
        }
        catch (err) {
            console.error("[AdminController] Error obteniendo roles:", err);
            res
                .status(500)
                .json({ error: "Error interno del servidor", detail: err.message });
        }
    }
    static async upsertRol(req, res) {
        try {
            const rol = req.body;
            if (!rol.codigo || !rol.nombre) {
                return res
                    .status(400)
                    .json({ error: "Faltan parametros obligatorios (codigo, nombre)" });
            }
            await ngac_admin_service_1.NgacAdminService.upsertRol(rol);
            res.json({ success: true, message: "Rol procesado exitosamente" });
        }
        catch (err) {
            console.error("[AdminController] Error procesando rol:", err);
            res
                .status(500)
                .json({ error: "Error interno del servidor", detail: err.message });
        }
    }
    static async deleteRol(req, res) {
        try {
            const { id } = req.params;
            await ngac_admin_service_1.NgacAdminService.deleteRol(Number(id));
            res.json({ success: true, message: "Rol eliminado exitosamente" });
        }
        catch (err) {
            console.error("[AdminController] Error eliminando rol:", err);
            res
                .status(409)
                .json({ error: "No se pudo eliminar el rol", detail: err.message });
        }
    }
    static async getDashboardStats(req, res) {
        try {
            const stats = await ngac_admin_service_1.NgacAdminService.getDashboardStats();
            res.json(stats);
        }
        catch (err) {
            console.error("[AdminController] Error obteniendo dashboard stats:", err);
            res
                .status(500)
                .json({ error: "Error interno del servidor", detail: err.message });
        }
    }
    static async getTree(req, res) {
        console.log(">>> [AdminController] HIT TREE [" + new Date().toISOString() + "]");
        try {
            const { rolBase } = req.query;
            const tree = await ngac_admin_service_1.NgacAdminService.getTree(rolBase);
            res.json(tree);
        }
        catch (err) {
            console.error("[AdminController] Error obteniendo arbol:", err);
            res
                .status(500)
                .json({ error: "Error interno del servidor", detail: err.message });
        }
    }
    static async simulateTree(req, res) {
        try {
            const { claims } = req.body;
            let claimsArray = [];
            if (typeof claims === "string") {
                claimsArray = claims
                    .split(",")
                    .map((c) => c.trim())
                    .filter((c) => c);
            }
            else if (Array.isArray(claims)) {
                claimsArray = claims;
            }
            const contextoParams = JSON.stringify({ claims: claimsArray });
            const result = await ngac_admin_service_1.NgacAdminService.getSimulatedTree(contextoParams);
            res.json(result);
        }
        catch (err) {
            console.error("[AdminController] Error simulando arbol:", err);
            res
                .status(500)
                .json({ error: "Error interno del servidor", detail: err.message });
        }
    }
    static async getNodos(req, res) {
        try {
            const nodos = await ngac_admin_service_1.NgacAdminService.getNodos();
            res.json(nodos);
        }
        catch (err) {
            console.error("[AdminController] Error obteniendo nodos:", err);
            res
                .status(500)
                .json({ error: "Error interno del servidor", detail: err.message });
        }
    }
    static async upsertNodo(req, res) {
        try {
            const dto = req.body;
            if (!dto.codigo || !dto.etiqueta || !dto.tipo) {
                return res.status(400).json({
                    error: "Faltan parametros obligatorios (codigo, etiqueta, tipo)",
                });
            }
            await ngac_admin_service_1.NgacAdminService.upsertNodo(dto);
            res.json({ success: true, message: "Nodo procesado exitosamente" });
        }
        catch (err) {
            console.error("[AdminController] Error procesando nodo:", err);
            res
                .status(500)
                .json({ error: "Error interno del servidor", detail: err.message });
        }
    }
    static async deleteNodo(req, res) {
        try {
            const { codigo } = req.params;
            await ngac_admin_service_1.NgacAdminService.deactivateNodo(codigo);
            res.json({ success: true, message: "Nodo desactivado exitosamente" });
        }
        catch (err) {
            console.error("[AdminController] Error desactivando nodo:", err);
            res
                .status(500)
                .json({ error: "Error interno del servidor", detail: err.message });
        }
    }
    static async getTiposNodo(req, res) {
        try {
            const tipos = await ngac_admin_service_1.NgacAdminService.getTiposNodo();
            res.json(tipos);
        }
        catch (err) {
            console.error("[AdminController] Error obteniendo tipos de nodo:", err);
            res
                .status(500)
                .json({ error: "Error interno del servidor", detail: err.message });
        }
    }
    static async upsertTipoNodo(req, res) {
        try {
            const dto = req.body;
            if (!dto.codigo) {
                return res.status(400).json({ error: "Codigo de tipo requerido" });
            }
            await ngac_admin_service_1.NgacAdminService.upsertTipoNodo(dto);
            res.json({ success: true, message: "Tipo de nodo procesado" });
        }
        catch (err) {
            console.error("[AdminController] Error procesando tipo de nodo:", err);
            res
                .status(500)
                .json({ error: "Error interno del servidor", detail: err.message });
        }
    }
    static async deleteTipoNodo(req, res) {
        try {
            const { codigo } = req.params;
            await ngac_admin_service_1.NgacAdminService.deleteTipoNodo(codigo);
            res.json({ success: true, message: "Tipo de nodo eliminado" });
        }
        catch (err) {
            console.error("[AdminController] Error eliminando tipo de nodo:", err);
            res.status(409).json({
                error: "No se pudo eliminar el tipo de nodo",
                detail: err.message,
            });
        }
    }
    static async getEnlaces(req, res) {
        try {
            const enlaces = await ngac_admin_service_1.NgacAdminService.getEnlaces();
            res.json(enlaces);
        }
        catch (err) {
            console.error("[AdminController] Error obteniendo enlaces:", err);
            res
                .status(500)
                .json({ error: "Error interno del servidor", detail: err.message });
        }
    }
    static async enlazarNodos(req, res) {
        try {
            const dto = req.body;
            if (!dto.padre || !dto.hijo) {
                return res
                    .status(400)
                    .json({ error: "Faltan parametros obligatorios (padre, hijo)" });
            }
            await ngac_admin_service_1.NgacAdminService.enlazarNodos(dto);
            res.json({ success: true, message: "Enlace creado exitosamente" });
        }
        catch (err) {
            console.error("[AdminController] Error enlazando nodos:", err);
            res
                .status(500)
                .json({ error: "Error interno del servidor", detail: err.message });
        }
    }
    static async deleteEnlace(req, res) {
        try {
            const dto = req.params;
            await ngac_admin_service_1.NgacAdminService.deleteEnlace(dto);
            res.json({ success: true, message: "Enlace eliminado exitosamente" });
        }
        catch (err) {
            console.error("[AdminController] Error eliminando enlace:", err);
            res
                .status(500)
                .json({ error: "Error interno del servidor", detail: err.message });
        }
    }
    static async getRolesPorNodo(req, res) {
        const id = req.query.id ? parseInt(req.query.id, 10) : null;
        console.log("[AdminController] getRolesPorNodo >> Recibido ID (Query):", id);
        try {
            if (!id) {
                return res.status(400).json({ error: "El parámetro 'id' (numérico) es requerido" });
            }
            const roles = await ngac_admin_service_1.NgacAdminService.getRolesPorNodo(id);
            console.log("[AdminController] getRolesPorNodo >> Éxito, roles enviados:", roles.length);
            res.json(roles);
        }
        catch (err) {
            console.error("[AdminController] Error obteniendo roles por nodo ID:", err);
            res
                .status(500)
                .json({ error: "Error interno del servidor", detail: err.message });
        }
        return;
    }
    static async getPermisos(req, res) {
        try {
            const { usr, obj } = req.query;
            // Paginación: page y pageSize, por defecto 1 y 5
            const page = req.query.page ? parseInt(req.query.page, 10) : 1;
            const pageSize = req.query.pageSize
                ? parseInt(req.query.pageSize, 10)
                : 5;
            const result = await ngac_admin_service_1.NgacAdminService.getPermisos(usr, obj, page, pageSize);
            res.json(result);
        }
        catch (err) {
            console.error("[AdminController] Error obteniendo permisos:", err);
            res
                .status(500)
                .json({ error: "Error interno del servidor", detail: err.message });
        }
    }
    static async otorgarPermiso(req, res) {
        try {
            const dto = req.body;
            if (!dto.usr || !dto.obj || !dto.op) {
                return res
                    .status(400)
                    .json({ error: "Faltan parametros obligatorios (usr, obj, op)" });
            }
            await ngac_admin_service_1.NgacAdminService.otorgarPermiso(dto);
            res.json({ success: true, message: "Permiso otorgado exitosamente" });
        }
        catch (err) {
            console.error("[AdminController] Error otorgando permiso:", err);
            res
                .status(500)
                .json({ error: "Error interno del servidor", detail: err.message });
        }
    }
    static async denegarPermiso(req, res) {
        try {
            const dto = req.body;
            if (!dto.usr || !dto.obj || !dto.op) {
                return res
                    .status(400)
                    .json({ error: "Faltan parametros obligatorios (usr, obj, op)" });
            }
            await ngac_admin_service_1.NgacAdminService.denegarPermiso(dto);
            res.json({ success: true, message: "Permiso denegado exitosamente" });
        }
        catch (err) {
            console.error("[AdminController] Error denegando permiso:", err);
            res
                .status(500)
                .json({ error: "Error interno del servidor", detail: err.message });
        }
    }
    static async revocarPermiso(req, res) {
        try {
            const dto = req.body;
            if (!dto.usr || !dto.obj || !dto.op) {
                return res
                    .status(400)
                    .json({ error: "Faltan parametros obligatorios (usr, obj, op)" });
            }
            await ngac_admin_service_1.NgacAdminService.revocarPermiso(dto);
            res.json({ success: true, message: "Permiso revocado exitosamente" });
        }
        catch (err) {
            console.error("[AdminController] Error revocando permiso:", err);
            res
                .status(500)
                .json({ error: "Error interno del servidor", detail: err.message });
        }
    }
    static async getOperaciones(req, res) {
        try {
            const ops = await ngac_admin_service_1.NgacAdminService.getOperaciones();
            res.json(ops);
        }
        catch (err) {
            console.error("[AdminController] Error obteniendo operaciones:", err);
            res
                .status(500)
                .json({ error: "Error interno del servidor", detail: err.message });
        }
    }
    static async upsertOperacion(req, res) {
        try {
            const { nombre_op, descripcion } = req.body;
            if (!nombre_op) {
                return res.status(400).json({ error: "Nombre de operacion requerido" });
            }
            await ngac_admin_service_1.NgacAdminService.upsertOperacion(nombre_op, descripcion);
            res.json({ success: true, message: "Operacion procesada" });
        }
        catch (err) {
            console.error("[AdminController] Error procesando operacion:", err);
            res
                .status(500)
                .json({ error: "Error interno del servidor", detail: err.message });
        }
    }
    static async deleteOperacion(req, res) {
        try {
            const { nombre } = req.params;
            await ngac_admin_service_1.NgacAdminService.deleteOperacion(nombre);
            res.json({ success: true, message: "Operacion eliminada" });
        }
        catch (err) {
            console.error("[AdminController] Error eliminando operacion:", err);
            res.status(409).json({
                error: "No se pudo eliminar la operacion",
                detail: err.message,
            });
        }
    }
    static async getLogs(req, res) {
        try {
            const logs = await ngac_admin_service_1.NgacAdminService.getLogs();
            res.json(logs);
        }
        catch (err) {
            console.error("[AdminController] Error obteniendo logs:", err);
            res
                .status(500)
                .json({ error: "Error interno del servidor", detail: err.message });
        }
    }
    static async clearLogs(req, res) {
        try {
            await ngac_admin_service_1.NgacAdminService.clearLogs();
            res.json({ success: true, message: "Logs limpiados exitosamente" });
        }
        catch (err) {
            console.error("[AdminController] Error limpiando logs:", err);
            res
                .status(500)
                .json({ error: "Error interno del servidor", detail: err.message });
        }
    }
}
exports.AdminController = AdminController;
