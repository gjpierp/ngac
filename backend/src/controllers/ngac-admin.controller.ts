import { Request, Response } from "express";
import { NgacAdminService } from "../services/ngac-admin.service";
import {
  AccRol,
  EnlazarNodoDto,
  OtorgarPermisoDto,
  UpsertNodoDto,
  UpsertTipoNodoDto,
  SafiUsuario,
  SafiEntidad,
  SafiUnidad,
  CrearSafiUsuarioDto,
  CrearSafiUnidadDto,
  CrearSafiEntidadDto,
  VinculoUsuarioUnidadDto,
  VinculoUsuarioEntidadDto,
  VinculoUnidadEntidadDto,
} from "../models/ngac-admin.models";

export class AdminController {
  // --- ENDPOINTS PARA DASHBOARD ---
  static async getModulosRaiz(req: Request, res: Response) {
    try {
      const modulos = await NgacAdminService.getModulosRaiz();
      res.json(modulos);
    } catch (err: any) {
      console.error("[AdminController] Error obteniendo módulos raíz:", err);
      res
        .status(500)
        .json({ error: "Error interno del servidor", detail: err.message });
    }
  }

  static async getPoliticasRaiz(req: Request, res: Response) {
    try {
      const politicas = await NgacAdminService.getPoliticasRaiz();
      res.json(politicas);
    } catch (err: any) {
      console.error("[AdminController] Error obteniendo políticas raíz:", err);
      res
        .status(500)
        .json({ error: "Error interno del servidor", detail: err.message });
    }
  }

  static async getRoles(req: Request, res: Response) {
    try {
      const roles = await NgacAdminService.getRoles();
      res.json(roles);
    } catch (err: any) {
      console.error("[AdminController] Error obteniendo roles:", err);
      res
        .status(500)
        .json({ error: "Error interno del servidor", detail: err.message });
    }
  }

  static async upsertRol(req: Request, res: Response) {
    try {
      const rol: AccRol = req.body;
      if (!rol.codigo || !rol.nombre) {
        return res
          .status(400)
          .json({ error: "Faltan parametros obligatorios (codigo, nombre)" });
      }
      await NgacAdminService.upsertRol(rol);
      res.json({ success: true, message: "Rol procesado exitosamente" });
    } catch (err: any) {
      console.error("[AdminController] Error procesando rol:", err);
      res
        .status(500)
        .json({ error: "Error interno del servidor", detail: err.message });
    }
  }

