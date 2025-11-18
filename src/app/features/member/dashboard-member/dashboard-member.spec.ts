import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardMember } from './dashboard-member';

describe('DashboardMember', () => {
  let component: DashboardMember;
  let fixture: ComponentFixture<DashboardMember>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardMember]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardMember);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
