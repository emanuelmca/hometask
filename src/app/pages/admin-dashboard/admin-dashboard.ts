import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { CalendarComponent } from '../../components/calendar/calendar';
import { NavComponent } from '../../components/nav/nav';
import { ChatFloatingComponent } from '../../components/chat-floating/chat-floating';
import { CalendarLateralComponent } from "../../components/calendar-lateral/calendar-lateral";


// -------------------------------------------------------------------
// 1. Interfaces para el tipado de datos
// -------------------------------------------------------------------

interface Rol {
  nombre: string;
  descripcion: string;
  id: number;
  estado: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

interface Miembro {
  nombre_completo: string;
  correo_electronico: string;
  id_rol: number;
  id_hogar: number;
  id: number;
  estado: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
  rol: Rol;
}

interface Tarea {
  titulo: string;
  descripcion: string;
  categoria: string;
  fecha_limite: string;
  repeticion: string;
  asignado_a: number;
  id_hogar: number;
  ubicacion: string | null;
  id_evento: number | null;
  id: number;
  estado: boolean;
  estado_actual: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  fecha_asignacion: string;
  tiempo_total_segundos: number | null;
  creado_por: number;
  comentarios: any[];
}

// -------------------------------------------------------------------
// 2. Componente principal
// -------------------------------------------------------------------

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    NgIf,
    HttpClientModule,
    CalendarComponent,
    NavComponent,
    ChatFloatingComponent,

  ],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})

export class AdminDashboard implements OnInit {

  // Dependencias inyectadas
  private http = inject(HttpClient);

  // Propiedades existentes
  cantidadMiembros: number | null = null;
  nombreHogar: string = '';
  idHogar = localStorage.getItem('id_hogar');
  eventos: { titulo: string, fecha_hora: string }[] = [];
  private baseUrl = 'http://127.0.0.1:8000';

  // -------------------------------------------------------------------
  // 👉 PROPIEDADES DE ESTADO
  // -------------------------------------------------------------------
  miembros: Miembro[] = [];
  totalMiembros: number | null = null;

  // 👉 NUEVA PROPIEDAD: Lista de tareas
  tareas: Tarea[] = [];

  // ----------------------------
  // Construir Headers con Token
  // ----------------------------
  private buildAuthHeaders(): HttpHeaders | null {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.warn("Token de autenticación no encontrado.");
      return null;
    }
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  // --------------------------------
  // Obtener cantidad de miembros (Endpoint existente)
  // --------------------------------
  cargarCantidadMiembros(): void {
    const headers = this.buildAuthHeaders();
    if (!headers || !this.idHogar) return;

    this.http.get<number>(`${this.baseUrl}/miembros/hogar/${this.idHogar}/cantidad`, { headers })
      .subscribe({
        next: (resp) => {
          this.cantidadMiembros = resp;
        },
        error: (err) => {
          console.error("❌ Error al obtener cantidad (endpoint antiguo):", err);
        }
      });
  }

  // --------------------------------
  // Obtener información del hogar
  // --------------------------------
  cargarNombreHogar(): void {
    const headers = this.buildAuthHeaders();
    if (!headers || !this.idHogar) return;

    this.http.get<any>(`${this.baseUrl}/hogares/${this.idHogar}`, { headers })
      .subscribe({
        next: (resp) => {
          this.nombreHogar = resp.nombre;
        },
        error: (err) => {
          console.error("❌ Error al obtener hogar:", err);
        }
      });
  }

  // --------------------------------
  // Cargar eventos del hogar
  // --------------------------------
  cargarEventos(): void {
    const headers = this.buildAuthHeaders();
    if (!headers || !this.idHogar) return;

    this.http.get<any[]>(`${this.baseUrl}/eventos/hogar/${this.idHogar}`, { headers })
      .subscribe({
        next: (resp) => {
          this.eventos = resp;
        },
        error: (err) => {
          console.error("❌ Error al obtener eventos:", err);
        }
      });
  }

  // -------------------------------------------------------------------
  // ✅ FUNCIÓN: Cargar lista de miembros y contar
  // -------------------------------------------------------------------
  cargarMiembros(): void {
    const headers = this.buildAuthHeaders();
    if (!headers || !this.idHogar) {
      console.warn("Token o ID de Hogar no disponible. No se cargarán los miembros.");
      this.totalMiembros = 0;
      return;
    }

    const url = `${this.baseUrl}/miembros/hogar/${this.idHogar}`;
    console.log(`Cargando miembros desde: ${url}`);

    this.http.get<Miembro[]>(url, { headers })
      .subscribe({
        next: (resp) => {
          this.miembros = resp;
          this.totalMiembros = resp.length;
          console.log(`Miembros cargados exitosamente. Total: ${this.totalMiembros}`);
        },
        error: (err) => {
          console.error("❌ Error al cargar la lista completa de miembros:", err);
          this.totalMiembros = 0;
        }
      });
  }

  // -------------------------------------------------------------------
  // 🆕 FUNCIÓN: Cargar tareas del hogar
  // -------------------------------------------------------------------
  cargarTareas(): void {
    const headers = this.buildAuthHeaders();
    if (!headers) {
      console.warn("Token no disponible. No se cargarán las tareas.");
      return;
    }

    const url = `${this.baseUrl}/tareas/hogar/todas`;
    console.log(`Cargando tareas desde: ${url}`);

    this.http.get<Tarea[]>(url, { headers })
      .subscribe({
        next: (resp) => {
          this.tareas = resp;
          console.log(`✅ Tareas cargadas exitosamente. Total: ${this.tareas.length}`);
        },
        error: (err) => {
          console.error("❌ Error al cargar las tareas:", err);
          this.tareas = []; // Lista vacía en caso de error
        }
      });
  }

  // --------------------------------
  // El que ya tenías
  // --------------------------------
  lloadMembers(): void {
    console.log("lloadMembers() fue llamado");
  }

  ngOnInit(): void {
    this.lloadMembers();
    this.cargarCantidadMiembros();
    this.cargarNombreHogar();
    this.cargarEventos();
    this.cargarMiembros();

    // 🆕 LLAMADA A LA FUNCIÓN DE TAREAS
    this.cargarTareas();
  }
}