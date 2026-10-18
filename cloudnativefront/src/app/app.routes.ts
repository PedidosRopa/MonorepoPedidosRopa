import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'productos' },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'productos',
    loadComponent: () => import('./pages/productos/productos').then((m) => m.ProductosComponent),
  },
  {
    path: 'nuevo-pedido',
    loadComponent: () => import('./pages/nuevo-pedido/nuevo-pedido').then((m) => m.NuevoPedidoComponent),
    canActivate: [MsalGuard],
  },
  {
    path: 'pedidos',
    loadComponent: () => import('./pages/pedidos/pedidos').then((m) => m.PedidosComponent),
    canActivate: [MsalGuard],
  },
  {
    path: 'admin-rabbit',
    loadComponent: () => import('./pages/admin-rabbit/admin-rabbit').then((m) => m.AdminRabbitComponent),
    canActivate: [MsalGuard],
  },
  { path: '**', redirectTo: 'productos' },
];
