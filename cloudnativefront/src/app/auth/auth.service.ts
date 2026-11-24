import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
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
 * - userRole(): lee el claim 'roles' del token (idTokenClaims) y devuelve el rol principal.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly msal = inject(MsalService);
  private readonly broadcast = inject(MsalBroadcastService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroy$ = new Subject<void>();

  readonly activeAccount = signal<AccountInfo | null>(null);
  readonly inProgress = signal<InteractionStatus>(InteractionStatus.None);

  readonly isLoggedIn = computed(() => this.activeAccount() !== null);
  readonly username = computed(
    () => this.activeAccount()?.username ?? this.activeAccount()?.name ?? null
  );

  /** Rol principal del usuario, extraído del claim 'roles' del JWT. */
  readonly userRole = computed<RolUsuario | null>(() => {
    const account = this.activeAccount();
    const idTokenClaims = account?.idTokenClaims as IdTokenClaims | undefined;
    const roles: string[] | undefined = idTokenClaims?.roles;
    if (!roles || roles.length === 0) return null;
    // Prioridad: ADMINISTRADOR > REPARTIDOR > CLIENTE
    const orden: RolUsuario[] = ['ADMINISTRADOR', 'REPARTIDOR', 'CLIENTE'];
    for (const rol of orden) {
      if (roles.includes(rol)) return rol;
    }
    return null;
  });

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
      .subscribe((msg) => this.setActiveAccount((msg.payload as AuthenticationResult).account));

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
        } else {
          this.syncActiveAccount();
        }
      },
      error: () => this.syncActiveAccount(),
    });

    this.syncActiveAccount();
  }

  /** Inicia login con redirect a Azure. */
  login(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.msal.loginRedirect({ ...loginRequest });
  }

  /** Cierra sesión (redirect) y limpia la cuenta local. */
  logout(): void {
    if (!isPlatformBrowser(this.platformId)) return;
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
