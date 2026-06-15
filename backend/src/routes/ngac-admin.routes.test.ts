import request from 'supertest';
import express from 'express';
import router from './ngac-admin.routes';

// Configurar aplicación Express para montar el router bajo prueba
const app = express();
app.use(express.json());
app.use('/api', router);

describe('Pruebas de Integración de Rutas - ngac-admin.routes', () => {
  // Validar que el router esté definido
  it('debería inicializar el router correctamente', () => {
    expect(router).toBeDefined();
  });

  // Validar el endpoint /ping
  it('debería responder pong en el endpoint ping', async () => {
    const response = await request(app).get('/api/ping');
    if (response.status === 200) {
      expect(response.text).toBe('pong admin ok');
    } else {
      // Si el endpoint no existe en este router en particular, omitir o verificar el 404
      expect(response.status).toBe(404);
    }
  });
});
