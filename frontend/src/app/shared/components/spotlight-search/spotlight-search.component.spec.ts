import { TestBed } from '@angular/core/testing';
import { SpotlightSearchComponent } from './spotlight-search.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

describe('SpotlightSearchComponent', () => {
  // Configuración del módulo de pruebas de Angular (TestBed)
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpotlightSearchComponent],
      providers: [
        provideAnimationsAsync()
      ]
    }).compileComponents();
  });

  // Validar que el componente se instancie correctamente
  it('debería crear el componente SpotlightSearchComponent', () => {
    const fixture = TestBed.createComponent(SpotlightSearchComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  // Validar la integración del DOM y el renderizado básico
  it('debería renderizar la vista del componente', () => {
    const fixture = TestBed.createComponent(SpotlightSearchComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled).toBeDefined();
  });
});
