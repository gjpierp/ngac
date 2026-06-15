import { TestBed } from '@angular/core/testing';
import { MatrizPermisosComponent } from './matriz-permisos.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

describe('MatrizPermisosComponent', () => {
  // Configuración del módulo de pruebas de Angular (TestBed)
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatrizPermisosComponent],
      providers: [
        provideAnimationsAsync()
      ]
    }).compileComponents();
  });

  // Validar que el componente se instancie correctamente
  it('debería crear el componente MatrizPermisosComponent', () => {
    const fixture = TestBed.createComponent(MatrizPermisosComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  // Validar la integración del DOM y el renderizado básico
  it('debería renderizar la vista del componente', () => {
    const fixture = TestBed.createComponent(MatrizPermisosComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled).toBeDefined();
  });
});
