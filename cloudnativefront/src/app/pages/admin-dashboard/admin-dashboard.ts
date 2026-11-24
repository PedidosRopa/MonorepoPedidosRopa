import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PedidoService } from '../../core/pedido.service';
import { ProductoService } from '../../core/producto.service';
import { Pedido } from '../../core/models';
import { Producto } from '../../core/models';

/**
 * Panel de administración general (solo ADMINISTRADOR).
 * Muestra métricas clave y accesos rápidos a RabbitMQ y Kafka.
 */
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboardComponent implements OnInit {
  private readonly pedidosApi = inject(PedidoService);
  private readonly productosApi = inject(ProductoService);

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
    this.pedidosApi.listarTodos().subscribe({
      next: (pedidos) => {
        this.totalPedidos.set(pedidos.length);
        this.pedidosPendientes.set(
          pedidos.filter((p) => p.estado !== 'ENTREGADO' && p.estado !== 'CANCELADO' && p.estado !== 'COMPLETADO').length
        );
      },
      error: () => this.error.set('No se pudieron cargar las métricas de pedidos.'),
    });
    this.productosApi.listar().subscribe({
      next: (productos) => {
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
