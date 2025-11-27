import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { VoiceAssistantComponent } from './components/voice-assistant/voice-assistant.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, VoiceAssistantComponent],
  template: `
    <router-outlet></router-outlet>
    <app-voice-assistant></app-voice-assistant>
  `,
  styles: [`
    :host {
      display: block;
      position: relative;
    }
  `]
})
export class AppComponent { }
