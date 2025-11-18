import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatFloatingComponent } from './chat-floating';



describe('ChatFloating', () => {
  let component: ChatFloatingComponent;
  let fixture: ComponentFixture<ChatFloatingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatFloatingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatFloatingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
