import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { PedidoService } from '../../core/pedido.service';
import { Pedido, EstadoPedido } from '../../core/models';
import { EstadoBadge } from '../../components/ui/estado-badge';
import { AuthService } from '../../auth/auth.service';
import { formatearFecha, formatearMoneda } from '../../core/formato';
import {
  esTerminal,
  etiquetaEstado,
  siguientesEstados,
} from '../../core/pedido-estado';

import { Icon } from '../../components/ui/icon';
@Component({
  selector: 'app-repartidor-dashboard',
  standalone: true,
  imports: [RouterLink, EstadoBadge, Icon],
  templateUrl: './repartidor-dashboard.html',
  styleUrl: './repartidor-dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RepartidorDashboardComponent implements OnInit {
  private readonly api = inject(PedidoService);
  protected readonly auth = inject(AuthService);

  protected readonly pedidos = signal<Pedido[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly mensaje = signal<string | null>(null);
  protected readonly actualizando = signal<number | null>(null);
  protected readonly soloActivos = signal(true);
  protected readonly expandido = signal<number | null>(null);

  protected readonly visibles = computed(() => {
    const lista = this.pedidos();
    return this.soloActivos() ? lista.filter((p) => !esTerminal(p.estado)) : lista;
  });

  protected readonly resumen = computed(() => {
    const lista = this.pedidos();
    return {
      pendientes: lista.filter((p) => p.estado === 'PENDIENTE' || p.estado === 'PENDIENTE_APROBACION').length,
      enRuta: lista.filter((p) => p.estado === 'EN_CAMINO').length,
      activos: lista.filter((p) => !esTerminal(p.estado)).length,
    };
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.listarTodos().subscribe({
      next: (data) => {
        this.pedidos.set(data ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(
          err?.status === 401 || err?.status === 403
            ? 'No autorizado. Se requiere rol REPARTIDOR o ADMINISTRADOR.'
            : `No se pudieron cargar los pedidos: ${err?.message ?? 'error de red'}`
        );
        this.loading.set(false);
      },
    });
  }

  toggleSoloActivos(): void {
    this.soloActivos.update((v) => !v);
  }

  toggleDetalle(id?: number): void {
    if (id === undefined) return;
    this.expandido.update((actual) => (actual === id ? null : id));
  }

  opcionesEstado(pedido: Pedido): EstadoPedido[] {
    return siguientesEstados(pedido.estado, this.auth.isAdmin());
  }

  cambiarEstado(pedido: Pedido, nuevoEstado: EstadoPedido): void {
    const id = pedido.idPedido;
    if (id === undefined || this.actualizando() !== null) return;

    this.actualizando.set(id);
    this.error.set(null);
    this.mensaje.set(null);
    this.api.actualizarEstado(id, nuevoEstado).subscribe({
      next: (actualizado) => {
        this.pedidos.update((lista) =>
          lista.map((p) => (p.idPedido === id ? { ...p, ...actualizado } : p))
        );
        this.mensaje.set(`Pedido #${id} marcado como ${etiquetaEstado(nuevoEstado)}.`);
        this.actualizando.set(null);
      },
      error: (err) => {
        this.error.set(
          err?.error?.detail ??
            `No se pudo actualizar el pedido #${id}: ${err?.message ?? 'error de red'}`
        );
        this.actualizando.set(null);
      },
    });
  }

  etiqueta(estado?: EstadoPedido): string {
    return etiquetaEstado(estado);
  }

  fecha(valor?: string): string {
    return formatearFecha(valor);
  }

  monto(valor?: number): string {
    return formatearMoneda(valor);
  }
}
