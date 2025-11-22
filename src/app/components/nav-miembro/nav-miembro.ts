import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-nav-miembro',
  imports: [RouterModule, CommonModule],
  templateUrl: './nav-miembro.html',
  styleUrls: ['./nav-miembro.css']
})
export class NavMiembroComponent {
  userName = 'Alex';
  userMenuOpen = false;
  mobileMenuOpen = false;

   constructor(private router: Router, private authService: AuthService) {}

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