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
    () => this.activeAccount()?.name ?? this.activeAccount()?.username ?? null
  );
  readonly email = computed(() => this.activeAccount()?.username ?? null);

  /** Rol principal del usuario. Se extrae del claim 'roles' del JWT. */
  readonly userRole = signal<RolUsuario | null>(null);

  readonly isAdmin = computed(() => this.userRole() === 'ADMINISTRADOR');
  readonly isStaff = computed(
    () => this.userRole() === 'ADMINISTRADOR' || this.userRole() === 'REPARTIDOR'
  );
  readonly isCliente = computed(() => this.userRole() === 'CLIENTE');

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

  /** Flag para evitar leer roles múltiples veces. */
  private rolesCargados = false;

  /** Evita que varios guards pidan el access token al mismo tiempo. */
  private rolesEnCurso: Promise<void> | null = null;

  /** Evita navegar dos veces por el mismo login (evento + redirect). */
  private navegacionPostLogin = false;

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
        this.cargarRoles();
        // Vuelve a la pantalla que el usuario intentaba abrir o al perfil.
        this.irTrasLogin();
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
          this.cargarRoles();
          this.irTrasLogin();
        } else {
          this.syncActiveAccount();
        }
      },
      error: () => this.syncActiveAccount(),
    });

    this.syncActiveAccount();
    // Intenta cargar roles de forma síncrona si ya hay cuenta activa
    this.cargarRoles();
  }

  /**
   * Lee los roles del idTokenClaims (síncrono). Si no encuentra roles,
   * intenta obtenerlos del access token (asíncrono, una sola vez).
   */
  private cargarRoles(): void {
    if (this.rolesCargados) {
      return;
    }
    this.cargarRolesDesdeToken();
    // Si el id token no trae roles (App Roles están en la API backend),
    // intentamos leerlos del access token.
    if (!this.userRole()) {
      this.cargarRolesDesdeAccessToken();
    }
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
    const rol = this.rolPrincipal(roles);
    if (rol) {
      this.rolesCargados = true;
    }
    this.userRole.set(rol);
  }

  /**
   * Intenta obtener los roles del access token (asíncrono, una sola vez).
   * Útil cuando los App Roles están registrados en la app del backend (API)
   * y se emiten en el access token, no en el id token.
   */
  async cargarRolesDesdeAccessToken(): Promise<void> {
    if (this.rolesCargados) {
      return;
    }
    if (this.rolesEnCurso) {
      return this.rolesEnCurso;
    }
    this.rolesEnCurso = this.leerRolesDelAccessToken();
    try {
      await this.rolesEnCurso;
    } finally {
      this.rolesEnCurso = null;
    }
  }

  private async leerRolesDelAccessToken(): Promise<void> {
    const account = this.activeAccount() ?? this.msal.instance.getActiveAccount();
    if (!account) return;
    try {
      const result = await this.msal.instance.acquireTokenSilent({
        scopes: [...environment.azure.apiScopes],
        account,
      });
      const payload = result.accessToken.split('.')[1];
      if (!payload) return;
      // Base64URL safe decode (con padding para atob).
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
      const claims = JSON.parse(atob(padded)) as { roles?: string[] };
      const rol = this.rolPrincipal(claims.roles);
      if (rol) {
        this.rolesCargados = true;
      }
      this.userRole.set(rol);
    } catch {
      // Ignorar errores silenciosos (no hay sesión, token expirado, etc.)
    }
  }

  /**
   * Garantiza que el rol esté resuelto antes de decidir un guard de ruta.
   * Si el id token no trae roles, consulta el access token una única vez.
   */
  async ensureRolesLoaded(): Promise<RolUsuario | null> {
    if (this.userRole()) return this.userRole();
    this.cargarRolesDesdeToken();
    if (this.userRole()) return this.userRole();
    await this.cargarRolesDesdeAccessToken();
    return this.userRole();
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

  /**
   * Inicia login con redirect a Azure.
   * @param destino ruta a la que volver tras autenticarse; por defecto la actual.
   */
  login(destino?: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const actual = destino || this.router.url;
      if (actual && !actual.startsWith('/login')) {
        window.sessionStorage.setItem('pedidosropa.returnUrl', actual);
      }
    } catch {
      // sessionStorage puede estar bloqueado; no es crítico.
    }
    this.msal.loginRedirect({ ...loginRequest });
  }

  /** Cierra sesión (redirect) y limpia la cuenta local. */
  logout(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.userRole.set(null);
    this.rolesCargados = false;
    try {
      window.sessionStorage.removeItem('pedidosropa.returnUrl');
    } catch {
      // Ignorar almacenamiento bloqueado.
    }
    this.msal.logoutRedirect({
      postLogoutRedirectUri: environment.azure.postLogoutRedirectUri,
    });
  }

  private irTrasLogin(): void {
    if (!isPlatformBrowser(this.platformId) || this.navegacionPostLogin) return;
    this.navegacionPostLogin = true;
    let destino = '/perfil';
    try {
      destino = window.sessionStorage.getItem('pedidosropa.returnUrl') || '/perfil';
      window.sessionStorage.removeItem('pedidosropa.returnUrl');
    } catch {
      // Ignorar almacenamiento bloqueado.
    }
    void this.router.navigateByUrl(destino).finally(() => {
      window.setTimeout(() => (this.navegacionPostLogin = false), 500);
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
