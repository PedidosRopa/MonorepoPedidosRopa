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
    path: 'pedidos',
    loadComponent: () => import('./pages/pedidos/pedidos').then((m) => m.PedidosComponent),
    canActivate: [MsalGuard],
  },
  { path: '**', redirectTo: 'productos' },
];
