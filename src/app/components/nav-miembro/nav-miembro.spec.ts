import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavMiembro } from './nav-miembro';

describe('NavMiembro', () => {
  let component: NavMiembro;
  let fixture: ComponentFixture<NavMiembro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavMiembro]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavMiembro);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
