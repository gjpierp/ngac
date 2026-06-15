import { TestBed } from '@angular/core/testing';
import { GestionEntidadesComponent } from './gestion-entidades.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

describe('GestionEntidadesComponent', () => {
  // Configuración del módulo de pruebas de Angular (TestBed)
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionEntidadesComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialog, useValue: { open: () => ({ afterClosed: () => of(true) }) } },
        { provide: MatSnackBar, useValue: { open: () => {} } },
        provideAnimationsAsync()
      ]
    }).compileComponents();
  });

  // Validar que el componente se instancie correctamente
  it('debería crear el componente GestionEntidadesComponent', () => {
    const fixture = TestBed.createComponent(GestionEntidadesComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  // Validar la integración del DOM y el renderizado básico
  it('debería renderizar la vista del componente', () => {
    const fixture = TestBed.createComponent(GestionEntidadesComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled).toBeDefined();
  });
});
