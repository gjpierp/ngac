const oracledb = require('oracledb');
async function run() {
  let conn;
  try {
    conn = await oracledb.getConnection({
      user: 'NGAC_USER',
      password: 'G3rC4t_01',
      connectString: 'localhost:1521/XEPDB1'
    });
    const res = await conn.execute(`SELECT table_name FROM all_tables WHERE owner = 'NGAC_USER' AND table_name LIKE 'ACC_%'`);
    console.log("Tables:", res.rows);
    for (let row of res.rows) {
      const tname = row[0];
      const cols = await conn.execute(`SELECT column_name, data_type FROM all_tab_columns WHERE table_name = '${tname}'`);
      console.log(`\nTable ${tname}:`);
      console.log(cols.rows.map(c => c.join(' ')).join(', '));
    }
  } catch (e) {
    console.error(e);
  } finally {
    if (conn) await conn.close();
  }
}
run();
