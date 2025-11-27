import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { NavComponent } from '../../components/nav/nav';
import { CalendarComponent } from '../../components/calendar/calendar';
import { ChatFloatingComponent } from '../../components/chat-floating/chat-floating';

// Interfaces
interface Evento {
  id: number;
  titulo: string;
  descripcion: string;
  fecha_hora: string;
  duracion_min: number;
  id_hogar: number;
  creado_por: number;
}

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavComponent, CalendarComponent, ChatFloatingComponent],
  templateUrl: './gestion-eventos.html',
  styleUrls: ['./gestion-eventos.css']
})
export class EventsComponent implements OnInit {

  // Datos
  eventos: Evento[] = [];
  eventosFiltrados: Evento[] = [];

  // Estados
  loading = false;
  errorMessage = '';
  filtroVista = 'calendario'; // 'calendario' | 'lista'
  filtroFecha = 'todos';
  orden = 'fecha_asc';

  // Modal
  mostrarModal = false;
  editando = false;
  guardandoEvento = false;
  errorModal = '';
  eventoEditando: Evento | null = null;

  // Nuevo evento
  nuevoEvento = {
    titulo: '',
    descripcion: '',
    fecha: '',
    hora: '10:00',
    duracion_min: 60,
    fecha_hora: '',
    id_hogar: 0,
    creado_por: 0
  };

