import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { map, catchError, of, Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { PedidoService } from '../core/pedido.service';

/**
 * Guard de acceso a pedido: permite ver el tracker/historial de un pedido solo si:
 * - El usuario es ADMINISTRADOR o REPARTIDOR (puede ver cualquier pedido), o
 * - El usuario es el dueño del pedido (CLIENTE con email coincidente).
 *
 * Uso: { canActivate: [pedidoAccessGuard] } en ruta /pedidos/:id/tracker
 */
export const pedidoAccessGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): Observable<boolean> => {
  const auth = inject(AuthService);
  const api = inject(PedidoService);

  if (!auth.isLoggedIn()) {
    return of(false);
  }

  // ADMINISTRADOR y REPARTIDOR pueden ver cualquier tracker
  if (auth.hasAnyRole('ADMINISTRADOR', 'REPARTIDOR')) {
    return of(true);
  }

  const idPedido = route.paramMap.get('id');
  if (!idPedido) {
    return of(false);
  }

  const id = Number(idPedido);
  if (!id) {
    return of(false);
  }

  // CLIENTE: verificar que el pedido le pertenezca consultando el historial.
  // Si el backend devuelve 200, el pedido es accesible; si 403/404, no.
  return api.obtenerHistorial(id).pipe(
    map(() => true),
    catchError((err) => {
      if (err?.status === 403 || err?.status === 404) {
        return of(false);
      }
      return of(false);
    })
  );
};
