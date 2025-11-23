import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../service/auth.service';
import { DashboardService } from '../../service/dashboard.service';

@Component({
  selector: 'app-nav-miembro',
  imports: [RouterModule, CommonModule],
  templateUrl: './nav-miembro.html',
  styleUrls: ['./nav-miembro.css']
})
export class NavMiembroComponent implements OnInit {
  userName = 'Usuario';
  userMenuOpen = false;
  mobileMenuOpen = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private dashboardService: DashboardService
  ) { }

  ngOnInit(): void {
    this.loadMemberName();
  }

  // Cargar nombre del miembro desde la API
  loadMemberName(): void {
    const idHogar = localStorage.getItem('id_hogar');
    const idMiembro = localStorage.getItem('id_miembro');

    if (!idHogar || !idMiembro) {
      console.error('No se encontró id_hogar o id_miembro en localStorage');
      return;
    }

    this.dashboardService.getMiembrosHogar(parseInt(idHogar)).subscribe({
      next: (miembros: any[]) => {
        const miembroActual = miembros.find(m => m.id === parseInt(idMiembro));
        if (miembroActual) {
          this.userName = miembroActual.nombre_completo;
          console.log('✅ Nombre del miembro cargado en nav:', this.userName);
        }
      },
      error: (error) => {
        console.error('Error al cargar datos del miembro:', error);
      }
    });
  }

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeUserMenu(): void {
    this.userMenuOpen = false;
  }

  // Método para cerrar sesión
  logout(): void {
    this.authService.clearUserData();
    console.log('Cerrando sesión...');
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}