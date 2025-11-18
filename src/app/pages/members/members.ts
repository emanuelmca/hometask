import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { NavComponent } from '../../components/nav/nav';

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [CommonModule, NavComponent, RouterModule],
  templateUrl: './members.html',
  styleUrls: ['./members.css'],
})
export class Members implements OnInit {

  miembros: any[] = [];
  loading = false;
  errorMessage = '';

  private baseUrl = 'http://127.0.0.1:8000';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.lloadMembers();
  }

  private buildAuthHeaders(): HttpHeaders | null {
    const token = localStorage.getItem('access_token');
    if (!token) return null;

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  lloadMembers(): void {
    const headers = this.buildAuthHeaders();

    if (!headers) {
      this.errorMessage = 'No hay token. Inicia sesión.';
      return;
    }

    const idHogar = 1; // <-- AJUSTA ESTE ID SEGÚN TU LOGIN REAL

    this.loading = true;

    this.http.get<any[]>(`${this.baseUrl}/miembros/hogar/${idHogar}`, { headers })
      .subscribe({
        next: (resp) => {
          this.miembros = resp;
          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = 'Error al cargar los miembros.';
          this.loading = false;
        },
      });
  }

  // -----------------------------
  //   EDITAR NOMBRE DE MIEMBRO
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
    `${this.baseUrl}/miembros/${miembro.id}`,   // 🔥 Ahora sí es PATCH
    { nombre_completo: nuevoNombre },
    { headers }
  ).subscribe({
    next: () => {
      miembro.nombre_completo = nuevoNombre; // Actualiza sin recargar
      alert("Nombre actualizado correctamente ✔️");
    },
    error: (err) => {
      console.error("❌ Error en PATCH:", err);
      alert("❌ Error al actualizar el nombre.");
    }
  });
}
}
