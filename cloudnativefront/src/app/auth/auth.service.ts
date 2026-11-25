import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { MsalService, MsalBroadcastService } from '@azure/msal-angular';
import {
  AuthenticationResult,
  EventMessage,
  EventType,
  InteractionStatus,
  AccountInfo,
  IdTokenClaims,
} from '@azure/msal-browser';
import { filter, Subject, takeUntil } from 'rxjs';
import { loginRequest } from './auth.config';
import { environment } from '../../environments/environment';
import { RolUsuario } from '../core/models';

/**
 * Fachada de autenticación sobre MSAL.
 * - login(): redirect a Microsoft Entra ID
 * - logout(): cierra sesión
 * - El MsalInterceptor inyecta el Bearer JWT automáticamente,
 *   este servicio solo expone estado + helpers para la UI.
 * - userRole: lee el claim 'roles' del JWT (idTokenClaims o access token).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly msal = inject(MsalService);
  private readonly broadcast = inject(MsalBroadcastService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroy$ = new Subject<void>();

  readonly activeAccount = signal<AccountInfo | null>(null);
  readonly inProgress = signal<InteractionStatus>(InteractionStatus.None);

  readonly isLoggedIn = computed(() => this.activeAccount() !== null);
  readonly username = computed(
    () => this.activeAccount()?.username ?? this.activeAccount()?.name ?? null
  );

  /** Rol principal del usuario. Se extrae del claim 'roles' del JWT. */
  readonly userRole = signal<RolUsuario | null>(null);

  /** Verifica si el usuario tiene el rol dado. */
  hasRole(rol: RolUsuario): boolean {
    const actual = this.userRole();
    return actual === rol || actual === 'ADMINISTRADOR';
  }

  /** Verifica si el usuario tiene al menos uno de los roles dados. */
  hasAnyRole(...roles: RolUsuario[]): boolean {
    const actual = this.userRole();
    if (!actual) return false;
    return roles.includes(actual) || actual === 'ADMINISTRADOR';
  }

  /** Orden de prioridad para determinar el rol principal cuando hay varios. */
  private readonly ordenRoles: RolUsuario[] = [
    'ADMINISTRADOR',
    'REPARTIDOR',
    'CLIENTE',
  ];

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return; // SSR: no tocar localStorage/MSAL en el servidor.
    }

    this.broadcast.inProgress$
      .pipe(takeUntil(this.destroy$))
      .subscribe((status) => this.inProgress.set(status));

    this.broadcast.msalSubject$
      .pipe(
        filter((msg: EventMessage) => msg.eventType === EventType.LOGIN_SUCCESS),
        takeUntil(this.destroy$)
      )
      .subscribe((msg) => {
        this.setActiveAccount((msg.payload as AuthenticationResult).account);
        this.cargarRolesDesdeToken();
        // Después del login exitoso, redirigir a la página de perfil
        this.router.navigate(['/perfil']);
      });

    this.broadcast.msalSubject$
      .pipe(
        filter(
          (msg: EventMessage) =>
            msg.eventType === EventType.ACTIVE_ACCOUNT_CHANGED ||
            msg.eventType === EventType.LOGIN_SUCCESS ||
            msg.eventType === EventType.LOGOUT_SUCCESS
        ),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.syncActiveAccount());

    // Resuelve el redirect (vuelta desde login.microsoftonline.com) y fija la cuenta activa.
    this.msal.handleRedirectObservable().subscribe({
      next: (result) => {
        if (result?.account) {
          this.setActiveAccount(result.account);
          this.cargarRolesDesdeToken();
        } else {
          this.syncActiveAccount();
        }
      },
      error: () => this.syncActiveAccount(),
    });

    this.syncActiveAccount();
    // Intenta cargar roles de forma síncrona si ya hay cuenta activa
    this.cargarRolesDesdeToken();
    // También intenta obtenerlos del access token (asíncrono)
    this.cargarRolesDesdeAccessToken();
  }

  /**
   * Lee los roles del idTokenClaims (síncrono, disponible inmediatamente tras el login).
   */
private cargarRolesDesdeToken(): void {
    const account = this.activeAccount();
    if (!account) {
      this.userRole.set(null);
      return;
    }
    const idTokenClaims = account.idTokenClaims as IdTokenClaims | undefined;
    const roles: string[] | undefined = idTokenClaims?.roles;
    const rolIdToken = this.rolPrincipal(roles);

    if (rolIdToken) {
      this.userRole.set(rolIdToken);
    } else {
      // Si el ID Token no trae 'roles' (porque los App Roles están en la API backend),
      // los extraemos inmediatamente del Access Token.
      this.cargarRolesDesdeAccessToken();
    }
  }

  async cargarRolesDesdeAccessToken(): Promise<void> {
    const account = this.activeAccount() ?? this.msal.instance.getActiveAccount();
    if (!account) return;
    try {
      const result = await this.msal.instance.acquireTokenSilent({
        scopes: [...environment.azure.apiScopes],
        account,
      });
      const payload = result.accessToken.split('.')[1];
      if (!payload) return;
      // Base64URL safe decode
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const claims = JSON.parse(atob(base64));
      this.userRole.set(this.rolPrincipal(claims.roles));
    } catch {
      // Ignorar errores silenciosos
    }
  }

  private rolPrincipal(roles: string[] | undefined): RolUsuario | null {
    if (!roles || roles.length === 0) return null;

    const normalizados: RolUsuario[] = roles.map((r) => {
      const upper = r.trim().toUpperCase();
      if (upper === 'ADMIN' || upper === 'ADMINISTRADOR') return 'ADMINISTRADOR';
      if (upper === 'REPARTIDOR') return 'REPARTIDOR';
      return 'CLIENTE';
    });

    for (const rol of this.ordenRoles) {
      if (normalizados.includes(rol)) return rol;
    }
    return null;
  }

  /** Inicia login con redirect a Azure. */
  login(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.msal.loginRedirect({ ...loginRequest });
  }

  /** Cierra sesión (redirect) y limpia la cuenta local. */
  logout(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.userRole.set(null);
    this.msal.logoutRedirect({
      postLogoutRedirectUri: environment.azure.postLogoutRedirectUri,
    });
  }

  /** Access token para la API del backend (útil para debug; el interceptor ya lo inyecta). */
  async getAccessToken(): Promise<string | null> {
    const account = this.activeAccount() ?? this.msal.instance.getActiveAccount();
    if (!account) return null;
    try {
      const result = await this.msal.instance.acquireTokenSilent({
        scopes: [...environment.azure.apiScopes],
        account,
      });
      return result.accessToken;
    } catch {
      return null;
    }
  }

  private setActiveAccount(account: AccountInfo | null): void {
    if (account) {
      this.msal.instance.setActiveAccount(account);
    }
    this.activeAccount.set(account);
  }

  private syncActiveAccount(): void {
    try {
      const accounts = this.msal.instance.getAllAccounts();
      const active = this.msal.instance.getActiveAccount() ?? accounts[0] ?? null;
      if (active) {
        this.msal.instance.setActiveAccount(active);
      }
      this.activeAccount.set(active);
    } catch {
      this.activeAccount.set(null);
    }
  }
}
