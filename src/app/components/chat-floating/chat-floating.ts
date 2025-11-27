import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { interval, Subscription } from 'rxjs';

interface Miembro {
  id: number;
  nombre_completo: string;
  correo_electronico: string;
  rol: {
    nombre: string;
  };
}

interface Mensaje {
  id: number;
  contenido: string;
  id_hogar: number;
  id_remitente: number;
  id_destinatario: number;
  fecha_envio: string;
  remitente: {
    id: number;
    nombre_completo: string;
  };
}

interface MensajeGrupo {
  fecha: string;
  mensajes: Mensaje[];
}

@Component({
  selector: 'app-chat-floating',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-floating.html',
  styleUrls: ['./chat-floating.css']
})
export class ChatFloatingComponent implements OnInit, OnDestroy {
  @ViewChild('chatBody') chatBody!: ElementRef;

  // Estados
  isOpen = false;
  cargandoMensajes = false;
  enviandoMensaje = false;

  // Datos
  miembros: Miembro[] = [];
  mensajes: Mensaje[] = [];
  contactoSeleccionado: number | null = null;
  nuevoMensaje = '';
  busquedaContacto = '';

  // IDs
  miId = parseInt(localStorage.getItem('id_miembro') || '0');
  idHogar = localStorage.getItem('id_hogar');

  // Notificaciones
  unreadMessages = 0;

  // Polling
  private pollingSubscription?: Subscription;
  private readonly POLLING_INTERVAL = 3000;

  // Cache de mensajes por contacto
  private mensajesPorContacto: { [contactoId: number]: Mensaje[] } = {};

