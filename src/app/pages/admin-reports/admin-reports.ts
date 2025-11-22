import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavComponent } from '../../components/nav/nav';
import { ChatFloatingComponent } from '../../components/chat-floating/chat-floating';

// Interfaces for chart data
interface ActivityData {
    day: string;
    hours: number;
}

interface ReceivedData {
    date: number;
    count: number;
}

interface ProgressStats {
    percentage: number;
    inProgress: number;
    completed: number;
}

interface CategoryData {
    name: string;
    icon: string;
    tasks: number;
    hours: number;
}

interface UserPerformanceData {
    date: string;
    tasksCompleted: number;
}

@Component({
    selector: 'app-admin-reports',
    standalone: true,
    imports: [CommonModule, NavComponent, ChatFloatingComponent],
    templateUrl: './admin-reports.html',
    styleUrls: ['./admin-reports.css', './iframe-fullwidth.css']
})
export class AdminReportsComponent implements OnInit {
    // Activity data (last 7 days)
    activityData: ActivityData[] = [
        { day: 'Mon', hours: 2.1 },
        { day: 'Tue', hours: 3.5 },
        { day: 'Wed', hours: 4.8 },
        { day: 'Thu', hours: 3.2 },
        { day: 'Fri', hours: 6.5 },
        { day: 'Sat', hours: 4.0 },
        { day: 'Sun', hours: 5.2 }
    ];

    maxActivityHours: number = 7;
    averageActivityHours: number = 4.2;

    // Received statistics (last 30 days - showing last 10 days)
    receivedData: ReceivedData[] = [
        { date: 12, count: 45 },
        { date: 13, count: 38 },
        { date: 14, count: 28 },
        { date: 15, count: 35 },
        { date: 16, count: 95 },
        { date: 17, count: 52 },
        { date: 18, count: 42 },
        { date: 19, count: 58 },
        { date: 20, count: 48 }
    ];

    maxReceivedCount: number = 100;

    // Progress statistics
    progressStats: ProgressStats = {
        percentage: 64,
        inProgress: 8934,
        completed: 595
    };

    // Category breakdown (adapted from "By platform")
    categoryData: CategoryData[] = [
        { name: 'Limpieza', icon: '🧹', tasks: 8, hours: 12.5 },
        { name: 'Cocina', icon: '🍳', tasks: 5, hours: 8.5 },
        { name: 'Compras', icon: '🛒', tasks: 3, hours: 4.2 },
        { name: 'Jardín', icon: '🌱', tasks: 8, hours: 2.5 },
        { name: 'Mantenimiento', icon: '🔧', tasks: 2, hours: 8.0 }
    ];

    // User performance report (last 30 days)
    userPerformanceData: UserPerformanceData[] = [];
    monthlyTasksCompleted: number = 487;
    monthlyGrowth: string = '+24.3%';
    averageTasksPerUser: number = 12.8;
    userGrowth: string = '+15.2%';

    ngOnInit(): void {
        this.generateUserPerformanceData();
    }

    // Generate user performance trend data
    generateUserPerformanceData(): void {
        const baseValue = 15;
        for (let i = 0; i < 30; i++) {
            const variation = Math.sin(i / 3) * 25 + Math.random() * 15;
            this.userPerformanceData.push({
                date: `Day ${i + 1}`,
                tasksCompleted: Math.max(5, Math.round(baseValue + variation + i * 1.5))
            });
        }
    }

    // Helper methods for chart rendering
    getActivityBarHeight(hours: number): number {
        return (hours / this.maxActivityHours) * 100;
    }

    getReceivedBarHeight(count: number): number {
        return (count / this.maxReceivedCount) * 100;
    }

    getUserPerformancePath(): string {
        if (this.userPerformanceData.length === 0) return '';

        const width = 600;
        const height = 200;
        const maxValue = Math.max(...this.userPerformanceData.map(d => d.tasksCompleted));
        const xStep = width / (this.userPerformanceData.length - 1);

        let path = '';
        this.userPerformanceData.forEach((d, i) => {
            const x = i * xStep;
            const y = height - (d.tasksCompleted / maxValue) * height;
            path += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
        });

        return path;
    }

    getUserPerformanceAreaPath(): string {
        const linePath = this.getUserPerformancePath();
        if (!linePath) return '';

        return `${linePath} L 600 200 L 0 200 Z`;
    }
}
