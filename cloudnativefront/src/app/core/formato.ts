/** Formato de moneda usado en toda la app (sin depender de locale global). */
export function formatearMoneda(valor?: number | null): string {
  const numero = Number(valor ?? 0);
  return `$${new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(numero) ? numero : 0)}`;
}

/** Formatea una fecha ISO del backend para mostrarla en tablas y trackers. */
export function formatearFecha(fecha?: string | null): string {
  if (!fecha) return '—';
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return fecha;
  return date.toLocaleString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Convierte 1 en "1 unidad" y N en "N unidades". */
export function pluralUnidades(cantidad: number): string {
  return `${cantidad} ${cantidad === 1 ? 'unidad' : 'unidades'}`;
}
