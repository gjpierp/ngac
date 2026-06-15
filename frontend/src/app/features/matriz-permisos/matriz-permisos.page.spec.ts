import { TestBed } from '@angular/core/testing';
import { PaginaMatrizPermisos } from './matriz-permisos.page';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

describe('PaginaMatrizPermisos', () => {
  // Configuración del módulo de pruebas de Angular (TestBed)
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginaMatrizPermisos],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatSnackBar, useValue: { open: () => {} } },
        provideAnimationsAsync()
      ]
    }).compileComponents();
  });

  // Validar que el componente se instancie correctamente
  it('debería crear el componente PaginaMatrizPermisos', () => {
    const fixture = TestBed.createComponent(PaginaMatrizPermisos);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  // Validar la integración del DOM y el renderizado básico
  it('debería renderizar la vista del componente', () => {
    const fixture = TestBed.createComponent(PaginaMatrizPermisos);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled).toBeDefined();
  });
});
