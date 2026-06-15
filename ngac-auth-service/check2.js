const oracledb = require('oracledb');
async function test() {
  const conn = await oracledb.getConnection({user: 'NGAC_USER', password: 'G3rC4t_01', connectString: 'localhost:1521/XEPDB1'});
  const result = await conn.execute(`
    SELECT * FROM acc_policy_menu_raices
  `);
  console.log(result.rows);
  await conn.close();
}
test();
