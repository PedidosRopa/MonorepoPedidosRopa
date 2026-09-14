import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../core/producto.service';
import { AuthService } from '../../auth/auth.service';
import { Producto } from '../../core/models';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './productos.html',
  styleUrl: './productos.css',
})
export class ProductosComponent implements OnInit {
  private readonly api = inject(ProductoService);
  protected readonly auth = inject(AuthService);

  protected readonly productos = signal<Producto[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected nombre = '';
  protected descripcion = '';
  protected precio: number | null = null;
  protected stock: number | null = null;

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.listar().subscribe({
      next: (data) => {
        this.productos.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(`No se pudieron cargar los productos: ${err?.message ?? err?.status ?? 'error'}`);
        this.loading.set(false);
      },
    });
  }

  crear(): void {
    if (!this.nombre || this.precio === null || this.stock === null) {
      this.error.set('Completa nombre, precio y stock para crear el producto.');
      return;
    }
    this.error.set(null);
    this.api
      .crear({ nombre: this.nombre, descripcion: this.descripcion, precio: this.precio, stock: this.stock })
      .subscribe({
        next: (nuevo) => {
          this.productos.update((list) => [...list, nuevo]);
          this.nombre = '';
          this.descripcion = '';
          this.precio = null;
          this.stock = null;
        },
        error: (err) => {
          if (err?.status === 401 || err?.status === 403) {
            this.error.set('No autorizado. Inicia sesión con Microsoft para crear productos.');
          } else {
            this.error.set(`No se pudo crear: ${err?.message ?? 'error'}`);
          }
        },
      });
  }

  eliminar(id?: number): void {
    if (id === undefined) return;
    this.api.eliminar(id).subscribe({
      next: () => this.productos.update((list) => list.filter((p) => p.idProducto !== id)),
      error: (err) => this.error.set(`No se pudo eliminar: ${err?.message ?? 'error'}`),
    });
  }

  login(): void {
    this.auth.login();
  }
}
