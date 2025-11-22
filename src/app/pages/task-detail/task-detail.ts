import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TaskService, TaskDetail } from '../../service/task.service';
import { CommentService, Comment } from '../../service/comment.service';

interface Miembro {
  id: number;
  nombre_completo: string;
  correo_electronico: string;
  rol: {
    nombre: string;
  };
}

interface ActionPlanItem {
  text: string;
  completed: boolean;
  status: string;
  type?: string;
}

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './task-detail.html',
  styleUrls: ['./task-detail.css']
})
export class TaskDetailComponent implements OnInit {

  taskId: number = 0;
  task: TaskDetail | null = null;
  comments: Comment[] = [];
  miembros: Miembro[] = [];
  actionPlan: ActionPlanItem[] = [
    { text: 'Organizar la despensa', completed: true, status: 'Realizado', type: 'Terminado' },
    { text: 'Limpiar superficies y microondas', completed: false, status: 'Realizando', type: 'Terminado' },
    { text: 'Fregar el suelo', completed: false, status: 'Realizando', type: 'Terminado' }
  ];

  loading = true;
  errorMessage = '';

  // Comentarios
  nuevoComentario = '';
  imagenSeleccionada: File | null = null;
  imagenPreview: string | null = null;
  enviandoComentario = false;

  private baseUrl = 'http://127.0.0.1:8000';
  private idHogar = localStorage.getItem('id_hogar');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private taskService: TaskService,
    private commentService: CommentService,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    // Obtener el ID de la tarea desde la ruta
    this.route.params.subscribe(params => {
      this.taskId = +params['id'];
      if (this.taskId) {
        this.cargarTarea();
        this.cargarComentarios();
        this.cargarMiembros();
      }
    });
  }

  // Cargar datos de la tarea
  cargarTarea(): void {
    this.loading = true;
    this.taskService.getTaskById(this.taskId).subscribe({
      next: (data) => {
        this.task = data;
        this.loading = false;
        console.log('✅ Tarea cargada:', data);
      },
      error: (err) => {
        console.error('❌ Error cargando tarea:', err);
        this.errorMessage = 'Error al cargar la tarea';
        this.loading = false;
      }
    });
  }

  // Cargar comentarios
  cargarComentarios(): void {
    this.commentService.getComments(this.taskId).subscribe({
      next: (data) => {
        this.comments = data;
        console.log('✅ Comentarios cargados:', data.length);
      },
      error: (err) => {
        console.error('❌ Error cargando comentarios:', err);
      }
    });
  }

  // Cargar miembros del hogar
  cargarMiembros(): void {
    const token = localStorage.getItem('access_token');
    if (!token || !this.idHogar) return;

    const headers = { Authorization: `Bearer ${token}` };
    this.http.get<Miembro[]>(`${this.baseUrl}/miembros/hogar/${this.idHogar}`, { headers })
      .subscribe({
        next: (data) => {
          this.miembros = data;
        },
        error: (err) => {
          console.error('❌ Error cargando miembros:', err);
        }
      });
  }

  // Obtener nombre del miembro asignado
  obtenerNombreMiembro(id: number): string {
    const miembro = this.miembros.find(m => m.id === id);
    return miembro ? miembro.nombre_completo : 'Cargando...';
  }

  // Manejar selección de imagen
  onImagenSeleccionada(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.imagenSeleccionada = file;

      // Crear preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagenPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  // Eliminar imagen seleccionada
  eliminarImagenPreview(): void {
    this.imagenSeleccionada = null;
    this.imagenPreview = null;
  }

  // Enviar comentario
  enviarComentario(): void {
    if (!this.nuevoComentario.trim() && !this.imagenSeleccionada) {
      return;
    }

    this.enviandoComentario = true;

    this.commentService.postComment(this.taskId, this.nuevoComentario, this.imagenSeleccionada || undefined)
      .subscribe({
        next: (comentario) => {
          this.comments.push(comentario);
          this.nuevoComentario = '';
          this.imagenSeleccionada = null;
          this.imagenPreview = null;
          this.enviandoComentario = false;
          console.log('✅ Comentario enviado');

          // Scroll al final de comentarios
          setTimeout(() => {
            const commentsContainer = document.querySelector('.comments-list');
            if (commentsContainer) {
              commentsContainer.scrollTop = commentsContainer.scrollHeight;
            }
          }, 100);
        },
        error: (err) => {
          console.error('❌ Error enviando comentario:', err);
          this.enviandoComentario = false;
          alert('Error al enviar comentario');
        }
      });
  }

  // Navegar a mensajería
  navegarAMensajes(): void {
    if (this.task?.asignado_a) {
      this.router.navigate(['/messages', this.task.asignado_a]);
    }
  }

  // Volver a la lista
  volver(): void {
    this.router.navigate(['/dashboard']);
  }

  // Calcular días hasta la fecha límite
  calcularDiasRestantes(): number | null {
    if (!this.task?.fecha_limite) return null;

    const hoy = new Date();
    const limite = new Date(this.task.fecha_limite);
    const diff = limite.getTime() - hoy.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  // Formatear fecha
  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  // Formatear fecha corta (para deadline)
  formatearFechaCorta(fecha: string): string {
    const date = new Date(fecha);
    const hoy = new Date();
    const esHoy = date.toDateString() === hoy.toDateString();

    if (esHoy) {
      return 'Hoy, ' + date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }

    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Obtener username del miembro
  obtenerUsernameMiembro(id: number): string {
    const miembro = this.miembros.find(m => m.id === id);
    if (miembro) {
      return miembro.correo_electronico.split('@')[0];
    }
    return 'usuario';
  }


  // Navegar a otra página
  navegarA(ruta: string): void {
    this.router.navigate([ruta]);
  }

  // Navegar al asistente
  navegarAsistente(): void {
    this.router.navigate(['/assistant']);
  }

  // Formatear hora (para comentarios)
  formatearHora(fecha: string): string {
    const date = new Date(fecha);
    const ahora = new Date();
    const diff = ahora.getTime() - date.getTime();
    const minutos = Math.floor(diff / 60000);

    if (minutos < 1) return 'Ahora';
    if (minutos < 60) return `Hace ${minutos} min`;

    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `Hace ${horas}h`;

    const dias = Math.floor(horas / 24);
    return `Hace ${dias}d`;
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
}
