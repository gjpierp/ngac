const oracledb = require('oracledb');
async function run() {
  let conn;
  try {
    conn = await oracledb.getConnection({user: 'NGAC_USER', password: 'G3rC4t_01', connectString: 'localhost:1521/XEPDB1'});
    const res = await conn.execute(`SELECT p.codigo_tecnico as policy, m.codigo_tecnico as menu_root FROM acc_policy_menu_raices pmr JOIN acc_nodos p ON p.id_nodo = pmr.id_policy JOIN acc_menu_nodos mn ON mn.id_menu_nodo = pmr.id_menu_nodo JOIN acc_nodos m ON m.id_nodo = mn.id_nodo WHERE pmr.activo = 'S'`);
    console.table(res.rows);
  } catch(e) {
    console.error(e);
  } finally {
    if(conn) await conn.close();
  }
}
run();
