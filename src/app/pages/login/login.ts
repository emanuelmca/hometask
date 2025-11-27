import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  correo_electronico = '';
  contrasena = '';
  errorMessage = '';
  successMessage = '';
  loading = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) { }

  login() {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = {
      correo_electronico: this.correo_electronico,
      contrasena: this.contrasena
    };

    console.log('📤 [Login] Enviando solicitud:', { ...payload, contrasena: '***' });

    this.http.post<any>('http://127.0.0.1:8000/auth/login', payload).subscribe({
      next: (response) => {
        console.log('✅ [Login] Respuesta recibida:', response);
        const token = response.access_token;

        // El rol viene directamente en la respuesta, no en el token decodificado
        const rolObj = response.rol;
        const rolId = rolObj?.id;
        const rolNombre = rolObj?.nombre;

        console.log('👤 [Login] Rol detectado:', { id: rolId, nombre: rolNombre });

        // Guardar rol_usuario (nombre) para compatibilidad y uso en UI
        if (rolNombre) {
          localStorage.setItem('rol_usuario', rolNombre);
        }

        // Guardar IDs usando AuthService
        this.authService.setToken(token);

        if (rolId) {
          this.authService.setRoleId(rolId);
        } else {
          console.warn('⚠️ No se encontró rol.id en la respuesta.');
        }

        // id_miembro y id_hogar vienen en la respuesta del login
        const miembroId = response.id_miembro;
        const idHogar = response.id_hogar;

        this.authService.setMemberId(miembroId);
        this.authService.setHomeId(idHogar);

        // Usar el nombre del rol como nombre de usuario por ahora (según lógica anterior)
        this.authService.setUserName(rolNombre || 'Usuario');

        this.loading = false;
        this.successMessage = `Bienvenido, ${rolNombre}`;

        // ⬇️ Redirección según rol
        setTimeout(() => {
          if (rolNombre === "Administrador") {
            this.router.navigate(['/dashboard']);
          }
          else {
            console.log("Redirigiendo a dash-miembro");
            this.router.navigate(['/dash-miembro']);
          }
        }, 1500);

      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.errorMessage = 'Correo o contraseña incorrectos.';
      }
    });
  }

  decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch (e) {
      console.error("Error decoding token", e);
      return null;
    }
  }
}
