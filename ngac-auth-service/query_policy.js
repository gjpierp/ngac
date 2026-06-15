const oracledb = require('oracledb');
async function run() {
  let conn;
  try {
    conn = await oracledb.getConnection({user: 'NGAC_USER', password: 'G3rC4t_01', connectString: 'localhost:1521/XEPDB1'});
    const res = await conn.execute(`SELECT n.id_nodo, n.codigo_tecnico, n.etiqueta, t.codigo_tipo FROM acc_nodos n JOIN acc_tipos_nodo t ON n.id_tipo_nodo = t.id_tipo_nodo WHERE t.codigo_tipo = 'POLICY' AND n.activo = 'S'`);
    console.table(res.rows);
  } catch(e) {
    console.error(e);
  } finally {
    if(conn) await conn.close();
  }
}
run();
