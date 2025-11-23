import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavMiembroComponent } from '../../components/nav-miembro/nav-miembro';
import { ChatFloatingComponent } from '../../components/chat-floating/chat-floating';
import { DashboardService } from '../../service/dashboard.service';

interface Evento {
    id: number;
    titulo: string;
    descripcion: string;
    fecha_hora: string;
    duracion_min: number;
    id_hogar: number;
    creado_por: number;
}

interface CalendarDay {
    date: Date;
    day: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    hasEvents: boolean;
    events: Evento[];
}

@Component({
    selector: 'app-eventos-miembro',
    imports: [CommonModule, NavMiembroComponent, ChatFloatingComponent],
    templateUrl: './eventos-miembro.html',
    styleUrls: ['./eventos-miembro.css']
})
export class EventosMiembroComponent implements OnInit {
    eventos: Evento[] = [];
    loading: boolean = true;
    error: string = '';

    // Calendar
    currentDate: Date = new Date();
    calendarDays: CalendarDay[] = [];
    selectedDate: Date | null = null;
    filteredEvents: Evento[] = [];

    // Month names
    monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    constructor(private dashboardService: DashboardService) { }

    ngOnInit(): void {
        this.loadEventos();
    }

    loadEventos(): void {
        this.loading = true;
        this.error = '';

        this.dashboardService.getEventosActuales().subscribe({
            next: (response) => {
                console.log('Eventos recibidos:', response);
                this.eventos = response;
                this.filteredEvents = response;
                this.generateCalendar();
                this.loading = false;
            },
            error: (error) => {
                console.error('Error al cargar eventos:', error);
                this.error = 'Error al cargar los eventos';
                this.loading = false;
            }
        });
    }

    generateCalendar(): void {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        // First day of the month
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        // Start from Sunday of the first week
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - startDate.getDay());

        // End on Saturday of the last week
        const endDate = new Date(lastDay);
        endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

        this.calendarDays = [];
        const currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const dateStr = this.formatDateForComparison(currentDate);
            const dayEvents = this.eventos.filter(evento => {
                const eventoDate = this.formatDateForComparison(new Date(evento.fecha_hora));
                return eventoDate === dateStr;
            });

            this.calendarDays.push({
                date: new Date(currentDate),
                day: currentDate.getDate(),
                isCurrentMonth: currentDate.getMonth() === month,
                isToday: this.isToday(currentDate),
                hasEvents: dayEvents.length > 0,
                events: dayEvents
            });

            currentDate.setDate(currentDate.getDate() + 1);
        }
    }

    formatDateForComparison(date: Date): string {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    isToday(date: Date): boolean {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    }

    selectDate(day: CalendarDay): void {
        this.selectedDate = day.date;
        if (day.hasEvents) {
            this.filteredEvents = day.events;
        } else {
            this.filteredEvents = [];
        }
    }

    previousMonth(): void {
        this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
        this.generateCalendar();
    }

    nextMonth(): void {
        this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
        this.generateCalendar();
    }

    resetFilter(): void {
        this.selectedDate = null;
        this.filteredEvents = this.eventos;
    }

    formatEventDate(fechaHora: string): string {
        const date = new Date(fechaHora);
        return date.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    formatEventTime(fechaHora: string): string {
        const date = new Date(fechaHora);
        return date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatDuration(minutes: number): string {
        if (minutes < 60) {
            return `${minutes} min`;
        }
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    }

    getCurrentMonthYear(): string {
        return `${this.monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
    }
}
