import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Producto } from './models';
import { environment } from '../../environments/environment';

/**
 * Consume ProductoController:
 *  GET    /api/productos      (público según SecurityConfig)
 *  GET    /api/productos/{id} (público)
 *  POST   /api/productos      (requiere Bearer JWT -> lo pone MsalInterceptor)
 *  DELETE /api/productos/{id} (requiere Bearer JWT)
 */
@Injectable({ providedIn: 'root' })
export class ProductoService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/productos`;

  listar(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.base);
  }

  obtener(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.base}/${id}`);
  }

  crear(producto: Producto): Observable<Producto> {
    return this.http.post<Producto>(this.base, producto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
