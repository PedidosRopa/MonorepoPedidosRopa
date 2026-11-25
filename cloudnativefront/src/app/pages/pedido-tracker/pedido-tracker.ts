import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PedidoService } from '../../core/pedido.service';
import { PagoService } from '../../core/pago.service';
import { HistorialPedido, EstadoPedido, Pedido } from '../../core/models';
import { EstadoBadge } from '../../components/ui/estado-badge';
import { AuthService } from '../../auth/auth.service';
import { formatearFecha, formatearMoneda } from '../../core/formato';
import {
  ETAPAS_TRACKER,
  ESTADO_META,
  esPagable,
  etiquetaEstado,
  siguientesEstados,
} from '../../core/pedido-estado';

interface EtapaTracker {
  estado: EstadoPedido;
  label: string;
  descripcion: string;
  completada: boolean;
  actual: boolean;
}

import { Icon } from '../../components/ui/icon';
@Component({
  selector: 'app-pedido-tracker',
  standalone: true,
  imports: [RouterLink, EstadoBadge, Icon],
  templateUrl: './pedido-tracker.html',
  styleUrl: './pedido-tracker.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PedidoTrackerComponent implements OnInit {
  private readonly api = inject(PedidoService);
  private readonly pagos = inject(PagoService);
  private readonly route = inject(ActivatedRoute);
  protected readonly auth = inject(AuthService);

  protected readonly idPedido = signal<number | null>(null);
  protected readonly pedido = signal<Pedido | null>(null);
  protected readonly historial = signal<HistorialPedido[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly mensaje = signal<string | null>(null);
  protected readonly actualizando = signal(false);
  protected readonly pagando = signal(false);

  /** El dueño puede pagar mientras el pedido siga pendiente. */
  protected readonly puedePagar = computed(() => {
    const p = this.pedido();
    const email = this.auth.email();
    return (
      !!p &&
      esPagable(p.estado) &&
      !!email &&
      !!p.usuarioEmail &&
      email.toLowerCase() === p.usuarioEmail.toLowerCase()
    );
  });

  protected readonly etapas = computed<EtapaTracker[]>(() => {
    const actual = this.pedido()?.estado;
    const indiceActual = actual ? ETAPAS_TRACKER.indexOf(actual) : -1;
    return ETAPAS_TRACKER.map((estado, indice) => ({
      estado,
      label: ESTADO_META[estado].label,
      descripcion: ESTADO_META[estado].descripcion,
      completada: indiceActual >= 0 && indice < indiceActual,
      actual: indice === indiceActual,
    }));
  });

  protected readonly cancelado = computed(() => this.pedido()?.estado === 'CANCELADO');

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(id) || id <= 0) {
      this.error.set('El identificador del pedido no es válido.');
      return;
    }
    this.idPedido.set(id);
    this.cargar();
  }

  async cargar(): Promise<void> {
    const id = this.idPedido();
    if (!id) return;

    this.loading.set(true);
    this.error.set(null);
    this.mensaje.set(null);
    // El rol puede venir del access token (asíncrono): esperar antes de elegir endpoint.
    await this.auth.ensureRolesLoaded();

    const pedidos$ = this.auth.isStaff() ? this.api.listarTodos() : this.api.misPedidos();
    const historial$ = this.api.obtenerHistorial(id).pipe(catchError(() => of([])));

    forkJoin({ pedidos: pedidos$, historial: historial$ }).subscribe({
      next: ({ pedidos, historial }) => {
        const pedido = (pedidos ?? []).find((p) => p.idPedido === id) ?? null;
        this.pedido.set(pedido);

        if (!pedido && !this.auth.isStaff()) {
          this.error.set('No tienes permiso para ver este pedido o ya no existe.');
          this.historial.set([]);
          this.loading.set(false);
          return;
        }

        this.historial.set(historial ?? []);
        this.loading.set(false);
        if (!pedido) {
          this.error.set('El pedido no aparece en la lista del backend, pero se muestra el historial disponible.');
        }
      },
      error: (err) => {
        this.error.set(
          err?.status === 401 || err?.status === 403
            ? 'No autorizado para ver este pedido.'
            : `No se pudo cargar el pedido: ${err?.message ?? 'error de red'}`
        );
        this.loading.set(false);
      },
    });
  }

  opcionesEstado(): EstadoPedido[] {
    return siguientesEstados(this.pedido()?.estado, this.auth.isAdmin());
  }

  cambiarEstado(nuevoEstado: EstadoPedido): void {
    const id = this.idPedido();
    if (!id || this.actualizando()) return;

    this.actualizando.set(true);
    this.error.set(null);
    this.api.actualizarEstado(id, nuevoEstado).subscribe({
      next: (actualizado) => {
        this.pedido.update((actual) => (actual ? { ...actual, ...actualizado } : actual));
        this.mensaje.set(`Estado actualizado a ${etiquetaEstado(nuevoEstado)}.`);
        this.actualizando.set(false);
        // El historial se persiste vía Kafka; recargarlo tras un pequeño margen.
        setTimeout(() => this.cargar(), 1200);
      },
      error: (err) => {
        this.error.set(
          err?.error?.detail ?? `No se pudo cambiar el estado: ${err?.message ?? 'error de red'}`
        );
        this.actualizando.set(false);
      },
    });
  }

  pagar(): void {
    const id = this.idPedido();
    if (!id || this.pagando()) return;
    this.pagando.set(true);
    this.error.set(null);
    this.pagos.crearPreferencia(id).subscribe({
      next: (preferencia) => {
        if (!this.pagos.redirigirAlPago(preferencia)) {
          this.error.set('El backend no devolvió un link de pago válido.');
          this.pagando.set(false);
        }
      },
      error: (err) => {
        this.error.set(this.pagos.mensajeError(err));
        this.pagando.set(false);
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
