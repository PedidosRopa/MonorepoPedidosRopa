import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { PedidoService } from '../../core/pedido.service';
import { ProductoService } from '../../core/producto.service';
import { Pedido, Producto } from '../../core/models';
import { AuthService } from '../../auth/auth.service';

import { Icon } from '../../components/ui/icon';
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, Icon],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardComponent implements OnInit {
  private readonly pedidosApi = inject(PedidoService);
  private readonly productosApi = inject(ProductoService);
  protected readonly auth = inject(AuthService);

  protected readonly totalPedidos = signal<number>(0);
  protected readonly totalProductos = signal<number>(0);
  protected readonly pedidosPendientes = signal<number>(0);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.cargarMetricas();
  }

  cargarMetricas(): void {
    this.loading.set(true);
    this.error.set(null);

    this.pedidosApi.listarTodos().subscribe({
      next: (pedidos: Pedido[]) => {
        this.totalPedidos.set(pedidos.length);
        this.pedidosPendientes.set(
          pedidos.filter(
            (p) => p.estado !== 'ENTREGADO' && p.estado !== 'CANCELADO' && p.estado !== 'COMPLETADO'
          ).length
        );
      },
      error: () => this.error.set('No se pudieron cargar las métricas de pedidos.'),
    });

    this.productosApi.listar().subscribe({
      next: (productos: Producto[]) => {
        this.totalProductos.set(productos.length);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las métricas de productos.');
        this.loading.set(false);
      },
    });
  }
}