  private baseUrl = 'http://127.0.0.1:8000';

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.cargarMiembros();
    this.restoreState();
  }

  ngOnDestroy(): void {
    this.detenerPolling();
  }

  // Restaurar estado del chat
  private restoreState(): void {
    const savedState = localStorage.getItem('chat_state');
    if (savedState) {
      const state = JSON.parse(savedState);
      this.isOpen = state.isOpen;

      if (this.isOpen && state.contactoSeleccionado) {
        this.contactoSeleccionado = state.contactoSeleccionado;
        // Esperar a que se carguen los miembros para tener el contexto completo si es necesario
        // pero podemos iniciar la carga de mensajes inmediatamente
        this.cargarMensajes(this.contactoSeleccionado!);
        this.iniciarPolling();
      }
    }
  }

  // Guardar estado del chat
  private saveState(): void {
    const state = {
      isOpen: this.isOpen,
      contactoSeleccionado: this.contactoSeleccionado
    };
    localStorage.setItem('chat_state', JSON.stringify(state));
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

  // Obtener miembros del hogar (excluyéndome a mí)
  get otrosMiembros(): Miembro[] {
    return this.miembros.filter(miembro => miembro.id !== this.miId);
  }

  // Contactos filtrados por búsqueda
  get contactosFiltrados(): Miembro[] {
    if (!this.busquedaContacto.trim()) {
      return this.otrosMiembros;
    }

    const busqueda = this.busquedaContacto.toLowerCase();
    return this.otrosMiembros.filter(miembro =>
      miembro.nombre_completo.toLowerCase().includes(busqueda) ||
      miembro.rol.nombre.toLowerCase().includes(busqueda)
    );
  }

  // TrackBy functions
  trackByMiembro(index: number, miembro: Miembro): number {
    return miembro.id;
  }

  trackByGrupo(index: number, grupo: MensajeGrupo): string {
    return grupo.fecha;
  }

  trackByMensaje(index: number, mensaje: Mensaje): number {
    return mensaje.id;
  }

  // Obtener iniciales para el avatar
  obtenerIniciales(nombreCompleto: string): string {
    return nombreCompleto
      .split(' ')
      .map(palabra => palabra.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  // Obtener último mensaje de un contacto
  obtenerUltimoMensaje(contactoId: number): Mensaje | null {
    const mensajes = this.mensajesPorContacto[contactoId] || [];
    return mensajes.length > 0 ? mensajes[mensajes.length - 1] : null;
  }

  // Obtener mensajes no leídos de un contacto
  obtenerMensajesNoLeidos(contactoId: number): number {
    const mensajes = this.mensajesPorContacto[contactoId] || [];
    return mensajes.filter(msg =>
      msg.id_remitente === contactoId &&
      !this.esMensajeVisto(msg)
    ).length;
  }

  // Verificar si un mensaje fue visto (simulado)
  private esMensajeVisto(mensaje: Mensaje): boolean {
    // En una implementación real, esto verificaría si el mensaje fue leído
    return mensaje.id_remitente === this.miId; // Simulación: mis mensajes están "vistos"
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

          // Cargar últimos mensajes para cada contacto
          this.otrosMiembros.forEach(miembro => {
            this.cargarUltimosMensajes(miembro.id);
          });
        },
        error: (err) => {
          console.error('❌ Error cargando miembros:', err);
        }
      });
  }

  // Cargar últimos mensajes para un contacto (para la vista de lista)
  cargarUltimosMensajes(contactoId: number): void {
    const headers = this.buildAuthHeaders();
    if (!headers) return;

    this.http.get<Mensaje[]>(`${this.baseUrl}/mensajes/directo/${contactoId}`, { headers })
      .subscribe({
        next: (resp) => {
          this.mensajesPorContacto[contactoId] = resp;
        },
        error: (err) => {
          console.error('❌ Error cargando últimos mensajes:', err);
        }
      });
  }

  // Cargar mensajes completos de una conversación
  cargarMensajes(idDestinatario: number): void {
    const headers = this.buildAuthHeaders();
    if (!headers) return;

    this.cargandoMensajes = true;

    this.http.get<Mensaje[]>(`${this.baseUrl}/mensajes/directo/${idDestinatario}`, { headers })
      .subscribe({
        next: (resp) => {
          this.mensajes = resp;
          this.mensajesPorContacto[idDestinatario] = resp;
          this.cargandoMensajes = false;
          this.scrollToBottom(true); // Force scroll on load
          console.log('✅ Mensajes cargados:', resp.length);
        },
        error: (err) => {
          console.error('❌ Error cargando mensajes:', err);
          this.cargandoMensajes = false;
        }
      });
  }

  // Agrupar mensajes por fecha
  get mensajesAgrupados(): MensajeGrupo[] {
    const grupos: { [fecha: string]: Mensaje[] } = {};

    this.mensajes.forEach(mensaje => {
      const fecha = new Date(mensaje.fecha_envio).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      if (!grupos[fecha]) {
        grupos[fecha] = [];
      }
      grupos[fecha].push(mensaje);
    });

    return Object.keys(grupos).map(fecha => ({
      fecha,
      mensajes: grupos[fecha]
    }));
  }

  // Obtener nombre del contacto seleccionado
  obtenerNombreContacto(): string {
    if (!this.contactoSeleccionado) return '';
    const miembro = this.miembros.find(m => m.id === this.contactoSeleccionado);
    return miembro ? miembro.nombre_completo : 'Contacto';
  }

  // Obtener rol del contacto seleccionado
  obtenerRolContacto(): string {
    if (!this.contactoSeleccionado) return '';
    const miembro = this.miembros.find(m => m.id === this.contactoSeleccionado);
    return miembro ? miembro.rol.nombre : '';
  }

  // Seleccionar contacto
  seleccionarContacto(contactoId: number): void {
    this.contactoSeleccionado = contactoId;
    this.saveState();
    this.cargarMensajes(contactoId);
    this.iniciarPolling();
  }

  // Volver a la lista de contactos
  volverALista(): void {
    this.contactoSeleccionado = null;
    this.saveState();
    this.mensajes = [];
    this.detenerPolling();
  }

  // Enviar mensaje
  enviarMensaje(): void {
    const contenido = this.nuevoMensaje.trim();
    if (!contenido || !this.contactoSeleccionado || !this.idHogar) return;

    const headers = this.buildAuthHeaders();
    if (!headers) return;

    this.enviandoMensaje = true;

    const mensajeData = {
      id_hogar: parseInt(this.idHogar),
      contenido: contenido
    };

    this.http.post<Mensaje>(
      `${this.baseUrl}/mensajes/directo/${this.contactoSeleccionado}`,
      mensajeData,
      { headers }
    ).subscribe({
      next: (resp) => {
        // Agregar el mensaje a la lista local


        // Actualizar cache de mensajes por contacto
        if (!this.mensajesPorContacto[this.contactoSeleccionado!]) {
          this.mensajesPorContacto[this.contactoSeleccionado!] = [];
        }


        // Si estamos viendo este chat, actualizar la lista visible
        if (this.contactoSeleccionado) {
          this.mensajes.push(resp);
        }

        this.nuevoMensaje = '';
        this.enviandoMensaje = false;
        this.scrollToBottom(true); // Force scroll on send
        console.log('✅ Mensaje enviado:', resp);
      },
      error: (err) => {
        console.error('❌ Error enviando mensaje:', err);
        this.enviandoMensaje = false;
        alert('❌ Error al enviar el mensaje');
      }
    });
  }

  // Scroll al final del chat
  scrollToBottom(force: boolean = false): void {
    setTimeout(() => {
      if (this.chatBody) {
        const element = this.chatBody.nativeElement;
        const threshold = 150; // px from bottom
        const isNearBottom = element.scrollHeight - element.scrollTop - element.clientHeight <= threshold;

        if (force || isNearBottom) {
          element.scrollTop = element.scrollHeight;
        }
      }
    }, 100);
  }

  // Polling para mensajes nuevos
  iniciarPolling(): void {
    this.detenerPolling();
    this.pollingSubscription = interval(this.POLLING_INTERVAL).subscribe(() => {
      if (this.contactoSeleccionado && this.isOpen) {
        this.verificarMensajesNuevos();
      }
    });
  }

  detenerPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  // Verificar mensajes nuevos
  verificarMensajesNuevos(): void {
    if (!this.contactoSeleccionado) return;

    const headers = this.buildAuthHeaders();
    if (!headers) return;

    this.http.get<Mensaje[]>(`${this.baseUrl}/mensajes/directo/${this.contactoSeleccionado}`, { headers })
      .subscribe({
        next: (nuevosMensajes) => {
          const mensajesActuales = this.mensajesPorContacto[this.contactoSeleccionado!] || [];

          if (nuevosMensajes.length > mensajesActuales.length) {
            // Hay mensajes nuevos
            const cantidadNuevos = nuevosMensajes.length - mensajesActuales.length;

            // Actualizar cache
            this.mensajesPorContacto[this.contactoSeleccionado!] = nuevosMensajes;

            if (this.isOpen && this.contactoSeleccionado) {
              // Si el chat está abierto y es el contacto actual, actualizar mensajes
              this.mensajes = nuevosMensajes;
              this.scrollToBottom(); // Smart scroll handles the logic
            } else {
              // Si el chat está cerrado, incrementar notificaciones
              this.unreadMessages += cantidadNuevos;
            }
          }
        },
        error: (err) => {
          console.error('❌ Error verificando mensajes nuevos:', err);
        }
      });
  }

  // Toggle del chat
  toggleChat(): void {
    this.isOpen = !this.isOpen;
    this.saveState();

    if (this.isOpen) {
      // Al abrir el chat, reiniciar notificaciones
      this.unreadMessages = 0;
      // Iniciar polling si hay un contacto seleccionado
      if (this.contactoSeleccionado) {
        this.iniciarPolling();
        // Ensure scroll on open
        this.scrollToBottom(true);
      }
    } else {
      // Al cerrar el chat, detener polling
      this.detenerPolling();
    }
  }
}