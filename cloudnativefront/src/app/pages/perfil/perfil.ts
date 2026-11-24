import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

/**
 * Página de perfil: muestra los datos de la cuenta autenticada y el rol detectado.
 * Requiere MsalGuard (usuario logueado).
 */
@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class PerfilComponent {
  protected readonly auth = inject(AuthService);

  /** Decodifica el access token para mostrar información útil (opcional). */
  accessTokenInfo: { roles?: string[]; email?: string; name?: string } | null = null;

  constructor() {
    // Intenta obtener información del access token si está disponible
    this.cargarInfoToken();
  }

  async cargarInfoToken(): Promise<void> {
    try {
      const token = await this.auth.getAccessToken();
      if (!token) return;
      const payload = token.split('.')[1];
      if (!payload) return;
      const claims = JSON.parse(atob(payload));
      this.accessTokenInfo = {
        roles: claims.roles,
        email: claims.email || claims.preferred_username,
        name: claims.name,
      };
    } catch {
      // Ignorar errores
    }
  }

  /** Color del badge según el rol. */
  getRolColor(rol: string): string {
    const colores: Record<string, string> = {
      ADMINISTRADOR: 'text-violet-400',
      REPARTIDOR: 'text-blue-400',
      CLIENTE: 'text-emerald-400',
    };
    return colores[rol] ?? 'text-slate-400';
  }

  logout(): void {
    this.auth.logout();
  }
}
