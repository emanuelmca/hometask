import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalendarLateral } from './calendar-lateral';

describe('CalendarLateral', () => {
  let component: CalendarLateral;
  let fixture: ComponentFixture<CalendarLateral>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalendarLateral]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CalendarLateral);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
