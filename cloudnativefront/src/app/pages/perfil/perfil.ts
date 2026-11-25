import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { RolUsuario } from '../../core/models';

/**
 * Página de perfil: datos de la cuenta, rol detectado y accesos rápidos
 * según el rol. Requiere MsalGuard.
 */
@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerfilComponent {
  protected readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  protected readonly accesoDenegado = this.route.snapshot.queryParamMap.get('acceso');

  /** Decodifica el access token para mostrar información útil (opcional). */
  accessTokenInfo: { roles?: string[]; email?: string; name?: string } | null = null;

  constructor() {
    void this.cargarInfoToken();
  }

  async cargarInfoToken(): Promise<void> {
    try {
      const token = await this.auth.getAccessToken();
      if (!token) return;
      const payload = token.split('.')[1];
      if (!payload) return;
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
      const claims = JSON.parse(atob(padded)) as {
        roles?: string[];
        email?: string;
        preferred_username?: string;
        name?: string;
      };
      this.accessTokenInfo = {
        roles: claims.roles,
        email: claims.email || claims.preferred_username,
        name: claims.name,
      };
    } catch {
      // Ignorar errores: la vista funciona sin el detalle del token.
    }
  }

  getRolColor(rol: RolUsuario): string {
    const colores: Record<RolUsuario, string> = {
      ADMINISTRADOR: 'text-violet-300',
      REPARTIDOR: 'text-blue-300',
      CLIENTE: 'text-emerald-300',
    };
    return colores[rol];
  }

  getRolDescripcion(rol: RolUsuario): string {
    const descripciones: Record<RolUsuario, string> = {
      ADMINISTRADOR: 'Acceso total, incluidos RabbitMQ y Kafka.',
      REPARTIDOR: 'Pedidos, tracker y cambios de estado logístico.',
      CLIENTE: 'Catálogo, carrito y tus propios pedidos.',
    };
    return descripciones[rol];
  }

  logout(): void {
    this.auth.logout();
  }
}
