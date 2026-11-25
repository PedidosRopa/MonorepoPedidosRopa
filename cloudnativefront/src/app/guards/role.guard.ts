import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, ActivatedRouteSnapshot, RouterStateSnapshot, Route, UrlSegment } from '@angular/router';
import { AuthService } from '../auth/auth.service';

/**
 * Guard de roles: permite activar la ruta solo si el usuario tiene el rol requerido
 * o es ADMINISTRADOR (que tiene acceso a todo).
 * Uso en rutas: { canActivate: [roleGuard], data: { role: 'REPARTIDOR' } }
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const auth = inject(AuthService);
  const rolRequerido = route.data?.['role'] as import('../core/models').RolUsuario | undefined;

  if (!auth.isLoggedIn()) {
    return false;
  }

  if (!rolRequerido) {
    return true;
  }

  return auth.hasRole(rolRequerido) || auth.hasAnyRole('ADMINISTRADOR');
};

/**
 * CanMatch opcional para lazy-loading (mismo rol que roleGuard).
 */
export const roleMatchGuard: CanMatchFn = (route: Route, segments: UrlSegment[]) => {
  const auth = inject(AuthService);
  const rolRequerido = route.data?.['role'] as import('../core/models').RolUsuario | undefined;

  if (!auth.isLoggedIn()) {
    return false;
  }

  if (!rolRequerido) {
    return true;
  }

  return auth.hasRole(rolRequerido) || auth.hasAnyRole('ADMINISTRADOR');
};
