import { Component, OnInit } from '@angular/core';
import { NavMiembroComponent } from '../../components/nav-miembro/nav-miembro';
import { CommonModule } from '@angular/common';
import { ChatFloatingComponent } from "../../components/chat-floating/chat-floating";


interface Task {
  id: number;
  title: string;
  completed: boolean;
  urgent: boolean;
}

interface Event {
  id: number;
  number: string;
  title: string;
  date: string;
  completed: boolean;
}

interface ShoppingItem {
  id: number;
  name: string;
  completed: boolean;
}

@Component({
  selector: 'app-member-dashboard',
  imports: [NavMiembroComponent, CommonModule, ChatFloatingComponent],
  templateUrl: './dash-miembro.html',
  styleUrls: ['./dash-miembro.css']
})
export class MemberDashboardComponent implements OnInit {
  
  tasks: Task[] = [
    { id: 1, title: 'Sacar la basura', completed: false, urgent: true },
    { id: 2, title: 'Pasear al perro', completed: false, urgent: true },
    { id: 3, title: 'Llamar al fontanero', completed: false, urgent: true },
    { id: 4, title: 'Preparar la cena para las 20h', completed: false, urgent: false }
  ];

  events: Event[] = [
    { id: 1, number: '1', title: 'Cena con los abuelos', date: 'Hoy, 2000h', completed: false },
    { id: 2, number: '2', title: 'Partido de fútbol de Leo', date: 'Mañana, 1100h', completed: true }
  ];

  shoppingList: ShoppingItem[] = [
    { id: 1, name: 'Leche', completed: false },
    { id: 2, name: 'Pan integral', completed: true },
    { id: 3, name: 'Huevos (una docena)', completed: false },
    { id: 4, name: 'Aguacates', completed: false }
  ];

  constructor() { }

  ngOnInit(): void {
  }

  toggleTask(taskId: number): void {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
    }
  }

  toggleShoppingItem(itemId: number): void {
    const item = this.shoppingList.find(i => i.id === itemId);
    if (item) {
      item.completed = !item.completed;
    }
  }

  toggleEvent(eventId: number): void {
    const event = this.events.find(e => e.id === eventId);
    if (event) {
      event.completed = !event.completed;
    }
  }
}