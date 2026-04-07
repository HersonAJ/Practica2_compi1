import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArbolDerivacion } from './arbol-derivacion';

describe('ArbolDerivacion', () => {
  let component: ArbolDerivacion;
  let fixture: ComponentFixture<ArbolDerivacion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArbolDerivacion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArbolDerivacion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
