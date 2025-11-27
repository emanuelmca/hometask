import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';

interface Tarea {
  id: number;
  titulo: string;
  descripcion: string;
  categoria: string;
  fecha_limite: string;
  estado_actual: string;
  fecha_creacion: string;
}

interface Evento {
  id: number;
  titulo: string;
  descripcion: string;
  fecha_hora: string;
  duracion_min: number;
  estado: boolean;
}

interface Hora {
  hora: number;
  formato: string;
}

interface EventoPosicionado {
  evento: Evento;
  top: number;
  height: number;
  left: number;
  width: number;
  solapado: boolean;
}

@Component({
  selector: 'app-calendario-lateral',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './calendar-lateral.html',
  styleUrls: ['./calendar-lateral.css']
})
export class CalendarLateralComponent implements OnInit {
  tareas: Tarea[] = [];
  eventos: Evento[] = [];
  fechaSeleccionada: Date = new Date();
  cargando: boolean = true;
  error: string | null = null;
  eventosPosicionados: EventoPosicionado[] = [];
  colapsado: boolean = false;
  private resizeObserver: ResizeObserver | null = null;


  constructor(private http: HttpClient) { }


  mostrarOverlay: boolean = false;

  ngOnInit(): void {
    this.cargarDatos();
    this.verificarAnchoPantalla();
    this.inicializarResizeObserver();
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    // Limpiar el overlay al destruir el componente
    this.ocultarOverlay();
  }

  private verificarAnchoPantalla() {
    const width = window.innerWidth;

    if (width < 768) {
      // En móvil, inicialmente colapsado pero con botón visible
      this.colapsado = true;
    } else {
      this.colapsado = width < 1200;
    }
  }

  toggleColapsado() {
    this.colapsado = !this.colapsado;

    // En móvil, manejar el overlay
    if (window.innerWidth < 768) {
      if (!this.colapsado) {
        // Al abrir: mostrar overlay y prevenir scroll
        this.mostrarOverlay = true;
        document.body.style.overflow = 'hidden';
      } else {
        // Al cerrar: ocultar overlay y restaurar scroll
        this.ocultarOverlay();
      }
    }
  }

  private ocultarOverlay() {
    this.mostrarOverlay = false;
    document.body.style.overflow = '';
  }

  // Cerrar al hacer clic en el overlay
  cerrarDesdeOverlay(event: Event) {
    event.stopPropagation();
    if (window.innerWidth < 768 && !this.colapsado) {
      this.toggleColapsado();
    }
  }

