import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Pedido,
  PedidoRequest,
  HistorialPedido,
  ActualizarEstadoRequest,
  EstadoPedido,
} from './models';
import { environment } from '../../environments/environment';

// El token se inyecta solo vía MsalInterceptor (protectedResourceMap).
@Injectable({ providedIn: 'root' })
export class PedidoService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/pedidos`;

  listarTodos(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(this.base);
  }

  misPedidos(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${this.base}/mis-pedidos`);
  }

  /** POST /api/pedidos con PedidoRequestDto { descPedido, items }. El backend calcula monto y estado. */
  crear(pedido: PedidoRequest): Observable<Pedido> {
    return this.http.post<Pedido>(this.base, pedido);
  }

  /** PATCH /api/pedidos/{id}/estado con ActualizarEstadoRequest. Repartidor/Administrador. */
  actualizarEstado(id: number, nuevoEstado: EstadoPedido): Observable<Pedido> {
    return this.http.patch<Pedido>(`${this.base}/${id}/estado`, {
      nuevoEstado,
    });
  }

  /** GET /api/pedidos/{id}/historial — línea de tiempo de estados (tracker). */
  obtenerHistorial(id: number): Observable<HistorialPedido[]> {
    return this.http.get<HistorialPedido[]>(`${this.base}/${id}/historial`);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
