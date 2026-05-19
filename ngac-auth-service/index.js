require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');
const { initialize, close } = require('./src/config/database');
const { client: eurekaClient, isEurekaEnabled } = require('./src/config/eureka');
const { getMenuNgac }        = require('./src/controllers/menu.controller');

const app  = express();
const PORT = process.env.PORT || 3100;

// ─── Middlewares ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// ─── Rutas ────────────────────────────────────────────────────────────────────
/** Health-check */
app.get('/info', (_req, res) =>
  res.json({ status: 'ok', service: 'ngac-auth-service', version: '1.0.0' })
);

/** Obtener menú jerárquico filtrado por claims del usuario */
app.post('/api/v1/menu', getMenuNgac);

// ─── Arranque ─────────────────────────────────────────────────────────────────
async function start() {
  try {
    await initialize();
    app.listen(PORT, () => {
      console.log(`[ngac-auth-service] Escuchando en puerto ${PORT}`);
      if (isEurekaEnabled) {
        eurekaClient.start();
      } else {
        console.log('[ngac-auth-service] Eureka deshabilitado para desarrollo local (no se detectó host de Eureka)');
      }
    });
  } catch (err) {
    console.error('[ngac-auth-service] Error al iniciar:', err);
    process.exit(1);
  }
}
start();

// ─── Apagado elegante ─────────────────────────────────────────────────────────
process.on('SIGINT', async () => {
  console.log('[ngac-auth-service] Apagando...');
  await close();
  if (isEurekaEnabled) {
    eurekaClient.stop();
  }
  process.exit(0);
});
