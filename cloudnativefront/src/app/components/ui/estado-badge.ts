import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Chip de estado de pedido con gradiente/matiz según EstadoPedido.
 * Estáticos para que Tailwind los detecte al escanear este .ts.
 */
const ESTADO_STYLES: Record<string, string> = {
  PENDIENTE: 'border-amber-400/30 bg-amber-500/10 text-amber-200',
  PENDIENTE_APROBACION: 'border-yellow-400/30 bg-yellow-500/10 text-yellow-200',
  PROCESANDO: 'border-blue-400/30 bg-blue-500/10 text-blue-200',
  COMPLETADO: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
  CANCELADO: 'border-rose-400/30 bg-rose-500/10 text-rose-200',
};

@Component({
  selector: 'app-estado-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [class]="classes()" class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide">
      {{ estado() }}
    </span>
  `,
})
export class EstadoBadge {
  /** Estado del pedido (enum EstadoPedido del backend); cualquier valor desconocido usa el estilo por defecto. */
  readonly estado = input.required<string>();

  protected readonly classes = computed(
    () => ESTADO_STYLES[this.estado()] ?? 'border-white/15 bg-white/5 text-slate-300'
  );
}
