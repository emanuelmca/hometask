import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AssistantService, Bubble, Action, AssistantResponse } from '../../service/assistant.service';
import { Location } from '@angular/common';

interface ChatMessage {
    type: 'bubble' | 'bullets' | 'actions';
    content?: any;
    from?: 'assistant' | 'user';
}

@Component({
    selector: 'app-assistant-chat',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './assistant-chat.html',
    styleUrls: ['./assistant-chat.css']
})
export class AssistantChatComponent implements OnInit, AfterViewChecked {
    @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

    messages: ChatMessage[] = [];
    newMessage: string = '';
    loading: boolean = false;

    // Auth info
    miembroId: number = 0;
    rolId: number = 0;

    // History for context
    historial: { role: 'user' | 'assistant'; content: string }[] = [];

    constructor(
        private assistantService: AssistantService,
        private router: Router,
        private location: Location
    ) { }

    ngOnInit() {
        // Get auth info from localStorage
        const miembroIdStr = localStorage.getItem('id_miembro');
        const rolIdStr = localStorage.getItem('rol_usuario');

        this.miembroId = miembroIdStr ? parseInt(miembroIdStr) : 0;
        this.rolId = rolIdStr && !isNaN(Number(rolIdStr)) ? parseInt(rolIdStr) : 2;

        // Initial greeting
        const greeting = '¡Hola! Soy tu asistente de gestión del hogar. Estoy aquí para ayudarte a organizar tareas, coordinar con miembros y mucho más. ¿En qué puedo ayudarte hoy?';
        this.pushBubble('assistant', greeting);
        this.historial.push({ role: 'assistant', content: greeting });
    }

    ngAfterViewChecked() {
        this.scrollToBottom();
    }

    scrollToBottom(): void {
        try {
            this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
        } catch (err) { }
    }

    goBack() {
        this.location.back();
    }

    pushBubble(from: 'assistant' | 'user', text: string) {
        this.messages.push({ type: 'bubble', from, content: text });
    }

    sendMessage() {
        if (!this.newMessage.trim()) return;

        const text = this.newMessage;
        this.newMessage = '';

        this.pushBubble('user', text);
        this.historial.push({ role: 'user', content: text });
        this.loading = true;

        this.assistantService.sendMessage({
            mensaje: text,
            miembro_id: this.miembroId,
            rol_id: this.rolId,
            historial: this.historial.slice(-4)
        }).subscribe({
            next: (response) => {
                this.loading = false;
                this.processResponse(response);

                if (response.raw) {
                    this.historial.push({ role: 'assistant', content: response.raw });
                } else if (response.bubbles && response.bubbles.length > 0) {
                    const combinedText = response.bubbles.map(b => b.text).join('\n');
                    this.historial.push({ role: 'assistant', content: combinedText });
                }
            },
            error: (err) => {
                this.loading = false;
                console.error('Error sending message:', err);
                this.pushBubble('assistant', 'Lo siento, hubo un error al procesar tu solicitud.');
            }
        });
    }

    processResponse(response: AssistantResponse) {
        // Check if we have a single unstructured bubble that needs parsing
        const isUnstructured = (!response.bullets || response.bullets.length === 0) &&
            (!response.actions || response.actions.length === 0) &&
            response.bubbles && response.bubbles.length === 1 &&
            (response.bubbles[0].text.includes('\n-') || response.bubbles[0].text.includes('\n•'));

        if (isUnstructured && response.bubbles) {
            this.parseAndRenderText(response.bubbles[0].text);
        } else {
            // Render structured response as is
            if (response.bubbles) {
                response.bubbles.forEach((bubble: Bubble) => {
                    this.pushBubble(bubble.from, bubble.text);
                });
            }

            if (response.bullets && response.bullets.length > 0) {
                this.messages.push({ type: 'bullets', from: 'assistant', content: response.bullets });
            }

            if (response.actions && response.actions.length > 0) {
                this.messages.push({ type: 'actions', from: 'assistant', content: response.actions });
            }
        }
    }

    parseAndRenderText(text: string) {
        const lines = text.split('\n');
        const introLines: string[] = [];
        const bulletLines: string[] = [];
        let foundList = false;

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ') || /^\d+\.\s/.test(trimmed)) {
                foundList = true;
                bulletLines.push(trimmed.replace(/^[-*•]|\d+\.\s/, '').trim());
            } else {
                if (foundList && !trimmed) continue;
                if (!foundList) {
                    introLines.push(line);
                }
            }
        }

        if (introLines.length > 0) {
            this.pushBubble('assistant', introLines.join('\n').trim());
        }

        if (bulletLines.length > 0) {
            this.messages.push({ type: 'bullets', from: 'assistant', content: bulletLines });
        }
    }

    handleAction(action: Action) {
        console.log('Handling action:', action);

        switch (action.action) {
            case 'ver_tareas':
                this.router.navigate(['/tasks'], { queryParams: action.payload });
                return;
            case 'ver_calendario':
                this.router.navigate(['/events']);
                return;
            case 'ver_comentarios':
                if (action.payload?.task_id) {
                    this.router.navigate(['/task-detail', action.payload.task_id]);
                } else {
                    this.router.navigate(['/tasks']);
                }
                return;
            case 'ver_mensajes':
                this.router.navigate(['/messages/0']);
                return;
            case 'crear_tarea':
            case 'crear_tarea_limpieza':
                this.router.navigate(['/tasks'], { queryParams: { create: true, ...action.payload } });
                return;
        }

        const mensaje = `Accion: ${action.label}`;
        const hist = [...this.historial, { role: 'user' as const, content: `Botón: ${action.label} payload=${JSON.stringify(action.payload || {})}` }];

        this.loading = true;
        this.assistantService.sendMessage({
            mensaje,
            miembro_id: this.miembroId,
            rol_id: this.rolId,
            historial: hist.slice(-4),
        }).subscribe({
            next: (resp) => {
                this.loading = false;
                this.processResponse(resp);
                if (resp.raw) this.historial.push({ role: 'assistant', content: resp.raw });
            },
            error: () => {
                this.loading = false;
                this.pushBubble('assistant', 'No pude procesar la acción. Intenta de nuevo.');
            }
        });
    }
}
