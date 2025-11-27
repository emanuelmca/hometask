import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
    ConfigHogar,
    PreferenciasMiembro,
    ActualizarPerfil,
    ActualizarRol,
    ActualizarAsistente,
    Miembro
} from '../models/configuracion.models';

@Injectable({
    providedIn: 'root'
})
export class ConfiguracionService {
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

    /**
     * Obtiene la configuración del hogar actual
     * Auth: Bearer token
     */
    getConfigHogar(): Observable<ConfigHogar> {
        const headers = this.buildAuthHeaders();
        if (!headers) {
            throw new Error('No hay token de autenticación');
        }
        return this.http.get<ConfigHogar>(`${this.baseUrl}/configuracion/hogar`, { headers });
    }

    /**
     * Actualiza la configuración del hogar (solo admin)
     * @param payload Configuración completa del hogar
     */
    updateConfigHogar(payload: ConfigHogar): Observable<any> {
        const headers = this.buildAuthHeaders();
        if (!headers) {
            throw new Error('No hay token de autenticación');
        }
        return this.http.put(`${this.baseUrl}/configuracion/hogar`, payload, { headers });
    }

    /**
     * Actualiza solo la configuración del asistente (solo admin)
     * @param payload Configuración del asistente
     */
    updateAsistente(payload: ActualizarAsistente): Observable<any> {
        const headers = this.buildAuthHeaders();
        if (!headers) {
            throw new Error('No hay token de autenticación');
        }
        return this.http.put(`${this.baseUrl}/configuracion/asistente`, payload, { headers });
    }

    /**
     * Obtiene las preferencias de un miembro
     * @param miembroId ID del miembro
     */
    getPreferencias(miembroId: number): Observable<PreferenciasMiembro> {
        const headers = this.buildAuthHeaders();
        if (!headers) {
            throw new Error('No hay token de autenticación');
        }
        return this.http.get<PreferenciasMiembro>(
            `${this.baseUrl}/configuracion/miembro/${miembroId}/preferencias`,
            { headers }
        );
    }

    /**
     * Actualiza las preferencias de un miembro
     * @param miembroId ID del miembro
     * @param payload Preferencias a actualizar
     */
    updatePreferencias(miembroId: number, payload: PreferenciasMiembro): Observable<any> {
        const headers = this.buildAuthHeaders();
        if (!headers) {
            throw new Error('No hay token de autenticación');
        }
        return this.http.put(
            `${this.baseUrl}/configuracion/miembro/${miembroId}/preferencias`,
            payload,
            { headers }
        );
    }

    /**
     * Actualiza el perfil del usuario actual
     * @param payload Datos del perfil a actualizar
     */
    updateMiPerfil(payload: ActualizarPerfil): Observable<any> {
        const headers = this.buildAuthHeaders();
        if (!headers) {
            throw new Error('No hay token de autenticación');
        }
        return this.http.put(`${this.baseUrl}/configuracion/mi-perfil`, payload, { headers });
    }

    /**
     * Actualiza el rol de un miembro (solo admin)
     * @param miembroId ID del miembro
     * @param payload Nuevo rol
     */
    updateRol(miembroId: number, payload: ActualizarRol): Observable<any> {
        const headers = this.buildAuthHeaders();
        if (!headers) {
            throw new Error('No hay token de autenticación');
        }
        return this.http.put(
            `${this.baseUrl}/configuracion/miembro/${miembroId}/rol`,
            payload,
            { headers }
        );
    }

    /**
     * Obtiene la lista de miembros del hogar
     */
    getMiembrosHogar(): Observable<Miembro[]> {
        const headers = this.buildAuthHeaders();
        if (!headers) {
            throw new Error('No hay token de autenticación');
        }
        return this.http.get<Miembro[]>(`${this.baseUrl}/miembros/hogar`, { headers });
    }
}
