import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProductoService } from '../../core/producto.service';
import { PedidoService } from '../../core/pedido.service';
import { CarritoService } from '../../core/carrito.service';
import { DetalleItem, PedidoRequest, Producto, CarritoItem } from '../../core/models';

/** Lee los items del carrito pasados por query string (?carrito=...). */
function leerItemsDesdeQuery(): CarritoItem[] {
  if (typeof window === 'undefined') return [];
  const params = new URLSearchParams(window.location.search);
  const carritoJson = params.get('carrito');
  if (!carritoJson) return [];
  try {
    return JSON.parse(carritoJson) as CarritoItem[];
  } catch {
    return [];
  }
}

/**
 * Vista "Nuevo pedido": arma un pedido eligiendo productos y cantidades
 * y envía POST /api/pedidos con { descPedido, items } (PedidoRequestDto).
 * El montoTotal y el estado los calcula el backend.
 * Si hay items en el carrito, se cargan por defecto.
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
  private readonly carritoApi = inject(CarritoService);

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
    this.cargarCarrito();
    // Si llegaron items por query string (desde el sidebar), cargarlos en cantidades
    const itemsQuery = leerItemsDesdeQuery();
    if (itemsQuery.length > 0) {
      const map: Record<number, number> = {};
      itemsQuery.forEach((i) => {
        map[i.productoId] = i.cantidad;
      });
      this.cantidades.set(map);
      this.mensaje.set(`Se cargaron ${itemsQuery.length} producto(s) desde tu carrito.`);
      setTimeout(() => this.mensaje.set(null), 3000);
    }
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

  /** Carga los items del carrito guardados en el backend. */
  cargarCarrito(): void {
    this.carritoApi.cargar().subscribe({
      next: (items) => {
        if (items.length > 0) {
          this.carritoApi.setItems(items);
          const map: Record<number, number> = {};
          items.forEach((i) => {
            map[i.productoId] = i.cantidad;
          });
          this.cantidades.set(map);
          this.mensaje.set(`Se cargaron ${items.length} producto(s) desde tu carrito.`);
        }
      },
      error: () => {
        // Si falla, ignorar silenciosamente; el carrito puede estar vacío
      },
    });
  }

  /** Agrega un producto al carrito global (para comprar luego). */
  agregarAlCarrito(producto: Producto): void {
    const item: CarritoItem = {
      productoId: producto.idProducto!,
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad: this.cantidades()[producto.idProducto!] ?? 1,
      imagenUrl: producto.imagenUrl,
    };
    this.carritoApi.agregar(item);
    this.mensaje.set(`${producto.nombre} agregado al carrito.`);
    setTimeout(() => this.mensaje.set(null), 3000);
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
        // Vaciar el carrito tras crear el pedido exitosamente
        this.carritoApi.vaciar().subscribe({
          next: () => this.carritoApi.setItems([]),
          error: () => {},
        });
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
