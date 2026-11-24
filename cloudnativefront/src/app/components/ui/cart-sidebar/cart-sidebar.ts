import { Component, inject, signal } from '@angular/core';
import { CarritoService } from '../../../core/carrito.service';
import { CarritoItem } from '../../../core/models';
import { AuthService } from '../../../auth/auth.service';

/**
 * Sidebar del carrito de compras. Se muestra como overlay lateral derecho.
 * Está disponible en todas las páginas a través de app.html.
 */
@Component({
  selector: 'app-cart-sidebar',
  standalone: true,
  imports: [],
  templateUrl: './cart-sidebar.html',
  styleUrl: './cart-sidebar.css',
})
export class CartSidebarComponent {
  private readonly carrito = inject(CarritoService);
  protected readonly auth = inject(AuthService);

  /** Visibilidad del sidebar (controlada desde AppComponent). */
  readonly open = signal(false);

  /** Items del carrito. */
  protected readonly items = this.carrito.itemsReadonly;
  protected readonly count = this.carrito.count;
  protected readonly total = this.carrito.total;
  protected readonly guardando = signal(false);
  protected readonly mensaje = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  /** Abre o cierra el sidebar. */
  toggle(): void {
    this.open.update((v) => !v);
  }

  /** Abre el sidebar. */
  abrir(): void {
    this.open.set(true);
  }

  /** Cierra el sidebar. */
  cerrar(): void {
    this.open.set(false);
  }

  incrementar(productoId: number): void {
    this.carrito.incrementar(productoId);
    this.persistir();
  }

  decrementar(productoId: number): void {
    this.carrito.decrementar(productoId);
    this.persistir();
  }

  remover(productoId: number): void {
    this.carrito.remover(productoId);
    this.persistir();
  }

  vaciar(): void {
    this.carrito.vaciar().subscribe({
      next: () => {
        this.carrito.setItems([]);
        this.mensaje.set('Carrito vacío.');
        setTimeout(() => this.mensaje.set(null), 2000);
      },
      error: (err) => {
        this.error.set(`No se pudo vaciar el carrito: ${err?.message ?? 'error'}`);
      },
    });
  }

  private persistir(): void {
    this.carrito.guardar(this.carrito.itemsReadonly()).subscribe({
      next: () => {
        this.mensaje.set('Carrito actualizado.');
        setTimeout(() => this.mensaje.set(null), 1500);
      },
      error: (err) => {
        this.error.set(`No se pudo guardar el carrito: ${err?.message ?? 'error'}`);
      },
    });
  }

  /** Crea un pedido con los items del carrito. */
  finalizarPedido(): void {
    if (this.items().length === 0) {
      this.error.set('Tu carrito está vacío.');
      return;
    }
    const items: { productoId: number; cantidad: number }[] = this.items().map((i) => ({
      productoId: i.productoId,
      cantidad: i.cantidad,
    }));
    // Pasar items por query string a nuevo-pedido
    const url = `/nuevo-pedido?carrito=${encodeURIComponent(JSON.stringify(items))}`;
    window.location.href = url;
  }
}
