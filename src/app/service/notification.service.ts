import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Notification {
    id: number;
    id_miembro: number;
    tipo: string;
    mensaje: string;
    leida: boolean;
    fecha_creacion: string;
    datos_adicionales?: any;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
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

    // Obtener mis notificaciones
    getMyNotifications(): Observable<Notification[]> {
        const headers = this.buildAuthHeaders();
        if (!headers) {
            throw new Error('No hay token de autenticación');
        }
        return this.http.get<Notification[]>(`${this.baseUrl}/notificaciones/mias`, { headers });
    }

    // Marcar notificación como leída
    markAsRead(notificationId: number): Observable<Notification> {
        const headers = this.buildAuthHeaders();
        if (!headers) {
            throw new Error('No hay token de autenticación');
        }
        return this.http.put<Notification>(
            `${this.baseUrl}/notificaciones/${notificationId}/leer`,
            {},
            { headers }
        );
    }
}
