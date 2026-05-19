import { Router } from "express";
import { AdminController } from "../controllers/ngac-admin.controller";

const router = Router();

// --- AUDITORÍA Y SEGURIDAD ---
router.get("/sec/roles-by-node", AdminController.getRolesPorNodo);
router.get("/ping", (req, res) => res.send("pong admin ok"));

// Dashboard: módulos y políticas raíz
router.get("/modulos-raiz", AdminController.getModulosRaiz);
router.get("/politicas-raiz", AdminController.getPoliticasRaiz);
// Roles
router.get("/roles", AdminController.getRoles);
router.post("/roles", AdminController.upsertRol);
router.put("/roles/:id", AdminController.upsertRol);
router.delete("/roles/:id", AdminController.deleteRol);

// Dashboard Stats
router.get("/dashboard/stats", AdminController.getDashboardStats);

// GET /api/v1/admin/arbol?rolBase=XYZ
router.get("/arbol", AdminController.getArbol);
router.post("/arbol/generar-menu", AdminController.generarMenuDinamico);

// POST /api/v1/admin/menu/context
router.post("/menu/context", AdminController.getMenuByContext);

// Nodos
router.get("/nodos", AdminController.getNodos);
router.get("/nodos/tipos", AdminController.getTiposNodo);
router.post("/nodos", AdminController.upsertNodo);
router.delete("/nodos/:codigo", AdminController.deleteNodo);

// Tipos de Nodo
router.get("/tipos-nodo", AdminController.getTiposNodo);
router.post("/tipos-nodo", AdminController.upsertTipoNodo);
router.delete("/tipos-nodo/:codigo", AdminController.deleteTipoNodo);

// Enlaces Jerarquicos
router.get("/enlaces", AdminController.getEnlaces);
router.post("/enlaces", AdminController.enlazarNodos);
router.delete("/enlaces/:padre/:hijo", AdminController.deleteEnlace);

// Permisos y Prohibiciones
router.get("/permisos/matriz", AdminController.getPermisosMatrix);
router.get("/permisos", AdminController.getPermisos);
router.post("/permisos", AdminController.otorgarPermiso);
router.post("/permisos/denegar", AdminController.denegarPermiso);
router.delete("/permisos", AdminController.revocarPermiso);
router.get("/prohibiciones", AdminController.getProhibiciones);
router.delete("/prohibiciones/:id", AdminController.revocarProhibicion);

// Operaciones
router.get("/operaciones", AdminController.getOperaciones);
router.post("/operaciones", AdminController.upsertOperacion);
router.delete("/operaciones/:nombre", AdminController.deleteOperacion);

// Logs
router.get("/logs", AdminController.getLogs);
router.delete("/logs", AdminController.clearLogs);

// --- TABLAS SAFI ---
router.get("/safi/usuarios", AdminController.getUsuarios);
router.post("/safi/usuarios", AdminController.upsertUsuario);
router.delete("/safi/usuarios/:id", AdminController.deleteUsuario);
router.get("/safi/usuarios/:userId/vinculos", AdminController.getUsuarioVinculos);
router.get("/safi/usuarios/:userId/roles", AdminController.getRolesDeUsuario);
router.post("/safi/usuarios/:userId/roles", AdminController.asignarRolAUsuario);
router.delete("/safi/usuarios/:userId/roles/:codigoRol?", AdminController.revocarRolDeUsuario);


router.get("/safi/entidades", AdminController.getEntidades);
router.get("/safi/entidades/:entidadId/unidades", AdminController.getUnidadesDeEntidad);
router.post("/safi/entidades", AdminController.upsertEntidad);
router.delete("/safi/entidades/:id", AdminController.deleteEntidad);

router.get("/safi/unidades", AdminController.getUnidades);
router.post("/safi/unidades", AdminController.upsertUnidad);
router.delete("/safi/unidades/:id", AdminController.deleteUnidad);

// --- METODOS DE PKG_SAFI_ADMIN ---
router.post("/safi/procedimientos/crear-usuario", AdminController.crearUsuario);
router.post("/safi/procedimientos/desactivar-usuario", AdminController.desactivarUsuario);
router.post("/safi/procedimientos/crear-unidad", AdminController.crearUnidad);
router.post("/safi/procedimientos/crear-entidad", AdminController.crearEntidad);
router.post("/safi/vinculos/usuario-unidad", AdminController.vincularUsuarioUnidad);
router.delete("/safi/vinculos/usuario-unidad", AdminController.desvincularUsuarioUnidad);
router.post("/safi/vinculos/usuario-entidad", AdminController.vincularUsuarioEntidad);
router.delete("/safi/vinculos/usuario-entidad", AdminController.desvincularUsuarioEntidad);
router.post("/safi/vinculos/unidad-entidad", AdminController.vincularUnidadEntidad);
router.delete("/safi/vinculos/unidad-entidad", AdminController.desvincularUnidadEntidad);
router.get("/safi/vinculos/unidad-entidad", AdminController.getUnidadEntidadVinculos);

export default router;
