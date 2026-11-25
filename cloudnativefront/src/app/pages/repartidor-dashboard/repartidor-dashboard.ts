import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PedidoService } from '../../core/pedido.service';
import { Pedido } from '../../core/models';
import { EstadoBadge } from '../../components/ui/estado-badge';

/**
 * Panel del repartidor (solo REPARTIDOR o ADMINISTRADOR).
 * Muestra pedidos en estados PROCESANDO, EN_PREPARACION, EN_CAMINO
 * y permite actualizar su estado.
 */
@Component({
  selector: 'app-repartidor-dashboard',
  standalone: true,
  imports: [RouterLink, EstadoBadge],
  templateUrl: './repartidor-dashboard.html',
  styleUrl: './repartidor-dashboard.css',
})
export class RepartidorDashboardComponent implements OnInit {
  private readonly api = inject(PedidoService);

  protected readonly pedidos = signal<Pedido[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.listarTodos().subscribe({
      next: (data) => {
        // Filtrar estados que el repartidor puede gestionar
        const estadosGestionables = ['PROCESANDO', 'EN_PREPARACION', 'EN_CAMINO'];
        this.pedidos.set(data.filter((p) => estadosGestionables.includes(p.estado ?? '')));
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(
          err?.status === 401 || err?.status === 403
            ? 'No autorizado. Se requiere rol de repartidor o administrador.'
            : `No se pudieron cargar los pedidos: ${err?.message ?? 'error'}`
        );
        this.loading.set(false);
      },
    });
  }

  actualizarEstado(id: number | undefined, nuevoEstado: string): void {
    if (id === undefined) return;
    this.api.actualizarEstado(id, nuevoEstado as import('../../core/models').EstadoPedido).subscribe({
      next: (actualizado) => {
        this.pedidos.update((lista) =>
          lista.map((p) => (p.idPedido === actualizado.idPedido ? actualizado : p))
        );
      },
      error: (err) => {
        this.error.set(`No se pudo actualizar el estado: ${err?.message ?? 'error'}`);
      },
    });
  }
}
