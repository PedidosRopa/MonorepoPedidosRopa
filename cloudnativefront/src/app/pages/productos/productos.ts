import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Icon } from '../../components/ui/icon';
import { ProductoMedia } from '../../components/ui/producto-media';
import { ProductoService } from '../../core/producto.service';
import { PedidoService } from '../../core/pedido.service';
import { CarritoService } from '../../core/carrito.service';
import { AuthService } from '../../auth/auth.service';
import { Producto } from '../../core/models';
import { formatearMoneda } from '../../core/formato';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [FormsModule, RouterLink, Icon, ProductoMedia],
  templateUrl: './productos.html',
  styleUrl: './productos.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductosComponent implements OnInit {
  private readonly api = inject(ProductoService);
  private readonly pedidosApi = inject(PedidoService);
  private readonly carrito = inject(CarritoService);
  private readonly route = inject(ActivatedRoute);
  protected readonly auth = inject(AuthService);

  protected readonly esAdmin = computed(() => this.auth.isAdmin());
  protected readonly productos = signal<Producto[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly mensaje = signal<string | null>(null);

  /**
   * IDs de productos referenciados por algún pedido. El backend falla con 500
   * al borrarlos por la FK de detalle_pedidos, así que se bloquea el botón.
   */
  protected readonly productosConPedidos = signal<ReadonlySet<number>>(new Set());
  protected readonly cargandoReferencias = signal(false);

  protected nombre = '';
  protected descripcion = '';
  protected precio: number | null = null;
  protected stock: number | null = null;
  protected categoria = '';
  protected talla = '';
  protected genero = '';
  protected filtroCategoria = '';
  protected filtroTalla = '';
  protected readonly creando = signal(false);

  /** Foto elegida en el formulario de creación (se sube tras crear el producto). */
  protected readonly archivoNuevo = signal<File | null>(null);
  /** id del producto cuya foto se está subiendo. */
  protected readonly subiendo = signal<number | null>(null);

  private temporizador: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    // Permite llegar filtrado desde la cinta de categorías del landing (?categoria=...).
    const params = this.route.snapshot.queryParamMap;
    this.filtroCategoria = params.get('categoria') ?? '';
    this.filtroTalla = params.get('talla') ?? '';
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .listar({
        categoria: this.filtroCategoria.trim() || undefined,
        talla: this.filtroTalla.trim() || undefined,
      })
      .subscribe({
        next: (data) => {
          this.productos.set(data);
          this.carrito.sincronizarCatalogo(data);
          this.loading.set(false);
          if (this.esAdmin()) {
            this.cargarReferenciasDePedidos();
          }
        },
        error: (err) => {
          this.error.set(this.mensajeError(err, 'cargar los productos'));
          this.loading.set(false);
        },
      });
  }

  limpiarFiltros(): void {
    this.filtroCategoria = '';
    this.filtroTalla = '';
    this.cargar();
  }

  crear(): void {
    if (!this.esAdmin()) return;
    if (
      !this.nombre.trim() ||
      this.precio === null ||
      this.stock === null ||
      !this.categoria.trim() ||
      !this.talla.trim()
    ) {
      this.error.set('Completa nombre, precio, stock, categoría y talla.');
      return;
    }

    this.creando.set(true);
    this.error.set(null);
    this.api
      .crear({
        nombre: this.nombre.trim(),
        descripcion: this.descripcion.trim(),
        precio: Number(this.precio),
        stock: Number(this.stock),
        categoria: this.categoria.trim(),
        talla: this.talla.trim(),
        genero: this.genero.trim() || undefined,
      })
      .subscribe({
        next: (nuevo) => {
          this.productos.update((lista) => [...lista, nuevo]);
          this.mensaje.set(`Producto "${nuevo.nombre}" creado.`);
          const foto = this.archivoNuevo();
          this.archivoNuevo.set(null);
          if (foto && nuevo.idProducto !== undefined) {
            this.enviarFoto(nuevo, foto);
          }
          this.nombre = '';
          this.descripcion = '';
          this.precio = null;
          this.stock = null;
          this.categoria = '';
          this.talla = '';
          this.genero = '';
          this.creando.set(false);
          this.avisarTemporal(this.mensaje);
        },
        error: (err) => {
          this.error.set(this.mensajeError(err, 'crear el producto'));
          this.creando.set(false);
        },
      });
  }

  eliminar(producto: Producto): void {
    const id = producto.idProducto;
    if (id === undefined || !this.esAdmin()) return;

    if (this.productosConPedidos().has(id)) {
      this.error.set(
        `No se puede eliminar "${producto.nombre}": ya aparece en pedidos y el backend rechaza el borrado (FK detalle_pedidos). ` +
          'Hay que corregirlo en backend con borrado lógico o desvinculando el detalle.'
      );
      return;
    }

    if (!confirm(`¿Eliminar "${producto.nombre}"? Esta acción no se puede deshacer.`)) return;

    this.api.eliminar(id).subscribe({
      next: () => {
        this.productos.update((lista) => lista.filter((p) => p.idProducto !== id));
        this.mensaje.set(`Producto "${producto.nombre}" eliminado.`);
        this.avisarTemporal(this.mensaje);
      },
      error: (err) => {
        if (err?.status === 500) {
          this.error.set(
            `No se pudo eliminar "${producto.nombre}". El backend devolvió 500: probablemente el producto tiene pedidos asociados (FK).`
          );
        } else if (err?.status === 401 || err?.status === 403) {
          this.error.set('No autorizado. Necesitas rol ADMINISTRADOR con un JWT válido.');
        } else {
          this.error.set(this.mensajeError(err, 'eliminar el producto'));
        }
      },
    });
  }

  elegirArchivoNuevo(input: HTMLInputElement): void {
    const archivo = input.files?.[0] ?? null;
    input.value = '';
    if (archivo && !this.validarFoto(archivo)) return;
    this.archivoNuevo.set(archivo);
  }

  subirFoto(producto: Producto, input: HTMLInputElement): void {
    const archivo = input.files?.[0];
    input.value = '';
    if (!archivo || !this.esAdmin() || !this.validarFoto(archivo)) return;
    this.enviarFoto(producto, archivo);
  }

  private validarFoto(archivo: File): boolean {
    if (!archivo.type.startsWith('image/')) {
      this.error.set('El archivo debe ser una imagen (JPG, PNG o WebP).');
      return false;
    }
    // Límite de multipart del backend: spring.servlet.multipart.max-file-size=10MB
    if (archivo.size > 10 * 1024 * 1024) {
      this.error.set('La imagen supera los 10 MB permitidos por el backend.');
      return false;
    }
    return true;
  }

  private enviarFoto(producto: Producto, archivo: File): void {
    const id = producto.idProducto;
    if (id === undefined) return;
    this.subiendo.set(id);
    this.error.set(null);
    this.api.subirImagen(id, archivo).subscribe({
      next: (actualizado) => {
        this.productos.update((lista) =>
          lista.map((p) => (p.idProducto === id ? { ...p, ...actualizado } : p))
        );
        this.carrito.sincronizarCatalogo(this.productos());
        this.mensaje.set(`Foto de "${producto.nombre}" actualizada.`);
        this.subiendo.set(null);
        this.avisarTemporal(this.mensaje);
      },
      error: (err) => {
        this.error.set(
          err?.status === 413
            ? 'La imagen es demasiado grande para el servidor.'
            : this.mensajeError(err, `subir la foto de "${producto.nombre}"`)
        );
        this.subiendo.set(null);
      },
    });
  }

  agregarAlCarrito(producto: Producto): void {
    if (producto.stock <= 0) return;
    this.carrito.agregarProducto(producto, 1);
    this.mensaje.set(`"${producto.nombre}" se agregó al carrito.`);
    this.avisarTemporal(this.mensaje);
  }

  unidadesEnCarrito(productoId?: number): number {
    return this.carrito.unidadesDe(productoId);
  }

  tienePedidos(productoId?: number): boolean {
    return productoId !== undefined && this.productosConPedidos().has(productoId);
  }

  formatearPrecio(valor: number): string {
    return formatearMoneda(valor);
  }

  private cargarReferenciasDePedidos(): void {
    this.cargandoReferencias.set(true);
    this.pedidosApi.listarTodos().subscribe({
      next: (pedidos) => {
        const ids = new Set<number>();
        for (const pedido of pedidos) {
          for (const detalle of pedido.detalles ?? []) {
            if (typeof detalle.idProducto === 'number') ids.add(detalle.idProducto);
          }
        }
        this.productosConPedidos.set(ids);
        this.cargandoReferencias.set(false);
      },
      error: () => this.cargandoReferencias.set(false),
    });
  }

  private mensajeError(err: { status?: number; message?: string; error?: { detail?: string } }, accion: string): string {
    if (err?.status === 401 || err?.status === 403) {
      return 'No autorizado. Inicia sesión con una cuenta que tenga permisos.';
    }
    if (err?.error?.detail) return err.error.detail;
    return `No se pudo ${accion}: ${err?.message ?? 'error de red'}`;
  }

  private avisarTemporal(senal: { set(valor: string | null): void }): void {
    if (this.temporizador) clearTimeout(this.temporizador);
    this.temporizador = setTimeout(() => senal.set(null), 3500);
  }
}
