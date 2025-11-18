import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat-floating',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-floating.html',
  styleUrls: ['./chat-floating.css']
})
export class ChatFloatingComponent {
  isOpen = false;
  message = '';
  messages: { from: 'me' | 'other', text: string }[] = [
    { from: 'other', text: 'Hola 👋' },
    { from: 'me', text: '¡Hola! ¿En qué te ayudo?' }
  ];

  toggleChat() {
    this.isOpen = !this.isOpen;
  }

  send() {
    const text = this.message?.trim();
    if (!text) return;
    this.messages.push({ from: 'me', text });
    this.message = '';
    // Simula respuesta automática (opcional)
    setTimeout(() => {
      this.messages.push({ from: 'other', text: 'Recibido — gracias.' });
    }, 700);
    // Si quieres enviar al backend, aquí haces la llamada HTTP / websocket
  }
}
