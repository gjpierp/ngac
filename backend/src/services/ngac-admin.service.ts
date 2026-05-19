import oracledb from "oracledb";
import { getDbConnection } from "../config/db.config";
import {
  AccNodo,
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

/**
 * =============================================================================================================
 * @file        ngac-admin.service.ts
 * @description Servicio principal de administración NGAC/SAFI. Expone métodos agrupados por package PL/SQL y funcionalidad.
 * @author      Gerardo Paiva G.
 * @convencion  Cada sección está documentada y separada por package y dominio funcional.
 * =============================================================================================================
 */

export class NgacAdminService {
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
   * @param {string} atributosContext - Contexto de usuario y políticas en formato JSON (CLOB).
   * @returns {Promise<any>} Menú generado en formato JSON.
   */
  static async getMenuByContext(atributosContext: string): Promise<any> {
    const connection = await getDbConnection();
    try {
      let payload: any;
      try {
        payload = JSON.parse(atributosContext);
      } catch (e) {
        payload = {};
      }

      // Si no vienen módulos en la solicitud, resolverlos dinámicamente como los hijos directos de la política activa
      const hasModulos = payload.solicitud && Array.isArray(payload.solicitud.modulos) && payload.solicitud.modulos.length > 0;
      const policyCode = payload.contexto?.politicas?.[0];

      if (!hasModulos && policyCode) {
        const resultModules = await connection.execute(
          `SELECT nh.codigo_tecnico
           FROM acc_asignaciones a
           JOIN acc_nodos np ON a.id_padre = np.id_nodo
           JOIN acc_nodos nh ON a.id_hijo = nh.id_nodo
           WHERE UPPER(np.codigo_tecnico) = UPPER(:policyCode)
             AND nh.id_tipo_nodo IN (SELECT id_tipo_nodo FROM acc_tipos_nodo WHERE codigo_tipo IN ('OBJETO', 'OBJ_ATTR'))`,
          { policyCode },
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        const resolvedModules = (resultModules.rows || []).map((row: any) => row.CODIGO_TECNICO || row[0]);
        if (resolvedModules.length > 0) {
          if (!payload.solicitud) {
            payload.solicitud = {};
          }
          payload.solicitud.modulos = resolvedModules;
          atributosContext = JSON.stringify(payload);
        }
      }

      const result = await connection.execute(
        `BEGIN :ret := pkg_seguridad_ngac.fn_obtener_menu_json(:contexto); END;`,
        {
          contexto: {
            dir: oracledb.BIND_IN,
            val: atributosContext,
            type: oracledb.CLOB,
          },
          ret: { dir: oracledb.BIND_OUT, type: oracledb.CLOB },
        },
      );
      const clob = (result.outBinds as any).ret;
      if (!clob) return null;
      const jsonString = await clob.getData();
      return JSON.parse(jsonString);
    } finally {
      await connection.close();
    }
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
   * @returns {Promise<any>} Objeto con los conteos de nodos, asignaciones, asociaciones, prohibiciones, logs, operaciones y tipos de nodo.
   */
  static async getDashboardStats(): Promise<any> {
    const connection = await getDbConnection();
    try {
      const result = await connection.execute(
        `BEGIN :cursor := pkg_seguridad_admin.fn_get_dashboard_stats(); END;`,
        { cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT } },
        { outFormat: oracledb.OUT_FORMAT_OBJECT },
      );
      const rs = (result.outBinds as any).cursor;
      const rows = await rs.getRows();
      await rs.close();

      const dbRow = rows && rows[0] ? rows[0] : {};
      
      const normalizedRow: any = {};
      for (const key of Object.keys(dbRow)) {
        normalizedRow[key.toUpperCase()] = dbRow[key];
      }

      return {
        acc_nodos: normalizedRow.TOTAL_NODOS ?? normalizedRow.ACC_NODOS ?? 0,
        acc_roles: normalizedRow.ACC_ROLES ?? 0,
        acc_asignaciones: normalizedRow.ASIGNACIONES_JERARQUICAS ?? normalizedRow.ACC_ASIGNACIONES ?? 0,
        acc_asociaciones: normalizedRow.ASOCIACIONES_PERMISOS ?? normalizedRow.ACC_ASOCIACIONES ?? 0,
        acc_prohibiciones: normalizedRow.ACC_PROHIBICIONES ?? 0,
        acc_log_errores: normalizedRow.ERRORES_RECIENTES ?? normalizedRow.ACC_LOG_ERRORES ?? 0,
        acc_operaciones: normalizedRow.TOTAL_OPERACIONES ?? 0,
        acc_tipos_nodo: normalizedRow.TOTAL_TIPOS_NODO ?? 0
      };
    } finally {
      await connection.close();
    }
  }

  /**
   * @function    getTree
   * @description Obtiene el árbol de nodos y enlaces, filtrando por rol base si corresponde.
   * @param {string} [rolBase] - Rol base para filtrar los nodos permitidos (opcional).
   * @returns {Promise<AccNodo[]>} Árbol de nodos estructurado.
   */
  static async getTree(rolBase?: string): Promise<AccNodo[]> {
    const connection = await getDbConnection();
    try {
      const nodosResult = await connection.execute(
        `BEGIN :cursor := pkg_seguridad_admin.fn_get_nodos_activos(); END;`,
        { cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT } },
        { outFormat: oracledb.OUT_FORMAT_OBJECT },
      );
      const rsNodos = (nodosResult.outBinds as any).cursor;
      const nodos = (await rsNodos.getRows()) || [];
      await rsNodos.close();

      const linksResult = await connection.execute(
        `BEGIN :cursor := pkg_seguridad_admin.fn_get_asignaciones_y_asociaciones(); END;`,
        { cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT } },
        { outFormat: oracledb.OUT_FORMAT_OBJECT },
      );
      const rsLinks = (linksResult.outBinds as any).cursor;
      const links = (await rsLinks.getRows()) || [];
      await rsLinks.close();

      let allowedIds: Set<number> | null = null;
      if (rolBase) {
        const permisosResult = await connection.execute(
          `BEGIN :cursor := pkg_seguridad_admin.fn_get_permisos_rol(:rolBase); END;`,
          {
            rolBase,
            cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT },
          },
          { outFormat: oracledb.OUT_FORMAT_OBJECT },
        );
        const rsPermisos = (permisosResult.outBinds as any).cursor;
        const permisos = (await rsPermisos.getRows()) || [];
        await rsPermisos.close();
        allowedIds = new Set(permisos.map((r: any) => r.ID_OBJ_ATTR));
      }

      const nodoMap = new Map<number, AccNodo>();
      const childIds = new Set<number>();

      nodos.forEach((n: any) => {
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

      links.forEach((l: any) => {
        const padre = nodoMap.get(l.ID_PADRE);
        const hijo = nodoMap.get(l.ID_HIJO);
        if (padre && hijo) {
          padre.children!.push(hijo);
          childIds.add(hijo.id_nodo!);
        }
      });

      const pruneTree = (node: AccNodo): boolean => {
        if (!node.children) return false;
        node.children = node.children.filter((child) => pruneTree(child));
        return (
          (allowedIds !== null && allowedIds.has(node.id_nodo!)) ||
          node.children.length > 0
        );
      };

      let roots: AccNodo[] = [];
      nodoMap.forEach((nodo) => {
        if (nodo.children && nodo.children.length > 0) {
          nodo.children.sort(
            (a, b) => (a.orden_visual || 0) - (b.orden_visual || 0),
          );
        }
        if (!childIds.has(nodo.id_nodo!)) {
          roots.push(nodo);
        }
      });

      if (allowedIds !== null) {
        roots = roots.filter((root) => pruneTree(root));
      }

      roots.sort((a, b) => (a.orden_visual || 0) - (b.orden_visual || 0));
      return roots;
    } finally {
      await connection.close();
    }
  }

  /**
   * @function    upsertNodo
   * @description Inserta o actualiza un nodo en la estructura de seguridad.
   * @param {UpsertNodoDto} dto - Datos del nodo a insertar o actualizar.
   * @returns {Promise<void>}
   */
  static async upsertNodo(dto: UpsertNodoDto) {
    const connection = await getDbConnection();
    try {
      await connection.execute(
        `BEGIN pkg_seguridad_admin.p_upsert_nodo(:codigo, :etiqueta, :tipo, :ruta, :slug, :icono, :descripcion, :orden, :activo); END;`,
        {
          codigo: dto.codigo,
          etiqueta: dto.etiqueta,
          tipo: dto.tipo,
          ruta: dto.ruta || null,
          slug: dto.slug || null,
          icono: dto.icono || null,
          descripcion: dto.descripcion || null,
          orden: dto.orden || 0,
          activo: dto.activo || "S",
        },
        { autoCommit: true },
      );
    } finally {
      await connection.close();
    }
  }

  /**
   * @function    deactivateNodo
   * @description Desactiva un nodo por su código técnico.
   * @param {string} codigo - Código técnico del nodo a desactivar.
   * @returns {Promise<void>}
   */
  static async deactivateNodo(codigo: string) {
    const connection = await getDbConnection();
    try {
      await connection.execute(
        `BEGIN pkg_seguridad_admin.p_desactivar_nodo(:codigo); END;`,
        { codigo },
        { autoCommit: true },
      );
    } finally {
      await connection.close();
    }
  }

  /**
   * @function    enlazarNodos
   * @description Crea un enlace (asignación) entre dos nodos (padre e hijo).
   * @param {EnlazarNodoDto} dto - Datos de los nodos a enlazar (padre e hijo).
   * @returns {Promise<void>}
   */
  static async enlazarNodos(dto: EnlazarNodoDto) {
    const padreId = await this.resolveNodeId(dto.padre);
    const hijoId = await this.resolveNodeId(dto.hijo);

    if (!padreId || !hijoId) {
      throw new Error(
        `No se pudo resolver el ID del nodo para uno de los elementos: padre=${dto.padre} (ID: ${padreId}), hijo=${dto.hijo} (ID: ${hijoId})`,
      );
    }

    const connection = await getDbConnection();
    try {
      await connection.execute(
        `BEGIN pkg_seguridad_admin.p_enlazar_nodos(:padre, :hijo); END;`,
        { padre: padreId, hijo: hijoId },
        { autoCommit: true },
      );
    } finally {
      await connection.close();
    }
  }

  /**
   * @function    getEnlaces
   * @description Obtiene todos los enlaces (asignaciones/asociaciones) entre nodos.
   * @returns {Promise<any[]>} Lista de enlaces entre nodos.
   */
  static async getEnlaces() {
    const connection = await getDbConnection();
    try {
      const result = await connection.execute(
        `BEGIN :cursor := pkg_seguridad_admin.fn_get_enlaces(); END;`,
        { cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT } },
        { outFormat: oracledb.OUT_FORMAT_OBJECT },
      );
      const rs = (result.outBinds as any).cursor;
      const rows = await rs.getRows();
      await rs.close();
      return (rows || []).map((row: any) => ({
        id_asignacion: row.ID_ASIGNACION || row.id_asignacion,
        id_padre: row.ID_PADRE || row.id_padre,
        id_hijo: row.ID_HIJO || row.id_hijo,
        padre: row.PADRE || row.padre,
        hijo: row.HIJO || row.hijo,
      }));
    } finally {
      await connection.close();
    }
  }

  /**
   * @function    deleteEnlace
   * @description Elimina un enlace (asignación) entre dos nodos.
   * @param {EnlazarNodoDto} dto - Datos de los nodos a desenlazar (padre e hijo).
   * @returns {Promise<void>}
   */
  static async deleteEnlace(dto: EnlazarNodoDto) {
    const padreId = await this.resolveNodeId(dto.padre);
    const hijoId = await this.resolveNodeId(dto.hijo);

    if (!padreId || !hijoId) {
      throw new Error(
        `No se pudo resolver el ID del nodo a desenlazar: padre=${dto.padre} (ID: ${padreId}), hijo=${dto.hijo} (ID: ${hijoId})`,
      );
    }

    const connection = await getDbConnection();
    try {
      await connection.execute(
        `BEGIN pkg_seguridad_admin.p_eliminar_enlace(:padre, :hijo); END;`,
        { padre: padreId, hijo: hijoId },
        { autoCommit: true },
      );
    } finally {
      await connection.close();
    }
  }

  /**
   * @function    otorgarPermiso
   * @description Otorga un permiso a un usuario/rol sobre un objeto y operación.
   * @param {OtorgarPermisoDto} dto - Datos del permiso a otorgar.
   * @returns {Promise<void>}
   */
  static async otorgarPermiso(dto: OtorgarPermisoDto) {
    const usrId = await this.resolveNodeId(dto.usr);
    const objId = await this.resolveNodeId(dto.obj);
    const connection = await getDbConnection();
    try {
      await connection.execute(
        `BEGIN pkg_seguridad_admin.p_otorgar_permiso(:usr, :obj, :op, :condicion); END;`,
        {
          usr: usrId,
          obj: objId,
          op: dto.op,
          condicion: dto.condicion_js || null,
        },
        { autoCommit: true },
      );
    } finally {
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
  static async denegarPermiso(dto: OtorgarPermisoDto) {
    const usrId = await this.resolveNodeId(dto.usr);
    const objId = await this.resolveNodeId(dto.obj);
    const connection = await getDbConnection();
    try {
      await connection.execute(
        `BEGIN pkg_seguridad_admin.p_denegar_permiso(:usr, :obj, :op); END;`,
        { usr: usrId, obj: objId, op: dto.op },
        { autoCommit: true },
      );
    } finally {
      await connection.close();
    }
  }

  /**
   * @function    revocarPermiso
   * @author      Gerardo Paiva G.
   * @description Revoca un permiso previamente otorgado a un usuario/rol.
   * @param {OtorgarPermisoDto} dto - Datos del permiso a revocar.
   * @returns {Promise<void>}
   */
  static async revocarPermiso(dto: OtorgarPermisoDto) {
    const usrId = await this.resolveNodeId(dto.usr);
    const objId = await this.resolveNodeId(dto.obj);
    const connection = await getDbConnection();
    try {
      await connection.execute(
        `BEGIN pkg_seguridad_admin.p_revocar_permiso(:usr, :obj, :op); END;`,
        { usr: usrId, obj: objId, op: dto.op },
        { autoCommit: true },
      );
    } finally {
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
  static async getPermisos(
    usr?: string,
    obj?: number,
    page: number = 1,
    pageSize: number = 5,
  ) {
    const connection = await getDbConnection();
    try {
      const result = await connection.execute(
        `BEGIN :cursor := pkg_seguridad_admin.fn_get_permisos(); END;`,
        { cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT } },
        { outFormat: oracledb.OUT_FORMAT_OBJECT },
      );
      const rs = (result.outBinds as any).cursor;
      const rows = await rs.getRows();
      await rs.close();

      let data = (rows || []).map((row: any) => ({
        id_asociacion: row.ID_ASOCIACION || row.id_asociacion,
        usr: row.USR || row.usr,
        usr_etiqueta:
          row.USR_ETIQUETA || row.usr_etiqueta || row.USR || row.usr,
        obj: row.OBJ || row.obj,
        obj_etiqueta:
          row.OBJ_ETIQUETA || row.obj_etiqueta || row.OBJ || row.obj,
        op: row.OP || row.op,
        condicion_json: row.CONDICION_JSON || row.condicion_json,
        fecha_registro: row.FECHA_REGISTRO || row.fecha_registro,
      }));

      if (usr) {
        data = data.filter((d: any) => {
          const uSearch = usr.toUpperCase().trim();
          const dUsr =
            d.usr !== undefined && d.usr !== null
              ? String(d.usr).toUpperCase().trim()
              : "";
          const dEtq =
            d.usr_etiqueta !== undefined && d.usr_etiqueta !== null
              ? String(d.usr_etiqueta).toUpperCase().trim()
              : "";
          return dUsr === uSearch || dEtq === uSearch;
        });
      }
      if (obj) {
        data = data.filter((d: any) => {
          const oSearch = String(obj).toUpperCase().trim();
          const dObj =
            d.obj !== undefined && d.obj !== null
              ? String(d.obj).toUpperCase().trim()
              : "";
          const dEtq =
            d.obj_etiqueta !== undefined && d.obj_etiqueta !== null
              ? String(d.obj_etiqueta).toUpperCase().trim()
              : "";
          return dObj === oSearch || dEtq === oSearch;
        });
      }

      const total = data.length;
      const offset = (page - 1) * pageSize;
      const paginatedData = data.slice(offset, offset + pageSize);
      return { total, data: paginatedData };
    } finally {
      await connection.close();
    }
  }

  /**
   * @function    getRolesPorNodo
   * @author      Gerardo Paiva G.
   * @description Obtiene los roles asociados a un nodo específico.
   * @param {number} id - ID del nodo.
   * @returns {Promise<any[]>} Lista de roles asociados.
   */
  static async getRolesPorNodo(id: number) {
    const connection = await getDbConnection();
    try {
      const result = await connection.execute(
        `BEGIN :cursor := pkg_seguridad_admin.fn_get_roles_por_nodo(:id); END;`,
        { id, cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT } },
        { outFormat: oracledb.OUT_FORMAT_OBJECT },
      );
      const rs = (result.outBinds as any).cursor;
      const rows = await rs.getRows();
      await rs.close();
      return (rows || []).map((row: any) => ({
        id_rol: row.ID_ROL || row.id_rol,
        codigo: row.CODIGO || row.codigo,
        nombre: row.NOMBRE || row.nombre,
      }));
    } finally {
      await connection.close();
    }
  }

  /**
   * @function    getNodos
   * @author      Gerardo Paiva G.
   * @description Obtiene la lista de nodos existentes en la estructura de seguridad.
   * @returns {Promise<any[]>} Lista de nodos.
   */
  static async getNodos() {
    const connection = await getDbConnection();
    try {
      const result = await connection.execute(
        `BEGIN :cursor := pkg_seguridad_admin.fn_get_nodos_lista(); END;`,
        { cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT } },
        { outFormat: oracledb.OUT_FORMAT_OBJECT },
      );
      const rs = (result.outBinds as any).cursor;
      const rows = await rs.getRows();
      await rs.close();
      return (rows || []).map((n: any) => ({
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
    } finally {
      await connection.close();
    }
  }

  /**
   * @function    getOperaciones
   * @author      Gerardo Paiva G.
   * @description Obtiene la lista de operaciones registradas en el sistema.
   * @returns {Promise<any[]>} Lista de operaciones.
   */
  static async getOperaciones() {
    const connection = await getDbConnection();
    try {
      const result = await connection.execute(
        `BEGIN :cursor := pkg_seguridad_admin.fn_get_operaciones(); END;`,
        { cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT } },
        { outFormat: oracledb.OUT_FORMAT_OBJECT },
      );
      const rs = (result.outBinds as any).cursor;
      const rows = await rs.getRows();
      await rs.close();
      return (rows || []).map((op: any) => ({
        nombre_op: op.NOMBRE_OP || op.nombre_op,
        descripcion: op.DESCRIPCION || op.descripcion,
      }));
    } finally {
      await connection.close();
    }
  }

  /**
   * @function    upsertOperacion
   * @author      Gerardo Paiva G.
   * @description Inserta o actualiza una operación en el sistema.
   * @param {string} nombre - Nombre de la operación.
   * @param {string} [desc] - Descripción de la operación (opcional).
   * @returns {Promise<void>}
   */
  static async upsertOperacion(nombre: string, desc?: string) {
    const connection = await getDbConnection();
    try {
      await connection.execute(
        `BEGIN pkg_seguridad_admin.p_upsert_operacion(:nombre, :desc); END;`,
        { nombre, desc: desc || null },
        { autoCommit: true },
      );
    } finally {
      await connection.close();
    }
  }

  /**
   * @function    deleteOperacion
   * @author      Gerardo Paiva G.
   * @description Elimina una operación del sistema.
   * @param {string} nombre - Nombre de la operación a eliminar.
   * @returns {Promise<void>}
   */
  static async deleteOperacion(nombre: string) {
    const connection = await getDbConnection();
    try {
      await connection.execute(
        `BEGIN pkg_seguridad_admin.p_eliminar_operacion(:nombre); END;`,
        { nombre },
        { autoCommit: true },
      );
    } finally {
      await connection.close();
    }
  }

  /**
   * @function    getTiposNodo
   * @author      Gerardo Paiva G.
   * @description Obtiene la lista de tipos de nodo registrados.
   * @returns {Promise<any[]>} Lista de tipos de nodo.
   */
  static async getTiposNodo() {
    const connection = await getDbConnection();
    try {
      const result = await connection.execute(
        `BEGIN :cursor := pkg_seguridad_admin.fn_get_tipos_nodo(); END;`,
        { cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT } },
        { outFormat: oracledb.OUT_FORMAT_OBJECT },
      );
      const rs = (result.outBinds as any).cursor;
      const rows = await rs.getRows();
      await rs.close();
      return (rows || []).map((t: any) => ({
        codigo: t.CODIGO_TIPO || t.codigo_tipo || t.CODIGO || t.codigo,
        descripcion: t.DESCRIPCION || t.descripcion,
      }));
    } finally {
      await connection.close();
    }
  }

  /**
   * @function    upsertTipoNodo
   * @author      Gerardo Paiva G.
   * @description Inserta o actualiza un tipo de nodo.
   * @param {UpsertTipoNodoDto} dto - Datos del tipo de nodo a insertar o actualizar.
   * @returns {Promise<void>}
   */
  static async upsertTipoNodo(dto: UpsertTipoNodoDto) {
    const connection = await getDbConnection();
    try {
      await connection.execute(
        `BEGIN pkg_seguridad_admin.p_upsert_tipo_nodo(:codigo, :descripcion); END;`,
        { codigo: dto.codigo, descripcion: dto.descripcion || null },
        { autoCommit: true },
      );
    } finally {
      await connection.close();
    }
  }

  /**
   * @function    deleteTipoNodo
   * @author      Gerardo Paiva G.
   * @description Elimina un tipo de nodo del sistema.
   * @param {string} codigo - Código del tipo de nodo a eliminar.
   * @returns {Promise<void>}
   */
  static async deleteTipoNodo(codigo: string) {
    const connection = await getDbConnection();
    try {
      await connection.execute(
        `BEGIN pkg_seguridad_admin.p_eliminar_tipo_nodo(:codigo); END;`,
        { codigo },
        { autoCommit: true },
      );
    } finally {
      await connection.close();
    }
  }

  /**
   * @function    getModulosRaiz
   * @author      Gerardo Paiva G.
   * @description Obtiene los nodos raíz de tipo módulo.
   * @returns {Promise<AccNodo[]>} Lista de nodos raíz tipo módulo.
   */
  static async getModulosRaiz(): Promise<AccNodo[]> {
    const connection = await getDbConnection();
    try {
      const nodosResult = await connection.execute(
        `BEGIN :cursor := pkg_seguridad_admin.fn_get_modulos_raiz_nodos(); END;`,
        { cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT } },
        { outFormat: oracledb.OUT_FORMAT_OBJECT },
      );
      const rsNodos = (nodosResult.outBinds as any).cursor;
      const nodos = (await rsNodos.getRows()) || [];
      await rsNodos.close();

      const linksResult = await connection.execute(
        `BEGIN :cursor := pkg_seguridad_admin.fn_get_modulos_raiz_links(); END;`,
        { cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT } },
        { outFormat: oracledb.OUT_FORMAT_OBJECT },
      );
      const rsLinks = (linksResult.outBinds as any).cursor;
      const links = (await rsLinks.getRows()) || [];
      await rsLinks.close();

      const nodoMap = new Map<number, AccNodo>();
      const childIds = new Set<number>();

      nodos.forEach((n: any) => {
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

      links.forEach((l: any) => {
        const padre = nodoMap.get(l.ID_PADRE);
        const hijo = nodoMap.get(l.ID_HIJO);
        if (padre && hijo) {
          padre.children!.push(hijo);
          childIds.add(hijo.id_nodo!);
        }
      });

      let roots: AccNodo[] = [];
      nodoMap.forEach((nodo) => {
        if (nodo.children && nodo.children.length > 0) {
          nodo.children.sort(
            (a, b) => (a.orden_visual || 0) - (b.orden_visual || 0),
          );
        }
        if (!childIds.has(nodo.id_nodo!)) {
          roots.push(nodo);
        }
      });

      roots.sort((a, b) => (a.orden_visual || 0) - (b.orden_visual || 0));
      return roots;
    } finally {
      await connection.close();
    }
  }

  /**
   * @function    getPoliticasRaiz
   * @author      Gerardo Paiva G.
   * @description Obtiene los nodos raíz de tipo política.
   * @returns {Promise<AccNodo[]>} Lista de nodos raíz tipo política.
   */
  static async getPoliticasRaiz(): Promise<AccNodo[]> {
    const connection = await getDbConnection();
    try {
      const result = await connection.execute(
        `BEGIN :cursor := pkg_seguridad_admin.fn_get_politicas_raiz(); END;`,
        { cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT } },
        { outFormat: oracledb.OUT_FORMAT_OBJECT },
      );
      const rs = (result.outBinds as any).cursor;
      const rows = await rs.getRows();
      await rs.close();
      return (rows || []).map((n: any) => ({
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
    } finally {
      await connection.close();
    }
  }

  /**
   * @function    getRoles
   * @author      Gerardo Paiva G.
   * @description Obtiene la lista de roles registrados en el sistema.
   * @returns {Promise<AccRol[]>} Lista de roles.
   */
  static async getRoles(): Promise<AccRol[]> {
    const connection = await getDbConnection();
    try {
      const result = await connection.execute(
        `BEGIN :cursor := pkg_seguridad_admin.fn_get_roles(); END;`,
        { cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT } },
        { outFormat: oracledb.OUT_FORMAT_OBJECT },
      );
      const rs = (result.outBinds as any).cursor;
      const rows = await rs.getRows();
      await rs.close();
      return (rows || []).map((row: any) => ({
        id_rol: row.ID_ROL || row.id_rol,
        codigo: row.CODIGO || row.codigo,
        nombre: row.NOMBRE || row.nombre,
        descripcion: row.DESCRIPCION || row.descripcion,
      }));
    } finally {
      await connection.close();
    }
  }

  /**
   * @function    upsertRol
   * @author      Gerardo Paiva G.
   * @description Inserta o actualiza un rol en el sistema.
   * @param {AccRol} rol - Datos del rol a insertar o actualizar.
   * @returns {Promise<void>}
   */
  static async upsertRol(rol: AccRol) {
    const connection = await getDbConnection();
    try {
      const technicalCode = rol.codigo.startsWith("ROL_")
        ? rol.codigo
        : `ROL_${rol.codigo.toUpperCase()}`;
      await connection.execute(
        `BEGIN pkg_seguridad_admin.p_upsert_rol(:codigo, :nombre, :descripcion); END;`,
        {
          codigo: technicalCode,
          nombre: rol.nombre,
          descripcion: rol.descripcion || null,
        },
        { autoCommit: true },
      );
    } finally {
      await connection.close();
    }
  }

  /**
   * @function    deleteRol
   * @author      Gerardo Paiva G.
   * @description Elimina un rol del sistema por su ID.
   * @param {number} id_rol - ID del rol a eliminar.
   * @returns {Promise<void>}
   */
  static async deleteRol(id_rol: number) {
    const connection = await getDbConnection();
    try {
      await connection.execute(
        `BEGIN pkg_seguridad_admin.p_delete_rol(:id_rol); END;`,
        { id_rol },
        { autoCommit: true },
      );
    } finally {
      await connection.close();
    }
  }

  /**
   * @function    getLogs
   * @author      Gerardo Paiva G.
   * @description Obtiene los logs de seguridad registrados en el sistema.
   * @returns {Promise<any[]>} Lista de logs.
   */
  static async getLogs() {
    const connection = await getDbConnection();
    try {
      const result = await connection.execute(
        `BEGIN :cursor := pkg_seguridad_admin.fn_get_logs(); END;`,
        { cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT } },
        { outFormat: oracledb.OUT_FORMAT_OBJECT },
      );
      const rs = (result.outBinds as any).cursor;
      const rows = await rs.getRows();
      await rs.close();
      return rows || [];
    } finally {
      await connection.close();
    }
  }

  /**
   * @function    clearLogs
   * @author      Gerardo Paiva G.
   * @description Elimina todos los logs de seguridad del sistema.
   * @returns {Promise<void>}
   */
  static async clearLogs() {
    const connection = await getDbConnection();
    try {
      await connection.execute(
        `BEGIN pkg_seguridad_admin.p_limpiar_logs(); END;`,
        [],
        { autoCommit: true },
      );
    } finally {
      await connection.close();
    }
  }

  /**
   * @function    getProhibiciones
   * @author      Gerardo Paiva G.
   * @description Obtiene la lista de prohibiciones activas en el sistema.
   * @returns {Promise<any[]>} Lista de prohibiciones.
   */
  static async getProhibiciones(): Promise<any[]> {
    const connection = await getDbConnection();
    try {
      const result = await connection.execute(
        `BEGIN :cursor := pkg_seguridad_admin.fn_get_prohibiciones(); END;`,
        { cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT } },
        { outFormat: oracledb.OUT_FORMAT_OBJECT },
      );
      const rs = (result.outBinds as any).cursor;
      const rows = await rs.getRows();
      await rs.close();
      return (rows || []).map((row: any) => ({
        id_prohibicion: row.ID_PROHIBICION || row.id_prohibicion,
        usr: row.USR || row.usr,
        obj: row.OBJ || row.obj,
        op: row.OP || row.op,
        fecha_registro: row.FECHA_REGISTRO || row.fecha_registro,
        creado_por: row.CREADO_POR || row.creado_por,
      }));
    } finally {
      await connection.close();
    }
  }

  /**
   * @function    revocarProhibicion
   * @author      Gerardo Paiva G.
   * @description Revoca una prohibición por su ID.
   * @param {number} id - ID de la prohibición a revocar.
   * @returns {Promise<void>}
   */
  static async revocarProhibicion(id: number) {
    const connection = await getDbConnection();
    try {
      await connection.execute(
        `BEGIN pkg_seguridad_admin.p_revocar_prohibicion(:id); END;`,
        { id },
        { autoCommit: true },
      );
    } finally {
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
  static async getUsuarios(): Promise<SafiUsuario[]> {
    const connection = await getDbConnection();
    try {
      const result = await connection.execute(
        `BEGIN :cursor := pkg_safi_admin.fn_get_safi_usuarios(); END;`,
        { cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT } },
        { outFormat: oracledb.OUT_FORMAT_OBJECT },
      );
      const rs = (result.outBinds as any).cursor;
      const rows = await rs.getRows();
      await rs.close();
      return (rows || []).map((row: any) => ({
        id: row.ID !== undefined ? row.ID : row.id,
        nombre: row.NOMBRE !== undefined ? row.NOMBRE : row.nombre,
        email: row.EMAIL !== undefined ? row.EMAIL : row.email,
        estado: row.ESTADO !== undefined ? row.ESTADO : row.estado,
      }));
    } finally {
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
  static async upsertUsuario(dto: SafiUsuario): Promise<void> {
    const connection = await getDbConnection();
    try {
      await connection.execute(
        `BEGIN pkg_safi_admin.p_upsert_safi_usuario(:id, :nombre, :email, :estado); END;`,
        {
          id: dto.id,
          nombre: dto.nombre,
          email: dto.email,
          estado: dto.estado || 1,
        },
        { autoCommit: true },
      );
    } finally {
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
  static async deleteUsuario(id: number): Promise<void> {
    const connection = await getDbConnection();
    try {
      await connection.execute(
        `BEGIN pkg_safi_admin.p_delete_safi_usuario(:id); END;`,
        { id },
        { autoCommit: true },
      );
    } finally {
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
  static async getEntidades(): Promise<SafiEntidad[]> {
    const connection = await getDbConnection();
    try {
      const result = await connection.execute(
        `BEGIN :cursor := pkg_safi_admin.fn_get_safi_entidades(); END;`,
        { cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT } },
        { outFormat: oracledb.OUT_FORMAT_OBJECT },
      );
      const rs = (result.outBinds as any).cursor;
      const rows = await rs.getRows();
      await rs.close();
      return (rows || []).map((row: any) => ({
        id: row.ID !== undefined ? row.ID : row.id,
        nombre: row.NOMBRE !== undefined ? row.NOMBRE : row.nombre,
        slug: row.SLUG !== undefined ? row.SLUG : row.slug,
        desc:
          row.DESC !== undefined
            ? row.DESC
            : row.DESCRIPCION !== undefined
              ? row.DESCRIPCION
              : row.desc,
        estado: row.ESTADO !== undefined ? row.ESTADO : row.estado,
      }));
    } finally {
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
  static async upsertEntidad(dto: SafiEntidad): Promise<void> {
    const connection = await getDbConnection();
    try {
      await connection.execute(
        `BEGIN pkg_safi_admin.p_upsert_safi_entidad(:id, :nombre, :slug, :desc, :estado); END;`,
        {
          id: dto.id,
          nombre: dto.nombre,
          slug: dto.slug,
          desc: dto.desc || null,
          estado: dto.estado || 1,
        },
        { autoCommit: true },
      );
    } finally {
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
  static async deleteEntidad(id: number): Promise<void> {
    const connection = await getDbConnection();
    try {
      await connection.execute(
        `BEGIN pkg_safi_admin.p_delete_safi_entidad(:id); END;`,
        { id },
        { autoCommit: true },
      );
    } finally {
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
  static async getUnidades(): Promise<SafiUnidad[]> {
    const connection = await getDbConnection();
    try {
      const result = await connection.execute(
        `BEGIN :cursor := pkg_safi_admin.fn_get_safi_unidades(); END;`,
        { cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT } },
        { outFormat: oracledb.OUT_FORMAT_OBJECT },
      );
      const rs = (result.outBinds as any).cursor;
      const rows = await rs.getRows();
      await rs.close();
      return (rows || []).map((row: any) => ({
        id: row.ID !== undefined ? row.ID : row.id,
        nombre: row.NOMBRE !== undefined ? row.NOMBRE : row.nombre,
        slug: row.SLUG !== undefined ? row.SLUG : row.slug,
        desc:
          row.DESC !== undefined
            ? row.DESC
            : row.DESCRIPCION !== undefined
              ? row.DESCRIPCION
              : row.desc,
        estado: row.ESTADO !== undefined ? row.ESTADO : row.estado,
      }));
    } finally {
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
  static async upsertUnidad(dto: SafiUnidad): Promise<void> {
    const connection = await getDbConnection();
    try {
      await connection.execute(
        `BEGIN pkg_safi_admin.p_upsert_safi_unidad(:id, :nombre, :slug, :desc, :estado); END;`,
        {
          id: dto.id,
          nombre: dto.nombre,
          slug: dto.slug,
          desc: dto.desc || null,
          estado: dto.estado || 1,
        },
        { autoCommit: true },
      );
    } finally {
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
  static async deleteUnidad(id: number): Promise<void> {
    const connection = await getDbConnection();
    try {
      await connection.execute(
        `BEGIN pkg_safi_admin.p_delete_safi_unidad(:id); END;`,
        { id },
        { autoCommit: true },
      );
    } finally {
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
  static async crearUsuario(dto: CrearSafiUsuarioDto): Promise<number> {
    const connection = await getDbConnection();
    try {
      const result = await connection.execute(
        `BEGIN pkg_safi_admin.crear_usuario(:slug, :rut, :nombres, :apellidos, :email, :out_id); END;`,
        {
          slug: dto.slug_usuario,
          rut: dto.rut,
          nombres: dto.nombres,
          apellidos: dto.apellidos,
          email: dto.email,
          out_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
        },
        { autoCommit: true },
      );
      return (result.outBinds as any).out_id;
    } finally {
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
  static async desactivarUsuario(idUsuario: number): Promise<void> {
    const connection = await getDbConnection();
    try {
      await connection.execute(
        `BEGIN pkg_safi_admin.desactivar_usuario(:id_usuario); END;`,
        { id_usuario: idUsuario },
        { autoCommit: true },
      );
    } finally {
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
  static async crearUnidad(dto: CrearSafiUnidadDto): Promise<number> {
    const connection = await getDbConnection();
    try {
      const result = await connection.execute(
        `BEGIN pkg_safi_admin.crear_unidad(:slug, :nombre, :descripcion, :out_id); END;`,
        {
          slug: dto.slug_unidad,
          nombre: dto.nombre_unidad,
          descripcion: dto.descripcion,
          out_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
        },
        { autoCommit: true },
      );
      return (result.outBinds as any).out_id;
    } finally {
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
  static async crearEntidad(dto: CrearSafiEntidadDto): Promise<number> {
    const connection = await getDbConnection();
    try {
      const result = await connection.execute(
        `BEGIN pkg_safi_admin.crear_entidad(:slug, :nombre, :tipo, :out_id); END;`,
        {
          slug: dto.slug_entidad,
          nombre: dto.nombre_entidad,
          tipo: dto.tipo_entidad,
          out_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
        },
        { autoCommit: true },
      );
      return (result.outBinds as any).out_id;
    } finally {
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
  static async vincularUsuarioUnidad(
    dto: VinculoUsuarioUnidadDto,
  ): Promise<void> {
    const connection = await getDbConnection();
    try {
      await connection.execute(
        `BEGIN pkg_safi_admin.vincular_usuario_unidad(:id_usuario, :id_unidad); END;`,
        { id_usuario: dto.id_usuario, id_unidad: dto.id_unidad },
        { autoCommit: true },
      );
    } finally {
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
  static async desvincularUsuarioUnidad(
    dto: VinculoUsuarioUnidadDto,
  ): Promise<void> {
    const connection = await getDbConnection();
    try {
      await connection.execute(
        `BEGIN pkg_safi_admin.desvincular_usuario_unidad(:id_usuario, :id_unidad); END;`,
        { id_usuario: dto.id_usuario, id_unidad: dto.id_unidad },
        { autoCommit: true },
      );
    } finally {
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
  static async vincularUsuarioEntidad(
    dto: VinculoUsuarioEntidadDto,
  ): Promise<void> {
    const connection = await getDbConnection();
    try {
      await connection.execute(
        `BEGIN pkg_safi_admin.vincular_usuario_entidad(:id_usuario, :id_entidad); END;`,
        { id_usuario: dto.id_usuario, id_entidad: dto.id_entidad },
        { autoCommit: true },
      );
    } finally {
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
  static async desvincularUsuarioEntidad(
    dto: VinculoUsuarioEntidadDto,
  ): Promise<void> {
    const connection = await getDbConnection();
    try {
      await connection.execute(
        `BEGIN pkg_safi_admin.desvincular_usuario_entidad(:id_usuario, :id_entidad); END;`,
        { id_usuario: dto.id_usuario, id_entidad: dto.id_entidad },
        { autoCommit: true },
      );
    } finally {
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
  static async vincularUnidadEntidad(
    dto: VinculoUnidadEntidadDto,
  ): Promise<void> {
    const connection = await getDbConnection();
    try {
      await connection.execute(
        `BEGIN pkg_safi_admin.vincular_unidad_entidad(:id_unidad, :id_entidad); END;`,
        { id_unidad: dto.id_unidad, id_entidad: dto.id_entidad },
        { autoCommit: true },
      );
    } finally {
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
  static async getRolesDeUsuario(userId: number): Promise<any[]> {
    const connection = await getDbConnection();
    try {
      const result = await connection.execute(
        `BEGIN :cursor := pkg_seguridad_admin.fn_get_roles_de_usuario(:userId); END;`,
        {
          userId,
          cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT }
        },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      const cursor = (result.outBinds as any).cursor;
      const rows = await cursor.getRows(100);
      await cursor.close();

      return rows.map((row: any) => ({
        id_rol: row.ID_ROL !== undefined ? row.ID_ROL : (row.id_rol !== undefined ? row.id_rol : null),
        codigo: row.CODIGO !== undefined ? row.CODIGO : (row.codigo !== undefined ? row.codigo : null),
        nombre: row.NOMBRE !== undefined ? row.NOMBRE : (row.nombre !== undefined ? row.nombre : null),
        descripcion: row.DESCRIPCION !== undefined ? row.DESCRIPCION : (row.descripcion !== undefined ? row.descripcion : null),
      }));
    } finally {
      await connection.close();
    }
  }

  /**
   * @function    asignarRolAUsuario
   * @author      Gerardo Paiva G.
   * @date        18/05/2026
   * @description Asigna un rol a un usuario NGAC.
   * @param       {number} userId - ID del usuario.
   * @param       {string} codigoRol - Código técnico del rol.
   * @returns     {Promise<void>}
   */
  static async asignarRolAUsuario(
    userId: number,
    codigoRol: string,
  ): Promise<void> {
    const connection = await getDbConnection();
    try {
      await connection.execute(
        `BEGIN pkg_seguridad_admin.p_asignar_rol_a_usuario(:userId, :codigoRol); END;`,
        { userId, codigoRol },
        { autoCommit: true }
      );
    } finally {
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
  static async desvincularUnidadEntidad(
    dto: VinculoUnidadEntidadDto,
  ): Promise<void> {
    const connection = await getDbConnection();
    try {
      await connection.execute(
        `BEGIN pkg_safi_admin.desvincular_unidad_entidad(:id_unidad, :id_entidad); END;`,
        { id_unidad: dto.id_unidad, id_entidad: dto.id_entidad },
        { autoCommit: true },
      );
    } finally {
      await connection.close();
    }
  }

  /**
   * @function    revocarRolDeUsuario
   * @description Revoca la asignación de un rol específico a un usuario en el sistema.
   * @param {number} userId - ID del usuario.
   * @param {string} codigoRol - Código técnico del rol a revocar.
   * @returns {Promise<void>}
   */
  static async revocarRolDeUsuario(
    userId: number,
    codigoRol: string,
  ): Promise<void> {
    const connection = await getDbConnection();
    try {
      await connection.execute(
        `BEGIN pkg_seguridad_admin.p_revocar_rol_de_usuario(:userId, :codigoRol); END;`,
        { userId, codigoRol },
        { autoCommit: true }
      );
    } finally {
      await connection.close();
    }
  }

  /**
   * @function    getUsuarioVinculos
   * @description Obtiene los IDs de las entidades y unidades asociadas a un usuario específico.
   * @param {number} userId - ID del usuario.
   * @returns {Promise<{ entidadIds: number[]; unidadIds: number[] }>} Listas de IDs de entidades y unidades.
   */
  static async getUsuarioVinculos(
    userId: number,
  ): Promise<{ entidadIds: number[]; unidadIds: number[] }> {
    const connection = await getDbConnection();
    try {
      const entResult = await connection.execute(
        `BEGIN :cursor := pkg_safi_admin.fn_get_entidades_usuario(:userId); END;`,
        {
          userId,
          cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT }
        },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      const entCursor = (entResult.outBinds as any).cursor;
      const entRows = await entCursor.getRows(100);
      await entCursor.close();

      const uniResult = await connection.execute(
        `BEGIN :cursor := pkg_safi_admin.fn_get_unidades_usuario(:userId); END;`,
        {
          userId,
          cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT }
        },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      const uniCursor = (uniResult.outBinds as any).cursor;
      const uniRows = await uniCursor.getRows(100);
      await uniCursor.close();

      return {
        entidadIds: entRows.map((r: any) => r.ID_ENTIDAD || r.id_entidad),
        unidadIds: uniRows.map((r: any) => r.ID_UNIDAD || r.id_unidad),
      };
    } finally {
      await connection.close();
    }
  }

  /**
   * @function    getUnidadesDeEntidad
   * @description Obtiene la lista de unidades organizacionales vinculadas a una entidad específica.
   * @param {number} entidadId - ID de la entidad.
   * @returns {Promise<any[]>} Lista de unidades vinculadas.
   */
  static async getUnidadesDeEntidad(entidadId: number): Promise<any[]> {
    const connection = await getDbConnection();
    try {
      const result = await connection.execute(
        `BEGIN :cursor := pkg_safi_admin.fn_get_unidades_de_entidad(:entidadId); END;`,
        {
          entidadId,
          cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT }
        },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      const cursor = (result.outBinds as any).cursor;
      const rows = await cursor.getRows(100);
      await cursor.close();

      return rows.map((row: any) => ({
        id: row.ID !== undefined ? row.ID : row.id,
        nombre: row.NOMBRE !== undefined ? row.NOMBRE : row.nombre,
        slug: row.SLUG !== undefined ? row.SLUG : row.slug,
        desc: row.DESC !== undefined ? row.DESC : row.desc,
        estado: row.ESTADO !== undefined ? row.ESTADO : row.estado,
      }));
    } finally {
      await connection.close();
    }
  }

  /**
   * @function    getUnidadEntidadVinculos
   * @description Obtiene todos los vínculos de relación existentes entre unidades y entidades.
   * @returns {Promise<any[]>} Lista de vínculos unidad-entidad.
   */
  static async getUnidadEntidadVinculos(): Promise<any[]> {
    const connection = await getDbConnection();
    try {
      const result = await connection.execute(
        `BEGIN :cursor := pkg_safi_admin.fn_get_unidad_entidad_vinculos(); END;`,
        {
          cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT }
        },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      const cursor = (result.outBinds as any).cursor;
      const rows = await cursor.getRows(100);
      await cursor.close();

      return rows.map((row: any) => ({
        id_unidad: row.ID_UNIDAD !== undefined ? row.ID_UNIDAD : row.id_unidad,
        id_entidad: row.ID_ENTIDAD !== undefined ? row.ID_ENTIDAD : row.id_entidad,
      }));
    } finally {
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
   * @param {string | number} identifier - Código técnico o ID numérico del nodo.
   * @returns {Promise<number>} ID numérico del nodo resuelto.
   */
  private static async resolveNodeId(
    identifier: string | number,
  ): Promise<number> {
    if (!identifier) return 0;
    const num = Number(identifier);
    if (!isNaN(num)) return num;

    const connection = await getDbConnection();
    try {
      const result = await connection.execute(
        `BEGIN :id := pkg_seguridad_admin.fn_resolve_node_id(:code); END;`,
        {
          code: String(identifier).trim().toUpperCase(),
          id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
        }
      );
      return (result.outBinds as any).id || 0;
    } finally {
      await connection.close();
    }
  }
}
