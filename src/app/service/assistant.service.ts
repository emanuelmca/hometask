import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Bubble {
    from: 'assistant' | 'user';
    text: string;
}

export interface Action {
    label: string;
    action: string;
    payload?: any;
}

export interface AssistantResponse {
    bubbles?: Bubble[];
    bullets?: string[];
    actions?: Action[];
    raw?: string;
    intencion?: string;
}

export interface AssistantRequest {
    mensaje: string;
    miembro_id: number;
    rol_id: number;
    historial?: { role: 'user' | 'assistant'; content: string }[];
}

@Injectable({
    providedIn: 'root'
})
export class AssistantService {
    private apiUrl = 'http://localhost:8000/assistant/agent';

    constructor(private http: HttpClient) { }

    sendMessage(request: AssistantRequest): Observable<AssistantResponse> {
        return this.http.post<AssistantResponse>(this.apiUrl, request);
    }
}
