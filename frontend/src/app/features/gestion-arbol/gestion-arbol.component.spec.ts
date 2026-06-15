import { TestBed } from '@angular/core/testing';
import { GestionArbolComponent } from './gestion-arbol.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

describe('GestionArbolComponent', () => {
  // Configuración del módulo de pruebas de Angular (TestBed)
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionArbolComponent],
      providers: [
        provideAnimationsAsync()
      ]
    }).compileComponents();
  });

  // Validar que el componente se instancie correctamente
  it('debería crear el componente GestionArbolComponent', () => {
    const fixture = TestBed.createComponent(GestionArbolComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  // Validar la integración del DOM y el renderizado básico
  it('debería renderizar la vista del componente', () => {
    const fixture = TestBed.createComponent(GestionArbolComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled).toBeDefined();
  });
});
