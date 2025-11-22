import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interfaces
export interface Comment {
    id: number;
    id_tarea: number;
    id_miembro: number;
    texto: string;
    imagen_url?: string;
    fecha_creacion: string;
    miembro: {
        id: number;
        nombre_completo: string;
    };
}

@Injectable({
    providedIn: 'root'
})
export class CommentService {
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

    // Obtener comentarios de una tarea
    getComments(taskId: number): Observable<Comment[]> {
        const headers = this.buildAuthHeaders();
        if (!headers) {
            throw new Error('No hay token de autenticación');
        }
        return this.http.get<Comment[]>(`${this.baseUrl}/tareas/${taskId}/comentarios`, { headers });
    }

    // Publicar comentario con texto e imagen opcional
    postComment(taskId: number, text: string, image?: File): Observable<Comment> {
        const token = localStorage.getItem('access_token');
        if (!token) {
            throw new Error('No hay token de autenticación');
        }

        const formData = new FormData();
        formData.append('texto', text);

        if (image) {
            formData.append('imagen', image, image.name);
        }

        // Para FormData, no establecemos Content-Type, el navegador lo hace automáticamente
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`
        });

        return this.http.post<Comment>(
            `${this.baseUrl}/tareas/${taskId}/comentarios`,
            formData,
            { headers }
        );
    }

    // Actualizar comentario
    updateComment(taskId: number, commentId: number, text: string): Observable<Comment> {
        const headers = this.buildAuthHeaders();
        if (!headers) {
            throw new Error('No hay token de autenticación');
        }

        return this.http.put<Comment>(
            `${this.baseUrl}/tareas/${taskId}/comentarios/${commentId}`,
            { texto: text },
            { headers }
        );
    }
}
