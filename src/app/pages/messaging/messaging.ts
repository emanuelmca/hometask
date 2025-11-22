import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MessageService, Message } from '../../service/message.service';

interface Miembro {
  id: number;
  nombre_completo: string;
  correo_electronico: string;
  rol: {
    nombre: string;
  };
}

@Component({
  selector: 'app-messaging',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './messaging.html',
  styleUrls: ['./messaging.css']
})
export class MessagingComponent implements OnInit {

  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  memberId: number = 0;
  miembro: Miembro | null = null;
  messages: Message[] = [];
  idMiembroActual: number = 0;

  loading = true;
  errorMessage = '';

  // Mensaje
  nuevoMensaje = '';
  imagenSeleccionada: File | null = null;
  imagenPreview: string | null = null;
  enviandoMensaje = false;

  private baseUrl = 'http://127.0.0.1:8000';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.idMiembroActual = parseInt(localStorage.getItem('id_miembro') || '0');

    // Obtener el ID del miembro desde la ruta
    this.route.params.subscribe(params => {
      this.memberId = +params['memberId'];
      if (this.memberId) {
        this.cargarMiembro();
        this.cargarMensajes();
      }
    });
  }

  // Cargar información del miembro
  cargarMiembro(): void {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };
    this.http.get<Miembro>(`${this.baseUrl}/miembros/${this.memberId}`, { headers })
      .subscribe({
        next: (data) => {
          this.miembro = data;
          console.log('✅ Miembro cargado:', data);
        },
        error: (err) => {
          console.error('❌ Error cargando miembro:', err);
        }
      });
  }

  // Cargar mensajes
  cargarMensajes(): void {
    this.loading = true;
    this.messageService.getConversation(this.memberId).subscribe({
      next: (data) => {
        this.messages = data;
        this.loading = false;
        console.log('✅ Mensajes cargados:', data.length);

        // Scroll al final después de cargar
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (err) => {
        console.error('❌ Error cargando mensajes:', err);
        this.errorMessage = 'Error al cargar mensajes';
        this.loading = false;
      }
    });
  }

  // Verificar si el mensaje es propio
  esMensajePropio(mensaje: Message): boolean {
    return mensaje.id_remitente === this.idMiembroActual;
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

  // Enviar mensaje
  enviarMensaje(): void {
    if (!this.nuevoMensaje.trim() && !this.imagenSeleccionada) {
      return;
    }

    this.enviandoMensaje = true;

    this.messageService.sendMessage(this.memberId, this.nuevoMensaje, this.imagenSeleccionada || undefined)
      .subscribe({
        next: (mensaje) => {
          this.messages.push(mensaje);
          this.nuevoMensaje = '';
          this.imagenSeleccionada = null;
          this.imagenPreview = null;
          this.enviandoMensaje = false;
          console.log('✅ Mensaje enviado');

          // Scroll al final
          setTimeout(() => this.scrollToBottom(), 100);
        },
        error: (err) => {
          console.error('❌ Error enviando mensaje:', err);
          this.enviandoMensaje = false;
          alert('Error al enviar mensaje');
        }
      });
  }

  // Scroll al final
  scrollToBottom(): void {
    if (this.messagesContainer) {
      const container = this.messagesContainer.nativeElement;
      container.scrollTop = container.scrollHeight;
    }
  }

  // Formatear hora
  formatearHora(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Volver atrás
  volver(): void {
    this.router.navigate(['/dashboard']);
  }

  // Navegar a sección
  navegarA(ruta: string): void {
    this.router.navigate([ruta]);
  }
}
