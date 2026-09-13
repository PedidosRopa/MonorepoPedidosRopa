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
    // Protegida: exige login Azure. Si no hay sesión, MSAL redirige a login.microsoftonline.com
    // y al volver, el MsalInterceptor adjunta el Bearer JWT a /api/pedidos.
    path: 'pedidos',
    loadComponent: () => import('./pages/pedidos/pedidos').then((m) => m.PedidosComponent),
    canActivate: [MsalGuard],
  },
  { path: '**', redirectTo: 'productos' },
];
