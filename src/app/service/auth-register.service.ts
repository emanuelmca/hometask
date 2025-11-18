import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RegistroRequest {
  nombre_completo: string;
  correo_electronico: string;
  contrasena: string;
  id_rol: number;
  id_hogar: number;
}

export interface RegistroResponse {
  access_token: string;
  token_type: string;
  id_miembro: number;
  id_hogar: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthRegisterService {

  private http = inject(HttpClient);
  private apiUrl = 'http://127.0.0.1:8000/auth';

  registrar(data: RegistroRequest): Observable<RegistroResponse> {
    return this.http.post<RegistroResponse>(`${this.apiUrl}/registro`, data);
  }
}
