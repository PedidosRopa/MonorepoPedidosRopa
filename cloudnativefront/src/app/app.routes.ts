import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { roleGuard } from './guards/role.guard';
import { pedidoAccessGuard } from './guards/pedido-access.guard';

export const routes: Routes = [
  // Ruta raíz pública: Landing page (sin MSAL)
  { path: '', pathMatch: 'full', redirectTo: 'landing' },
  {
    path: 'landing',
    loadComponent: () => import('./pages/landing/landing').then((m) => m.LandingComponent),
  },

  // Autenticación (pública)
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.LoginComponent),
  },

  // Catálogo público (lectura sin login; crear/eliminar requiere login)
  {
    path: 'productos',
    loadComponent: () => import('./pages/productos/productos').then((m) => m.ProductosComponent),
  },

  // Rutas protegidas por autenticación (MsalGuard)
  {
    path: 'pedidos',
    loadComponent: () => import('./pages/pedidos/pedidos').then((m) => m.PedidosComponent),
    canActivate: [MsalGuard],
  },
  {
    path: 'pedidos/:id/tracker',
    loadComponent: () => import('./pages/pedido-tracker/pedido-tracker').then((m) => m.PedidoTrackerComponent),
    canActivate: [MsalGuard, pedidoAccessGuard],
  },
  {
    path: 'nuevo-pedido',
    loadComponent: () => import('./pages/nuevo-pedido/nuevo-pedido').then((m) => m.NuevoPedidoComponent),
    canActivate: [MsalGuard],
  },
  {
    path: 'perfil',
    loadComponent: () => import('./pages/perfil/perfil').then((m) => m.PerfilComponent),
    canActivate: [MsalGuard],
  },

  // Rutas solo ADMINISTRADOR
  {
    path: 'admin-rabbit',
    loadComponent: () => import('./pages/admin-rabbit/admin-rabbit').then((m) => m.AdminRabbitComponent),
    canActivate: [MsalGuard, roleGuard],
    data: { role: 'ADMINISTRADOR' },
  },
  {
    path: 'admin-kafka',
    loadComponent: () => import('./pages/admin-kafka/admin-kafka').then((m) => m.AdminKafkaComponent),
    canActivate: [MsalGuard, roleGuard],
    data: { role: 'ADMINISTRADOR' },
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin-dashboard/admin-dashboard').then((m) => m.AdminDashboardComponent),
    canActivate: [MsalGuard, roleGuard],
    data: { role: 'ADMINISTRADOR' },
  },

  // Ruta solo REPARTIDOR (y ADMINISTRADOR por herencia de roleGuard)
  {
    path: 'repartidor',
    loadComponent: () => import('./pages/repartidor-dashboard/repartidor-dashboard').then((m) => m.RepartidorDashboardComponent),
    canActivate: [MsalGuard, roleGuard],
    data: { role: 'REPARTIDOR' },
  },

  { path: '**', redirectTo: 'landing' },
];
