import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interfaces
export interface TaskDetail {
  id: number;
  titulo: string;
  descripcion: string;
  categoria: string;
  fecha_limite: string;
  repeticion: string;
  asignado_a: number;
  id_hogar: number;
  estado: boolean;
  estado_actual: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  tiempo_total_segundos: number | null;
  creado_por: number;
  comentarios: any[];
}

export interface MyTask {
  id: number;
  titulo: string;
  descripcion: string;
  estado_actual: string;
  fecha_limite: string;
  categoria: string;
  asignado_a: number;
  tiempo_total_segundos?: number;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
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

  // Obtener detalles de una tarea por ID
  getTaskById(id: number): Observable<TaskDetail> {
    const headers = this.buildAuthHeaders();
    if (!headers) {
      throw new Error('No hay token de autenticación');
    }
    return this.http.get<TaskDetail>(`${this.baseUrl}/tareas/${id}`, { headers });
  }

  // Obtener mis tareas asignadas
  getMyTasks(): Observable<MyTask[]> {
    const headers = this.buildAuthHeaders();
    if (!headers) {
      throw new Error('No hay token de autenticación');
    }
    return this.http.get<MyTask[]>(`${this.baseUrl}/tareas/mias`, { headers });
  }

  // Obtener mis tareas con detalle de tiempo
  getMyTasksWithTimeDetail(): Observable<any[]> {
    const headers = this.buildAuthHeaders();
    if (!headers) {
      throw new Error('No hay token de autenticación');
    }
    return this.http.get<any[]>(`${this.baseUrl}/tareas/mias/detalle-tiempo`, { headers });
  }

  // Cambiar estado de tarea
  updateTaskStatus(taskId: number, estado: string): Observable<TaskDetail> {
    const headers = this.buildAuthHeaders();
    if (!headers) {
      throw new Error('No hay token de autenticación');
    }
    return this.http.put<TaskDetail>(
      `${this.baseUrl}/tareas/${taskId}/estado`,
      { estado: estado },
      { headers }
    );
  }
}
