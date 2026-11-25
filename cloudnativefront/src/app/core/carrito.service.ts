import { Injectable, computed, signal } from '@angular/core';
import { CarritoItem, DetalleItem, Producto } from './models';

const STORAGE_KEY = 'pedidosropa.carrito.v1';

/**
 * Carrito de compras global (sidebar perpetuo).
 *
 * Se guarda en localStorage para que funcione sin sesión y sobreviva a recargas.
 * Decisión de producto: no se sincroniza con /api/carrito para evitar llamadas
 * extra (y popups de MSAL) que ralentizaban la app; el backend igualmente limpia
 * su carrito persistido al crear un pedido.
 */
@Injectable({ providedIn: 'root' })
export class CarritoService {
  private readonly _items = signal<CarritoItem[]>(this.leerLocal());

  /** Items del carrito (solo lectura para plantillas). */
  readonly itemsReadonly = this._items.asReadonly();

  readonly count = computed(() =>
    this._items().reduce((suma, item) => suma + item.cantidad, 0)
  );

  readonly total = computed(() =>
    this._items().reduce((suma, item) => suma + item.precio * item.cantidad, 0)
  );

  /** Visibilidad del sidebar, compartida por el navbar y cualquier página. */
  readonly sidebarOpen = signal(false);

  // ---------------------------------------------------------------------
  // Sidebar
  // ---------------------------------------------------------------------

  toggleSidebar(): void {
    this.sidebarOpen.update((abierto) => !abierto);
  }

  abrirSidebar(): void {
    this.sidebarOpen.set(true);
  }

  cerrarSidebar(): void {
    this.sidebarOpen.set(false);
  }

  // ---------------------------------------------------------------------
  // Mutaciones del carrito
  // ---------------------------------------------------------------------

  /** Agrega un producto (o suma unidades si ya está en el carrito). */
  agregarProducto(producto: Producto, cantidad = 1): void {
    if (!producto.idProducto || cantidad <= 0) return;
    const limite = producto.stock ?? Number.MAX_SAFE_INTEGER;

    this._items.update((lista) => {
      const existente = lista.find((item) => item.productoId === producto.idProducto);
      if (existente) {
        const nuevaCantidad = Math.min(existente.cantidad + cantidad, limite);
        return lista.map((item) =>
          item.productoId === producto.idProducto
            ? { ...item, cantidad: nuevaCantidad, stock: producto.stock, precio: producto.precio }
            : item
        );
      }
      return [
        ...lista,
        {
          productoId: producto.idProducto!,
          nombre: producto.nombre,
          precio: producto.precio,
          cantidad: Math.min(cantidad, limite),
          imagenUrl: producto.imagenUrl,
          stock: producto.stock,
        },
      ];
    });
    this.persistir();
  }

  /** Reemplaza el carrito completo (por ejemplo, al precargar "nuevo pedido"). */
  setItems(items: CarritoItem[]): void {
    this._items.set(items);
    this.persistir();
  }

  /** Fija una cantidad exacta; 0 o menos elimina el producto. */
  actualizarCantidad(productoId: number, cantidad: number): void {
    const numero = Math.floor(Number(cantidad) || 0);
    this._items.update((lista) => {
      if (numero <= 0) {
        return lista.filter((item) => item.productoId !== productoId);
      }
      return lista.map((item) =>
        item.productoId === productoId
          ? { ...item, cantidad: Math.min(numero, item.stock ?? Number.MAX_SAFE_INTEGER) }
          : item
      );
    });
    this.persistir();
  }

  incrementar(productoId: number): void {
    this._items.update((lista) =>
      lista.map((item) => {
        if (item.productoId !== productoId) return item;
        const limite = item.stock ?? Number.MAX_SAFE_INTEGER;
        return { ...item, cantidad: Math.min(item.cantidad + 1, limite) };
      })
    );
    this.persistir();
  }

  decrementar(productoId: number): void {
    this._items.update((lista) => {
      const existente = lista.find((item) => item.productoId === productoId);
      if (!existente) return lista;
      if (existente.cantidad <= 1) {
        return lista.filter((item) => item.productoId !== productoId);
      }
      return lista.map((item) =>
        item.productoId === productoId
          ? { ...item, cantidad: item.cantidad - 1 }
          : item
      );
    });
    this.persistir();
  }

  remover(productoId: number): void {
    this._items.update((lista) => lista.filter((item) => item.productoId !== productoId));
    this.persistir();
  }

  vaciar(): void {
    this._items.set([]);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }

  /** Unidades de un producto concreto (0 si no está en el carrito). */
  unidadesDe(productoId?: number): number {
    if (!productoId) return 0;
    return this._items().find((item) => item.productoId === productoId)?.cantidad ?? 0;
  }

  /** Items listos para enviar en el body de POST /api/pedidos. */
  itemsParaPedido(): DetalleItem[] {
    return this._items().map((item) => ({
      productoId: item.productoId,
      cantidad: item.cantidad,
    }));
  }

  /** Recalcula precios/stock con el catálogo más reciente. */
  sincronizarCatalogo(productos: Producto[]): void {
    if (!productos.length) return;
    const porId = new Map(productos.map((producto) => [producto.idProducto, producto]));
    let cambio = false;

    this._items.update((lista) =>
      lista.flatMap((item) => {
        const producto = porId.get(item.productoId);
        if (!producto) return [item];
        if (producto.stock <= 0) {
          cambio = true;
          return [];
        }
        const cantidad = Math.min(item.cantidad, producto.stock);
        if (
          cantidad !== item.cantidad ||
          producto.precio !== item.precio ||
          producto.nombre !== item.nombre
        ) {
          cambio = true;
          return [
            {
              ...item,
              nombre: producto.nombre,
              precio: producto.precio,
              cantidad,
              stock: producto.stock,
              imagenUrl: producto.imagenUrl,
            },
          ];
        }
        return [item];
      })
    );

    if (cambio) this.persistir();
  }

  // ---------------------------------------------------------------------
  // Persistencia local
  // ---------------------------------------------------------------------

  private leerLocal(): CarritoItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((item): item is CarritoItem => {
          if (!item || typeof item !== 'object') return false;
          const candidato = item as Partial<CarritoItem>;
          return (
            typeof candidato.productoId === 'number' &&
            typeof candidato.nombre === 'string' &&
            typeof candidato.precio === 'number' &&
            typeof candidato.cantidad === 'number' &&
            candidato.cantidad > 0
          );
        })
        .map((item) => ({ ...item, cantidad: Math.max(1, Math.floor(item.cantidad)) }));
    } catch {
      return [];
    }
  }

  private persistir(): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this._items()));
    } catch {
      // localStorage lleno o bloqueado: el carrito sigue funcionando en memoria.
    }
  }
}
