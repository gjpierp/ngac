import { TestBed } from '@angular/core/testing';
import { TimeTravelDrawerComponent } from './time-travel-drawer.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

describe('TimeTravelDrawerComponent', () => {
  // Configuración del módulo de pruebas de Angular (TestBed)
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeTravelDrawerComponent],
      providers: [
        provideAnimationsAsync()
      ]
    }).compileComponents();
  });

  // Validar que el componente se instancie correctamente
  it('debería crear el componente TimeTravelDrawerComponent', () => {
    const fixture = TestBed.createComponent(TimeTravelDrawerComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  // Validar la integración del DOM y el renderizado básico
  it('debería renderizar la vista del componente', () => {
    const fixture = TestBed.createComponent(TimeTravelDrawerComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled).toBeDefined();
  });
});
