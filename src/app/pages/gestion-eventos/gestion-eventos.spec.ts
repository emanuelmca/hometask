import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionEventos } from './gestion-eventos';

describe('GestionEventos', () => {
  let component: GestionEventos;
  let fixture: ComponentFixture<GestionEventos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionEventos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionEventos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
