import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Icon, NombreIcono } from '../../components/ui/icon';

type ResultadoPago = 'exitoso' | 'fallido' | 'pendiente';

interface VistaResultado {
  icono: NombreIcono;
  titulo: string;
  texto: string;
  clases: string;
}

const VISTAS: Record<ResultadoPago, VistaResultado> = {
  exitoso: {
    icono: 'check',
    titulo: 'Pago aprobado',
    texto:
      'Mercado Pago confirmó tu pago. El pedido pasará a "Pagado" en cuanto el backend reciba la notificación (puede tardar unos segundos).',
    clases: 'bg-emerald-500/15 text-emerald-200',
  },
  pendiente: {
    icono: 'reloj',
    titulo: 'Pago pendiente',
    texto:
      'Tu pago quedó en proceso. Cuando Mercado Pago lo apruebe, el pedido se marcará como pagado automáticamente.',
    clases: 'bg-amber-500/15 text-amber-200',
  },
  fallido: {
    icono: 'x',
    titulo: 'Pago no completado',
    texto: 'El pago fue rechazado o cancelado. Tu pedido sigue pendiente y puedes intentarlo de nuevo.',
    clases: 'bg-rose-500/15 text-rose-200',
  },
};

/**
 * Página de vuelta desde Mercado Pago Checkout Pro (back_urls del backend).
 * Mercado Pago agrega por query: status/collection_status, payment_id y
 * external_reference (= idPedido).
 */
@Component({
  selector: 'app-pago-resultado',
  standalone: true,
  imports: [RouterLink, Icon],
  templateUrl: './pago-resultado.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PagoResultadoComponent {
  private readonly route = inject(ActivatedRoute);

  private readonly resultadoRuta = (this.route.snapshot.data['resultado'] ?? 'pendiente') as ResultadoPago;
  private readonly query = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  /** El status real de MP prevalece sobre la ruta (por si la back_url no coincide). */
  protected readonly resultado = computed<ResultadoPago>(() => {
    const status = (this.query().get('collection_status') ?? this.query().get('status') ?? '').toLowerCase();
    if (status === 'approved') return 'exitoso';
    if (status === 'pending' || status === 'in_process') return 'pendiente';
    if (status === 'rejected' || status === 'cancelled' || status === 'null') return 'fallido';
    return this.resultadoRuta;
  });

  protected readonly vista = computed(() => VISTAS[this.resultado()]);

  protected readonly idPedido = computed(() => {
    const id = Number(this.query().get('external_reference'));
    return Number.isFinite(id) && id > 0 ? id : null;
  });

  protected readonly idPago = computed(
    () => this.query().get('payment_id') ?? this.query().get('collection_id')
  );
}
