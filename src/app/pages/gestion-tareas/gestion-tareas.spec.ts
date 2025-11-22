import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionTareas } from './gestion-tareas';

describe('GestionTareas', () => {
  let component: GestionTareas;
  let fixture: ComponentFixture<GestionTareas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionTareas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionTareas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
