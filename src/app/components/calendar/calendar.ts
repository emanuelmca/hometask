import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, MatButtonModule, FormsModule],
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

  // Variables para el modal
  mostrarModal = false;
  fechaSeleccionada: Date = new Date();
  eventosDelDiaSeleccionado: any[] = [];
  creandoEvento = false;

  // Nuevo evento
  nuevoEvento = {
    titulo: '',
    descripcion: '',
    hora: '10:00',
    duracion: '60'
  };

  private baseUrl = 'http://127.0.0.1:8000';
  private idHogar = localStorage.getItem('id_hogar');
  private idMiembro = localStorage.getItem('id_miembro');

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.monthName = this.getMonthName(this.month);
    this.generarCalendario();
    this.cargarEventos();
  }

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

  cargarEventos() {
    const headers = this.buildAuthHeaders();
    if (!headers || !this.idHogar) {
      console.error('❌ No se pueden cargar eventos: falta token o id_hogar');
      return;
    }

    this.http.get<any[]>(`${this.baseUrl}/eventos/hogar/${this.idHogar}`, { headers })
      .subscribe({
        next: (resp) => {
          console.log('✅ Eventos cargados:', resp);
          this.eventos = resp;
        },
        error: err => {
          console.error("❌ Error cargando eventos:", err);
        }
      });
  }

  // Retorna eventos de un día específico
  eventosDelDia(day: number | null) {
    if (!day) return [];

    return this.eventos.filter(ev => {
      try {
        const [y, m, d] = ev.fecha_hora.split("T")[0].split("-").map(Number);
        return y === this.year && m - 1 === this.month && d === day;
      } catch (error) {
        return false;
      }
    });
  }

  // Abrir modal para crear evento
  abrirModalCrearEvento(day: number | null) {
    if (!day) return;

    console.log('📅 Día seleccionado:', day);
    
    this.fechaSeleccionada = new Date(this.year, this.month, day);
    this.eventosDelDiaSeleccionado = this.eventosDelDia(day);
    
    // Resetear formulario con valores por defecto
    this.nuevoEvento = {
      titulo: '',
      descripcion: '',
      hora: '10:00',
      duracion: '60'
    };

    this.mostrarModal = true;
    console.log('📋 Modal abierto para:', this.fechaSeleccionada);
  }

  // Cerrar modal
  cerrarModal() {
    this.mostrarModal = false;
    this.creandoEvento = false;
  }

  // Crear nuevo evento
  crearEvento() {
    const headers = this.buildAuthHeaders();
    
    if (!headers) {
      alert('❌ Error: No hay token de autenticación');
      return;
    }

    if (!this.idHogar || !this.idMiembro) {
      alert('❌ Error: No se encontró el ID del hogar o miembro');
      return;
    }

    // Validar campos requeridos
    if (!this.nuevoEvento.titulo.trim()) {
      alert('❌ El título del evento es obligatorio');
      return;
    }

    // Construir fecha y hora completa
    const fechaStr = this.fechaSeleccionada.toISOString().split('T')[0];
    const fechaHora = `${fechaStr}T${this.nuevoEvento.hora}:00`;

    const eventoData = {
      titulo: this.nuevoEvento.titulo,
      descripcion: this.nuevoEvento.descripcion,
      fecha_hora: fechaHora,
      duracion_min: parseInt(this.nuevoEvento.duracion),
      id_hogar: parseInt(this.idHogar),
      creado_por: parseInt(this.idMiembro)
    };

    console.log('📤 Enviando evento:', eventoData);

    this.creandoEvento = true;

    this.http.post(`${this.baseUrl}/eventos/`, eventoData, { headers })
      .subscribe({
        next: (resp: any) => {
          console.log('✅ Evento creado exitosamente:', resp);
          
          // Agregar el nuevo evento a la lista local
          this.eventos.push(resp);
          this.eventosDelDiaSeleccionado = this.eventosDelDia(this.fechaSeleccionada.getDate());
          
          // Cerrar modal y resetear
          this.cerrarModal();
          alert('✅ Evento creado correctamente');
        },
        error: (err) => {
          console.error('❌ Error creando evento:', err);
          this.creandoEvento = false;
          
          let mensajeError = 'Error al crear el evento';
          if (err.status === 400) {
            mensajeError = 'Datos inválidos. Verifica la información.';
          } else if (err.status === 401) {
            mensajeError = 'No autorizado. Token inválido.';
          }
          
          alert(`❌ ${mensajeError}`);
        }
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

  isCurrentDay(day: number | null): boolean {
    if (!day) return false;
    
    const today = new Date();
    return this.year === today.getFullYear() && 
           this.month === today.getMonth() && 
           day === today.getDate();
  }

  isWeekend(day: number | null): boolean {
    if (!day) return false;
    
    const date = new Date(this.year, this.month, day);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // 0 = Domingo, 6 = Sábado
  }
}