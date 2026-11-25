import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductoService } from '../../core/producto.service';
import { AuthService } from '../../auth/auth.service';
import { Producto } from '../../core/models';

/**
 * Landing page pública (sin MSAL).
 * Muestra el catálogo de productos y un llamado a la acción para iniciar sesión.
 */
@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class LandingComponent implements OnInit {
  private readonly productosApi = inject(ProductoService);
  protected readonly auth = inject(AuthService);

  protected readonly productos = signal<Producto[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.error.set(null);
    this.productosApi.listar().subscribe({
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

  login(): void {
    this.auth.login();
  }
}
