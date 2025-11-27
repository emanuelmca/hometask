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

    this.http.post<any>('http://127.0.0.1:8000/auth/login', payload).subscribe({
      next: (response) => {
        const token = response.access_token;

        const decoded = this.decodeToken(token);
        const rol = decoded?.rol;


        localStorage.setItem('rol_usuario', rol);

        const miembroId = response.id_miembro;
        const idHogar = response.id_hogar;

        this.authService.setToken(token);
        localStorage.setItem('id_hogar', idHogar);
        localStorage.setItem('id_miembro', miembroId);


        const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`
        });


        const nombre = localStorage.getItem('rol_usuario') || 'Usuario';
        this.authService.setUserName(nombre);


        this.loading = false;
        this.successMessage = `Bienvenido, ${nombre}`;

        // ⬇️ Redirección según rol
        setTimeout(() => {

          if (rol === "Administrador") {
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
