import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavComponent } from '../../components/nav/nav';
import { ChatFloatingComponent } from '../../components/chat-floating/chat-floating';
import { VirtualAssistantFabComponent } from '../../components/virtual-assistant-fab/virtual-assistant-fab';

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [CommonModule, NavComponent, RouterModule, FormsModule, ChatFloatingComponent,
    VirtualAssistantFabComponent],
  templateUrl: './members.html',
  styleUrls: ['./members.css'],
})
export class Members implements OnInit {

  miembros: any[] = [];
  loading = false;
  errorMessage = '';

  // Variables para el modal y nuevo miembro
  mostrarModal = false;
  agregandoMiembro = false;
  errorAgregar = '';
  editando = false;
  miembroEditando: any = null;

  nuevoMiembro = {
    nombre_completo: '',
    correo_electronico: '',
    contrasena: '',
    id_rol: '',
    id_hogar: 0
  };

  private baseUrl = 'http://127.0.0.1:8000';

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.verificarLocalStorage();
    this.lloadMembers();
  }

  verificarLocalStorage(): void {
    const token = localStorage.getItem('access_token');
    const idHogar = localStorage.getItem('id_hogar');
    
    console.log('🔍 Debug localStorage:');
    console.log('Token:', token ? '✅ Presente' : '❌ Ausente');
    console.log('ID Hogar:', idHogar || '❌ No encontrado');
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

  private getIdHogar(): number | null {
    try {
      const idHogar = localStorage.getItem('id_hogar');
      if (!idHogar) {
        console.warn('⚠️ No se encontró id_hogar en localStorage');
        return null;
      }
      const id = parseInt(idHogar);
      if (isNaN(id)) {
        console.error('❌ id_hogar no es un número válido:', idHogar);
        return null;
      }
      return id;
    } catch (error) {
      console.error('❌ Error al obtener id_hogar:', error);
      return null;
    }
  }

  lloadMembers(): void {
    const headers = this.buildAuthHeaders();
    const idHogar = this.getIdHogar();

    if (!headers) {
      this.errorMessage = 'No hay token. Inicia sesión.';
      return;
    }

    if (!idHogar) {
      this.errorMessage = 'No se encontró el ID del hogar.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    console.log('🔍 Cargando miembros para hogar:', idHogar);

    this.http.get<any[]>(`${this.baseUrl}/miembros/hogar/${idHogar}`, { headers })
      .subscribe({
        next: (resp) => {
          console.log('✅ Miembros cargados:', resp);
          this.miembros = resp;
          this.loading = false;
        },
        error: (err) => {
          console.error('❌ Error al cargar miembros:', err);
          if (err.status === 404) {
            this.errorMessage = 'No se encontraron miembros para este hogar.';
          } else if (err.status === 401) {
            this.errorMessage = 'No autorizado. Token inválido o expirado.';
          } else if (err.status === 0) {
            this.errorMessage = 'Error de conexión. Verifica que el servidor esté ejecutándose.';
          } else {
            this.errorMessage = `Error al cargar los miembros: ${err.message}`;
          }
          this.loading = false;
        },
      });
  }

  // -----------------------------
  // AGREGAR NUEVO MIEMBRO
  // -----------------------------
  abrirModalAgregar(): void {
    const idHogar = this.getIdHogar();
    if (!idHogar) {
      alert('No se encontró el ID del hogar. Inicia sesión nuevamente.');
      return;
    }

    this.editando = false;
    this.miembroEditando = null;
    this.nuevoMiembro = {
      nombre_completo: '',
      correo_electronico: '',
      contrasena: '',
      id_rol: '',
      id_hogar: idHogar
    };
    this.errorAgregar = '';
    this.mostrarModal = true;
  }

  // -----------------------------
  // EDITAR MIEMBRO
  // -----------------------------
  editarMiembro(miembro: any): void {
    this.editando = true;
    this.miembroEditando = miembro;
    this.nuevoMiembro = {
      nombre_completo: miembro.nombre_completo,
      correo_electronico: miembro.correo_electronico,
      contrasena: '', // No requerido en edición
      id_rol: miembro.id_rol?.toString() || miembro.rol?.id.toString() || '',
      id_hogar: miembro.id_hogar
    };
    this.errorAgregar = '';
    this.mostrarModal = true;
  }

  // -----------------------------
  // GUARDAR MIEMBRO (AGREGAR O EDITAR)
  // -----------------------------
  agregarMiembro(): void {
    const headers = this.buildAuthHeaders();
    if (!headers) {
      this.errorAgregar = 'No hay token. Inicia sesión.';
      return;
    }

    // Validaciones diferentes para agregar vs editar
    if (this.editando) {
      // Validación para edición - contraseña NO es obligatoria
      if (!this.nuevoMiembro.nombre_completo ||
          !this.nuevoMiembro.correo_electronico ||
          !this.nuevoMiembro.id_rol) {
        this.errorAgregar = 'Nombre, correo y rol son obligatorios.';
        return;
      }
    } else {
      // Validación para nuevo miembro - contraseña SÍ es obligatoria
      if (!this.nuevoMiembro.nombre_completo ||
          !this.nuevoMiembro.correo_electronico ||
          !this.nuevoMiembro.contrasena ||
          !this.nuevoMiembro.id_rol) {
        this.errorAgregar = 'Todos los campos son obligatorios.';
        return;
      }

      if (this.nuevoMiembro.contrasena.length < 6) {
        this.errorAgregar = 'La contraseña debe tener al menos 6 caracteres.';
        return;
      }
    }

    this.agregandoMiembro = true;
    this.errorAgregar = '';

    if (this.editando) {
      this.actualizarMiembro();
    } else {
      this.crearMiembro();
    }
  }

  private crearMiembro(): void {
    const headers = this.buildAuthHeaders();
    if (!headers) return;

    console.log('📤 Creando nuevo miembro:', this.nuevoMiembro);

    this.http.post(
      `${this.baseUrl}/miembros`,
      this.nuevoMiembro,
      { headers }
    ).subscribe({
      next: (resp: any) => {
        console.log('✅ Miembro creado:', resp);
        this.miembros.push(resp);
        this.cerrarModal();
        alert('✅ Miembro agregado correctamente');
      },
      error: (err) => {
        console.error('❌ Error al crear miembro:', err);
        this.handleError(err);
        this.agregandoMiembro = false;
      }
    });
  }

  private actualizarMiembro(): void {
    const headers = this.buildAuthHeaders();
    if (!headers) return;

    // Preparar datos para la actualización - solo enviar campos modificados
    const datosActualizacion: any = {
      nombre_completo: this.nuevoMiembro.nombre_completo,
      correo_electronico: this.nuevoMiembro.correo_electronico,
      id_rol: parseInt(this.nuevoMiembro.id_rol)
    };

    // Solo incluir contraseña si se proporcionó una nueva
    if (this.nuevoMiembro.contrasena && this.nuevoMiembro.contrasena.length >= 6) {
      datosActualizacion.contrasena = this.nuevoMiembro.contrasena;
    }

    console.log('📤 Actualizando miembro:', datosActualizacion);

    this.http.patch(
      `${this.baseUrl}/miembros/${this.miembroEditando.id}`,
      datosActualizacion,
      { headers }
    ).subscribe({
      next: (resp: any) => {
        console.log('✅ Miembro actualizado:', resp);
        // Actualizar el miembro en la lista
        const index = this.miembros.findIndex(m => m.id === this.miembroEditando.id);
        if (index !== -1) {
          this.miembros[index] = { ...this.miembros[index], ...resp };
        }
        this.cerrarModal();
        alert('✅ Miembro actualizado correctamente');
      },
      error: (err) => {
        console.error('❌ Error al actualizar miembro:', err);
        this.handleError(err);
        this.agregandoMiembro = false;
      }
    });
  }

  private handleError(err: any): void {
    if (err.status === 400) {
      this.errorAgregar = 'El correo electrónico ya está en uso.';
    } else if (err.status === 401) {
      this.errorAgregar = 'No autorizado. Token inválido.';
    } else if (err.status === 422) {
      this.errorAgregar = 'Datos inválidos. Verifica la información.';
    } else {
      this.errorAgregar = 'Error al procesar la solicitud. Intenta nuevamente.';
    }
  }

  // -----------------------------
  // CAMBIAR ESTADO (ACTIVAR/DESACTIVAR)
  // -----------------------------
  cambiarEstado(miembro: any): void {
    const accion = miembro.estado ? 'desactivar' : 'activar';
    const confirmacion = confirm(
      `¿Estás seguro de que quieres ${accion} a ${miembro.nombre_completo}?`
    );

    if (!confirmacion) return;

    const headers = this.buildAuthHeaders();
    if (!headers) {
      alert('No hay token. Inicia sesión.');
      return;
    }

    // Usar PATCH para cambiar el estado
    this.http.patch(
      `${this.baseUrl}/miembros/${miembro.id}`,
      { estado: !miembro.estado },
      { headers }
    ).subscribe({
      next: (resp: any) => {
        miembro.estado = !miembro.estado;
        alert(`✅ Miembro ${accion}do correctamente`);
      },
      error: (err) => {
        console.error('❌ Error al cambiar estado:', err);
        alert('❌ Error al cambiar el estado del miembro.');
      }
    });
  }

  // -----------------------------
  // CERRAR MODAL
  // -----------------------------
  cerrarModal(): void {
    this.mostrarModal = false;
    this.agregandoMiembro = false;
    this.editando = false;
    this.miembroEditando = null;
    this.errorAgregar = '';
  }

  // -----------------------------
  // EDITAR NOMBRE RÁPIDO (OPCIONAL - MANTENER SI LO USAS)
  // -----------------------------
  editarNombre(miembro: any): void {
    const nuevoNombre = prompt("Escribe el nuevo nombre:", miembro.nombre_completo);
    if (!nuevoNombre || nuevoNombre.trim() === "") return;

    const headers = this.buildAuthHeaders();
    if (!headers) {
      alert("No hay token. Inicia sesión.");
      return;
    }

    this.http.patch(
      `${this.baseUrl}/miembros/${miembro.id}`,
      { nombre_completo: nuevoNombre },
      { headers }
    ).subscribe({
      next: (resp: any) => {
        miembro.nombre_completo = nuevoNombre;
        alert("Nombre actualizado correctamente ✔️");
      },
      error: (err) => {
        console.error("❌ Error en PATCH:", err);
        alert("❌ Error al actualizar el nombre.");
      }
    });
  }
}