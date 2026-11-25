import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CarritoService } from '../../core/carrito.service';
import { CarritoItem } from '../../core/models';

/**
 * Panel del carrito de compras.
 * Muestra los items agregados, permite ajustar cantidades y finalizar el pedido.
 */
@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './cart-drawer.html',
  styleUrl: './cart-drawer.css',
})
export class CartDrawerComponent {
  private readonly carrito = inject(CarritoService);

  protected readonly items = this.carrito.itemsReadonly;
  protected readonly count = this.carrito.count;
  protected readonly total = this.carrito.total;
  protected readonly guardando = signal(false);
  protected readonly mensaje = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

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

  /** Sincroniza el estado local con el backend. */
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
    // Navega a nuevo-pedido pasando items por query (simplificado)
    // En una app completa se usaría un estado compartido o localStorage.
    const url = `/nuevo-pedido?carrito=${encodeURIComponent(JSON.stringify(items))}`;
    window.location.href = url;
  }
}
