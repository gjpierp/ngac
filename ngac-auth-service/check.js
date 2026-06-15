const oracledb = require('oracledb');
async function test() {
  const conn = await oracledb.getConnection({user: 'NGAC_USER', password: 'G3rC4t_01', connectString: 'localhost:1521/XEPDB1'});
  const result = await conn.execute(`
    SELECT a.id_obj_attr, a.condicion_json
    FROM acc_asociaciones a
    JOIN acc_roles r ON r.id_rol = a.id_usr_attr
    WHERE r.codigo = 'ROL_DEV'
  `);
  console.log(result.rows);
  await conn.close();
}
test();
