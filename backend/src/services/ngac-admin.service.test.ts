import { NgacAdminService } from './ngac-admin.service';
import { NgacGraphManager } from '../security/application/services/NgacGraphManager';

// Mockear el gestor de grafos para validar la resolución de carpetas raíz en memoria
jest.mock('../security/application/services/NgacGraphManager');

describe('Pruebas Unitarias del Servicio - ngac-admin.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Verificar la existencia del servicio
  it('debería tener el servicio definido con sus métodos raíz', () => {
    expect(NgacAdminService).toBeDefined();
    expect(NgacAdminService.getCarpetasRaiz).toBeDefined();
  });

  // Validar lógica de carpetas raíz en memoria
  it('debería devolver carpetas raíz desde el gestor de grafos en memoria sin tocar base de datos', async () => {
    const mockGraphInstance = {
      initialize: jest.fn(),
      policyMenuRoots: new Map([[1, new Set([1001])]]),
      menuNodes: new Map([[1001, { idNode: 6, label: 'Historiales', description: 'Menu Historial', active: true, displayOrder: 1 }]]),
      menuChildToParents: new Map(),
      menuParentToChildren: new Map(),
    };

    (NgacGraphManager.getInstance as jest.Mock).mockReturnValue(mockGraphInstance);

    const result = await NgacAdminService.getCarpetasRaiz(1);
    expect(result).toEqual([
      { id: 6, nombre: 'Historiales', descripcion: 'Menu Historial', tieneHijos: false }
    ]);
  });
});
