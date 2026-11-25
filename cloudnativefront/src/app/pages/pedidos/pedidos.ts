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
  ESTADO_META,
  esTerminal,
  etiquetaEstado,
  siguientesEstados,
} from '../../core/pedido-estado';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [RouterLink, EstadoBadge],
  templateUrl: './pedidos.html',
  styleUrl: './pedidos.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PedidosComponent implements OnInit {
  private readonly api = inject(PedidoService);
  protected readonly auth = inject(AuthService);

  protected readonly pedidos = signal<Pedido[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly mensaje = signal<string | null>(null);
  protected readonly filtro = signal<EstadoPedido | 'TODOS'>('TODOS');
  protected readonly expandido = signal<number | null>(null);
  protected readonly actualizando = signal<number | null>(null);

  protected readonly esStaff = computed(() => this.auth.isStaff());
  protected readonly esAdmin = computed(() => this.auth.isAdmin());

  protected readonly filtrados = computed(() => {
    const filtro = this.filtro();
    const lista = this.pedidos();
    if (filtro === 'TODOS') return lista;
    return lista.filter((pedido) => pedido.estado === filtro);
  });

  protected readonly resumen = computed(() => {
    const lista = this.pedidos();
    return {
      total: lista.length,
      activos: lista.filter((p) => !esTerminal(p.estado)).length,
      entregados: lista.filter((p) => p.estado === 'ENTREGADO' || p.estado === 'COMPLETADO').length,
    };
  });

  /** Estados presentes en la lista, para no mostrar filtros vacíos. */
  protected readonly estadosDisponibles = computed(() => {
    const presentes = new Set(this.pedidos().map((p) => p.estado).filter(Boolean));
    return Array.from(presentes) as EstadoPedido[];
  });

  ngOnInit(): void {
    this.cargar();
  }

  async cargar(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    // El rol puede venir del access token (asíncrono): esperar antes de elegir endpoint.
    await this.auth.ensureRolesLoaded();
    const peticion = this.esStaff() ? this.api.listarTodos() : this.api.misPedidos();

    peticion.subscribe({
      next: (data) => {
        this.pedidos.set(data ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(this.mensajeError(err));
        this.loading.set(false);
      },
    });
  }

  cambiarFiltro(filtro: EstadoPedido | 'TODOS'): void {
    this.filtro.set(filtro);
  }

  toggleDetalle(id?: number): void {
    if (id === undefined) return;
    this.expandido.update((actual) => (actual === id ? null : id));
  }

  opcionesEstado(pedido: Pedido): EstadoPedido[] {
    return siguientesEstados(pedido.estado, this.esAdmin());
  }

  puedeCambiarEstado(pedido: Pedido): boolean {
    return this.esStaff() && this.opcionesEstado(pedido).length > 0;
  }

  puedeCancelar(pedido: Pedido): boolean {
    if (!pedido.estado || esTerminal(pedido.estado)) return false;
    return this.esAdmin() || this.esPropietario(pedido);
  }

  esPropietario(pedido: Pedido): boolean {
    const email = this.auth.email();
    if (!email || !pedido.usuarioEmail) return false;
    return email.toLowerCase() === pedido.usuarioEmail.toLowerCase();
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
        this.mensaje.set(`Pedido #${id} actualizado a ${etiquetaEstado(nuevoEstado)}.`);
        this.actualizando.set(null);
      },
      error: (err) => {
        this.error.set(this.mensajeError(err, 'cambiar el estado del pedido'));
        this.actualizando.set(null);
      },
    });
  }

  cancelar(pedido: Pedido): void {
    const id = pedido.idPedido;
    if (id === undefined) return;
    if (!confirm(`¿Cancelar el pedido #${id}? Se restituirá el stock de sus productos.`)) return;

    this.actualizando.set(id);
    this.error.set(null);
    this.api.eliminar(id).subscribe({
      next: () => {
        this.pedidos.update((lista) =>
          lista.map((p) => (p.idPedido === id ? { ...p, estado: 'CANCELADO' } : p))
        );
        this.mensaje.set(`Pedido #${id} cancelado y stock restituido.`);
        this.actualizando.set(null);
      },
      error: (err) => {
        this.error.set(this.mensajeError(err, 'cancelar el pedido'));
        this.actualizando.set(null);
      },
    });
  }

  etiqueta(estado?: EstadoPedido): string {
    return estado ? (ESTADO_META[estado]?.label ?? estado) : 'Sin estado';
  }

  fecha(valor?: string): string {
    return formatearFecha(valor);
  }

  monto(valor?: number): string {
    return formatearMoneda(valor);
  }

  private mensajeError(err: { status?: number; message?: string; error?: { detail?: string } }, accion = 'cargar los pedidos'): string {
    if (err?.status === 401) return 'Tu sesión expiró. Vuelve a iniciar sesión.';
    if (err?.status === 403) return 'No autorizado para ver estos pedidos.';
    if (err?.error?.detail) return err.error.detail;
    return `No se pudo ${accion}: ${err?.message ?? 'error de red'}`;
  }
}
