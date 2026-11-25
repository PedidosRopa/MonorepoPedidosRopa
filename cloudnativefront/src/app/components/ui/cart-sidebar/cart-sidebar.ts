import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CarritoService } from '../../../core/carrito.service';
import { AuthService } from '../../../auth/auth.service';
import { formatearMoneda } from '../../../core/formato';

/**
 * Sidebar global del carrito. Lee y escribe el estado compartido de
 * CarritoService, por lo que el botón del navbar siempre lo abre.
 */
@Component({
  selector: 'app-cart-sidebar',
  standalone: true,
  imports: [],
  templateUrl: './cart-sidebar.html',
  styleUrl: './cart-sidebar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartSidebarComponent {
  private readonly carrito = inject(CarritoService);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  readonly open = this.carrito.sidebarOpen;
  protected readonly items = this.carrito.itemsReadonly;
  protected readonly count = this.carrito.count;
  protected readonly total = this.carrito.total;

  constructor() {
    effect(() => {
      if (typeof document !== 'undefined') {
        document.body.classList.toggle('overflow-hidden', this.open());
      }
    });
  }

  cerrar(): void {
    this.carrito.cerrarSidebar();
  }

  incrementar(productoId: number): void {
    this.carrito.incrementar(productoId);
  }

  decrementar(productoId: number): void {
    this.carrito.decrementar(productoId);
  }

  remover(productoId: number): void {
    this.carrito.remover(productoId);
  }

  vaciar(): void {
    this.carrito.vaciar();
  }

  irAlCatalogo(): void {
    this.cerrar();
    void this.router.navigate(['/productos']);
  }

  /** Si hay sesión va a "nuevo pedido"; si no, inicia el login de Microsoft. */
  finalizarPedido(): void {
    if (this.items().length === 0) return;
    this.cerrar();
    if (!this.auth.isLoggedIn()) {
      this.auth.login('/nuevo-pedido');
      return;
    }
    void this.router.navigate(['/nuevo-pedido']);
  }

  precio(valor: number): string {
    return formatearMoneda(valor);
  }

  subtotal(precio: number, cantidad: number): string {
    return formatearMoneda(precio * cantidad);
  }

  limiteAlcanzado(item: { cantidad: number; stock?: number }): boolean {
    return item.stock !== undefined && item.cantidad >= item.stock;
  }
}
