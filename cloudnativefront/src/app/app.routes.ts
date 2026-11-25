import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { roleGuard } from './guards/role.guard';
import { pedidoAccessGuard } from './guards/pedido-access.guard';

export const routes: Routes = [
  // Ruta raíz pública: Landing page (sin MSAL)
  { path: '', pathMatch: 'full', redirectTo: 'landing' },
  {
    path: 'landing',
    title: 'PedidosRopa · Inicio',
    loadComponent: () => import('./pages/landing/landing').then((m) => m.LandingComponent),
  },

  // Autenticación (pública)
  {
    path: 'login',
    title: 'PedidosRopa · Iniciar sesión',
    loadComponent: () => import('./pages/login/login').then((m) => m.LoginComponent),
  },

  // Catálogo público (lectura sin login; crear/eliminar requiere rol admin)
  {
    path: 'productos',
    title: 'PedidosRopa · Catálogo',
    loadComponent: () => import('./pages/productos/productos').then((m) => m.ProductosComponent),
  },

  // Carrito completo (el sidebar global sigue disponible en todas las páginas)
  {
    path: 'carrito',
    title: 'PedidosRopa · Carrito',
    loadComponent: () => import('./pages/cart-drawer/cart-drawer').then((m) => m.CartDrawerComponent),
  },

  // Rutas protegidas por autenticación (MsalGuard)
  {
    path: 'pedidos',
    title: 'PedidosRopa · Pedidos',
    loadComponent: () => import('./pages/pedidos/pedidos').then((m) => m.PedidosComponent),
    canActivate: [MsalGuard],
  },
  {
    path: 'pedidos/:id/tracker',
    title: 'PedidosRopa · Tracker',
    loadComponent: () =>
      import('./pages/pedido-tracker/pedido-tracker').then((m) => m.PedidoTrackerComponent),
    canActivate: [MsalGuard, pedidoAccessGuard],
  },
  {
    path: 'nuevo-pedido',
    title: 'PedidosRopa · Nuevo pedido',
    loadComponent: () =>
      import('./pages/nuevo-pedido/nuevo-pedido').then((m) => m.NuevoPedidoComponent),
    canActivate: [MsalGuard],
  },
  {
    path: 'perfil',
    title: 'PedidosRopa · Perfil',
    loadComponent: () => import('./pages/perfil/perfil').then((m) => m.PerfilComponent),
    canActivate: [MsalGuard],
  },

  // Rutas solo ADMINISTRADOR
  {
    path: 'admin-rabbit',
    title: 'PedidosRopa · Admin RabbitMQ',
    loadComponent: () =>
      import('./pages/admin-rabbit/admin-rabbit').then((m) => m.AdminRabbitComponent),
    canActivate: [MsalGuard, roleGuard],
    data: { role: 'ADMINISTRADOR' },
  },
  {
    path: 'admin-kafka',
    title: 'PedidosRopa · Admin Kafka',
    loadComponent: () =>
      import('./pages/admin-kafka/admin-kafka').then((m) => m.AdminKafkaComponent),
    canActivate: [MsalGuard, roleGuard],
    data: { role: 'ADMINISTRADOR' },
  },
  {
    path: 'admin',
    title: 'PedidosRopa · Admin',
    loadComponent: () =>
      import('./pages/admin-dashboard/admin-dashboard').then((m) => m.AdminDashboardComponent),
    canActivate: [MsalGuard, roleGuard],
    data: { role: 'ADMINISTRADOR' },
  },

  // Ruta solo REPARTIDOR (y ADMINISTRADOR por herencia de roleGuard)
  {
    path: 'repartidor',
    title: 'PedidosRopa · Repartidor',
    loadComponent: () =>
      import('./pages/repartidor-dashboard/repartidor-dashboard').then(
        (m) => m.RepartidorDashboardComponent
      ),
    canActivate: [MsalGuard, roleGuard],
    data: { role: 'REPARTIDOR' },
  },

  // Vuelta desde Mercado Pago (back_urls definidas en el backend: FRONTEND_URL + /pago-*).
  // También se aceptan bajo /productos por si FRONTEND_URL quedó con el valor por defecto
  // del backend (que termina en /productos).
  ...(['', 'productos/'] as const).flatMap((prefijo) =>
    (['exitoso', 'fallido', 'pendiente'] as const).map((resultado) => ({
      path: `${prefijo}pago-${resultado}`,
      title: 'PedidosRopa · Pago',
      loadComponent: () =>
        import('./pages/pago-resultado/pago-resultado').then((m) => m.PagoResultadoComponent),
      data: { resultado },
    }))
  ),

  { path: '**', redirectTo: 'landing' },
];
