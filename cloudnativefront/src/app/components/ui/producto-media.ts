import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { Icon } from './icon';

/**
 * Foto de producto con relleno de marca debajo: si no hay imagenUrl o la URL
 * falla (por ejemplo, objeto S3 sin acceso público), se ve el relleno en vez
 * de una imagen rota.
 */
@Component({
  selector: 'app-producto-media',
  standalone: true,
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'card-media relative block h-full w-full overflow-hidden' },
  template: `
    <div class="media-vacia absolute inset-0">
      <app-icon nombre="polera" [tamano]="compacto() ? 22 : 40" [grosor]="1.4" />
      @if (!compacto()) {
        <span class="px-3 text-center font-display text-xs font-semibold uppercase tracking-widest text-orquidea-300/70">
          {{ categoria() || 'Sin foto' }}
        </span>
      }
    </div>
    @if (src() && src() !== srcFallida()) {
      <img
        [src]="src()"
        [alt]="alt()"
        class="relative h-full w-full object-cover"
        loading="lazy"
        decoding="async"
        (error)="srcFallida.set(src() ?? null)"
      />
    }
  `,
})
export class ProductoMedia {
  readonly src = input<string | null | undefined>(null);
  readonly alt = input<string>('');
  readonly categoria = input<string | null | undefined>(null);
  /** Versión mini (carrito): solo el ícono. */
  readonly compacto = input<boolean>(false);

  /** URL que falló; si cambia la imagen (nueva subida) se vuelve a intentar. */
  protected readonly srcFallida = signal<string | null>(null);
}
