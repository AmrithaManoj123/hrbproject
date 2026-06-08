import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent) },
  // Customer pages are guarded separately from agent/admin pages so URL access matches the user's role.
  {
    path: 'customer/dashboard',
    canActivate: [authGuard, roleGuard('customer')],
    loadComponent: () => import('./pages/customer-dashboard/customer-dashboard.component').then(m => m.CustomerDashboardComponent)
  },
  {
    path: 'customer/tickets',
    canActivate: [authGuard, roleGuard('customer')],
    loadComponent: () => import('./pages/ticket-detail/ticket-detail.component').then(m => m.TicketDetailComponent)
  },
  {
    path: 'customer/tickets/new',
    canActivate: [authGuard, roleGuard('customer')],
    loadComponent: () => import('./pages/create-ticket/create-ticket.component').then(m => m.CreateTicketComponent)
  },
  {
    path: 'customer/tickets/:id',
    canActivate: [authGuard, roleGuard('customer')],
    loadComponent: () => import('./pages/ticket-detail/ticket-detail.component').then(m => m.TicketDetailComponent)
  },
  // Agent routes focus on assigned work and ticket handling tools.
  {
    path: 'agent/dashboard',
    canActivate: [authGuard, roleGuard('agent')],
    loadComponent: () => import('./pages/agent-dashboard/agent-dashboard.component').then(m => m.AgentDashboardComponent)
  },
  {
    path: 'agent/tickets',
    canActivate: [authGuard, roleGuard('agent')],
    loadComponent: () => import('./pages/workbench/workbench.component').then(m => m.WorkbenchComponent)
  },
  {
    path: 'agent/sla-alerts',
    canActivate: [authGuard, roleGuard('agent')],
    loadComponent: () => import('./pages/workbench/workbench.component').then(m => m.WorkbenchComponent)
  },
  {
    path: 'agent/reports',
    canActivate: [authGuard, roleGuard('agent')],
    loadComponent: () => import('./pages/workbench/workbench.component').then(m => m.WorkbenchComponent)
  },
  {
    path: 'agent/tickets/:id',
    canActivate: [authGuard, roleGuard('agent')],
    loadComponent: () => import('./pages/agent-ticket-detail/agent-ticket-detail.component').then(m => m.AgentTicketDetailComponent)
  },
  // Admin routes use broader workbench/detail components because admins can review, assign, and configure system data.
  {
    path: 'admin/dashboard',
    canActivate: [authGuard, roleGuard('admin')],
    loadComponent: () => import('./pages/admin-panel/admin-panel.component').then(m => m.AdminPanelComponent)
  },
  {
    path: 'admin/review-queue',
    canActivate: [authGuard, roleGuard('admin')],
    loadComponent: () => import('./pages/review-queue/review-queue.component').then(m => m.ReviewQueueComponent)
  },
  {
    path: 'admin/teams',
    canActivate: [authGuard, roleGuard('admin')],
    loadComponent: () => import('./pages/teams/teams.component').then(m => m.TeamsComponent)
  },
  {
    path: 'admin/tickets',
    canActivate: [authGuard, roleGuard('admin')],
    loadComponent: () => import('./pages/workbench/workbench.component').then(m => m.WorkbenchComponent)
  },
  {
    path: 'admin/tickets/:id',
    canActivate: [authGuard, roleGuard('admin')],
    loadComponent: () => import('./pages/agent-ticket-detail/agent-ticket-detail.component').then(m => m.AgentTicketDetailComponent)
  },
  {
    path: 'admin/categories',
    canActivate: [authGuard, roleGuard('admin')],
    loadComponent: () => import('./pages/workbench/workbench.component').then(m => m.WorkbenchComponent)
  },
  {
    path: 'admin/agents',
    canActivate: [authGuard, roleGuard('admin')],
    loadComponent: () => import('./pages/workbench/workbench.component').then(m => m.WorkbenchComponent)
  },
  {
    path: 'admin/reports',
    canActivate: [authGuard, roleGuard('admin')],
    loadComponent: () => import('./pages/workbench/workbench.component').then(m => m.WorkbenchComponent)
  },
  {
    path: 'admin/sla-monitoring',
    canActivate: [authGuard, roleGuard('admin')],
    loadComponent: () => import('./pages/workbench/workbench.component').then(m => m.WorkbenchComponent)
  },
  {
    path: 'admin/settings',
    canActivate: [authGuard, roleGuard('admin')],
    loadComponent: () => import('./pages/workbench/workbench.component').then(m => m.WorkbenchComponent)
  },
  { path: '**', redirectTo: 'login' }
];
