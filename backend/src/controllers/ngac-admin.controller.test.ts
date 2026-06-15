import { Request, Response } from 'express';
import { AdminController } from './ngac-admin.controller';
import { NgacAdminService } from '../services/ngac-admin.service';

// Mockear el servicio NgacAdminService para evitar llamadas a la base de datos real
jest.mock('../services/ngac-admin.service');

describe('Pruebas Unitarias del Controlador - ngac-admin.controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {};
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
  });

  // Verificar la existencia de las funciones del controlador
  it('debería tener el controlador definido con sus métodos clave', () => {
    expect(AdminController).toBeDefined();
    expect(AdminController.getRolesPorNodo).toBeDefined();
  });

  // Prueba unitaria aislada mockeando el servicio
  it('debería invocar getRolesPorNodo y retornar el resultado en formato JSON', async () => {
    req.query = { id: '42' };
    (NgacAdminService.getRolesPorNodo as jest.Mock).mockResolvedValue(['ROL_MEDICO']);

    await AdminController.getRolesPorNodo(req as Request, res as Response);

    expect(NgacAdminService.getRolesPorNodo).toHaveBeenCalledWith(42);
    expect(res.json).toHaveBeenCalledWith(['ROL_MEDICO']);
  });
});