  private baseUrl = 'http://127.0.0.1:8000';
  private idHogar = localStorage.getItem('id_hogar');
  private idMiembro = localStorage.getItem('id_miembro');

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.cargarEventos();
  }

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

  // Cargar eventos
  cargarEventos(): void {
    const headers = this.buildAuthHeaders();
    if (!headers || !this.idHogar) {
      this.errorMessage = 'Error de autenticación';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.http.get<Evento[]>(`${this.baseUrl}/eventos/hogar/${this.idHogar}`, { headers })
      .subscribe({
        next: (resp) => {
          this.eventos = resp;
          this.aplicarFiltros();
          this.loading = false;
          console.log('✅ Eventos cargados:', resp.length);
        },
        error: (err) => {
          console.error('❌ Error cargando eventos:', err);
          this.errorMessage = 'Error al cargar los eventos';
          this.loading = false;
        }
      });
  }

  // Cambiar vista entre calendario y lista
  cambiarVista(vista: string): void {
    this.filtroVista = vista;
  }

  // Aplicar filtros y ordenamiento
  aplicarFiltros(): void {
    let eventosFiltrados = [...this.eventos];

    // Aplicar filtro de fecha
    if (this.filtroFecha !== 'todos') {
      const ahora = new Date();
      eventosFiltrados = eventosFiltrados.filter(evento => {
        const fechaEvento = new Date(evento.fecha_hora);

        switch (this.filtroFecha) {
          case 'hoy':
            return this.esMismoDia(fechaEvento, ahora);
          case 'semana':
            return this.esMismaSemana(fechaEvento, ahora);
          case 'mes':
            return this.esMismoMes(fechaEvento, ahora);
          case 'futuro':
            return fechaEvento > ahora;
          case 'pasado':
            return fechaEvento < ahora;
          default:
            return true;
        }
      });
    }

    // Aplicar ordenamiento
    eventosFiltrados.sort((a, b) => {
      const fechaA = new Date(a.fecha_hora);
      const fechaB = new Date(b.fecha_hora);

      switch (this.orden) {
        case 'fecha_asc':
          return fechaA.getTime() - fechaB.getTime();
        case 'fecha_desc':
          return fechaB.getTime() - fechaA.getTime();
        case 'titulo_asc':
          return a.titulo.localeCompare(b.titulo);
        case 'titulo_desc':
          return b.titulo.localeCompare(a.titulo);
        default:
          return 0;
      }
    });

    this.eventosFiltrados = eventosFiltrados;
  }

  // Helper functions para fechas
  private esMismoDia(fecha1: Date, fecha2: Date): boolean {
    return fecha1.toDateString() === fecha2.toDateString();
  }

  private esMismaSemana(fecha1: Date, fecha2: Date): boolean {
    const inicioSemana = new Date(fecha2);
    inicioSemana.setDate(fecha2.getDate() - fecha2.getDay());
    inicioSemana.setHours(0, 0, 0, 0);

    const finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 6);
    finSemana.setHours(23, 59, 59, 999);

    return fecha1 >= inicioSemana && fecha1 <= finSemana;
  }

  private esMismoMes(fecha1: Date, fecha2: Date): boolean {
    return fecha1.getMonth() === fecha2.getMonth() &&
      fecha1.getFullYear() === fecha2.getFullYear();
  }

  // Obtener eventos de este mes
  get eventosEsteMes(): Evento[] {
    const ahora = new Date();
    return this.eventos.filter(evento =>
      this.esMismoMes(new Date(evento.fecha_hora), ahora)
    );
  }

  // Verificar si un evento es pasado
  esEventoPasado(evento: Evento): boolean {
    return new Date(evento.fecha_hora) < new Date();
  }

  // Obtener nombre del creador (simulado)
  obtenerNombreCreador(idCreador: number): string {
    // En una implementación real, buscarías en la lista de miembros
    return idCreador === parseInt(this.idMiembro || '0') ? 'Tú' : `Miembro ${idCreador}`;
  }

  // Obtener fecha de creación (simulado)
  obtenerFechaCreacion(eventoId: number): Date {
    // En una implementación real, esto vendría del backend
    return new Date();
  }

  // Obtener texto del filtro
  obtenerTextoFiltro(): string {
    const textos: { [key: string]: string } = {
      'todos': 'todos',
      'hoy': 'hoy',
      'semana': 'esta semana',
      'mes': 'este mes',
      'futuro': 'próximos',
      'pasado': 'pasados'
    };
    return textos[this.filtroFecha] || this.filtroFecha;
  }

  // Modal crear evento
  abrirModalCrearEvento(): void {
    this.editando = false;
    this.eventoEditando = null;

    // Establecer fecha y hora por defecto (mañana a las 10:00)
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);

    this.nuevoEvento = {
      titulo: '',
      descripcion: '',
      fecha: manana.toISOString().split('T')[0],
      hora: '10:00',
      duracion_min: 60,
      fecha_hora: '',
      id_hogar: parseInt(this.idHogar || '0'),
      creado_por: parseInt(this.idMiembro || '0')
    };

    this.actualizarFechaHora();
    this.errorModal = '';
    this.mostrarModal = true;
  }

  // Modal editar evento
  editarEvento(evento: Evento): void {
    this.editando = true;
    this.eventoEditando = evento;

    const fechaHora = new Date(evento.fecha_hora);

    this.nuevoEvento = {
      titulo: evento.titulo,
      descripcion: evento.descripcion,
      fecha: fechaHora.toISOString().split('T')[0],
      hora: fechaHora.toTimeString().slice(0, 5),
      duracion_min: evento.duracion_min,
      fecha_hora: evento.fecha_hora,
      id_hogar: evento.id_hogar,
      creado_por: evento.creado_por
    };

    this.errorModal = '';
    this.mostrarModal = true;
  }

  // Actualizar fecha_hora combinando fecha y hora
  actualizarFechaHora(): void {
    if (this.nuevoEvento.fecha && this.nuevoEvento.hora) {
      this.nuevoEvento.fecha_hora = `${this.nuevoEvento.fecha}T${this.nuevoEvento.hora}:00`;
    }
  }

  // Cerrar modal
  cerrarModal(): void {
    this.mostrarModal = false;
    this.guardandoEvento = false;
    this.errorModal = '';
  }

  // Guardar evento (crear o editar)
  guardarEvento(): void {
    const headers = this.buildAuthHeaders();
    if (!headers || !this.idHogar || !this.idMiembro) {
      this.errorModal = 'Error de autenticación';
      return;
    }

    // Validar campos requeridos
    if (!this.nuevoEvento.titulo.trim()) {
      this.errorModal = 'El título es obligatorio';
      return;
    }

    if (!this.nuevoEvento.fecha || !this.nuevoEvento.hora) {
      this.errorModal = 'La fecha y hora son obligatorias';
      return;
    }

    this.guardandoEvento = true;
    this.errorModal = '';

    const eventoData = {
      titulo: this.nuevoEvento.titulo,
      descripcion: this.nuevoEvento.descripcion,
      fecha_hora: this.nuevoEvento.fecha_hora,
      duracion_min: this.nuevoEvento.duracion_min,
      id_hogar: this.nuevoEvento.id_hogar,
      creado_por: this.nuevoEvento.creado_por
    };

    if (this.editando && this.eventoEditando) {
      // Editar evento (PATCH)
      this.http.patch<Evento>(
        `${this.baseUrl}/eventos/${this.eventoEditando.id}`,
        eventoData,
        { headers }
      ).subscribe({
        next: (resp) => {
          this.actualizarEventoEnLista(resp);
          this.cerrarModal();
          alert('✅ Evento actualizado correctamente');
        },
        error: (err) => {
          this.manejarErrorGuardado(err);
        }
      });
    } else {
      // Crear evento (POST)
      this.http.post<Evento>(
        `${this.baseUrl}/eventos/`,
        eventoData,
        { headers }
      ).subscribe({
        next: (resp) => {
          this.eventos.unshift(resp);
          this.aplicarFiltros();
          this.cerrarModal();
          alert('✅ Evento creado correctamente');
        },
        error: (err) => {
          this.manejarErrorGuardado(err);
        }
      });
    }
  }

  // Actualizar evento en lista
  private actualizarEventoEnLista(eventoActualizado: Evento): void {
    const index = this.eventos.findIndex(e => e.id === eventoActualizado.id);
    if (index !== -1) {
      this.eventos[index] = eventoActualizado;
      this.aplicarFiltros();
    }
  }

  // Manejar errores al guardar
  private manejarErrorGuardado(err: any): void {
    console.error('❌ Error guardando evento:', err);
    this.guardandoEvento = false;

    let mensaje = 'Error al guardar el evento';
    if (err.status === 400) {
      mensaje = 'Datos inválidos';
    } else if (err.status === 401) {
      mensaje = 'No autorizado';
    }

    this.errorModal = mensaje;
  }

  // Eliminar evento
  eliminarEvento(evento: Evento): void {
    const confirmacion = confirm(`¿Estás seguro de que quieres eliminar el evento "${evento.titulo}"?`);

    if (!confirmacion) return;

    const headers = this.buildAuthHeaders();
    if (!headers) {
      alert('Error de autenticación');
      return;
    }

    this.http.delete(`${this.baseUrl}/eventos/${evento.id}`, { headers })
      .subscribe({
        next: () => {
          this.eventos = this.eventos.filter(e => e.id !== evento.id);
          this.aplicarFiltros();
          alert('✅ Evento eliminado correctamente');
        },
        error: (err) => {
          console.error('❌ Error eliminando evento:', err);
          alert('❌ Error al eliminar el evento');
        }
      });
  }

  // TrackBy function
  trackByEvento(index: number, evento: Evento): number {
    return evento.id;
  }
}