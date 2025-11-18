import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { RegisterComponent } from './pages/register/register';

import { AdminDashboard } from './pages/admin-dashboard/admin-dashboard';
import { Members } from './pages/members/members';
import { MemberGuard } from './guards/role-guard';
import { DashboardMember } from './features/member/dashboard-member/dashboard-member';


export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: AdminDashboard, canActivate: [MemberGuard] },
  { path: 'members', component: Members, canActivate: [MemberGuard] },
  {path: 'dashboard-member', component: DashboardMember, canActivate: [MemberGuard]},
  { path: '**', redirectTo: '/login' }

];
