import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  TopicRequest,
  TopicInfo,
  TopicConfigUpdate,
  ConsumerGroupInfo,
} from './models';
import { environment } from '../../environments/environment';

/**
 * Cliente del panel de administración de Kafka (KafkaAdminController).
 * Solo accesible por usuarios con rol ADMINISTRADOR.
 * El token se inyecta vía MsalInterceptor.
 */
@Injectable({ providedIn: 'root' })
export class KafkaAdminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/admin/kafka`;

  listarTopics(): Observable<TopicInfo[]> {
    return this.http.get<TopicInfo[]>(`${this.base}/topics`);
  }

  crearTopic(topic: TopicRequest): Observable<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(
      `${this.base}/topics`,
      topic
    );
  }

  actualizarConfigTopic(
    nombre: string,
    config: TopicConfigUpdate
  ): Observable<Record<string, string>> {
    return this.http.patch<Record<string, string>>(
      `${this.base}/topics/${encodeURIComponent(nombre)}/config`,
      config
    );
  }

  eliminarTopic(nombre: string): Observable<void> {
    return this.http.delete<void>(
      `${this.base}/topics/${encodeURIComponent(nombre)}`
    );
  }

  listarConsumerGroups(): Observable<ConsumerGroupInfo[]> {
    return this.http.get<ConsumerGroupInfo[]>(
      `${this.base}/consumer-groups`
    );
  }
}
