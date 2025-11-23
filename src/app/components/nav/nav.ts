import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../service/auth.service';
import { routes } from '../../app.routes';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../service/dashboard.service';

@Component({
  selector: 'app-nav',
  imports: [RouterModule, CommonModule],
  templateUrl: './nav.html',
  styleUrls: ['./nav.css']
})
export class NavComponent implements OnInit {

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
          console.log('✅ Nombre del admin cargado en nav:', this.userName);
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