  static async deleteRol(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await NgacAdminService.deleteRol(Number(id));
      res.json({ success: true, message: "Rol eliminado exitosamente" });
    } catch (err: any) {
      console.error("[AdminController] Error eliminando rol:", err);
      res
        .status(409)
        .json({ error: "No se pudo eliminar el rol", detail: err.message });
    }
  }
  static async getDashboardStats(req: Request, res: Response) {
    try {
      const stats = await NgacAdminService.getDashboardStats();
      res.json(stats);
    } catch (err: any) {
      console.error("[AdminController] Error obteniendo dashboard stats:", err);
      res
        .status(500)
        .json({ error: "Error interno del servidor", detail: err.message });
    }
  }
  static async getArbol(req: Request, res: Response) {
    console.log(
      ">>> [AdminController] HIT ARBOL [" + new Date().toISOString() + "]",
    );
    try {
      const { rolBase } = req.query;
      const tree = await NgacAdminService.getTree(rolBase as string);
      res.json(tree);
    } catch (err: any) {
      console.error("[AdminController] Error obteniendo arbol:", err);
      res
        .status(500)
        .json({ error: "Error interno del servidor", detail: err.message });
    }
  }

  static async getMenuByContext(req: Request, res: Response) {
    try {
      const { atributos, claims } = req.body;
      const target = atributos || claims;

      let atributosArray: string[] = [];
      if (typeof target === "string") {
        atributosArray = target
          .split(",")
          .map((c) => c.trim())
          .filter((c) => c);
      } else if (Array.isArray(target)) {
        atributosArray = target;
      }

      const contextoParams = JSON.stringify({ atributos: atributosArray });
      const result = await NgacAdminService.getMenuByContext(contextoParams);
      res.json(result);
    } catch (err: any) {
      console.error(
        "[AdminController] Error obteniendo menú por contexto:",
        err,
      );
      res
        .status(500)
        .json({ error: "Error interno del servidor", detail: err.message });
    }
  }

  static async generarMenuDinamico(req: Request, res: Response) {
    try {
      const payload = req.body;
      const contextStr = JSON.stringify(payload);
      const result = await NgacAdminService.getMenuByContext(contextStr);
      res.json(result);
    } catch (err: any) {
      console.error("[AdminController] Error generando menu dinamico:", err);
      res
        .status(500)
        .json({ error: "Error en motor de seguridad", detail: err.message });
    }
  }

  static async getNodos(req: Request, res: Response) {
    try {
      const nodos = await NgacAdminService.getNodos();
      res.json(nodos);
    } catch (err: any) {
      console.error("[AdminController] Error obteniendo nodos:", err);
      res
        .status(500)
        .json({ error: "Error interno del servidor", detail: err.message });
    }
  }

  static async upsertNodo(req: Request, res: Response) {
    try {
      const body = req.body || {};
      const dto: UpsertNodoDto = {
        codigo:      body.codigo || body.codigo_tecnico,
        etiqueta:    body.etiqueta,
        tipo:        body.tipo || body.tipo_nodo,
        ruta:        body.ruta || body.url_ruta,
        slug:        body.slug,
        icono:       body.icono,
        descripcion: body.descripcion,
        orden:       body.orden !== undefined ? body.orden : body.orden_visual,
        activo:      body.activo
      };

      if (!dto.codigo || !dto.etiqueta || !dto.tipo) {
        return res.status(400).json({
          error: "Faltan parametros obligatorios (codigo/codigo_tecnico, etiqueta, tipo/tipo_nodo)",
        });
      }
      await NgacAdminService.upsertNodo(dto);
      res.json({ success: true, message: "Nodo procesado exitosamente" });
    } catch (err: any) {
      console.error("[AdminController] Error procesando nodo:", err);
      res
        .status(500)
        .json({ error: "Error interno del servidor", detail: err.message });
    }
  }

  static async deleteNodo(req: Request, res: Response) {
    try {
      const { codigo } = req.params;
      await NgacAdminService.deactivateNodo(codigo);
      res.json({ success: true, message: "Nodo desactivado exitosamente" });
    } catch (err: any) {
      console.error("[AdminController] Error desactivando nodo:", err);
      res
        .status(500)
        .json({ error: "Error interno del servidor", detail: err.message });
    }
  }

  static async getTiposNodo(req: Request, res: Response) {
    try {
      const tipos = await NgacAdminService.getTiposNodo();
      res.json(tipos);
    } catch (err: any) {
      console.error("[AdminController] Error obteniendo tipos de nodo:", err);
      res
        .status(500)
        .json({ error: "Error interno del servidor", detail: err.message });
    }
  }

  static async upsertTipoNodo(req: Request, res: Response) {
    try {
      const dto: UpsertTipoNodoDto = req.body;
      if (!dto.codigo) {
        return res.status(400).json({ error: "Codigo de tipo requerido" });
      }
      await NgacAdminService.upsertTipoNodo(dto);
      res.json({ success: true, message: "Tipo de nodo procesado" });
    } catch (err: any) {
      console.error("[AdminController] Error procesando tipo de nodo:", err);
      res
        .status(500)
        .json({ error: "Error interno del servidor", detail: err.message });
    }
  }

  static async deleteTipoNodo(req: Request, res: Response) {
    try {
      const { codigo } = req.params;
      await NgacAdminService.deleteTipoNodo(codigo);
      res.json({ success: true, message: "Tipo de nodo eliminado" });
    } catch (err: any) {
      console.error("[AdminController] Error eliminando tipo de nodo:", err);
      res.status(409).json({
        error: "No se pudo eliminar el tipo de nodo",
        detail: err.message,
      });
    }
  }

  static async getEnlaces(req: Request, res: Response) {
    try {
      const enlaces = await NgacAdminService.getEnlaces();
      res.json(enlaces);
    } catch (err: any) {
      console.error("[AdminController] Error obteniendo enlaces:", err);
      res
        .status(500)
        .json({ error: "Error interno del servidor", detail: err.message });
    }
  }

  static async enlazarNodos(req: Request, res: Response) {
    try {
      const dto: EnlazarNodoDto = req.body;
      if (!dto.padre || !dto.hijo) {
        return res
          .status(400)
          .json({ error: "Faltan parametros obligatorios (padre, hijo)" });
      }
      await NgacAdminService.enlazarNodos(dto);
      res.json({ success: true, message: "Enlace creado exitosamente" });
    } catch (err: any) {
      console.error("[AdminController] Error enlazando nodos:", err);
      res
        .status(500)
        .json({ error: "Error interno del servidor", detail: err.message });
    }
  }

  static async deleteEnlace(req: Request, res: Response) {
    try {
      const dto: EnlazarNodoDto = req.params as any;
      await NgacAdminService.deleteEnlace(dto);
      res.json({ success: true, message: "Enlace eliminado exitosamente" });
    } catch (err: any) {
      console.error("[AdminController] Error eliminando enlace:", err);
      res
        .status(500)
        .json({ error: "Error interno del servidor", detail: err.message });
    }
  }

  static async getRolesPorNodo(req: Request, res: Response) {
    const id = req.query.id ? parseInt(req.query.id as string, 10) : null;
    console.log(
      "[AdminController] getRolesPorNodo >> Recibido ID (Query):",
      id,
    );
    try {
      if (!id) {
        return res
          .status(400)
          .json({ error: "El parámetro 'id' (numérico) es requerido" });
      }
      const roles = await NgacAdminService.getRolesPorNodo(id);
      console.log(
        "[AdminController] getRolesPorNodo >> Éxito, roles enviados:",
        roles.length,
      );
      res.json(roles);
    } catch (err: any) {
      console.error(
        "[AdminController] Error obteniendo roles por nodo ID:",
        err,
      );
      res
        .status(500)
        .json({ error: "Error interno del servidor", detail: err.message });
    }
    return;
  }

  static async getPermisosMatrix(req: Request, res: Response) {
    console.log("[AdminController] getPermisosMatrix >> Query:", req.query);
    try {
      const rol = req.query.rol ? String(req.query.rol) : undefined;
      const politica = req.query.politica
        ? parseInt(req.query.politica as string, 10)
        : undefined;

      const result = await NgacAdminService.getPermisos(
        rol,
        politica,
        1,
        999999,
      );
      res.json(result);
    } catch (err: any) {
      console.error(
        "[AdminController] Error obteniendo matriz de permisos:",
        err,
      );
      res
        .status(500)
        .json({ error: "Error interno del servidor", detail: err.message });
    }
  }

  static async getPermisos(req: Request, res: Response) {
    console.log("[AdminController] getPermisos >> Query:", req.query);
    try {
      const usr = req.query.usr ? String(req.query.usr) : undefined;
      const obj = req.query.obj
        ? parseInt(req.query.obj as string, 10)
        : undefined;

      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const pageSize = req.query.pageSize
        ? parseInt(req.query.pageSize as string, 10)
        : 5;

      const result = await NgacAdminService.getPermisos(
        usr,
        obj,
        page,
        pageSize,
      );
      res.json(result);
    } catch (err: any) {
      console.error("[AdminController] Error obteniendo permisos:", err);
      res
        .status(500)
        .json({ error: "Error interno del servidor", detail: err.message });
    }
  }

  static async otorgarPermiso(req: Request, res: Response) {
    try {
      const dto: OtorgarPermisoDto = req.body;
      if (!dto.usr || !dto.obj || !dto.op) {
        return res
          .status(400)
          .json({ error: "Faltan parametros obligatorios (usr, obj, op)" });
      }
      await NgacAdminService.otorgarPermiso(dto);
      res.json({ success: true, message: "Permiso otorgado exitosamente" });
    } catch (err: any) {
      console.error("[AdminController] Error otorgando permiso:", err);
      res
        .status(500)
        .json({ error: "Error interno del servidor", detail: err.message });
    }
  }

  static async denegarPermiso(req: Request, res: Response) {
    try {
      const dto: OtorgarPermisoDto = req.body;
      if (!dto.usr || !dto.obj || !dto.op) {
        return res
          .status(400)
          .json({ error: "Faltan parametros obligatorios (usr, obj, op)" });
      }
      await NgacAdminService.denegarPermiso(dto);
      res.json({ success: true, message: "Permiso denegado exitosamente" });
    } catch (err: any) {
      console.error("[AdminController] Error denegando permiso:", err);
      res
        .status(500)
        .json({ error: "Error interno del servidor", detail: err.message });
    }
  }

  static async revocarPermiso(req: Request, res: Response) {
    try {
      const dto: OtorgarPermisoDto = req.body;
      if (!dto.usr || !dto.obj || !dto.op) {
        return res
          .status(400)
          .json({ error: "Faltan parametros obligatorios (usr, obj, op)" });
      }
      await NgacAdminService.revocarPermiso(dto);
      res.json({ success: true, message: "Permiso revocado exitosamente" });
    } catch (err: any) {
      console.error("[AdminController] Error revocando permiso:", err);
      res.status(500).json({
        error: "Error interno del servidor",
        detail: err.message,
      });
    }
  }

  static async getProhibiciones(req: Request, res: Response) {
    try {
      const prohibiciones = await NgacAdminService.getProhibiciones();
      res.json(prohibiciones);
    } catch (err: any) {
      console.error("[AdminController] Error obteniendo prohibiciones:", err);
      res.status(500).json({
        error: "Error interno del servidor",
        detail: err.message,
      });
    }
  }

  static async revocarProhibicion(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID de prohibición inválido" });
      }
      await NgacAdminService.revocarProhibicion(id);
      res.json({ success: true, message: "Prohibición revocada exitosamente" });
    } catch (err: any) {
      console.error("[AdminController] Error revocando prohibición:", err);
      res.status(500).json({
        error: "Error interno del servidor",
        detail: err.message,
      });
    }
  }

  static async getOperaciones(req: Request, res: Response) {
    try {
      const ops = await NgacAdminService.getOperaciones();
      res.json(ops);
    } catch (err: any) {
      console.error("[AdminController] Error obteniendo operaciones:", err);
      res
        .status(500)
        .json({ error: "Error interno del servidor", detail: err.message });
    }
  }

  static async upsertOperacion(req: Request, res: Response) {
    try {
      const { nombre_op, descripcion } = req.body;
      if (!nombre_op) {
        return res.status(400).json({ error: "Nombre de operacion requerido" });
      }
      await NgacAdminService.upsertOperacion(nombre_op, descripcion);
      res.json({ success: true, message: "Operacion procesada" });
    } catch (err: any) {
      console.error("[AdminController] Error procesando operacion:", err);
      res
        .status(500)
        .json({ error: "Error interno del servidor", detail: err.message });
    }
  }

  static async deleteOperacion(req: Request, res: Response) {
    try {
      const { nombre } = req.params;
      await NgacAdminService.deleteOperacion(nombre);
      res.json({ success: true, message: "Operacion eliminada" });
    } catch (err: any) {
      console.error("[AdminController] Error eliminando operacion:", err);
      res.status(409).json({
        error: "No se pudo eliminar la operacion",
        detail: err.message,
      });
    }
  }
  static async getLogs(req: Request, res: Response) {
    try {
      const logs = await NgacAdminService.getLogs();
      res.json(logs);
    } catch (err: any) {
      console.error("[AdminController] Error obteniendo logs:", err);
      res
        .status(500)
        .json({ error: "Error interno del servidor", detail: err.message });
    }
  }

  static async clearLogs(req: Request, res: Response) {
    try {
      await NgacAdminService.clearLogs();
      res.json({ success: true, message: "Logs limpiados exitosamente" });
    } catch (err: any) {
      console.error("[AdminController] Error limpiando logs:", err);
      res
        .status(500)
        .json({ error: "Error interno del servidor", detail: err.message });
    }
  }

  // ==========================================
  // ENDPOINTS PARA TABLAS SAFI
  // ==========================================

  static async getUsuarios(req: Request, res: Response) {
    try {
      const usuarios = await NgacAdminService.getUsuarios();
      res.json(usuarios);
    } catch (err: any) {
      console.error("[AdminController] Error obteniendo usuarios SAFI:", err);
      res
        .status(500)
        .json({ error: "Error interno del servidor", detail: err.message });
    }
  }

  static async upsertUsuario(req: Request, res: Response) {
    try {
      const dto: SafiUsuario = req.body;
      if (dto.id === undefined || !dto.nombre || !dto.email) {
        return res.status(400).json({
          error: "Faltan parámetros obligatorios (id, nombre, email)",
        });
      }
      await NgacAdminService.upsertUsuario(dto);
      res.json({
        success: true,
        message: "Usuario SAFI procesado exitosamente",
      });
    } catch (err: any) {
      console.error("[AdminController] Error guardando usuario SAFI:", err);
      res
        .status(500)
        .json({ error: "Error interno del servidor", detail: err.message });
    }
  }

  static async deleteUsuario(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const numericId = Number(id);
      if (isNaN(numericId)) {
        return res.status(400).json({ error: "ID de usuario inválido" });
      }
      await NgacAdminService.deleteUsuario(numericId);
      res.json({
        success: true,
        message: "Usuario SAFI eliminado exitosamente",
      });
    } catch (err: any) {
      console.error("[AdminController] Error eliminando usuario SAFI:", err);
      res
        .status(500)
        .json({ error: "Error interno del servidor", detail: err.message });
    }
  }

  static async getEntidades(req: Request, res: Response) {
    try {
      const entidades = await NgacAdminService.getEntidades();
      res.json(entidades);
    } catch (err: any) {
      console.error("[AdminController] Error obteniendo entidades SAFI:", err);
      res
        .status(500)
        .json({ error: "Error interno del servidor", detail: err.message });
    }
  }

  static async upsertEntidad(req: Request, res: Response) {
    try {
      const dto: SafiEntidad = req.body;
      if (dto.id === undefined || !dto.nombre || !dto.slug) {
        return res.status(400).json({
          error: "Faltan parámetros obligatorios (id, nombre, slug)",
        });
      }
      await NgacAdminService.upsertEntidad(dto);
      res.json({
        success: true,
        message: "Entidad SAFI procesada exitosamente",
      });
    } catch (err: any) {
      console.error("[AdminController] Error guardando entidad SAFI:", err);
      res
        .status(500)
        .json({ error: "Error interno del servidor", detail: err.message });
    }
  }

  static async deleteEntidad(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const numericId = Number(id);
      if (isNaN(numericId)) {
        return res.status(400).json({ error: "ID de entidad inválido" });
      }
      await NgacAdminService.deleteEntidad(numericId);
      res.json({
        success: true,
        message: "Entidad SAFI eliminada exitosamente",
      });
    } catch (err: any) {
      console.error("[AdminController] Error eliminando entidad SAFI:", err);
      res
        .status(500)
        .json({ error: "Error interno del servidor", detail: err.message });
    }
  }

  static async getUnidades(req: Request, res: Response) {
    try {
      const unidades = await NgacAdminService.getUnidades();
      res.json(unidades);
    } catch (err: any) {
      console.error("[AdminController] Error obteniendo unidades SAFI:", err);
      res
        .status(500)
        .json({ error: "Error interno del servidor", detail: err.message });
    }
  }

  static async upsertUnidad(req: Request, res: Response) {
    try {
      const dto: SafiUnidad = req.body;
      if (dto.id === undefined || !dto.nombre || !dto.slug) {
        return res.status(400).json({
          error: "Faltan parámetros obligatorios (id, nombre, slug)",
        });
      }
      await NgacAdminService.upsertUnidad(dto);
      res.json({
        success: true,
        message: "Unidad SAFI procesada exitosamente",
      });
    } catch (err: any) {
      console.error("[AdminController] Error guardando unidad SAFI:", err);
      res
        .status(500)
        .json({ error: "Error interno del servidor", detail: err.message });
    }
  }

  static async deleteUnidad(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const numericId = Number(id);
      if (isNaN(numericId)) {
        return res.status(400).json({ error: "ID de unidad inválido" });
      }
      await NgacAdminService.deleteUnidad(numericId);
      res.json({
        success: true,
        message: "Unidad SAFI eliminada exitosamente",
      });
    } catch (err: any) {
      console.error("[AdminController] Error eliminando unidad SAFI:", err);
      res
        .status(500)
        .json({ error: "Error interno del servidor", detail: err.message });
    }
  }

  // ==========================================
  // METODOS DEL PAQUETE: PKG_SAFI_ADMIN
  // ==========================================

  static async crearUsuario(req: Request, res: Response) {
    try {
      const dto: CrearSafiUsuarioDto = req.body;
      if (
        !dto.slug_usuario ||
        !dto.rut ||
        !dto.nombres ||
        !dto.apellidos ||
        !dto.email
      ) {
        return res.status(400).json({
          error:
            "Faltan parámetros obligatorios (slug_usuario, rut, nombres, apellidos, email)",
        });
      }
      const newId = await NgacAdminService.crearUsuario(dto);
      res.status(201).json({
        success: true,
        message: "Usuario creado exitosamente en SAFI",
        data: { id_usuario: newId },
      });
    } catch (err: any) {
      console.error("[AdminController] Error en crearUsuario:", err);
      res
        .status(500)
        .json({ error: "Error al crear usuario en SAFI", detail: err.message });
    }
  }

  static async desactivarUsuario(req: Request, res: Response) {
    try {
      const idUsuario = Number(req.body.id_usuario);
      if (isNaN(idUsuario)) {
        return res
          .status(400)
          .json({ error: "id_usuario (número) es obligatorio" });
      }
      await NgacAdminService.desactivarUsuario(idUsuario);
      res.json({
        success: true,
        message: "Usuario desactivado exitosamente en SAFI",
      });
    } catch (err: any) {
      console.error("[AdminController] Error en desactivarUsuario:", err);
      res.status(500).json({
        error: "Error al desactivar usuario en SAFI",
        detail: err.message,
      });
    }
  }

  static async crearUnidad(req: Request, res: Response) {
    try {
      const dto: CrearSafiUnidadDto = req.body;
      if (!dto.slug_unidad || !dto.nombre_unidad) {
        return res.status(400).json({
          error: "Faltan parámetros obligatorios (slug_unidad, nombre_unidad)",
        });
      }
      const newId = await NgacAdminService.crearUnidad(dto);
      res.status(201).json({
        success: true,
        message: "Unidad creada exitosamente en SAFI",
        data: { id_unidad: newId },
      });
    } catch (err: any) {
      console.error("[AdminController] Error en crearUnidad:", err);
      res
        .status(500)
        .json({ error: "Error al crear unidad en SAFI", detail: err.message });
    }
  }

  static async crearEntidad(req: Request, res: Response) {
    try {
      const dto: CrearSafiEntidadDto = req.body;
      if (!dto.slug_entidad || !dto.nombre_entidad || !dto.tipo_entidad) {
        return res.status(400).json({
          error:
            "Faltan parámetros obligatorios (slug_entidad, nombre_entidad, tipo_entidad)",
        });
      }
      const newId = await NgacAdminService.crearEntidad(dto);
      res.status(201).json({
        success: true,
        message: "Entidad creada exitosamente en SAFI",
        data: { id_entidad: newId },
      });
    } catch (err: any) {
      console.error("[AdminController] Error en crearEntidad:", err);
      res
        .status(500)
        .json({ error: "Error al crear entidad en SAFI", detail: err.message });
    }
  }

  static async vincularUsuarioUnidad(req: Request, res: Response) {
    try {
      const dto: VinculoUsuarioUnidadDto = req.body;
      if (dto.id_usuario === undefined || dto.id_unidad === undefined) {
        return res.status(400).json({
          error: "Faltan parámetros obligatorios (id_usuario, id_unidad)",
        });
      }
      await NgacAdminService.vincularUsuarioUnidad(dto);
      res.json({
        success: true,
        message: "Usuario vinculado a Unidad exitosamente",
      });
    } catch (err: any) {
      console.error("[AdminController] Error en vincularUsuarioUnidad:", err);
      res.status(500).json({
        error: "Error al vincular usuario a unidad",
        detail: err.message,
      });
    }
  }

  static async desvincularUsuarioUnidad(req: Request, res: Response) {
    try {
      const dto: VinculoUsuarioUnidadDto = {
        id_usuario: Number(req.query.id_usuario || req.body.id_usuario),
        id_unidad: Number(req.query.id_unidad || req.body.id_unidad),
      };
      if (isNaN(dto.id_usuario) || isNaN(dto.id_unidad)) {
        return res.status(400).json({
          error: "id_usuario y id_unidad son requeridos y deben ser números",
        });
      }
      await NgacAdminService.desvincularUsuarioUnidad(dto);
      res.json({
        success: true,
        message: "Usuario desvinculado de Unidad exitosamente",
      });
    } catch (err: any) {
      console.error(
        "[AdminController] Error en desvincularUsuarioUnidad:",
        err,
      );
      res.status(500).json({
        error: "Error al desvincular usuario de unidad",
        detail: err.message,
      });
    }
  }

  static async vincularUsuarioEntidad(req: Request, res: Response) {
    try {
      const dto: VinculoUsuarioEntidadDto = req.body;
      if (dto.id_usuario === undefined || dto.id_entidad === undefined) {
        return res.status(400).json({
          error: "Faltan parámetros obligatorios (id_usuario, id_entidad)",
        });
      }
      await NgacAdminService.vincularUsuarioEntidad(dto);
      res.json({
        success: true,
        message: "Usuario vinculado a Entidad exitosamente",
      });
    } catch (err: any) {
      console.error("[AdminController] Error en vincularUsuarioEntidad:", err);
      res.status(500).json({
        error: "Error al vincular usuario a entidad",
        detail: err.message,
      });
    }
  }

  static async desvincularUsuarioEntidad(req: Request, res: Response) {
    try {
      const dto: VinculoUsuarioEntidadDto = {
        id_usuario: Number(req.query.id_usuario || req.body.id_usuario),
        id_entidad: Number(req.query.id_entidad || req.body.id_entidad),
      };
      if (isNaN(dto.id_usuario) || isNaN(dto.id_entidad)) {
        return res.status(400).json({
          error: "id_usuario y id_entidad son requeridos y deben ser números",
        });
      }
      await NgacAdminService.desvincularUsuarioEntidad(dto);
      res.json({
        success: true,
        message: "Usuario desvinculado de Entidad exitosamente",
      });
    } catch (err: any) {
      console.error(
        "[AdminController] Error en desvincularUsuarioEntidad:",
        err,
      );
      res.status(500).json({
        error: "Error al desvincular usuario de entidad",
        detail: err.message,
      });
    }
  }

  static async vincularUnidadEntidad(req: Request, res: Response) {
    try {
      const dto: VinculoUnidadEntidadDto = req.body;
      if (dto.id_unidad === undefined || dto.id_entidad === undefined) {
        return res.status(400).json({
          error: "Faltan parámetros obligatorios (id_unidad, id_entidad)",
        });
      }
      await NgacAdminService.vincularUnidadEntidad(dto);
      res.json({
        success: true,
        message: "Unidad vinculada a Entidad exitosamente",
      });
    } catch (err: any) {
      console.error("[AdminController] Error en vincularUnidadEntidad:", err);
      res.status(500).json({
        error: "Error al vincular unidad a entidad",
        detail: err.message,
      });
    }
  }

  static async desvincularUnidadEntidad(req: Request, res: Response) {
    try {
      const dto: VinculoUnidadEntidadDto = {
        id_unidad: Number(req.query.id_unidad || req.body.id_unidad),
        id_entidad: Number(req.query.id_entidad || req.body.id_entidad),
      };
      if (isNaN(dto.id_unidad) || isNaN(dto.id_entidad)) {
        return res.status(400).json({
          error: "id_unidad y id_entidad son requeridos y deben ser números",
        });
      }
      await NgacAdminService.desvincularUnidadEntidad(dto);
      res.json({
        success: true,
        message: "Unidad desvinculada de Entidad exitosamente",
      });
    } catch (err: any) {
      console.error(
        "[AdminController] Error en desvincularUnidadEntidad:",
        err,
      );
      res.status(500).json({
        error: "Error al desvincular unidad de entidad",
        detail: err.message,
      });
    }
  }

  static async getUsuarioVinculos(req: Request, res: Response) {
    try {
      const userId = Number(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({
          error: "El ID de usuario es obligatorio y debe ser numérico",
        });
      }
      const vinculos = await NgacAdminService.getUsuarioVinculos(userId);
      res.json({ success: true, data: vinculos });
    } catch (err: any) {
      console.error("[AdminController] Error en getUsuarioVinculos:", err);
      res.status(500).json({
        error: "Error al obtener vínculos del usuario",
        detail: err.message,
      });
    }
  }

  static async getRolesDeUsuario(req: Request, res: Response) {
    try {
      const userId = Number(req.params.userId);
      if (isNaN(userId)) {
        return res
          .status(400)
          .json({ error: "El ID de usuario debe ser numérico" });
      }
      const roles = await NgacAdminService.getRolesDeUsuario(userId);
      res.json({ success: true, data: roles });
    } catch (err: any) {
      console.error("[AdminController] Error en getRolesDeUsuario:", err);
      res.status(500).json({
        error: "Error al obtener roles del usuario",
        detail: err.message,
      });
    }
  }

  static async asignarRolAUsuario(req: Request, res: Response) {
    try {
      const userId = Number(req.params.userId);
      const { codigoRol } = req.body;
      if (isNaN(userId) || !codigoRol) {
        return res
          .status(400)
          .json({ error: "Se requieren userId y codigoRol" });
      }
      await NgacAdminService.asignarRolAUsuario(userId, codigoRol);
      res.json({ success: true, message: "Rol asignado exitosamente" });
    } catch (err: any) {
      console.error("[AdminController] Error en asignarRolAUsuario:", err);
      res.status(500).json({
        error: "Error al asignar rol al usuario",
        detail: err.message,
      });
    }
  }

  static async revocarRolDeUsuario(req: Request, res: Response) {
    try {
      const userId = Number(req.params.userId);
      const codigoRol = req.params.codigoRol || req.query.codigoRol || req.body.codigoRol;
      if (isNaN(userId) || !codigoRol) {
        return res
          .status(400)
          .json({ error: "Se requieren userId y codigoRol" });
      }
      await NgacAdminService.revocarRolDeUsuario(userId, (codigoRol as string).trim());
      res.json({ success: true, message: "Rol revocado exitosamente" });
    } catch (err: any) {
      console.error("[AdminController] Error en revocarRolDeUsuario:", err);
      res.status(500).json({
        error: "Error al revocar rol del usuario",
        detail: err.message,
      });
    }
  }

  static async getUnidadesDeEntidad(req: Request, res: Response) {
    try {
      const entidadId = Number(req.params.entidadId);
      if (isNaN(entidadId)) {
        return res
          .status(400)
          .json({ error: "El ID de entidad debe ser numérico" });
      }
      const unidades = await NgacAdminService.getUnidadesDeEntidad(entidadId);
      res.json({ success: true, data: unidades });
    } catch (err: any) {
      console.error("[AdminController] Error en getUnidadesDeEntidad:", err);
      res.status(500).json({
        error: "Error al obtener unidades de la entidad",
        detail: err.message,
      });
    }
  }

  static async getUnidadEntidadVinculos(req: Request, res: Response) {
    try {
      const vinculos = await NgacAdminService.getUnidadEntidadVinculos();
      res.json({ success: true, data: vinculos });
    } catch (err: any) {
      console.error("[AdminController] Error en getUnidadEntidadVinculos:", err);
      res.status(500).json({
        error: "Error al obtener vínculos de unidades y entidades",
        detail: err.message,
      });
    }
  }
}
