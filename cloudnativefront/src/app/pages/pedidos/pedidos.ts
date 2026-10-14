import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PedidoService } from '../../core/pedido.service';
import { Pedido } from '../../core/models';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './pedidos.html',
  styleUrl: './pedidos.css',
})
export class PedidosComponent implements OnInit {
  private readonly api = inject(PedidoService);

  protected readonly pedidos = signal<Pedido[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly soloMios = signal(true);

  protected descPedido = '';
  protected montoTotal: number | null = null;
  protected estado = 'PENDIENTE';

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.error.set(null);
    const req = this.soloMios() ? this.api.misPedidos() : this.api.listarTodos();
    req.subscribe({
      next: (data) => {
        this.pedidos.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(
          err?.status === 401 || err?.status === 403
            ? 'No autorizado. Tu sesión no tiene un JWT válido para /api/pedidos.'
            : `No se pudieron cargar los pedidos: ${err?.message ?? 'error'}`
        );
        this.loading.set(false);
      },
    });
  }

  toggleFiltro(): void {
    this.soloMios.update((v) => !v);
    this.cargar();
  }

  crear(): void {
    if (!this.descPedido || this.montoTotal === null) {
      this.error.set('Completa la descripción y el monto total.');
      return;
    }
    this.api.crear({ descPedido: this.descPedido, montoTotal: this.montoTotal, estado: this.estado }).subscribe({
      next: (nuevo) => {
        this.pedidos.update((list) => [...list, nuevo]);
        this.descPedido = '';
        this.montoTotal = null;
        this.estado = 'PENDIENTE';
      },
      error: (err) => this.error.set(`No se pudo crear el pedido: ${err?.message ?? 'error'}`),
    });
  }

  eliminar(id?: number): void {
    if (id === undefined) return;
    this.api.eliminar(id).subscribe({
      next: () => this.pedidos.update((list) => list.filter((p) => p.idPedido !== id)),
      error: (err) => this.error.set(`No se pudo eliminar: ${err?.message ?? 'error'}`),
    });
  }
}
