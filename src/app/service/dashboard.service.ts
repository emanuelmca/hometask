import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    private baseUrl = 'http://127.0.0.1:8000';

    constructor(private http: HttpClient) { }

    private getHeaders(): HttpHeaders | null {
        const token = localStorage.getItem('access_token');
        if (!token) {
            console.error('❌ No hay token en localStorage');
            return null;
        }
        return new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });
    }

    // Obtener miembros del hogar
    getMiembrosHogar(idHogar: number): Observable<any> {
        const headers = this.getHeaders();
        if (!headers) {
            throw new Error('No hay token de autenticación');
        }
        return this.http.get(`${this.baseUrl}/miembros/hogar/${idHogar}`, { headers });
    }

    // Obtener tareas del miembro
    getMisTareas(): Observable<any> {
        const headers = this.getHeaders();
        if (!headers) {
            throw new Error('No hay token de autenticación');
        }
        return this.http.get(`${this.baseUrl}/tareas/mias/`, { headers });
    }

    // Obtener eventos activos del hogar
    getEventosActivos(): Observable<any> {
        const headers = this.getHeaders();
        if (!headers) {
            throw new Error('No hay token de autenticación');
        }
        return this.http.get(`${this.baseUrl}/eventos/hogar/activos`, { headers });
    }

    // Obtener todas las tareas del hogar
    getTareasHogar(): Observable<any> {
        const headers = this.getHeaders();
        if (!headers) {
            throw new Error('No hay token de autenticación');
        }
        return this.http.get(`${this.baseUrl}/tareas/hogar/todas`, { headers });
    }

    // Obtener tareas en proceso
    getTareasEnProceso(): Observable<any> {
        const headers = this.getHeaders();
        if (!headers) {
            throw new Error('No hay token de autenticación');
        }
        return this.http.get(`${this.baseUrl}/tareas/en-proceso`, { headers });
    }

    // Obtener detalles de una tarea específica
    getTareaDetalle(tareaId: number): Observable<any> {
        const headers = this.getHeaders();
        if (!headers) {
            throw new Error('No hay token de autenticación');
        }
        return this.http.get(`${this.baseUrl}/tareas/${tareaId}`, { headers });
    }

    // Obtener tareas de un evento
    getTareasEvento(eventoId: number): Observable<any> {
        const headers = this.getHeaders();
        if (!headers) {
            throw new Error('No hay token de autenticación');
        }
        return this.http.get(`${this.baseUrl}/tareas/evento/${eventoId}`, { headers });
    }

    // Obtener tareas pendientes de un evento
    getTareasPendientesEvento(eventoId: number): Observable<any> {
        const headers = this.getHeaders();
        if (!headers) {
            throw new Error('No hay token de autenticación');
        }
        return this.http.get(`${this.baseUrl}/eventos/${eventoId}/tareas/pendientes`, { headers });
    }

    // Obtener tareas completadas de un evento
    getTareasCompletadasEvento(eventoId: number): Observable<any> {
        const headers = this.getHeaders();
        if (!headers) {
            throw new Error('No hay token de autenticación');
        }
        return this.http.get(`${this.baseUrl}/eventos/${eventoId}/tareas/completadas`, { headers });
    }

    // Obtener eventos actuales del hogar
    getEventosActuales(): Observable<any> {
        const headers = this.getHeaders();
        if (!headers) {
            throw new Error('No hay token de autenticación');
        }
        return this.http.get(`${this.baseUrl}/eventos/hogar/actuales`, { headers });
    }
}
