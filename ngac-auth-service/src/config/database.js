const oracledb = require('oracledb');
require('dotenv').config();

// Retornar CLOBs como String directamente para evitar manejo manual del stream
oracledb.fetchAsString = [oracledb.CLOB];

let pool;

async function initialize() {
  pool = await oracledb.createPool({
    user:          process.env.DB_USER,
    password:      process.env.DB_PASSWORD,
    connectString: process.env.DB_CONNECTION_STRING,
    poolMin:       2,
    poolMax:       10,
    poolIncrement: 1,
  });
  console.log('[DB] Pool de conexiones Oracle iniciado');
}

async function close() {
  if (pool) await pool.close(0);
}

module.exports = { initialize, close, getPool: () => pool };