  // Prevenir que el clic dentro del calendario cierre el overlay
  prevenirCierre(event: Event) {
    event.stopPropagation();
  }

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    if (window.innerWidth < 768 && !this.colapsado) {
      this.toggleColapsado();
    }
  }



  private inicializarResizeObserver(): void {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.verificarAnchoPantalla();
      });

      this.resizeObserver.observe(document.body);
    }
  }

  @HostListener('window:resize')
  onResize() {
    this.verificarAnchoPantalla();
  }

  @HostListener('window:orientationchange')
  onOrientationChange() {
    // Esperar a que se complete el cambio de orientación
    setTimeout(() => {
      this.verificarAnchoPantalla();
    }, 300);
  }


  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  cargarDatos(): void {
    this.cargando = true;
    this.error = null;

    const headers = this.getAuthHeaders();
    let tareasCargadas = false;
    let eventosCargados = false;

    const verificarCargaCompleta = () => {
      if (tareasCargadas && eventosCargados) {
        this.cargando = false;
        this.calcularPosicionesEventos();
      }
    };

    // Cargar tareas
    this.http.get<Tarea[]>('http://127.0.0.1:8000/tareas/mias/', { headers }).subscribe({
      next: (tareas) => {
        this.tareas = tareas;
        tareasCargadas = true;
        verificarCargaCompleta();
      },
      error: (error) => {
        console.error('Error al cargar tareas:', error);
        this.error = 'Error al cargar tareas';
        tareasCargadas = true;
        verificarCargaCompleta();
      }
    });

    // Cargar eventos
    this.http.get<Evento[]>('http://127.0.0.1:8000/eventos/hogar/actuales', { headers }).subscribe({
      next: (eventos) => {
        this.eventos = eventos;
        eventosCargados = true;
        verificarCargaCompleta();
      },
      error: (error) => {
        console.error('Error al cargar eventos:', error);
        this.error = 'Error al cargar eventos';
        eventosCargados = true;
        verificarCargaCompleta();
      }
    });
  }

  private calcularPosicionesEventos(): void {
    const eventosDelDia = this.obtenerActividadesDelDia().eventos;
    const eventosConPosiciones: EventoPosicionado[] = [];
    const columnas: EventoPosicionado[][] = [[]];

    // Ordenar eventos por hora de inicio
    eventosDelDia.sort((a, b) =>
      new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime()
    );

    // Asignar eventos a columnas para evitar superposición
    eventosDelDia.forEach(evento => {
      const top = this.obtenerPosicionEvento(evento.fecha_hora);
      const height = this.obtenerAlturaEvento(evento.duracion_min);

      let columnaEncontrada = false;

      // Buscar una columna donde no haya superposición
      for (let columna of columnas) {
        const superpone = columna.some(e =>
          this.haySuperposicion(
            top, top + height,
            e.top, e.top + e.height
          )
        );

        if (!superpone) {
          const eventoPosicionado: EventoPosicionado = {
            evento,
            top,
            height,
            left: (columnas.indexOf(columna) / columnas.length) * 90 + 5, // 5% de margen
            width: (90 / columnas.length) - 2, // 2% de separación
            solapado: false
          };
          columna.push(eventoPosicionado);
          eventosConPosiciones.push(eventoPosicionado);
          columnaEncontrada = true;
          break;
        }
      }

      // Si no cabe en ninguna columna existente, crear nueva columna
      if (!columnaEncontrada) {
        const nuevaColumna: EventoPosicionado[] = [];
        const eventoPosicionado: EventoPosicionado = {
          evento,
          top,
          height,
          left: (columnas.length / (columnas.length + 1)) * 90 + 5,
          width: (90 / (columnas.length + 1)) - 2,
          solapado: true
        };
        nuevaColumna.push(eventoPosicionado);
        columnas.push(nuevaColumna);
        eventosConPosiciones.push(eventoPosicionado);
      }
    });

    this.eventosPosicionados = eventosConPosiciones;
  }

  private haySuperposicion(
    inicio1: number, fin1: number,
    inicio2: number, fin2: number
  ): boolean {
    return inicio1 < fin2 && fin1 > inicio2;
  }

  formatearFecha(fecha: Date): string {
    const opciones: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    };
    return fecha.toLocaleDateString('es-ES', opciones);
  }

  esHoy(fecha: Date): boolean {
    const hoy = new Date();
    return fecha.toDateString() === hoy.toDateString();
  }

  esHoraActual(hora: number): boolean {
    const ahora = new Date();
    return ahora.getHours() === hora;
  }

  diaAnterior(): void {
    const nuevaFecha = new Date(this.fechaSeleccionada);
    nuevaFecha.setDate(nuevaFecha.getDate() - 1);
    this.fechaSeleccionada = nuevaFecha;
    this.calcularPosicionesEventos();
  }

  diaSiguiente(): void {
    const nuevaFecha = new Date(this.fechaSeleccionada);
    nuevaFecha.setDate(nuevaFecha.getDate() + 1);
    this.fechaSeleccionada = nuevaFecha;
    this.calcularPosicionesEventos();
  }

  irAHoy(): void {
    this.fechaSeleccionada = new Date();
    this.calcularPosicionesEventos();
  }

  obtenerActividadesDelDia(): { tareas: Tarea[], eventos: Evento[] } {
    const fechaStr = this.fechaSeleccionada.toISOString().split('T')[0];

    // Filtrar tareas del día seleccionado
    const tareasDelDia = this.tareas.filter(tarea =>
      tarea.fecha_limite === fechaStr
    );

    // Filtrar eventos del día seleccionado
    const eventosDelDia = this.eventos.filter(evento => {
      const fechaEvento = new Date(evento.fecha_hora);
      return fechaEvento.toISOString().split('T')[0] === fechaStr;
    });

    return { tareas: tareasDelDia, eventos: eventosDelDia };
  }

  generarHoras(): Hora[] {
    const horas: Hora[] = [];
    for (let i = 0; i < 24; i++) {
      horas.push({
        hora: i,
        formato: i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`
      });
    }
    return horas;
  }

  obtenerPosicionEvento(fechaHora: string): number {
    const fecha = new Date(fechaHora);
    const hora = fecha.getHours();
    const minutos = fecha.getMinutes();

    // Cada hora ocupa 60px, cada minuto ocupa 1px
    return (hora * 60) + minutos;
  }

  obtenerAlturaEvento(duracionMin: number): number {
    return Math.max(duracionMin, 30); // Mínimo 30px de altura
  }

  formatearHoraEvento(fechaHora: string, duracionMin: number): string {
    const fechaInicio = new Date(fechaHora);
    const fechaFin = new Date(fechaInicio.getTime() + duracionMin * 60000);

    const formatoHora = (fecha: Date): string => {
      const horas = fecha.getHours();
      const minutos = fecha.getMinutes();
      const ampm = horas >= 12 ? 'pm' : 'am';
      const horas12 = horas % 12 || 12;
      return minutos > 0 ? `${horas12}:${minutos.toString().padStart(2, '0')}${ampm}` : `${horas12}${ampm}`;
    };

    return `${formatoHora(fechaInicio)} – ${formatoHora(fechaFin)}`;
  }

  obtenerTareasPorHora(hora: number): Tarea[] {
    const { tareas } = this.obtenerActividadesDelDia();
    // Distribuir tareas de manera más inteligente
    return tareas.filter((tarea, index) => {
      // Usar el ID y el índice para distribuir mejor
      const horaBase = (tarea.id + index) % 24;
      return horaBase === hora && tareas.length <= 24; // Máximo una tarea por hora si hay pocas
    });
  }

  recargar(): void {
    this.cargarDatos();
  }

  tieneToken(): boolean {
    return !!localStorage.getItem('access_token');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // Solo en móvil
    if (window.innerWidth < 768 && !this.colapsado) {
      const target = event.target as HTMLElement;
      const calendario = document.querySelector('.calendario-lateral');

      if (calendario && !calendario.contains(target) && !target.closest('.btn-toggle')) {
        this.toggleColapsado();
      }
    }
  }
}