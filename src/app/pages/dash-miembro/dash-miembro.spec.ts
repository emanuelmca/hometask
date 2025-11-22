import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashMiembro } from './dash-miembro';

describe('DashMiembro', () => {
  let component: DashMiembro;
  let fixture: ComponentFixture<DashMiembro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashMiembro]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashMiembro);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
