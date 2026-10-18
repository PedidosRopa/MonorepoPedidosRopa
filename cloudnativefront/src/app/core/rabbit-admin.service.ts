import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BindingRequest, ExchangeRequest, QueueRequest } from './models';
import { environment } from '../../environments/environment';

/**
 * Cliente del microservicio administrador de RabbitMQ (RabbitAdminController).
 * El token se inyecta vía MsalInterceptor; requiere un JWT válido (usuario autenticado).
 */
@Injectable({ providedIn: 'root' })
export class RabbitAdminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/admin/rabbitmq`;

  crearCola(cola: QueueRequest): Observable<string> {
    return this.http.post(`${this.base}/queues`, cola, { responseType: 'text' });
  }

  eliminarCola(nombre: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/queues/${encodeURIComponent(nombre)}`);
  }

  crearExchange(exchange: ExchangeRequest): Observable<string> {
    return this.http.post(`${this.base}/exchanges`, exchange, { responseType: 'text' });
  }

  eliminarExchange(nombre: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/exchanges/${encodeURIComponent(nombre)}`);
  }

  crearBinding(binding: BindingRequest): Observable<string> {
    return this.http.post(`${this.base}/bindings`, binding, { responseType: 'text' });
  }
}
