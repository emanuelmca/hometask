import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NavComponent } from '../../components/nav/nav';
import { NavMiembroComponent } from '../../components/nav-miembro/nav-miembro';
import { ChatFloatingComponent } from '../../components/chat-floating/chat-floating';

// Interfaces
interface Miembro {
  id: number;
  nombre_completo: string;
  correo_electronico: string;
  rol: {
    nombre: string;
  };
}

interface Tarea {
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

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavComponent, NavMiembroComponent, ChatFloatingComponent],
  templateUrl: './gestion-tareas.html',
  styleUrls: ['./gestion-tareas.css']
})
export class TasksComponent implements OnInit {

  // Datos
  tareas: Tarea[] = [];
  miembros: Miembro[] = [];
  tareasFiltradas: Tarea[] = [];
  isAdmin: boolean = false;

  // Estados
  loading = false;
  errorMessage = '';
  filtroEstado = 'todas';

  // Modal
  mostrarModal = false;
  editando = false;
  guardandoTarea = false;
  errorModal = '';
  tareaEditando: Tarea | null = null;

  // Nueva tarea
  nuevaTarea = {
    titulo: '',
    descripcion: '',
    categoria: '',
    asignado_a: 0,
    fecha_limite: '',
    id_hogar: 0
  };

  private baseUrl = 'http://127.0.0.1:8000';
  private idHogar = localStorage.getItem('id_hogar');
  private idMiembro = localStorage.getItem('id_miembro');

  constructor(private http: HttpClient, private router: Router) { }

  ngOnInit(): void {
    this.verificarRol();
    this.cargarTareas();
    this.cargarMiembros();
  }

