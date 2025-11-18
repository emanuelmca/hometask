import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userNameSource = new BehaviorSubject<string>('Invitado');
  currentUserName = this.userNameSource.asObservable();

  constructor() {
    const storedName = localStorage.getItem('nombre_usuario');
    if (storedName) {
      this.userNameSource.next(storedName);
    }
  }

  setUserName(name: string) {
    localStorage.setItem('nombre_usuario', name);
    this.userNameSource.next(name);
  }

  getUserName(): string {
    return localStorage.getItem('nombre_usuario') || 'Invitado';
  }

  clearUserData() {
    localStorage.clear();
    this.userNameSource.next('Invitado');
  }
}
