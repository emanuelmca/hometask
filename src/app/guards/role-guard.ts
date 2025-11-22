import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class MemberGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(): boolean {
    const token = localStorage.getItem('access_token');
    const rol = localStorage.getItem('rol_usuario');
  
    console.log(token, " _______________ ", rol);

    if (token && (rol === 'Hijo' || rol === 'Administrador')) {
      console.log('Acceso concedido por MemberGuard');
      return true;

    } else {
      this.router.navigate(['/login']);
      console.log('Acceso denegado por MemberGuard');
      return false;
    }

    return false;




  }
  
}
