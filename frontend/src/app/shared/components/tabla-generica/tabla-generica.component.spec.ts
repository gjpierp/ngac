import { TestBed } from '@angular/core/testing';
import { TablaGenericaComponent } from './tabla-generica.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

describe('TablaGenericaComponent', () => {
  // Configuración del módulo de pruebas de Angular (TestBed)
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TablaGenericaComponent],
      providers: [
        provideAnimationsAsync()
      ]
    }).compileComponents();
  });

  // Validar que el componente se instancie correctamente
  it('debería crear el componente TablaGenericaComponent', () => {
    const fixture = TestBed.createComponent(TablaGenericaComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  // Validar la integración del DOM y el renderizado básico
  it('debería renderizar la vista del componente', () => {
    const fixture = TestBed.createComponent(TablaGenericaComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled).toBeDefined();
  });
});
