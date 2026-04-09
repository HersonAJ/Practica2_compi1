import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TablaSimbolos } from './tabla-simbolos';

describe('TablaSimbolos', () => {
  let component: TablaSimbolos;
  let fixture: ComponentFixture<TablaSimbolos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TablaSimbolos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TablaSimbolos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
