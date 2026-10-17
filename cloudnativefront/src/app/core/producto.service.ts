import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Producto, ProductoFiltros } from './models';
import { HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';


@Injectable({ providedIn: 'root' })
export class ProductoService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/productos`;

  listar(filtros?: ProductoFiltros): Observable<Producto[]> {
    let params = new HttpParams();
    if (filtros?.categoria) {
      params = params.set('categoria', filtros.categoria);
    }
    if (filtros?.talla) {
      params = params.set('talla', filtros.talla);
    }
    return this.http.get<Producto[]>(this.base, { params });
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
