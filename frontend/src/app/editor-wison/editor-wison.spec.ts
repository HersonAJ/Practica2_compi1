import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditorWison } from './editor-wison';

describe('EditorWison', () => {
  let component: EditorWison;
  let fixture: ComponentFixture<EditorWison>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditorWison]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditorWison);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
