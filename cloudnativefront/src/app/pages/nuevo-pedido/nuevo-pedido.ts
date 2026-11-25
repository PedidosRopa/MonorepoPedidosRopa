import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProductoService } from '../../core/producto.service';
import { PedidoService } from '../../core/pedido.service';
import { CarritoService } from '../../core/carrito.service';
import { Producto, Pedido } from '../../core/models';
import { formatearMoneda } from '../../core/formato';

@Component({
  selector: 'app-nuevo-pedido',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './nuevo-pedido.html',
  styleUrl: './nuevo-pedido.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NuevoPedidoComponent implements OnInit {
  private readonly productosApi = inject(ProductoService);
  private readonly pedidosApi = inject(PedidoService);
  protected readonly carrito = inject(CarritoService);

  protected readonly productos = signal<Producto[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly mensaje = signal<string | null>(null);
  protected readonly enviando = signal(false);
  protected readonly pedidoCreado = signal<Pedido | null>(null);

  protected readonly items = this.carrito.itemsReadonly;
  protected readonly total = this.carrito.total;
  protected readonly count = this.carrito.count;

  protected descPedido = '';
  protected filtroCategoria = '';
  protected filtroTalla = '';

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.error.set(null);
    this.productosApi
      .listar({
        categoria: this.filtroCategoria.trim() || undefined,
        talla: this.filtroTalla.trim() || undefined,
      })
      .subscribe({
        next: (data) => {
          this.productos.set(data);
          // Mantiene precios/stock del carrito alineados con el catálogo.
          this.carrito.sincronizarCatalogo(data);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(`No se pudieron cargar los productos: ${err?.message ?? 'error de red'}`);
          this.loading.set(false);
        },
      });
  }

  limpiarFiltros(): void {
    this.filtroCategoria = '';
    this.filtroTalla = '';
    this.cargar();
  }

  unidades(productoId?: number): number {
    return this.carrito.unidadesDe(productoId);
  }

  agregar(producto: Producto): void {
    this.carrito.agregarProducto(producto, 1);
  }

  incrementar(producto: Producto): void {
    this.carrito.incrementar(producto.idProducto!);
  }

  decrementar(productoId: number): void {
    this.carrito.decrementar(productoId);
  }

  quitar(productoId: number): void {
    this.carrito.remover(productoId);
  }

  vaciar(): void {
    this.carrito.vaciar();
  }

  crearPedido(): void {
    if (this.items().length === 0) {
      this.error.set('Agrega al menos un producto al carrito.');
      return;
    }

    this.enviando.set(true);
    this.error.set(null);
    this.mensaje.set(null);

    this.pedidosApi
      .crear({
        descPedido: this.descPedido.trim() || undefined,
        items: this.carrito.itemsParaPedido(),
      })
      .subscribe({
        next: (creado) => {
          this.pedidoCreado.set(creado);
          this.mensaje.set(`Pedido #${creado.idPedido} creado correctamente.`);
          this.carrito.vaciar();
          this.descPedido = '';
          this.enviando.set(false);
        },
        error: (err) => {
          if (err?.status === 400 && err?.error?.errors) {
            const campos = Object.values(err.error.errors).join(' | ');
            this.error.set(`Datos inválidos: ${campos}`);
          } else if (err?.status === 400 && err?.error?.detail) {
            this.error.set(err.error.detail);
          } else if (err?.status === 401 || err?.status === 403) {
            this.error.set('No autorizado. Inicia sesión con Microsoft para crear pedidos.');
          } else {
            this.error.set(`No se pudo crear el pedido: ${err?.message ?? 'error de red'}`);
          }
          this.enviando.set(false);
        },
      });
  }

  precio(valor: number): string {
    return formatearMoneda(valor);
  }

  nuevoPedido(): void {
    this.pedidoCreado.set(null);
    this.mensaje.set(null);
    this.cargar();
  }
}
