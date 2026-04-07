import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalizadorCadena } from './analizador-cadena';

describe('AnalizadorCadena', () => {
  let component: AnalizadorCadena;
  let fixture: ComponentFixture<AnalizadorCadena>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalizadorCadena]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnalizadorCadena);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
