"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const router = (0, express_1.Router)();
// --- AUDITORÍA Y SEGURIDAD ---
router.get("/sec/roles-by-node", admin_controller_1.AdminController.getRolesPorNodo);
router.get("/ping", (req, res) => res.send("pong admin ok"));
// Dashboard: módulos y políticas raíz
router.get("/modulos-raiz", admin_controller_1.AdminController.getModulosRaiz);
router.get("/politicas-raiz", admin_controller_1.AdminController.getPoliticasRaiz);
// Roles
router.get("/roles", admin_controller_1.AdminController.getRoles);
router.post("/roles", admin_controller_1.AdminController.upsertRol);
router.put("/roles/:id", admin_controller_1.AdminController.upsertRol);
router.delete("/roles/:id", admin_controller_1.AdminController.deleteRol);
// Dashboard Stats
router.get("/dashboard/stats", admin_controller_1.AdminController.getDashboardStats);
// GET /api/v1/admin/tree?rolBase=XYZ
router.get("/tree", admin_controller_1.AdminController.getTree);
// POST /api/v1/admin/tree/simulate
router.post("/tree/simulate", admin_controller_1.AdminController.simulateTree);
// Nodos
router.get("/nodos", admin_controller_1.AdminController.getNodos);
router.get("/nodos/tipos", admin_controller_1.AdminController.getTiposNodo);
router.post("/nodos", admin_controller_1.AdminController.upsertNodo);
router.delete("/nodos/:codigo", admin_controller_1.AdminController.deleteNodo);
// Tipos de Nodo
router.get("/tipos-nodo", admin_controller_1.AdminController.getTiposNodo);
router.post("/tipos-nodo", admin_controller_1.AdminController.upsertTipoNodo);
router.delete("/tipos-nodo/:codigo", admin_controller_1.AdminController.deleteTipoNodo);
// Enlaces Jerarquicos
router.get("/enlaces", admin_controller_1.AdminController.getEnlaces);
router.post("/enlaces", admin_controller_1.AdminController.enlazarNodos);
router.delete("/enlaces/:padre/:hijo", admin_controller_1.AdminController.deleteEnlace);
// Permisos
router.get("/permisos", admin_controller_1.AdminController.getPermisos);
router.post("/permisos", admin_controller_1.AdminController.otorgarPermiso);
router.post("/permisos/denegar", admin_controller_1.AdminController.denegarPermiso);
router.delete("/permisos", admin_controller_1.AdminController.revocarPermiso);
// Operaciones
router.get("/operaciones", admin_controller_1.AdminController.getOperaciones);
router.post("/operaciones", admin_controller_1.AdminController.upsertOperacion);
router.delete("/operaciones/:nombre", admin_controller_1.AdminController.deleteOperacion);
// Logs
router.get("/logs", admin_controller_1.AdminController.getLogs);
router.delete("/logs", admin_controller_1.AdminController.clearLogs);
exports.default = router;
