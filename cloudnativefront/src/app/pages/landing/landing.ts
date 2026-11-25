import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductoService } from '../../core/producto.service';
import { CarritoService } from '../../core/carrito.service';
import { AuthService } from '../../auth/auth.service';
import { Producto } from '../../core/models';
import { formatearMoneda } from '../../core/formato';
import { Icon } from '../../components/ui/icon';
import { ProductoMedia } from '../../components/ui/producto-media';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, Icon, ProductoMedia],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingComponent implements OnInit {
  private readonly productosApi = inject(ProductoService);
  private readonly carrito = inject(CarritoService);
  protected readonly auth = inject(AuthService);

  protected readonly productos = signal<Producto[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly mensaje = signal<string | null>(null);
  protected readonly destacados = computed(() => this.productos().slice(0, 8));

  /** Categorías únicas del catálogo (sin distinguir mayúsculas). */
  protected readonly categorias = computed(() => {
    const vistas = new Map<string, string>();
    for (const p of this.productos()) {
      const cat = p.categoria?.trim();
      if (cat && !vistas.has(cat.toLowerCase())) vistas.set(cat.toLowerCase(), cat);
    }
    return Array.from(vistas.values());
  });

  /** Repite las categorías para que la cinta siempre llene el ancho de pantalla. */
  protected readonly cintaCategorias = computed(() => {
    const base = this.categorias();
    if (!base.length) return [];
    const repeticiones = Math.max(1, Math.ceil(8 / base.length));
    return Array.from({ length: repeticiones }, () => base).flat();
  });

  private temporizador: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.error.set(null);
    this.productosApi.listar().subscribe({
      next: (data) => {
        this.productos.set(data);
        this.carrito.sincronizarCatalogo(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(`No se pudieron cargar los productos: ${err?.message ?? 'error'}`);
        this.loading.set(false);
      },
    });
  }

  agregarAlCarrito(producto: Producto): void {
    if (producto.stock <= 0) return;
    this.carrito.agregarProducto(producto, 1);
    this.mensaje.set(`"${producto.nombre}" se agregó al carrito.`);
    if (this.temporizador) clearTimeout(this.temporizador);
    this.temporizador = setTimeout(() => this.mensaje.set(null), 3000);
  }

  unidadesEnCarrito(productoId?: number): number {
    return this.carrito.unidadesDe(productoId);
  }

  precio(valor: number): string {
    return formatearMoneda(valor);
  }

  login(): void {
    this.auth.login();
  }
}
