import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PreferenciaPago } from './models';
import { environment } from '../../environments/environment';

/** Pasarela de pagos (Mercado Pago Checkout Pro). El JWT lo agrega MsalInterceptor. */
@Injectable({ providedIn: 'root' })
export class PagoService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/pagos`;

  /** POST /api/pagos/preferencia/{idPedido}: devuelve el link de pago. */
  crearPreferencia(idPedido: number): Observable<PreferenciaPago> {
    return this.http.post<PreferenciaPago>(`${this.base}/preferencia/${idPedido}`, {});
  }

  /** Lleva al usuario a Mercado Pago. Usa sandbox solo si no hay link productivo. */
  redirigirAlPago(preferencia: PreferenciaPago): boolean {
    const url = preferencia.initPoint || preferencia.sandboxInitPoint;
    if (!url || typeof window === 'undefined') return false;
    window.location.href = url;
    return true;
  }

  /** Mensaje legible para errores del endpoint de preferencia. */
  mensajeError(err: { status?: number; message?: string; error?: { detail?: string; message?: string } }): string {
    if (err?.status === 401) return 'Tu sesión expiró. Vuelve a iniciar sesión para pagar.';
    if (err?.status === 403) return 'No autorizado para pagar este pedido.';
    if (err?.error?.detail) return err.error.detail;
    if (err?.status === 500) {
      return 'Mercado Pago no pudo generar el pago (error 500 del backend). Inténtalo de nuevo más tarde.';
    }
    return `No se pudo iniciar el pago: ${err?.error?.message ?? err?.message ?? 'error de red'}`;
  }
}
