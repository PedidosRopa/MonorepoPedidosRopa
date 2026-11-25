import { EstadoPedido } from './models';

export interface EstadoMeta {
  valor: EstadoPedido;
  label: string;
  descripcion: string;
}

/**
 * Metadatos de los estados del backend (`com.ev1.cloudnative.model.EstadoPedido`).
 * El orden de ESTADOS_PEDIDO es el flujo logístico normal y se usa en el tracker.
 */
export const ESTADOS_PEDIDO: EstadoPedido[] = [
  'PENDIENTE',
  'PAGADO',
  'PENDIENTE_APROBACION',
  'PROCESANDO',
  'EN_PREPARACION',
  'EN_CAMINO',
  'ENTREGADO',
  'COMPLETADO',
  'CANCELADO',
];

export const ESTADO_META: Record<EstadoPedido, EstadoMeta> = {
  PENDIENTE: {
    valor: 'PENDIENTE',
    label: 'Pendiente',
    descripcion: 'Pedido recibido y stock reservado.',
  },
  PAGADO: {
    valor: 'PAGADO',
    label: 'Pagado',
    descripcion: 'Pago confirmado por Mercado Pago.',
  },
  PENDIENTE_APROBACION: {
    valor: 'PENDIENTE_APROBACION',
    label: 'Pendiente de aprobación',
    descripcion: 'El pedido requiere revisión manual.',
  },
  PROCESANDO: {
    valor: 'PROCESANDO',
    label: 'Procesando',
    descripcion: 'Pedido confirmado en bodega.',
  },
  EN_PREPARACION: {
    valor: 'EN_PREPARACION',
    label: 'En preparación',
    descripcion: 'Se está preparando el paquete.',
  },
  EN_CAMINO: {
    valor: 'EN_CAMINO',
    label: 'En camino',
    descripcion: 'El repartidor va en ruta de entrega.',
  },
  ENTREGADO: {
    valor: 'ENTREGADO',
    label: 'Entregado',
    descripcion: 'Pedido entregado al cliente.',
  },
  COMPLETADO: {
    valor: 'COMPLETADO',
    label: 'Completado',
    descripcion: 'Cierre administrativo del pedido.',
  },
  CANCELADO: {
    valor: 'CANCELADO',
    label: 'Cancelado',
    descripcion: 'Pedido anulado y stock restituido.',
  },
};

/** Estados en los que el pedido ya no admite más cambios. */
export const ESTADOS_TERMINALES: EstadoPedido[] = ['ENTREGADO', 'COMPLETADO', 'CANCELADO'];

export function esTerminal(estado?: EstadoPedido | null): boolean {
  return !!estado && ESTADOS_TERMINALES.includes(estado);
}

/** Estados en los que el cliente puede pagar con Mercado Pago. */
export const ESTADOS_PAGABLES: EstadoPedido[] = ['PENDIENTE', 'PENDIENTE_APROBACION'];

export function esPagable(estado?: EstadoPedido | null): boolean {
  return !!estado && ESTADOS_PAGABLES.includes(estado);
}

/** El backend no permite cancelar pedidos terminales ni ya pagados. */
export function esCancelable(estado?: EstadoPedido | null): boolean {
  return !!estado && !esTerminal(estado) && estado !== 'PAGADO';
}

export function etiquetaEstado(estado?: EstadoPedido | null): string {
  return estado ? (ESTADO_META[estado]?.label ?? estado) : 'Sin estado';
}

/**
 * Siguientes estados válidos para el flujo del negocio.
 * CANCELADO no se incluye aquí a propósito: la cancelación se hace con
 * DELETE /api/pedidos/{id}, que además restituye el stock.
 */
export function siguientesEstados(
  estado: EstadoPedido | undefined,
  esAdmin: boolean
): EstadoPedido[] {
  switch (estado) {
    case 'PENDIENTE':
      return ['PROCESANDO'];
    case 'PAGADO':
      return ['PROCESANDO'];
    case 'PENDIENTE_APROBACION':
      return ['PROCESANDO'];
    case 'PROCESANDO':
      return ['EN_PREPARACION'];
    case 'EN_PREPARACION':
      return ['EN_CAMINO'];
    case 'EN_CAMINO':
      return ['ENTREGADO'];
    case 'ENTREGADO':
      return esAdmin ? ['COMPLETADO'] : [];
    default:
      return [];
  }
}

/** Etapas que se dibujan en la línea de tiempo del tracker. */
export const ETAPAS_TRACKER: EstadoPedido[] = [
  'PENDIENTE',
  'PAGADO',
  'PROCESANDO',
  'EN_PREPARACION',
  'EN_CAMINO',
  'ENTREGADO',
  'COMPLETADO',
];
