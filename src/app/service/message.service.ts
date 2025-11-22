import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interfaces
export interface Message {
    id: number;
    id_remitente: number;
    id_destinatario: number;
    contenido: string;
    imagen_url?: string;
    fecha_envio: string;
    leido: boolean;
    remitente: {
        id: number;
        nombre_completo: string;
    };
    destinatario: {
        id: number;
        nombre_completo: string;
    };
}

@Injectable({
    providedIn: 'root'
})
export class MessageService {
    private baseUrl = 'http://127.0.0.1:8000';

    constructor(private http: HttpClient) { }

    // Headers de autenticación
    private buildAuthHeaders(): HttpHeaders | null {
        const token = localStorage.getItem('access_token');
        if (!token) {
            console.error('❌ No hay token en localStorage');
            return null;
        }
        return new HttpHeaders({
            Authorization: `Bearer ${token}`
        });
    }

    // Obtener conversación con un miembro (endpoint correcto)
    getConversation(memberId: number): Observable<Message[]> {
        const headers = this.buildAuthHeaders();
        if (!headers) {
            throw new Error('No hay token de autenticación');
        }
        return this.http.get<Message[]>(`${this.baseUrl}/mensajes/directo/${memberId}`, { headers });
    }

    // Enviar mensaje (endpoint correcto con id_hogar y contenido)
    sendMessage(receiverId: number, contenido: string, image?: File): Observable<Message> {
        const token = localStorage.getItem('access_token');
        const idHogar = localStorage.getItem('id_hogar');

        if (!token || !idHogar) {
            throw new Error('No hay token de autenticación o id_hogar');
        }

        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        });

        // Si hay imagen, usar FormData
        if (image) {
            const formData = new FormData();
            formData.append('id_hogar', idHogar);
            formData.append('contenido', contenido);
            formData.append('imagen', image, image.name);

            const headersMultipart = new HttpHeaders({
                Authorization: `Bearer ${token}`
            });

            return this.http.post<Message>(
                `${this.baseUrl}/mensajes/directo/${receiverId}`,
                formData,
                { headers: headersMultipart }
            );
        }

        // Sin imagen, usar JSON
        return this.http.post<Message>(
            `${this.baseUrl}/mensajes/directo/${receiverId}`,
            {
                id_hogar: parseInt(idHogar),
                contenido: contenido
            },
            { headers }
        );
    }
}