  // Verificar rol del usuario
  verificarRol(): void {
    const rolId = localStorage.getItem('rolId');
    // rolId 1 = Administrador, rolId 2 = Hijo/Miembro
    this.isAdmin = rolId === '1';
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

  // Cargar tareas
  cargarTareas(): void {
    const headers = this.buildAuthHeaders();
    if (!headers || !this.idHogar) {
      this.errorMessage = 'Error de autenticación';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.http.get<Tarea[]>(`${this.baseUrl}/tareas/hogar/todas`, { headers })
      .subscribe({
        next: (resp) => {
          this.tareas = resp;
          this.aplicarFiltro();
          this.loading = false;
          console.log('✅ Tareas cargadas:', resp.length);
        },
        error: (err) => {
          console.error('❌ Error cargando tareas:', err);
          this.errorMessage = 'Error al cargar las tareas';
          this.loading = false;
        }
      });
  }

  // Cargar miembros
  cargarMiembros(): void {
    const headers = this.buildAuthHeaders();
    if (!headers || !this.idHogar) return;

    this.http.get<Miembro[]>(`${this.baseUrl}/miembros/hogar/${this.idHogar}`, { headers })
      .subscribe({
        next: (resp) => {
          this.miembros = resp;
          console.log('✅ Miembros cargados:', resp.length);
        },
        error: (err) => {
          console.error('❌ Error cargando miembros:', err);
        }
      });
  }

  // Filtrar tareas
  filtrarTareas(estado: string): void {
    this.filtroEstado = estado;
    this.aplicarFiltro();
  }

  aplicarFiltro(): void {
    if (this.filtroEstado === 'todas') {
      this.tareasFiltradas = this.tareas;
    } else {
      this.tareasFiltradas = this.tareas.filter(t => t.estado_actual === this.filtroEstado);
    }
  }

  // Contar tareas por estado
  contarTareasPorEstado(estado: string): number {
    return this.tareas.filter(t => t.estado_actual === estado).length;
  }

  // Obtener nombre del miembro
  obtenerNombreMiembro(id: number): string {
    const miembro = this.miembros.find(m => m.id === id);
    return miembro ? miembro.nombre_completo : '';
  }

  // Texto del estado
  getEstadoTexto(estado: string): string {
    const estados: { [key: string]: string } = {
      'pendiente': 'Pendiente',
      'en_progreso': 'En Progreso',
      'completada': 'Completada',
      'cancelada': 'Cancelada'
    };
    return estados[estado] || estado;
  }

  // Calcular progreso
  calcularProgreso(tarea: Tarea): number {
    if (!tarea.tiempo_total_segundos) return 0;
    // Simular progreso basado en el tiempo (puedes ajustar esta lógica)
    return Math.min(Math.floor((Date.now() - new Date(tarea.fecha_creacion).getTime()) / 1000 / tarea.tiempo_total_segundos * 100), 100);
  }

  // Modal crear tarea
  abrirModalCrearTarea(): void {
    this.editando = false;
    this.tareaEditando = null;
    this.nuevaTarea = {
      titulo: '',
      descripcion: '',
      categoria: '',
      asignado_a: 0,
      fecha_limite: '',
      id_hogar: parseInt(this.idHogar || '0')
    };
    this.errorModal = '';
    this.mostrarModal = true;
  }

  // Modal editar tarea
  editarTarea(tarea: Tarea): void {
    this.editando = true;
    this.tareaEditando = tarea;
    this.nuevaTarea = {
      titulo: tarea.titulo,
      descripcion: tarea.descripcion,
      categoria: tarea.categoria,
      asignado_a: tarea.asignado_a,
      fecha_limite: tarea.fecha_limite,
      id_hogar: tarea.id_hogar
    };
    this.errorModal = '';
    this.mostrarModal = true;
  }

  // Cerrar modal
  cerrarModal(): void {
    this.mostrarModal = false;
    this.guardandoTarea = false;
    this.errorModal = '';
  }

  // Guardar tarea (crear o editar)
  guardarTarea(): void {
    const headers = this.buildAuthHeaders();
    if (!headers || !this.idHogar || !this.idMiembro) {
      this.errorModal = 'Error de autenticación';
      return;
    }

    // Validar campos requeridos
    if (!this.nuevaTarea.titulo.trim()) {
      this.errorModal = 'El título es obligatorio';
      return;
    }

    if (!this.nuevaTarea.asignado_a) {
      this.errorModal = 'Debes asignar la tarea a un miembro';
      return;
    }

    this.guardandoTarea = true;
    this.errorModal = '';

    const tareaData = {
      ...this.nuevaTarea,
      creado_por: parseInt(this.idMiembro)
    };

    if (this.editando && this.tareaEditando) {
      // Editar tarea (PUT)
      this.http.put<Tarea>(`${this.baseUrl}/tareas/${this.tareaEditando.id}`, tareaData, { headers })
        .subscribe({
          next: (resp) => {
            this.actualizarTareaEnLista(resp);
            this.cerrarModal();
            alert('✅ Tarea actualizada correctamente');
          },
          error: (err) => {
            this.manejarErrorGuardado(err);
          }
        });
    } else {
      // Crear tarea (POST)
      this.http.post<Tarea>(`${this.baseUrl}/tareas/`, tareaData, { headers })
        .subscribe({
          next: (resp) => {
            this.tareas.unshift(resp);
            this.aplicarFiltro();
            this.cerrarModal();
            alert('✅ Tarea creada correctamente');
          },
          error: (err) => {
            this.manejarErrorGuardado(err);
          }
        });
    }
  }

  // Actualizar tarea en lista
  private actualizarTareaEnLista(tareaActualizada: Tarea): void {
    const index = this.tareas.findIndex(t => t.id === tareaActualizada.id);
    if (index !== -1) {
      this.tareas[index] = tareaActualizada;
      this.aplicarFiltro();
    }
  }

  // Manejar errores al guardar
  private manejarErrorGuardado(err: any): void {
    console.error('❌ Error guardando tarea:', err);
    this.guardandoTarea = false;

    let mensaje = 'Error al guardar la tarea';
    if (err.status === 400) {
      mensaje = 'Datos inválidos';
    } else if (err.status === 401) {
      mensaje = 'No autorizado';
    }

    this.errorModal = mensaje;
  }

  // Cambiar estado de tarea
  cambiarEstadoTarea(tarea: Tarea): void {
    const estados = ['pendiente', 'en_progreso', 'completada', 'cancelada'];
    const estadoActual = estados.indexOf(tarea.estado_actual);
    const siguienteEstado = estados[(estadoActual + 1) % estados.length];

    const confirmacion = confirm(`¿Cambiar estado de "${tarea.titulo}" a "${this.getEstadoTexto(siguienteEstado)}"?`);

    if (!confirmacion) return;

    const headers = this.buildAuthHeaders();
    if (!headers) {
      alert('Error de autenticación');
      return;
    }

    this.http.put<Tarea>(`${this.baseUrl}/tareas/${tarea.id}/estado`,
      { estado_actual: siguienteEstado },
      { headers }
    ).subscribe({
      next: (resp) => {
        this.actualizarTareaEnLista(resp);
        alert(`✅ Estado cambiado a ${this.getEstadoTexto(siguienteEstado)}`);
      },
      error: (err) => {
        console.error('❌ Error cambiando estado:', err);
        alert('❌ Error al cambiar el estado');
      }
    });
  }

  // Navegar a detalles de tarea
  navegarADetalle(id: number): void {
    this.router.navigate(['/task-detail', id]);
  }
}