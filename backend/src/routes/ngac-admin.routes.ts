import { Router } from "express";
import { AdminController } from "../controllers/ngac-admin.controller";

const router = Router();

router.get("/sec/roles-by-node", AdminController.getRolesPorNodo);
router.get("/ping", (req, res) => res.send("pong admin ok"));
router.get("/modulos-raiz", AdminController.getModulosRaiz);
router.get("/modulos-por-politicas", AdminController.getModulosPorPoliticas);
router.get("/politicas-raiz", AdminController.getPoliticasRaiz);
router.get("/menus/raiz/:id", AdminController.getCarpetasRaiz);
router.get(
  "/menus/raiz-sin-hijos/:id",
  AdminController.getCarpetasRaizSinHijos,
);
router.get("/roles", AdminController.getRoles);
router.post("/roles", AdminController.upsertRol);
router.put("/roles/:id", AdminController.upsertRol);
router.delete("/roles/:id", AdminController.deleteRol);
router.get("/dashboard/stats", AdminController.getDashboardStats);
router.get("/arbol", AdminController.getArbol);
router.post("/arbol/generar-menu", AdminController.generarMenuDinamico);
router.post("/menu/context", AdminController.getMenuByContext);
router.get("/nodos", AdminController.getNodos);
router.get("/nodos/tipos", AdminController.getTiposNodo);
router.post("/nodos", AdminController.upsertNodo);
router.post("/nodos/crear-y-enlazar", AdminController.crearYEnlazarNodo);
router.delete("/nodos/:id", AdminController.deleteNodo);
router.get("/tipos-nodo", AdminController.getTiposNodo);
router.post("/tipos-nodo", AdminController.upsertTipoNodo);
router.delete("/tipos-nodo/:codigo", AdminController.deleteTipoNodo);
router.get("/enlaces", AdminController.getEnlaces);
router.post("/enlaces", AdminController.enlazarNodos);
router.delete("/enlaces/:padre/:hijo", AdminController.deleteEnlace);
router.get("/menu/enlaces", AdminController.getMenuEnlaces);
router.post("/menu/enlaces", AdminController.enlazarMenuNodos);
router.post("/menu/clonar", AdminController.clonarMenuJerarquia);
router.delete("/menu/enlaces/:padre/:hijo", AdminController.deleteMenuEnlace);
router.get("/permisos/matriz", AdminController.getPermisosMatrix);
router.get("/permisos", AdminController.getPermisos);
router.post("/permisos", AdminController.otorgarPermiso);
router.post("/permisos/denegar", AdminController.denegarPermiso);
router.delete("/permisos", AdminController.revocarPermiso);
router.get("/prohibiciones", AdminController.getProhibiciones);
router.delete("/prohibiciones/:id", AdminController.revocarProhibicion);
router.get("/operaciones", AdminController.getOperaciones);
router.post("/operaciones", AdminController.upsertOperacion);
router.delete("/operaciones/:nombre", AdminController.deleteOperacion);
router.get("/logs", AdminController.getLogs);
router.delete("/logs", AdminController.clearLogs);
router.get("/safi/usuarios", AdminController.getUsuarios);
router.post("/safi/usuarios", AdminController.upsertUsuario);
router.delete("/safi/usuarios/:id", AdminController.deleteUsuario);
router.get(
  "/safi/usuarios/:userId/vinculos",
  AdminController.getUsuarioVinculos,
);
router.get("/safi/usuarios/:userId/roles", AdminController.getRolesDeUsuario);
router.post("/safi/usuarios/:userId/roles", AdminController.asignarRolAUsuario);
router.delete(
  "/safi/usuarios/:userId/roles/:idRol?",
  AdminController.revocarRolDeUsuario,
);

router.get("/safi/entidades", AdminController.getEntidades);
router.get(
  "/safi/entidades/:entidadId/unidades",
  AdminController.getUnidadesDeEntidad,
);
router.post("/safi/entidades", AdminController.upsertEntidad);
router.delete("/safi/entidades/:id", AdminController.deleteEntidad);
router.get("/safi/unidades", AdminController.getUnidades);
router.post("/safi/unidades", AdminController.upsertUnidad);
router.delete("/safi/unidades/:id", AdminController.deleteUnidad);
router.post("/safi/procedimientos/crear-usuario", AdminController.crearUsuario);
router.post(
  "/safi/procedimientos/desactivar-usuario",
  AdminController.desactivarUsuario,
);
router.post("/safi/procedimientos/crear-unidad", AdminController.crearUnidad);
router.post("/safi/procedimientos/crear-entidad", AdminController.crearEntidad);
router.post(
  "/safi/vinculos/usuario-unidad",
  AdminController.vincularUsuarioUnidad,
);
router.delete(
  "/safi/vinculos/usuario-unidad",
  AdminController.desvincularUsuarioUnidad,
);
router.post(
  "/safi/vinculos/usuario-entidad",
  AdminController.vincularUsuarioEntidad,
);
router.delete(
  "/safi/vinculos/usuario-entidad",
  AdminController.desvincularUsuarioEntidad,
);
router.post(
  "/safi/vinculos/unidad-entidad",
  AdminController.vincularUnidadEntidad,
);
router.delete(
  "/safi/vinculos/unidad-entidad",
  AdminController.desvincularUnidadEntidad,
);
router.get(
  "/safi/vinculos/unidad-entidad",
  AdminController.getUnidadEntidadVinculos,
);

// Módulos de Negocio SAFI
router.get("/safi/modulos", AdminController.getSafiModulos);
router.post("/safi/modulos", AdminController.upsertSafiModulo);
router.delete("/safi/modulos/:id", AdminController.deleteSafiModulo);
router.post("/safi/vinculos/modulo-nodo", AdminController.vincularModuloNodo);
router.delete("/safi/vinculos/modulo-nodo", AdminController.desvincularModuloNodo);

// Endpoint para verificar acceso con operaciones como JSON array
router.post("/verificar-acceso", AdminController.verificarAcceso);

// Endpoints para línea de tiempo y simulador
router.post("/batch-save", AdminController.batchSave);
router.post("/simulate", AdminController.simulate);

export default router;
