import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { PedidoService } from '../../core/pedido.service';
import { HistorialPedido, EstadoPedido } from '../../core/models';
import { EstadoBadge } from '../../components/ui/estado-badge';

/**
 * Vista de seguimiento (tracker) de un pedido.
 * Muestra la línea de tiempo de cambios de estado (historial).
 * Accesible por: dueño del pedido, REPARTIDOR, ADMINISTRADOR.
 */
@Component({
  selector: 'app-pedido-tracker',
  standalone: true,
  imports: [RouterLink, EstadoBadge],
  templateUrl: './pedido-tracker.html',
  styleUrl: './pedido-tracker.css',
})
export class PedidoTrackerComponent implements OnInit {
  private readonly api = inject(PedidoService);
  private readonly route = inject(ActivatedRoute);

  protected readonly idPedido = signal<number | null>(null);
  protected readonly historial = signal<HistorialPedido[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.idPedido.set(id);
      this.cargarHistorial(id);
    }
  }

  cargarHistorial(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.obtenerHistorial(id).subscribe({
      next: (data) => {
        this.historial.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        if (err?.status === 403 || err?.status === 404) {
          this.error.set('No tienes permiso para ver el historial de este pedido.');
        } else {
          this.error.set(`No se pudo cargar el historial: ${err?.message ?? 'error'}`);
        }
        this.loading.set(false);
      },
    });
  }

  /** Formatea una fecha ISO para mostrar. */
  formatearFecha(fecha?: string): string {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
