"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_config_1 = require("./config/db.config");
async function main() {
    const conn = await (0, db_config_1.getDbConnection)();
    try {
        console.log('--- Diagnóstico de Opciones de Administración ---');
        // 1. Ver estado del nodo ADMINISTRACION y sus hijos
        const resNode = await conn.execute(`
      SELECT id_nodo, codigo_tecnico, etiqueta, activo 
      FROM acc_nodos 
      WHERE id_nodo = 1756 OR codigo_tecnico = 'ADMINISTRACION'
    `);
        console.log('Nodo ADMINISTRACION:', JSON.stringify(resNode.rows, null, 2));
        // 2. Ver si existen en acc_menu_nodos
        const resMenuNode = await conn.execute(`
      SELECT id_menu_nodo, id_nodo, etiqueta_visible, activo 
      FROM acc_menu_nodos 
      WHERE id_nodo = 1756
    `);
        console.log('Menu Nodo ADMINISTRACION:', JSON.stringify(resMenuNode.rows, null, 2));
        // 3. Ver relaciones de menu de ADMINISTRACION
        const resMenuRels = await conn.execute(`
      SELECT ma.id_menu_asignacion, mn_padre.id_nodo AS padre_id, n_padre.codigo_tecnico AS padre,
             mn_hijo.id_nodo AS hijo_id, n_hijo.codigo_tecnico AS hijo, ma.activo
      FROM acc_menu_asignaciones ma
      JOIN acc_menu_nodos mn_padre ON mn_padre.id_menu_nodo = ma.id_menu_padre
      JOIN acc_menu_nodos mn_hijo ON mn_hijo.id_menu_nodo = ma.id_menu_hijo
      JOIN acc_nodos n_padre ON n_padre.id_nodo = mn_padre.id_nodo
      JOIN acc_nodos n_hijo ON n_hijo.id_nodo = mn_hijo.id_nodo
      WHERE n_padre.id_nodo = 1756 OR n_hijo.id_nodo = 1756
    `);
        console.log('Relaciones de menú para ADMINISTRACION:', JSON.stringify(resMenuRels.rows, null, 2));
        // 4. Ver si ADMINISTRACION está vinculada a alguna política (en acc_policy_menu_raices)
        const resPolicy = await conn.execute(`
      SELECT pmr.id_policy_menu_raiz, pmr.id_policy, n_pol.codigo_tecnico AS politica, 
             pmr.id_menu_nodo, mn.etiqueta_visible, pmr.activo
      FROM acc_policy_menu_raices pmr
      JOIN acc_nodos n_pol ON n_pol.id_nodo = pmr.id_policy
      JOIN acc_menu_nodos mn ON mn.id_menu_nodo = pmr.id_menu_nodo
      WHERE mn.id_nodo = 1756
    `);
        console.log('Políticas que tienen ADMINISTRACION como raíz:', JSON.stringify(resPolicy.rows, null, 2));
    }
    catch (err) {
        console.error(err);
    }
    finally {
        await conn.close();
    }
}
main();
