import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './calendar.html',
  styleUrls: ['./calendar.css']
})
export class CalendarComponent {

  // Datos del calendario
  currentDate = new Date();
  month = this.currentDate.getMonth();
  year = this.currentDate.getFullYear();
  
  dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  monthName = '';

  calendarDays: (number | null)[] = [];

  // Eventos cargados desde API
  eventos: any[] = [];

  private baseUrl = 'http://127.0.0.1:8000';
  private idHogar = localStorage.getItem('id_hogar');

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.monthName = this.getMonthName(this.month);
    this.generarCalendario();
    this.cargarEventos();
  }

  private buildAuthHeaders(): HttpHeaders | null {
    const token = localStorage.getItem('access_token');
    if (!token) return null;

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  cargarEventos() {
    const headers = this.buildAuthHeaders();
    if (!headers) return;

    this.http.get<any[]>(`${this.baseUrl}/eventos/hogar/${this.idHogar}`, { headers })
      .subscribe({
        next: (resp) => {
          this.eventos = resp;
        },
        error: err => console.error("Error cargando eventos", err)
      });
  }

  // Retorna eventos de un día específico
  eventosDelDia(day: number | null) {
    if (!day) return [];

    return this.eventos.filter(ev => {
      const [y, m, d] = ev.fecha_hora.split("T")[0].split("-").map(Number);
      return y === this.year && m - 1 === this.month && d === day;
    });
  }

  // Generar calendario mensual
  generarCalendario() {
    const firstDay = new Date(this.year, this.month, 1);
    const lastDay = new Date(this.year, this.month + 1, 0);

    let start = firstDay.getDay();
    if (start === 0) start = 7; // domingo → 7

    this.calendarDays = [];

    // Vacíos antes del inicio
    for (let i = 1; i < start; i++) {
      this.calendarDays.push(null);
    }

    // Días del mes
    for (let day = 1; day <= lastDay.getDate(); day++) {
      this.calendarDays.push(day);
    }
  }

  // Mes anterior
  prevMonth() {
    this.month--;
    if (this.month < 0) {
      this.month = 11;
      this.year--;
    }
    this.monthName = this.getMonthName(this.month);
    this.generarCalendario();
  }

  // Mes siguiente
  nextMonth() {
    this.month++;
    if (this.month > 11) {
      this.month = 0;
      this.year++;
    }
    this.monthName = this.getMonthName(this.month);
    this.generarCalendario();
  }

  // Nombre del mes en español
  getMonthName(month: number) {
    return new Date(this.year, month, 1)
      .toLocaleString('es', { month: 'long' });
  }
}
