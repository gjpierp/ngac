"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const ngac_admin_service_1 = require("../services/ngac-admin.service");
class AdminController {
    /**
     * Endpoint para verificar acceso usando operaciones como JSON array
     * POST /ngac/verificar-acceso
     * Body: { atributos: string[], operaciones: string[], objeto: string, contextoJson?: object }
     */
    static async verificarAcceso(req, res) {
        try {
            const { atributos, operaciones, objeto, contextoJson } = req.body;
            if (!Array.isArray(atributos) ||
                !Array.isArray(operaciones) ||
                typeof objeto !== "string") {
                return res.status(400).json({
                    error: "Parámetros requeridos: atributos (array), operaciones (array), objeto (string)",
                });
            }
            const result = await ngac_admin_service_1.NgacAdminService.verificarAcceso(atributos, operaciones, objeto, contextoJson);
            res.json({ acceso: result });
        }
        catch (err) {
            console.error("[AdminController] Error en verificarAcceso:", err);
            res
                .status(500)
                .json({ error: "Error interno del servidor", detail: err.message });
        }
    }
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
    static async getCarpetasRaiz(req, res) {
        const id = Number(req.params.id);
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({ error: "Parámetro id inválido" });
        }
        try {
            const data = await ngac_admin_service_1.NgacAdminService.getCarpetasRaiz(id);
            res.setHeader("Content-Type", "application/json");
            return res.json(data);
        }
        catch (err) {
            console.error("[AdminController] Error en getCarpetasRaiz:", err);
            return res
                .status(500)
                .json({ error: "Error interno del servidor", detail: err.message });
        }
    }
    static async getCarpetasRaizSinHijos(req, res) {
        const id = Number(req.params.id);
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({ error: "Parámetro id inválido" });
        }
        try {
            const data = await ngac_admin_service_1.NgacAdminService.getCarpetasRaizSinHijos(id);
            res.setHeader("Content-Type", "application/json");
            return res.json(data);
        }
        catch (err) {
            console.error("[AdminController] Error en getCarpetasRaizSinHijos:", err);
            return res
                .status(500)
                .json({ error: "Error interno del servidor", detail: err.message });
        }
    }
    static async getModulosPorPoliticas(req, res) {
        try {
            const rawCodes = String(req.query.codes || "");
            const policyCodes = rawCodes
                .split(",")
                .map((code) => code.trim())
                .filter((code) => !!code);
            const modulos = await ngac_admin_service_1.NgacAdminService.getModulosPorPoliticas(policyCodes);
            res.json(modulos);
        }
        catch (err) {
            console.error("[AdminController] Error obteniendo módulos por políticas:", err);
            res
                .status(500)
                .json({ error: "Error interno del servidor", detail: err.message });
        }
    }
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
    static async getArbol(req, res) {
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
    static async getMenuByContext(req, res) {
        try {
            const { atributos, claims } = req.body;
            const target = atributos || claims;
            let atributosArray = [];
            if (typeof target === "string") {
                atributosArray = target
                    .split(",")
                    .map((c) => c.trim())
                    .filter((c) => c);
            }
            else if (Array.isArray(target)) {
                atributosArray = target;
            }
            const contextoParams = JSON.stringify({ atributos: atributosArray });
            const result = await ngac_admin_service_1.NgacAdminService.getMenuByContext(contextoParams);
            res.json(result);
        }
        catch (err) {
            console.error("[AdminController] Error obteniendo menú por contexto:", err);
            res
                .status(500)
                .json({ error: "Error interno del servidor", detail: err.message });
        }
    }
    static async generarMenuDinamico(req, res) {
        try {
            const payload = req.body;
            const contextStr = JSON.stringify(payload);
            const result = await ngac_admin_service_1.NgacAdminService.getMenuByContext(contextStr);
            res.json(result);
        }
        catch (err) {
            console.error("[AdminController] Error generando menu dinamico:", err);
            res
                .status(500)
                .json({ error: "Error en motor de seguridad", detail: err.message });
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
            const body = req.body || {};
            const dto = {
                id_nodo: body.id_nodo,
                codigo: body.codigo || body.codigo_tecnico,
                etiqueta: body.etiqueta,
                tipo: body.tipo || body.tipo_nodo,
                ruta: body.ruta || body.url_ruta,
                slug: body.slug,
                icono: body.icono,
                descripcion: body.descripcion,
                orden: body.orden !== undefined ? body.orden : body.orden_visual,
                activo: body.activo,
            };
            if (!dto.codigo || !dto.etiqueta || !dto.tipo) {
                return res.status(400).json({
                    error: "Faltan parametros obligatorios (codigo/codigo_tecnico, etiqueta, tipo/tipo_nodo)",
                });
            }
            const result = await ngac_admin_service_1.NgacAdminService.upsertNodo(dto);
            res.json({
                success: true,
                message: "Nodo procesado exitosamente",
                data: result,
            });
        }
        catch (err) {
            console.error("[AdminController] Error procesando nodo:", err);
            res
                .status(500)
                .json({ error: "Error interno del servidor", detail: err.message });
        }
    }
    static async crearYEnlazarNodo(req, res) {
        try {
            const body = req.body || {};
            const dto = {
                id_nodo: body.id_nodo,
                codigo: body.codigo || body.codigo_tecnico,
                etiqueta: body.etiqueta,
                tipo: body.tipo || body.tipo_nodo,
                ruta: body.ruta || body.url_ruta,
                slug: body.slug,
                icono: body.icono,
                descripcion: body.descripcion,
                orden: body.orden !== undefined ? body.orden : body.orden_visual,
                activo: body.activo,
            };
            const padre = body.padre || body.padreId;
            if (!dto.codigo || !dto.etiqueta || !dto.tipo) {
                return res.status(400).json({
                    error: "Faltan parametros obligatorios (codigo/codigo_tecnico, etiqueta, tipo/tipo_nodo)",
                });
            }
            const result = await ngac_admin_service_1.NgacAdminService.crearYEnlazarNodo(dto, padre);
            res.json({
                success: true,
                message: "Nodo creado y enlazado exitosamente",
                data: result,
            });
        }
        catch (err) {
            console.error("[AdminController] Error en crearYEnlazarNodo:", err);
            res
                .status(500)
                .json({ error: "Error interno del servidor", detail: err.message });
        }
    }
    static async deleteNodo(req, res) {
        try {
            const id = Number(req.params.id);
            if (!id) {
                return res
                    .status(400)
                    .json({ error: "Parámetro obligatorio inválido (id)" });
            }
            await ngac_admin_service_1.NgacAdminService.deactivateNodo(id);
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
    static async getMenuEnlaces(req, res) {
        try {
            const enlaces = await ngac_admin_service_1.NgacAdminService.getMenuEnlaces();
            res.json(enlaces);
        }
        catch (err) {
            console.error("[AdminController] Error obteniendo enlaces de menú:", err);
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
    static async enlazarMenuNodos(req, res) {
        try {
            const dto = req.body;
            if (!dto.padre || !dto.hijo) {
                return res
                    .status(400)
                    .json({ error: "Faltan parametros obligatorios (padre, hijo)" });
            }
            await ngac_admin_service_1.NgacAdminService.enlazarMenuNodos(dto);
            res.json({
                success: true,
                message: "Enlace de menú creado exitosamente",
            });
        }
        catch (err) {
            console.error("[AdminController] Error enlazando nodos de menú:", err);
            res
                .status(500)
                .json({ error: "Error interno del servidor", detail: err.message });
        }
    }
    static async clonarMenuJerarquia(req, res) {
        try {
            const { padre, hijo } = req.body;
            if (!padre || !hijo) {
                return res
                    .status(400)
                    .json({ error: "Faltan parametros obligatorios (padre, hijo)" });
            }
            await ngac_admin_service_1.NgacAdminService.clonarMenuJerarquia({ padre, hijo });
            res.json({
                success: true,
                message: "Jerarquía de menú clonada y duplicada exitosamente",
            });
        }
        catch (err) {
            console.error("[AdminController] Error clonando jerarquía:", err);
            res
                .status(500)
                .json({ error: "Error interno del servidor", detail: err.message });
        }
    }
    static async deleteMenuEnlace(req, res) {
        try {
            const dto = req.params;
            await ngac_admin_service_1.NgacAdminService.deleteMenuEnlace(dto);
            res.json({
                success: true,
                message: "Enlace de menú eliminado exitosamente",
            });
        }
        catch (err) {
            console.error("[AdminController] Error eliminando enlace de menú:", err);
            res
                .status(500)
                .json({ error: "Error interno del servidor", detail: err.message });
        }
    }
    static async getRolesPorNodo(req, res) {
        const id = req.query.id ? parseInt(req.query.id, 10) : null;
        try {
            if (!id) {
                return res
                    .status(400)
                    .json({ error: "El parámetro 'id' (numérico) es requerido" });
            }
            const roles = await ngac_admin_service_1.NgacAdminService.getRolesPorNodo(id);
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
    static async getPermisosMatrix(req, res) {
        try {
            const rol = req.query.rol ? String(req.query.rol) : undefined;
            const politica = req.query.politica
                ? parseInt(req.query.politica, 10)
                : undefined;
            const result = await ngac_admin_service_1.NgacAdminService.getPermisosMatrix(rol, politica);
            res.json(result);
        }
        catch (err) {
            console.error("[AdminController] Error obteniendo matriz de permisos:", err);
            res
                .status(500)
                .json({ error: "Error interno del servidor", detail: err.message });
        }
    }
    static async getPermisos(req, res) {
        try {
            const usr = req.query.usr ? String(req.query.usr) : undefined;
            const obj = req.query.obj
                ? parseInt(req.query.obj, 10)
                : undefined;
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
            res.status(500).json({
                error: "Error interno del servidor",
                detail: err.message,
            });
        }
    }
    static async getProhibiciones(req, res) {
        try {
            const prohibiciones = await ngac_admin_service_1.NgacAdminService.getProhibiciones();
            res.json(prohibiciones);
        }
        catch (err) {
            console.error("[AdminController] Error obteniendo prohibiciones:", err);
            res.status(500).json({
                error: "Error interno del servidor",
                detail: err.message,
            });
        }
    }
    static async revocarProhibicion(req, res) {
        try {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id)) {
                return res.status(400).json({ error: "ID de prohibición inválido" });
            }
            await ngac_admin_service_1.NgacAdminService.revocarProhibicion(id);
            res.json({ success: true, message: "Prohibición revocada exitosamente" });
        }
        catch (err) {
            console.error("[AdminController] Error revocando prohibición:", err);
            res.status(500).json({
                error: "Error interno del servidor",
                detail: err.message,
            });
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
    // ==========================================
    // ENDPOINTS PARA TABLAS SAFI
    // ==========================================
    static async getUsuarios(req, res) {
        try {
            const usuarios = await ngac_admin_service_1.NgacAdminService.getUsuarios();
            res.json(usuarios);
        }
        catch (err) {
            console.error("[AdminController] Error obteniendo usuarios SAFI:", err);
            res
                .status(500)
                .json({ error: "Error interno del servidor", detail: err.message });
        }
    }
    static async upsertUsuario(req, res) {
        try {
            const dto = req.body;
            if (dto.id === undefined ||
                !dto.nombre ||
                !dto.email ||
                !dto.rut_numero ||
                !dto.rut_dv) {
                return res.status(400).json({
                    error: "Faltan parámetros obligatorios (id, nombre, email, rut_numero, rut_dv)",
                });
            }
            if (!/^[0-9]{7,8}$/.test(dto.rut_numero)) {
                return res
                    .status(400)
                    .json({ error: "El número de RUT debe tener 7 u 8 dígitos" });
            }
            if (!/^\d|k|K$/.test(dto.rut_dv)) {
                return res.status(400).json({ error: "Dígito verificador inválido" });
            }
            await ngac_admin_service_1.NgacAdminService.upsertUsuario(dto);
            res.json({
                success: true,
                message: "Usuario SAFI procesado exitosamente",
            });
        }
        catch (err) {
            console.error("[AdminController] Error guardando usuario SAFI:", err);
            res
                .status(500)
                .json({ error: "Error interno del servidor", detail: err.message });
        }
    }
    static async deleteUsuario(req, res) {
        try {
            const { id } = req.params;
            const numericId = Number(id);
            if (isNaN(numericId)) {
                return res.status(400).json({ error: "ID de usuario inválido" });
            }
            await ngac_admin_service_1.NgacAdminService.deleteUsuario(numericId);
            res.json({
                success: true,
                message: "Usuario SAFI eliminado exitosamente",
            });
        }
        catch (err) {
            console.error("[AdminController] Error eliminando usuario SAFI:", err);
            res
                .status(500)
                .json({ error: "Error interno del servidor", detail: err.message });
        }
    }
    static async getEntidades(req, res) {
        try {
            const entidades = await ngac_admin_service_1.NgacAdminService.getEntidades();
            res.json(entidades);
        }
        catch (err) {
            console.error("[AdminController] Error obteniendo entidades SAFI:", err);
            res
                .status(500)
                .json({ error: "Error interno del servidor", detail: err.message });
        }
    }
    static async upsertEntidad(req, res) {
        try {
            const dto = req.body;
            if (dto.id === undefined || !dto.codigo || !dto.nombre || !dto.slug) {
                return res.status(400).json({
                    error: "Faltan parámetros obligatorios (id, codigo, nombre, slug)",
                });
            }
            await ngac_admin_service_1.NgacAdminService.upsertEntidad(dto);
            res.json({
                success: true,
                message: "Entidad SAFI procesada exitosamente",
            });
        }
        catch (err) {
            console.error("[AdminController] Error guardando entidad SAFI:", err);
            res
                .status(500)
                .json({ error: "Error interno del servidor", detail: err.message });
        }
    }
    static async deleteEntidad(req, res) {
        try {
            const { id } = req.params;
            const numericId = Number(id);
            if (isNaN(numericId)) {
                return res.status(400).json({ error: "ID de entidad inválido" });
            }
            await ngac_admin_service_1.NgacAdminService.deleteEntidad(numericId);
            res.json({
                success: true,
                message: "Entidad SAFI eliminada exitosamente",
            });
        }
        catch (err) {
            console.error("[AdminController] Error eliminando entidad SAFI:", err);
            res
                .status(500)
                .json({ error: "Error interno del servidor", detail: err.message });
        }
    }
    static async getUnidades(req, res) {
        try {
            const unidades = await ngac_admin_service_1.NgacAdminService.getUnidades();
            res.json(unidades);
        }
        catch (err) {
            console.error("[AdminController] Error obteniendo unidades SAFI:", err);
            res
                .status(500)
                .json({ error: "Error interno del servidor", detail: err.message });
        }
    }
    static async upsertUnidad(req, res) {
        try {
            const dto = req.body;
            if (dto.id === undefined || !dto.codigo || !dto.nombre || !dto.slug) {
                return res.status(400).json({
                    error: "Faltan parámetros obligatorios (id, codigo, nombre, slug)",
                });
            }
            await ngac_admin_service_1.NgacAdminService.upsertUnidad(dto);
            res.json({
                success: true,
                message: "Unidad SAFI procesada exitosamente",
            });
        }
        catch (err) {
            console.error("[AdminController] Error guardando unidad SAFI:", err);
            res
                .status(500)
                .json({ error: "Error interno del servidor", detail: err.message });
        }
    }
    static async deleteUnidad(req, res) {
        try {
            const { id } = req.params;
            const numericId = Number(id);
            if (isNaN(numericId)) {
                return res.status(400).json({ error: "ID de unidad inválido" });
            }
            await ngac_admin_service_1.NgacAdminService.deleteUnidad(numericId);
            res.json({
                success: true,
                message: "Unidad SAFI eliminada exitosamente",
            });
        }
        catch (err) {
            console.error("[AdminController] Error eliminando unidad SAFI:", err);
            res
                .status(500)
                .json({ error: "Error interno del servidor", detail: err.message });
        }
    }
    static async crearUsuario(req, res) {
        try {
            const dto = req.body;
            if (!dto.slug_usuario ||
                !dto.rut_numero ||
                !dto.rut_dv ||
                !dto.nombres ||
                !dto.apellidos ||
                !dto.email) {
                return res.status(400).json({
                    error: "Faltan parámetros obligatorios (slug_usuario, rut_numero, rut_dv, nombres, apellidos, email)",
                });
            }
            // Pasar rut_numero y rut_dv como corresponde al servicio
            const newId = await ngac_admin_service_1.NgacAdminService.crearUsuario(dto);
            res.status(201).json({
                success: true,
                message: "Usuario creado exitosamente en SAFI",
                data: { id_usuario: newId },
            });
        }
        catch (err) {
            console.error("[AdminController] Error en crearUsuario:", err);
            // Mejorar el detalle del error si viene de Oracle
            let detail = err.message;
            if (err.errorNum && err.message) {
                detail = `Oracle error ${err.errorNum}: ${err.message}`;
            }
            res.status(500).json({ error: "Error al crear usuario en SAFI", detail });
        }
    }
    static async desactivarUsuario(req, res) {
        try {
            const idUsuario = Number(req.body.id_usuario);
            if (isNaN(idUsuario)) {
                return res
                    .status(400)
                    .json({ error: "id_usuario (número) es obligatorio" });
            }
            await ngac_admin_service_1.NgacAdminService.desactivarUsuario(idUsuario);
            res.json({
                success: true,
                message: "Usuario desactivado exitosamente en SAFI",
            });
        }
        catch (err) {
            console.error("[AdminController] Error en desactivarUsuario:", err);
            res.status(500).json({
                error: "Error al desactivar usuario en SAFI",
                detail: err.message,
            });
        }
    }
    static async crearUnidad(req, res) {
        try {
            const dto = req.body;
            if (!dto.codigo || !dto.slug_unidad || !dto.nombre_unidad) {
                return res.status(400).json({
                    error: "Faltan parámetros obligatorios (codigo, slug_unidad, nombre_unidad)",
                });
            }
            const newId = await ngac_admin_service_1.NgacAdminService.crearUnidad(dto);
            res.status(201).json({
                success: true,
                message: "Unidad creada exitosamente en SAFI",
                data: { id_unidad: newId },
            });
        }
        catch (err) {
            console.error("[AdminController] Error en crearUnidad:", err);
            res
                .status(500)
                .json({ error: "Error al crear unidad en SAFI", detail: err.message });
        }
    }
    static async crearEntidad(req, res) {
        try {
            const dto = req.body;
            if (!dto.codigo || !dto.slug_entidad || !dto.nombre_entidad || !dto.tipo_entidad) {
                return res.status(400).json({
                    error: "Faltan parámetros obligatorios (codigo, slug_entidad, nombre_entidad, tipo_entidad)",
                });
            }
            const newId = await ngac_admin_service_1.NgacAdminService.crearEntidad(dto);
            res.status(201).json({
                success: true,
                message: "Entidad creada exitosamente en SAFI",
                data: { id_entidad: newId },
            });
        }
        catch (err) {
            console.error("[AdminController] Error en crearEntidad:", err);
            res
                .status(500)
                .json({ error: "Error al crear entidad en SAFI", detail: err.message });
        }
    }
    static async vincularUsuarioUnidad(req, res) {
        try {
            const dto = req.body;
            if (dto.id_usuario === undefined || dto.id_unidad === undefined) {
                return res.status(400).json({
                    error: "Faltan parámetros obligatorios (id_usuario, id_unidad)",
                });
            }
            await ngac_admin_service_1.NgacAdminService.vincularUsuarioUnidad(dto);
            res.json({
                success: true,
                message: "Usuario vinculado a Unidad exitosamente",
            });
        }
        catch (err) {
            console.error("[AdminController] Error en vincularUsuarioUnidad:", err);
            res.status(500).json({
                error: "Error al vincular usuario a unidad",
                detail: err.message,
            });
        }
    }
    static async desvincularUsuarioUnidad(req, res) {
        try {
            const dto = {
                id_usuario: Number(req.query.id_usuario || req.body.id_usuario),
                id_unidad: Number(req.query.id_unidad || req.body.id_unidad),
            };
            if (isNaN(dto.id_usuario) || isNaN(dto.id_unidad)) {
                return res.status(400).json({
                    error: "id_usuario y id_unidad son requeridos y deben ser números",
                });
            }
            await ngac_admin_service_1.NgacAdminService.desvincularUsuarioUnidad(dto);
            res.json({
                success: true,
                message: "Usuario desvinculado de Unidad exitosamente",
            });
        }
        catch (err) {
            console.error("[AdminController] Error en desvincularUsuarioUnidad:", err);
            res.status(500).json({
                error: "Error al desvincular usuario de unidad",
                detail: err.message,
            });
        }
    }
    static async vincularUsuarioEntidad(req, res) {
        try {
            const dto = req.body;
            if (dto.id_usuario === undefined || dto.id_entidad === undefined) {
                return res.status(400).json({
                    error: "Faltan parámetros obligatorios (id_usuario, id_entidad)",
                });
            }
            await ngac_admin_service_1.NgacAdminService.vincularUsuarioEntidad(dto);
            res.json({
                success: true,
                message: "Usuario vinculado a Entidad exitosamente",
            });
        }
        catch (err) {
            console.error("[AdminController] Error en vincularUsuarioEntidad:", err);
            res.status(500).json({
                error: "Error al vincular usuario a entidad",
                detail: err.message,
            });
        }
    }
    static async desvincularUsuarioEntidad(req, res) {
        try {
            const dto = {
                id_usuario: Number(req.query.id_usuario || req.body.id_usuario),
                id_entidad: Number(req.query.id_entidad || req.body.id_entidad),
            };
            if (isNaN(dto.id_usuario) || isNaN(dto.id_entidad)) {
                return res.status(400).json({
                    error: "id_usuario y id_entidad son requeridos y deben ser números",
                });
            }
            await ngac_admin_service_1.NgacAdminService.desvincularUsuarioEntidad(dto);
            res.json({
                success: true,
                message: "Usuario desvinculado de Entidad exitosamente",
            });
        }
        catch (err) {
            console.error("[AdminController] Error en desvincularUsuarioEntidad:", err);
            res.status(500).json({
                error: "Error al desvincular usuario de entidad",
                detail: err.message,
            });
        }
    }
    static async vincularUnidadEntidad(req, res) {
        try {
            const dto = req.body;
            if (dto.id_unidad === undefined || dto.id_entidad === undefined) {
                return res.status(400).json({
                    error: "Faltan parámetros obligatorios (id_unidad, id_entidad)",
                });
            }
            await ngac_admin_service_1.NgacAdminService.vincularUnidadEntidad(dto);
            res.json({
                success: true,
                message: "Unidad vinculada a Entidad exitosamente",
            });
        }
        catch (err) {
            console.error("[AdminController] Error en vincularUnidadEntidad:", err);
            res.status(500).json({
                error: "Error al vincular unidad a entidad",
                detail: err.message,
            });
        }
    }
    static async desvincularUnidadEntidad(req, res) {
        try {
            const dto = {
                id_unidad: Number(req.query.id_unidad || req.body.id_unidad),
                id_entidad: Number(req.query.id_entidad || req.body.id_entidad),
            };
            if (isNaN(dto.id_unidad) || isNaN(dto.id_entidad)) {
                return res.status(400).json({
                    error: "id_unidad y id_entidad son requeridos y deben ser números",
                });
            }
            await ngac_admin_service_1.NgacAdminService.desvincularUnidadEntidad(dto);
            res.json({
                success: true,
                message: "Unidad desvinculada de Entidad exitosamente",
            });
        }
        catch (err) {
            console.error("[AdminController] Error en desvincularUnidadEntidad:", err);
            res.status(500).json({
                error: "Error al desvincular unidad de entidad",
                detail: err.message,
            });
        }
    }
    static async getUsuarioVinculos(req, res) {
        try {
            const userId = Number(req.params.userId);
            if (isNaN(userId)) {
                return res.status(400).json({
                    error: "El ID de usuario es obligatorio y debe ser numérico",
                });
            }
            const vinculos = await ngac_admin_service_1.NgacAdminService.getUsuarioVinculos(userId);
            res.json({ success: true, data: vinculos });
        }
        catch (err) {
            console.error("[AdminController] Error en getUsuarioVinculos:", err);
            res.status(500).json({
                error: "Error al obtener vínculos del usuario",
                detail: err.message,
            });
        }
    }
    static async getRolesDeUsuario(req, res) {
        try {
            const userId = Number(req.params.userId);
            if (isNaN(userId)) {
                return res
                    .status(400)
                    .json({ error: "El ID de usuario debe ser numérico" });
            }
            const roles = await ngac_admin_service_1.NgacAdminService.getRolesDeUsuario(userId);
            res.json({ success: true, data: roles });
        }
        catch (err) {
            console.error("[AdminController] Error en getRolesDeUsuario:", err);
            res.status(500).json({
                error: "Error al obtener roles del usuario",
                detail: err.message,
            });
        }
    }
    static async asignarRolAUsuario(req, res) {
        try {
            const userId = Number(req.params.userId);
            const idRol = Number(req.body.idRol);
            if (isNaN(userId) || isNaN(idRol)) {
                return res.status(400).json({ error: "Se requieren userId e idRol" });
            }
            await ngac_admin_service_1.NgacAdminService.asignarRolAUsuario(userId, idRol);
            res.json({ success: true, message: "Rol asignado exitosamente" });
        }
        catch (err) {
            console.error("[AdminController] Error en asignarRolAUsuario:", err);
            res.status(500).json({
                error: "Error al asignar rol al usuario",
                detail: err.message,
            });
        }
    }
    static async revocarRolDeUsuario(req, res) {
        try {
            const userId = Number(req.params.userId);
            const idRol = Number(req.params.idRol || req.query.idRol || req.body.idRol);
            if (isNaN(userId) || isNaN(idRol)) {
                return res.status(400).json({ error: "Se requieren userId e idRol" });
            }
            await ngac_admin_service_1.NgacAdminService.revocarRolDeUsuario(userId, idRol);
            res.json({ success: true, message: "Rol revocado exitosamente" });
        }
        catch (err) {
            console.error("[AdminController] Error en revocarRolDeUsuario:", err);
            res.status(500).json({
                error: "Error al revocar rol del usuario",
                detail: err.message,
            });
        }
    }
    static async getUnidadesDeEntidad(req, res) {
        try {
            const entidadId = Number(req.params.entidadId);
            if (isNaN(entidadId)) {
                return res
                    .status(400)
                    .json({ error: "El ID de entidad debe ser numérico" });
            }
            const unidades = await ngac_admin_service_1.NgacAdminService.getUnidadesDeEntidad(entidadId);
            res.json({ success: true, data: unidades });
        }
        catch (err) {
            console.error("[AdminController] Error en getUnidadesDeEntidad:", err);
            res.status(500).json({
                error: "Error al obtener unidades de la entidad",
                detail: err.message,
            });
        }
    }
    static async getUnidadEntidadVinculos(req, res) {
        try {
            const vinculos = await ngac_admin_service_1.NgacAdminService.getUnidadEntidadVinculos();
            res.json({ success: true, data: vinculos });
        }
        catch (err) {
            console.error("[AdminController] Error en getUnidadEntidadVinculos:", err);
            res.status(500).json({
                error: "Error al obtener vínculos de unidades y entidades",
                detail: err.message,
            });
        }
    }
    // ==========================================
    // ENDPOINTS PARA LÍNEA DE TIEMPO Y BATCH
    // ==========================================
    static async batchSave(req, res) {
        try {
            const { modifications, audit_user } = req.body;
            if (!Array.isArray(modifications)) {
                return res.status(400).json({ error: "modifications debe ser un array" });
            }
            const results = [];
            for (const mod of modifications) {
                if (mod.type === 'UPDATE_ORDER') {
                    // Update order logic
                    results.push({ id: mod.id, status: 'ok', operation: 'order' });
                }
                else if (mod.type === 'UPDATE_PERMISSION') {
                    // Update permission logic
                    results.push({ id: mod.id, status: 'ok', operation: 'permission' });
                }
                else if (mod.type === 'SOFT_DELETE') {
                    await ngac_admin_service_1.NgacAdminService.deactivateNodo(Number(mod.id));
                    results.push({ id: mod.id, status: 'ok', operation: 'soft_delete' });
                }
            }
            res.json({ success: true, results });
        }
        catch (err) {
            console.error("[AdminController] Error en batchSave:", err);
            res.status(500).json({ error: "Error interno del servidor", detail: err.message });
        }
    }
    static async simulate(req, res) {
        try {
            const { rol } = req.body;
            res.json({
                success: true,
                imposterRole: rol,
                deniedNodes: ['NODE_A', 'NODE_B'], // Stub data
                orphans: ['NODE_C']
            });
        }
        catch (err) {
            console.error("[AdminController] Error en simulate:", err);
            res.status(500).json({ error: "Error interno del servidor", detail: err.message });
        }
    }
    // --- SAFI MODULOS ENDPOINTS ---
    static async getSafiModulos(req, res) {
        try {
            const modulos = await ngac_admin_service_1.NgacAdminService.getSafiModulos();
            res.json(modulos);
        }
        catch (err) {
            console.error("[AdminController] Error obteniendo módulos SAFI:", err);
            res.status(500).json({ error: "Error interno del servidor", detail: err.message });
        }
    }
    static async upsertSafiModulo(req, res) {
        try {
            const dto = req.body;
            if (!dto.codigo || !dto.nombre) {
                return res.status(400).json({ error: "Faltan parámetros obligatorios (codigo, nombre)" });
            }
            await ngac_admin_service_1.NgacAdminService.upsertSafiModulo(dto);
            res.json({ success: true, message: "Módulo SAFI procesado exitosamente" });
        }
        catch (err) {
            console.error("[AdminController] Error guardando módulo SAFI:", err);
            res.status(500).json({ error: "Error interno del servidor", detail: err.message });
        }
    }
    static async deleteSafiModulo(req, res) {
        try {
            const { id } = req.params;
            const numericId = Number(id);
            if (isNaN(numericId)) {
                return res.status(400).json({ error: "ID de módulo inválido" });
            }
            await ngac_admin_service_1.NgacAdminService.deleteSafiModulo(numericId);
            res.json({ success: true, message: "Módulo SAFI eliminado exitosamente" });
        }
        catch (err) {
            console.error("[AdminController] Error eliminando módulo SAFI:", err);
            res.status(500).json({ error: "Error interno del servidor", detail: err.message });
        }
    }
    static async vincularModuloNodo(req, res) {
        try {
            const { id_modulo, id_nodo } = req.body;
            if (id_modulo === undefined || id_nodo === undefined) {
                return res.status(400).json({ error: "Faltan parámetros obligatorios (id_modulo, id_nodo)" });
            }
            await ngac_admin_service_1.NgacAdminService.vincularModuloNodo(Number(id_modulo), Number(id_nodo));
            res.json({ success: true, message: "Nodo vinculado al módulo exitosamente" });
        }
        catch (err) {
            console.error("[AdminController] Error vinculando módulo y nodo:", err);
            res.status(500).json({ error: "Error interno del servidor", detail: err.message });
        }
    }
    static async desvincularModuloNodo(req, res) {
        try {
            const { id_modulo, id_nodo } = req.body;
            if (id_modulo === undefined || id_nodo === undefined) {
                return res.status(400).json({ error: "Faltan parámetros obligatorios (id_modulo, id_nodo)" });
            }
            await ngac_admin_service_1.NgacAdminService.desvincularModuloNodo(Number(id_modulo), Number(id_nodo));
            res.json({ success: true, message: "Nodo desvinculado del módulo exitosamente" });
        }
        catch (err) {
            console.error("[AdminController] Error desvinculando módulo y nodo:", err);
            res.status(500).json({ error: "Error interno del servidor", detail: err.message });
        }
    }
}
exports.AdminController = AdminController;
