const { getPool } = require('../config/database');
const oracledb    = require('oracledb');

/**
 * POST /api/v1/menu
 * Body: { "contexto": "{\"claims\":[\"ROL_X\",\"CONTABILIDAD\",\"VER\"]}" }
 * Invoca pkg_seguridad_ngac.fn_obtener_menu_json y retorna el JSON del árbol.
 */
async function getMenuNgac(req, res) {
  let connection;
  try {
    const { contexto } = req.body;

    if (!contexto) {
      return res.status(400).json({ error: 'Se requiere el campo "contexto"' });
    }

    connection = await getPool().getConnection();

    const result = await connection.execute(
      `BEGIN :ret := pkg_seguridad_ngac.fn_obtener_menu_json(:contexto); END;`,
      {
        contexto,
        ret: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 500000 },
      }
    );

    const jsonString = result.outBinds.ret;
    if (!jsonString) {
      return res.status(500).json({ error: 'El paquete Oracle no retornó datos' });
    }

    res.status(200).json(JSON.parse(jsonString));
  } catch (err) {
    console.error('[menu.controller] Error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) {
      try { await connection.close(); } catch (_) {}
    }
  }
}

module.exports = { getMenuNgac };
