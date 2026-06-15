import { AccNodo } from './ngac-admin.models';

describe('Pruebas de Modelos y Tipos - ngac-admin.models', () => {
  // Validar estructura de tipos
  it('debería crear un objeto que satisfaga la interfaz AccNodo', () => {
    const nodo: AccNodo = {
      id_nodo: 10,
      codigo_tecnico: 'ROL_TEST',
      etiqueta: 'Rol de Test',
      activo: 'S',
    };
    expect(nodo.id_nodo).toBe(10);
    expect(nodo.codigo_tecnico).toBe('ROL_TEST');
  });
});
