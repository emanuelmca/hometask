import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { RegisterComponent } from './pages/register/register';

import { AdminDashboard } from './pages/admin-dashboard/admin-dashboard';
import { AdminReportsComponent } from './pages/admin-reports/admin-reports';
import { Members } from './pages/members/members';
import { MemberGuard } from './guards/role-guard';
import { TasksComponent } from './pages/gestion-tareas/gestion-tareas';
import { EventsComponent } from './pages/gestion-eventos/gestion-eventos';
import { MemberDashboardComponent } from './pages/dash-miembro/dash-miembro';
import { TaskDetailComponent } from './pages/task-detail/task-detail';
import { MessagingComponent } from './pages/messaging/messaging';
import { AssistantChatComponent } from './pages/assistant-chat/assistant-chat';
import { EventosMiembroComponent } from './pages/eventos-miembro/eventos-miembro';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: AdminDashboard, canActivate: [MemberGuard] },
  { path: 'members', component: Members, canActivate: [MemberGuard] },
  { path: 'tasks', component: TasksComponent, canActivate: [MemberGuard] },
  { path: 'events', component: EventsComponent, canActivate: [MemberGuard] },
  { path: 'dash-miembro', component: MemberDashboardComponent, canActivate: [MemberGuard] },
  { path: 'task-detail/:id', component: TaskDetailComponent, canActivate: [MemberGuard] },
  { path: 'messages/:memberId', component: MessagingComponent, canActivate: [MemberGuard] },
  { path: 'assistant', component: AssistantChatComponent, canActivate: [MemberGuard] },
  { path: 'admin/reports', component: AdminReportsComponent, canActivate: [MemberGuard] },
  { path: 'eventos-miembro', component: EventosMiembroComponent, canActivate: [MemberGuard] },
  { path: '**', redirectTo: '/login' }
];
