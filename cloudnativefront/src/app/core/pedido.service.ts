import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pedido, PedidoRequest } from './models';
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

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
