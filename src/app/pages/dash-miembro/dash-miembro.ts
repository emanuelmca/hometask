import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NavMiembroComponent } from '../../components/nav-miembro/nav-miembro';
import { CommonModule } from '@angular/common';
import { ChatFloatingComponent } from "../../components/chat-floating/chat-floating";
import { DashboardService } from '../../service/dashboard.service';

interface Task {
  id: number;
  titulo: string;
  descripcion: string;
  estado: string;
  prioridad: string;
  fecha_vencimiento: string;
  categoria?: string;
}

interface Event {
  id: number;
  titulo: string;
  descripcion: string;
  fecha: string;
  hora: string;
  estado: string;
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

  tasks: Task[] = [];
  events: Event[] = [];
  loading: boolean = true;
  error: string = '';
  memberName: string = 'Usuario';

  shoppingList: ShoppingItem[] = [
    { id: 1, name: 'Leche', completed: false },
    { id: 2, name: 'Pan integral', completed: true },
    { id: 3, name: 'Huevos (una docena)', completed: false },
    { id: 4, name: 'Aguacates', completed: false }
  ];

  constructor(
    private dashboardService: DashboardService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadMemberName();
    this.loadDashboardData();
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
          this.memberName = miembroActual.nombre_completo;
          console.log('✅ Nombre del miembro cargado:', this.memberName);
        }
      },
      error: (error) => {
        console.error('Error al cargar datos del miembro:', error);
      }
    });
  }

  loadDashboardData(): void {
    this.loading = true;

    // Cargar tareas del miembro
    this.dashboardService.getMisTareas().subscribe({
      next: (response) => {
        console.log('Tareas recibidas:', response);
        this.tasks = response.tareas || response || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar tareas:', error);
        this.error = 'Error al cargar las tareas';
        this.loading = false;
      }
    });

    // Cargar eventos activos
    this.dashboardService.getEventosActivos().subscribe({
      next: (response) => {
        console.log('Eventos recibidos:', response);
        this.events = response.eventos || response || [];
      },
      error: (error) => {
        console.error('Error al cargar eventos:', error);
      }
    });
  }

  isTaskUrgent(task: Task): boolean {
    return task.prioridad === 'alta' || task.prioridad === 'urgente';
  }

  isTaskCompleted(task: Task): boolean {
    return task.estado === 'completada' || task.estado === 'finalizada';
  }

  goToTaskDetail(taskId: number): void {
    this.router.navigate(['/task', taskId]);
  }

  toggleShoppingItem(itemId: number): void {
    const item = this.shoppingList.find(i => i.id === itemId);
    if (item) {
      item.completed = !item.completed;
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Mañana';
    } else {
      return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    }
  }

  getEventNumber(index: number): string {
    return (index + 1).toString();
  }
}