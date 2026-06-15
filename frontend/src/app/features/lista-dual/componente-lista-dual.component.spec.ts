import { TestBed } from '@angular/core/testing';
import { ComponenteListaDual } from './componente-lista-dual.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

describe('ComponenteListaDual', () => {
  // Configuración del módulo de pruebas de Angular (TestBed)
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComponenteListaDual],
      providers: [
        provideAnimationsAsync()
      ]
    }).compileComponents();
  });

  // Validar que el componente se instancie correctamente
  it('debería crear el componente ComponenteListaDual', () => {
    const fixture = TestBed.createComponent(ComponenteListaDual);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  // Validar la integración del DOM y el renderizado básico
  it('debería renderizar la vista del componente', () => {
    const fixture = TestBed.createComponent(ComponenteListaDual);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled).toBeDefined();
  });
});
