import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaAnalizadores } from './lista-analizadores';

describe('ListaAnalizadores', () => {
  let component: ListaAnalizadores;
  let fixture: ComponentFixture<ListaAnalizadores>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaAnalizadores]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListaAnalizadores);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
