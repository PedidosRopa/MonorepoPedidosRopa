import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../auth/auth.service';

/**
 * Guard de acceso a pedido: permite ver el tracker/historial de un pedido solo si:
 * - El usuario es ADMINISTRADOR o REPARTIDOR (puede ver cualquier pedido), o
 * - El usuario es el dueño del pedido (el backend rechazará con 403/404 si no lo es).
 *
 * No hace llamadas HTTP aquí para evitar latencia y reintentos que bloquean la UI.
 * Uso: { canActivate: [pedidoAccessGuard] } en ruta /pedidos/:id/tracker
 */
export const pedidoAccessGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): boolean => {
  const auth = inject(AuthService);

  if (!auth.isLoggedIn()) {
    return false;
  }

  // ADMINISTRADOR y REPARTIDOR pueden ver cualquier tracker
  if (auth.hasAnyRole('ADMINISTRADOR', 'REPARTIDOR')) {
    return true;
  }

  // CLIENTE: permitir el acceso y dejar que el backend rechace con 403/404
  // si el pedido no le pertenece. El componente maneja ese error.
  return true;
};
