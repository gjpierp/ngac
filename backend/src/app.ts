import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import adminRoutes from './routes/ngac-admin.routes';
import { AdminController } from './controllers/ngac-admin.controller';
import { eurekaClient, isEurekaEnabled } from './config/eureka.config';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3205;

app.use(cors());
app.use(express.json());

// Log de depuración para ver qué rutas llegan al backend
app.use((req, res, next) => {
    console.log(`[Backend Debug] ${req.method} ${req.originalUrl} -> ${req.url}`);
    next();
});

// Registro de Rutas
app.get('/api/v1/admin/sec/roles-by-node', AdminController.getRolesPorNodo);
app.get('/api/v1/admin/ping', (req, res) => res.send("pong admin ok"));

app.get('/api/v1/admin/debug/routes', (req, res) => {
    res.json({
        status: 'OK',
        time: new Date().toISOString(),
        message: 'Si ves esto, el backend está cargando el código correctamente',
        expected_routes: [
            '/api/v1/admin/sec/roles-by-node',
            '/api/v1/admin/ping'
        ]
    });
});

app.use('/api/v1/admin', adminRoutes);

// Manejo de errores global (middleware básico)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[App Error]', err.stack);
    res.status(500).json({ error: 'Ocurrió un error inesperado', detail: err.message });
});

app.listen(PORT, () => {
    console.log(">>> ADMIN BACKEND RESTART OK - ROUTES UPDATED [" + new Date().toISOString() + "]");
    console.log(`NGAC Admin Backend en ejecución en http://localhost:${PORT}`);
    
    // Iniciar cliente Eureka
    if (isEurekaEnabled) {
        eurekaClient.start((error: any) => {
            if (error) {
                console.error('[Eureka] Error al registrar:', error);
            } else {
                console.log('[Eureka] Registrado exitosamente');
            }
        });
    } else {
        console.log('[Eureka] Deshabilitado para desarrollo local (no se detectó host de Eureka)');
    }

    console.log(`Endpoints configurados:`);
    console.log(`- GET    /api/v1/admin/tree`);
    console.log(`- POST   /api/v1/admin/tree/simulate`);
    console.log(`- GET    /api/v1/admin/dashboard/stats`);
    console.log(`- GET    /api/v1/admin/roles`);
    console.log(`- POST   /api/v1/admin/roles`);
    console.log(`- DELETE /api/v1/admin/roles/:id`);
    console.log(`- GET    /api/v1/admin/nodos`);
    console.log(`- POST   /api/v1/admin/nodos`);
    console.log(`- DELETE /api/v1/admin/nodos/:codigo`);
    console.log(`- GET    /api/v1/admin/tipos-nodo`);
    console.log(`- POST   /api/v1/admin/tipos-nodo`);
    console.log(`- DELETE /api/v1/admin/tipos-nodo/:codigo`);
    console.log(`- GET    /api/v1/admin/enlaces`);
    console.log(`- POST   /api/v1/admin/enlaces`);
    console.log(`- DELETE /api/v1/admin/enlaces/:padre/:hijo`);
    console.log(`- GET    /api/v1/admin/permisos`);
    console.log(`- POST   /api/v1/admin/permisos`);
    console.log(`- POST   /api/v1/admin/permisos/denegar`);
    console.log(`- DELETE /api/v1/admin/permisos`);
    console.log(`- GET    /api/v1/admin/operaciones`);
    console.log(`- POST   /api/v1/admin/operaciones`);
    console.log(`- DELETE /api/v1/admin/operaciones/:nombre`);
    console.log(`- GET    /api/v1/admin/logs`);
    console.log(`- DELETE /api/v1/admin/logs`);
});

// Manejo de apagado elegante
process.on('SIGINT', () => {
    console.log('[Backend] Apagando...');
    if (isEurekaEnabled) {
        eurekaClient.stop(() => {
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
});
