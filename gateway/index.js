require('dotenv').config();
const express         = require('express');
const morgan          = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { Eureka }      = require('eureka-js-client');

const app  = express();
const PORT = process.env.PORT || 3200;

// ── Configuración de targets desde ENV (con fallback a nombre Docker interno) ──
const TARGETS = {
  AUTH:     process.env.AUTH_SERVICE_URL     || 'http://ngac-auth-service:3100',
  BACKEND:  process.env.BACKEND_SERVICE_URL  || 'http://localhost:3205',
  FRONTEND: process.env.FRONTEND_SERVICE_URL || 'http://ngac-frontend:80',
};

// ── Middlewares ────────────────────────────────────────────────────────────────
app.use(morgan('[:method] :url :status :response-time ms'));

// ─── Health-check del gateway ──────────────────────────────────────────────────
app.get('/gateway/health', (_req, res) =>
  res.json({
    status: 'UP',
    service: 'ngac-gateway',
    version: '1.0.0',
    routes: Object.entries(TARGETS).map(([k, v]) => ({ service: k, target: v }))
  })
);

// ── Rutas del Auth Service ─────────────────────────────────────────────────────
app.use(
  '/api/v1/menu',
  createProxyMiddleware({
    target:      TARGETS.AUTH,
    changeOrigin: true,
    pathRewrite: (_path, req) => req.originalUrl,
    on: {
      error: (err, _req, res) => {
        console.error('[Gateway→Auth] Error:', err.message);
        res.status(502).json({ error: 'Auth Service no disponible', detail: err.message });
      }
    }
  })
);

// ── Rutas del Admin Backend ────────────────────────────────────────────────────
app.use(
  '/api/v1/admin',
  createProxyMiddleware({
    target:      TARGETS.BACKEND,
    changeOrigin: true,
    pathRewrite: (_path, req) => req.originalUrl,
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[Gateway] Proxying to Backend: ${proxyReq.path}`);
    },
    on: {
      error: (err, _req, res) => {
        console.error('[Gateway→Backend] Error:', err.message);
        res.status(502).json({ error: 'Admin Backend no disponible', detail: err.message });
      }
    }
  })
);

// ── Frontend (catch-all → Nginx) ───────────────────────────────────────────────
app.use(
  '/',
  createProxyMiddleware({
    target:      TARGETS.FRONTEND,
    changeOrigin: true,
    on: {
      error: (err, req, res) => {
        console.error('[Gateway→Frontend] Error:', err.message);
        // Si es una petición de navegación (HTML) y no estamos ya en un bucle
        if (req.headers.accept && req.headers.accept.includes('text/html') && req.url !== '/') {
          return res.redirect('/');
        }
        res.status(503).json({ 
          error: 'Servicio temporalmente no disponible', 
          message: 'El sistema está iniciando, por favor intenta en unos segundos.' 
        });
      }
    }
  })
);

// ── Registro Eureka ────────────────────────────────────────────────────────────
const eurekaClient = new Eureka({
  instance: {
    app:      'ngac-gateway',
    hostName: 'ngac-gateway',
    ipAddr:   '127.0.0.1',
    port:     { $: PORT, '@enabled': true },
    vipAddress: 'ngac-gateway',
    dataCenterInfo: {
      '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
      name: 'MyOwn',
    },
    healthCheckUrl: `http://ngac-gateway:${PORT}/gateway/health`,
    statusPageUrl:  `http://ngac-gateway:${PORT}/gateway/health`,
  },
  eureka: {
    host:                 process.env.EUREKA_HOST || 'eureka',
    port:                 process.env.EUREKA_PORT || 9090,
    servicePath:          '/eureka/apps/',
    maxRetries:           15,
    requestRetryDelay:    3000,
    fetchRegistry:        false,
    registerWithEureka:   true,
  },
});

// ── Arranque ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[Gateway] En ejecución en http://0.0.0.0:${PORT}`);
  console.log(`[Gateway] Rutas:`);
  console.log(`  /api/v1/menu   → ${TARGETS.AUTH}`);
  console.log(`  /api/v1/admin  → ${TARGETS.BACKEND}`);
  console.log(`  /*             → ${TARGETS.FRONTEND}`);

  // Intentar registrar en Eureka (no crítico si falla)
  eurekaClient.start(err => {
    if (err) console.warn('[Gateway] Eureka no disponible:', err.message);
    else      console.log('[Gateway] Registrado en Eureka');
  });
});

// ── Apagado elegante ───────────────────────────────────────────────────────────
process.on('SIGINT', () => {
  console.log('[Gateway] Apagando...');
  eurekaClient.stop();
  process.exit(0);
});
