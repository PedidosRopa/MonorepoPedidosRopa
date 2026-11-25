import { inject } from '@angular/core';
import {
  CanActivateFn,
  CanMatchFn,
  ActivatedRouteSnapshot,
  Route,
  Router,
  UrlSegment,
} from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { RolUsuario } from '../core/models';

/**
 * Guard de roles: espera a que el rol esté resuelto (id token o access token)
 * antes de decidir, para que un ADMINISTRADOR no quede bloqueado por una
 * lectura asíncrona del JWT.
 */
export const roleGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const rolRequerido = route.data?.['role'] as RolUsuario | undefined;

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  const rol = await auth.ensureRolesLoaded();

  if (!rol) {
    return router.createUrlTree(['/perfil'], { queryParams: { acceso: 'sin-rol' } });
  }

  if (!rolRequerido || auth.hasRole(rolRequerido)) {
    return true;
  }

  return router.createUrlTree(['/perfil'], { queryParams: { acceso: 'denegado' } });
};

/** Variante CanMatch (por si en el futuro se usa para lazy-loading). */
export const roleMatchGuard: CanMatchFn = async (route: Route, _segments: UrlSegment[]) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const rolRequerido = route.data?.['role'] as RolUsuario | undefined;

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  const rol = await auth.ensureRolesLoaded();
  if (!rol) {
    return router.createUrlTree(['/perfil'], { queryParams: { acceso: 'sin-rol' } });
  }

  return !rolRequerido || auth.hasRole(rolRequerido)
    ? true
    : router.createUrlTree(['/perfil'], { queryParams: { acceso: 'denegado' } });
};
