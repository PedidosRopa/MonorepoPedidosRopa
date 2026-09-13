import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pedido } from './models';
import { environment } from '../../environments/environment';

/**
 * Consume PedidoController (todo requiere Bearer JWT):
 *  GET    /api/pedidos            -> todos los pedidos
 *  GET    /api/pedidos/mis-pedidos -> pedidos del usuario del token
 *  POST   /api/pedidos            -> crea pedido (el backend setea usuarioEmail y fecha)
 *  DELETE /api/pedidos/{id}
 *
 * El token se inyecta solo vía MsalInterceptor (protectedResourceMap).
 */
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

  crear(pedido: Pick<Pedido, 'descPedido' | 'montoTotal' | 'estado'>): Observable<Pedido> {
    return this.http.post<Pedido>(this.base, pedido);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
