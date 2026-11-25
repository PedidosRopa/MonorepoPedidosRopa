import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Íconos SVG de trazo (24x24) en línea: sin fuentes de íconos ni peticiones extra.
 * Cada entrada es una lista de `d` de <path>; heredan el color con currentColor.
 */
const ICONOS = {
  carrito: [
    'M6 6h15l-1.5 9h-12z',
    'M6 6 5 3H2',
    'M9 20.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
    'M18 20.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  ],
  bolsa: ['M5 8h14l-1 13H6z', 'M9 8V6a3 3 0 0 1 6 0v2'],
  caja: ['M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z', 'M3 7.5 12 12l9-4.5', 'M12 12v9'],
  camion: ['M2 6h11v10H2z', 'M13 10h4l3 3v3h-7', 'M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z', 'M17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z'],
  polera: ['M8 3 3 6l2 4 2-1v12h10V9l2 1 2-4-5-3c0 1.7-1.8 3-4 3S8 4.7 8 3z'],
  cola: ['M4 5h16v4H4z', 'M4 10h16v4H4z', 'M4 15h16v4H4z'],
  flujo: ['M3 7h12', 'M3 12h18', 'M3 17h9', 'M18 4l3 3-3 3'],
  usuario: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M4 21a8 8 0 0 1 16 0'],
  check: ['M5 12.5 10 17.5 19 7'],
  x: ['M6 6l12 12', 'M18 6 6 18'],
  flecha: ['M5 12h14', 'M13 6l6 6-6 6'],
  mas: ['M12 5v14', 'M5 12h14'],
  menos: ['M5 12h14'],
  subir: ['M12 16V4', 'M7 9l5-5 5 5', 'M4 20h16'],
  imagen: ['M3 5h18v14H3z', 'M3 16l5-5 4 4 3-3 6 6', 'M15.5 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z'],
  basura: ['M4 7h16', 'M9 7V4h6v3', 'M6 7l1 13h10l1-13'],
  reloj: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 7v5l3 2'],
  tarjeta: ['M3 6h18v12H3z', 'M3 10h18', 'M7 15h3'],
  estrella: ['M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z'],
} as const;

export type NombreIcono = keyof typeof ICONOS;

@Component({
  selector: 'app-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex shrink-0', 'aria-hidden': 'true' },
  template: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      [attr.stroke-width]="grosor()"
      stroke-linecap="round"
      stroke-linejoin="round"
      [attr.width]="tamano()"
      [attr.height]="tamano()"
    >
      @for (d of trazos(); track $index) {
        <path [attr.d]="d" />
      }
    </svg>
  `,
})
export class Icon {
  readonly nombre = input.required<NombreIcono>();
  readonly tamano = input<number>(18);
  readonly grosor = input<number>(1.8);

  protected readonly trazos = computed(() => ICONOS[this.nombre()]);
}
