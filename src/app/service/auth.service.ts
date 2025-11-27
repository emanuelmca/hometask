import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userNameSource = new BehaviorSubject<string>('Invitado');
  currentUserName = this.userNameSource.asObservable();
  private apiUrl = 'http://127.0.0.1:8000/auth'; // Ajusta según tu backend

  constructor(private http: HttpClient, private router: Router) {
    const storedName = localStorage.getItem('nombre_usuario');
    if (storedName) {
      this.userNameSource.next(storedName);
    }
  }

  // ========== GESTIÓN DE USUARIO ==========
  setUserName(name: string) {
    localStorage.setItem('nombre_usuario', name);
    this.userNameSource.next(name);
  }

  getUserName(): string {
    return localStorage.getItem('nombre_usuario') || 'Invitado';
  }

  clearUserData() {
    localStorage.clear();
    this.userNameSource.next('Invitado');
    this.router.navigate(['/login']);
  }

  // ========== GESTIÓN DE TOKEN ==========
  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  setToken(token: string): void {
    localStorage.setItem('access_token', token);
  }

  removeToken(): void {
    localStorage.removeItem('access_token');
  }

  // ========== DECODIFICACIÓN Y EXPIRACIÓN ==========
  private decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch (e) {
      console.error("Error decoding token", e);
      return null;
    }
  }

  getExpirationDate(token: string): Date | null {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return null;
    const date = new Date(0);
    date.setUTCSeconds(decoded.exp);
    return date;
  }

  isTokenExpired(token: string): boolean {
    const date = this.getExpirationDate(token);
    if (!date) return true;
    return date.valueOf() < new Date().valueOf();
  }

  isTokenNearExpiration(token: string): boolean {
    const date = this.getExpirationDate(token);
    if (!date) return true;
    // Considerar "cerca" si faltan menos de 5 minutos
    const fiveMinutes = 5 * 60 * 1000;
    return date.valueOf() < (new Date().valueOf() + fiveMinutes);
  }

  // ========== REFRESCO DE TOKEN ==========
  refreshToken(): Observable<any> {
    const token = this.getToken();
    if (!token) {
      return throwError(() => new Error('No token available'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<any>(`${this.apiUrl}/refresh-token`, {}, { headers }).pipe(
      tap((response: any) => {
        if (response && response.access_token) {
          console.log('🔄 [AuthService] Token refrescado exitosamente.');
          this.setToken(response.access_token);
        }
      }),
      catchError((error) => {
        console.error('❌ [AuthService] Error al refrescar token:', error);
        this.clearUserData(); // Logout si falla el refresh
        return throwError(() => error);
      })
    );
  }
}
