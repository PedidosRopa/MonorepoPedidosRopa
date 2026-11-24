import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CarritoItem } from './models';
import { environment } from '../../environments/environment';

/**
 * Carrito de compras: estado global + persistencia en backend /api/carrito.
 * El estado se indexa por el OID de Entra ID (claim 'oid' del JWT).
 */
@Injectable({ providedIn: 'root' })
export class CarritoService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/carrito`;

  /** Estado global del carrito (cantidad de items para badge del navbar). */
  protected readonly items = signal<CarritoItem[]>([]);

  readonly count = computed(
    () => this.items().reduce((suma, i) => suma + i.cantidad, 0)
  );

  /** Items del carrito como señal de solo lectura. */
  readonly itemsReadonly = this.items.asReadonly();

  /** Carga el carrito desde el backend (se llama tras el login). */
  cargar(): Observable<CarritoItem[]> {
    return this.http.get<CarritoItem[]>(this.base).pipe(
      // eslint-disable-next-line no-console
      // No console logs en producción
    );
  }

  /** Guarda el carrito completo en el backend y actualiza el estado global. */
  guardar(items: CarritoItem[]): Observable<CarritoItem[]> {
    return this.http.put<CarritoItem[]>(this.base, items).pipe(
      // eslint-disable-next-line no-console
    );
  }

  /** Vacía el carrito en el backend y en el estado global. */
  vaciar(): Observable<void> {
    return this.http.delete<void>(this.base).pipe(
      // eslint-disable-next-line no-console
    );
  }

  /** Settea el estado local sin escribir al backend (útil para optimismo). */
  setItems(items: CarritoItem[]): void {
    this.items.set(items);
  }

  /** Agrega un producto al carrito (o incrementa cantidad). */
  agregar(item: CarritoItem): void {
    this.items.update((lista) => {
      const existente = lista.find((i) => i.productoId === item.productoId);
      if (existente) {
        return lista.map((i) =>
          i.productoId === item.productoId
            ? { ...i, cantidad: i.cantidad + item.cantidad }
            : i
        );
      }
      return [...lista, item];
    });
  }

  /** Incrementa la cantidad de un producto en el carrito. */
  incrementar(productoId: number): void {
    this.items.update((lista) =>
      lista.map((i) =>
        i.productoId === productoId ? { ...i, cantidad: i.cantidad + 1 } : i
      )
    );
  }

  /** Decrementa la cantidad de un producto; si llega a 0, lo elimina. */
  decrementar(productoId: number): void {
    this.items.update((lista) => {
      const existente = lista.find((i) => i.productoId === productoId);
      if (!existente) return lista;
      if (existente.cantidad <= 1) {
        return lista.filter((i) => i.productoId !== productoId);
      }
      return lista.map((i) =>
        i.productoId === productoId ? { ...i, cantidad: i.cantidad - 1 } : i
      );
    });
  }

  /** Elimina un producto del carrito. */
  remover(productoId: number): void {
    this.items.update((lista) => lista.filter((i) => i.productoId !== productoId));
  }

  /** Monto total del carrito. */
  total = computed(
    () =>
      this.items().reduce(
        (suma, i) => suma + i.precio * i.cantidad,
        0
      )
  );
}
