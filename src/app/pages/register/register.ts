import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthRegisterService } from '../../service/auth-register.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,RouterModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent {

  private fb = inject(FormBuilder);
  private authService = inject(AuthRegisterService);
  private router = inject(Router);

  loading = false;
  message = '';

  registerForm = this.fb.group({
    nombre_completo: ['', Validators.required],
    correo_electronico: ['', [Validators.required, Validators.email]],
    contrasena: ['', [Validators.required, Validators.minLength(6)]],
    id_rol: [2, Validators.required],  // usuario por defecto
  });

  onSubmit() {
  if (this.registerForm.invalid) {
    this.message = 'Completa todos los campos correctamente';
    return;
  }

  this.loading = true;

  const data = {
    ...this.registerForm.value,
    id_rol: Number(1)
  
  } as any;

  this.authService.registrar(data).subscribe({
    next: (resp) => {
      this.loading = false;

      // Guardar token e info
      localStorage.setItem('token', resp.access_token);
      localStorage.setItem('id_hogar', resp.id_hogar.toString());
      localStorage.setItem('id_miembro', resp.id_miembro.toString());

      this.message = 'Registro exitoso';

      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 1000);
    },
    error: (err) => {
      this.loading = false;
      console.error(err);

      // Capturamos mensaje del backend si viene:
      this.message = err.error?.detail || 'Error al registrar. Revisa los datos.';
    }
  });
}

}
