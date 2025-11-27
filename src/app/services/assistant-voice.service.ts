import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RespuestaVoz {
    texto_usuario: string;
    respuesta_texto: string;
    respuesta_ia: any;
    audio_base64?: string;
    mime_type?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AssistantVoiceService {
    private apiUrl = 'http://localhost:8000/assistant';

    constructor(private http: HttpClient) { }

    /**
     * Envía el audio grabado al backend junto con el token de autenticación
     * @param blob - Blob del audio grabado
     * @param token - Token de autenticación Bearer
     * @param historial - Historial opcional de conversación
     * @returns Observable con la respuesta del asistente
     */
    enviarAudio(blob: Blob, token: string, historial?: any): Observable<RespuestaVoz> {
        console.log('📡 [AssistantService] Preparando petición HTTP...');
        const formData = new FormData();

        // Añadir el archivo de audio
        formData.append('audio', blob, 'grabacion.webm');
        console.log(`📦 [AssistantService] Audio adjuntado. Tamaño: ${blob.size}, Tipo: ${blob.type}`);

        // Si hay historial, añadirlo como JSON string
        if (historial) {
            formData.append('historial', JSON.stringify(historial));
            console.log('📜 [AssistantService] Historial adjuntado.');
        }

        // Headers con autorización
        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });
        console.log('🔑 [AssistantService] Headers configurados (Auth Bearer).');

        const url = `${this.apiUrl}/voz`;
        console.log(`🌐 [AssistantService] Enviando POST a: ${url}`);

        return this.http.post<RespuestaVoz>(
            url,
            formData,
            { headers }
        );
    }
}
