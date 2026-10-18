import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProductoService } from '../../core/producto.service';
import { PedidoService } from '../../core/pedido.service';
import { DetalleItem, PedidoRequest, Producto } from '../../core/models';

/**
 * Vista "Nuevo pedido": arma un pedido eligiendo productos y cantidades
 * y envía POST /api/pedidos con { descPedido, items } (PedidoRequestDto).
 * El montoTotal y el estado los calcula el backend.
 */
@Component({
  selector: 'app-nuevo-pedido',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './nuevo-pedido.html',
  styleUrl: './nuevo-pedido.css',
})
export class NuevoPedidoComponent implements OnInit {
  private readonly productosApi = inject(ProductoService);
  private readonly pedidosApi = inject(PedidoService);

  protected readonly productos = signal<Producto[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly mensaje = signal<string | null>(null);
  protected readonly enviando = signal(false);

  protected descPedido = '';
  /** productoId -> cantidad elegida (0 o ausente = sin seleccionar). */
  protected readonly cantidades = signal<Record<number, number>>({});
  protected filtroCategoria = '';
  protected filtroTalla = '';

  protected readonly items = computed<DetalleItem[]>(() => {
    const map = this.cantidades();
    return Object.entries(map)
      .filter(([, cantidad]) => cantidad > 0)
      .map(([id, cantidad]) => ({ productoId: Number(id), cantidad }));
  });

  protected readonly total = computed<number>(() => {
    const cantidades = this.cantidades();
    return this.productos().reduce((suma, p) => suma + (cantidades[p.idProducto!] ?? 0) * p.precio, 0);
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.error.set(null);
    this.productosApi
      .listar({
        categoria: this.filtroCategoria || undefined,
        talla: this.filtroTalla || undefined,
      })
      .subscribe({
        next: (data) => {
          this.productos.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(`No se pudieron cargar los productos: ${err?.message ?? 'error'}`);
          this.loading.set(false);
        },
      });
  }

  cambiarCantidad(producto: Producto, valor: number): void {
    const cantidad = Math.max(0, Math.min(producto.stock, Math.floor(valor || 0)));
    this.cantidades.update((map) => {
      const copia = { ...map };
      if (cantidad > 0) {
        copia[producto.idProducto!] = cantidad;
      } else {
        delete copia[producto.idProducto!];
      }
      return copia;
    });
  }

  crearPedido(): void {
    if (this.items().length === 0) {
      this.error.set('Selecciona al menos un producto con cantidad mayor a 0.');
      return;
    }
    const pedido: PedidoRequest = {
      descPedido: this.descPedido || undefined,
      items: this.items(),
    };
    this.enviando.set(true);
    this.error.set(null);
    this.mensaje.set(null);
    this.pedidosApi.crear(pedido).subscribe({
      next: (creado) => {
        this.mensaje.set(
          `Pedido #${creado.idPedido} creado (estado ${creado.estado}, monto ${creado.montoTotal}). ` +
            'Se publicó en RabbitMQ para su procesamiento.'
        );
        this.enviando.set(false);
        this.descPedido = '';
        this.cantidades.set({});
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
          this.error.set(`No se pudo crear el pedido: ${err?.message ?? 'error'}`);
        }
        this.enviando.set(false);
      },
    });
  }
}
