import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { RegisterComponent } from './pages/register/register';

import { AdminDashboard } from './pages/admin-dashboard/admin-dashboard';
import { Members } from './pages/members/members';
import { MemberGuard } from './guards/role-guard';
import { TasksComponent } from './pages/gestion-tareas/gestion-tareas';
import { EventsComponent } from './pages/gestion-eventos/gestion-eventos';
import { MemberDashboardComponent } from './pages/dash-miembro/dash-miembro';




export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: AdminDashboard, canActivate: [MemberGuard] },
  { path: 'members', component: Members, canActivate: [MemberGuard] },
  { path: 'tasks', component: TasksComponent, canActivate: [MemberGuard] },
  { path: 'events', component: EventsComponent, canActivate: [MemberGuard] },
  {path: 'dash-miembro', component: MemberDashboardComponent, canActivate: [MemberGuard]},
  { path: '**', redirectTo: '/login' },

];
