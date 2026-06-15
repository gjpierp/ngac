const oracledb = require('oracledb');
async function run() {
  let conn;
  try {
    conn = await oracledb.getConnection({
      user: 'NGAC_USER',
      password: 'G3rC4t_01',
      connectString: 'localhost:1521/XEPDB1'
    });
    // Check if Roles are assigned to Policies in ACC_ASIGNACIONES
    // Or if Roles exist in ACC_NODOS at all
    const roles = await conn.execute(`SELECT * FROM acc_nodos WHERE tipo_nodo = 'ROLE' OR tipo_nodo = 'USR_ATTR'`);
    console.log("Roles in acc_nodos:", roles.rows.length);
  } catch(e) {
    console.error(e);
  } finally {
    if(conn) await conn.close();
  }
}
run();
