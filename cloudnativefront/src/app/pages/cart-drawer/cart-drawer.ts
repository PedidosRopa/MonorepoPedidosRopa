import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CarritoService } from '../../core/carrito.service';
import { AuthService } from '../../auth/auth.service';
import { formatearMoneda } from '../../core/formato';

/**
 * Vista completa del carrito (/carrito). El sidebar global sigue siendo la
 * forma principal de usarlo; esta página sirve como respaldo en móvil.
 */
import { Icon } from '../../components/ui/icon';
import { ProductoMedia } from '../../components/ui/producto-media';
@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [RouterLink, Icon, ProductoMedia],
  templateUrl: './cart-drawer.html',
  styleUrl: './cart-drawer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartDrawerComponent {
  private readonly carrito = inject(CarritoService);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  protected readonly items = this.carrito.itemsReadonly;
  protected readonly total = this.carrito.total;

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

  finalizarPedido(): void {
    if (this.items().length === 0) return;
    if (!this.auth.isLoggedIn()) {
      this.auth.login('/nuevo-pedido');
      return;
    }
    void this.router.navigate(['/nuevo-pedido']);
  }

  precio(valor: number): string {
    return formatearMoneda(valor);
  }
}
