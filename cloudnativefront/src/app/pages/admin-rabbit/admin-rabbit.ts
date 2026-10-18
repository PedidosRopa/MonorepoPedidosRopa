import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { RabbitAdminService } from '../../core/rabbit-admin.service';
import { BindingRequest, ExchangeRequest, QueueRequest } from '../../core/models';

/**
 * Panel del microservicio administrador de RabbitMQ.
 * Consume POST/DELETE /api/admin/rabbitmq/{queues|exchanges|bindings} con Bearer JWT.
 */
@Component({
  selector: 'app-admin-rabbit',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-rabbit.html',
  styleUrl: './admin-rabbit.css',
})
export class AdminRabbitComponent {
  private readonly api = inject(RabbitAdminService);
  protected readonly auth = inject(AuthService);

  protected readonly mensaje = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly trabajando = signal(false);

  // Formulario: colas
  protected colaNombre = '';
  protected colaDurable = true;

  // Formulario: exchanges
  protected exchangeNombre = '';
  protected exchangeTipo: ExchangeRequest['tipo'] = 'direct';

  // Formulario: bindings
  protected bindingCola = '';
  protected bindingExchange = '';
  protected bindingRoutingKey = '';

  crearCola(): void {
    if (!this.colaNombre.trim()) {
      this.error.set('El nombre de la cola no puede estar vacío.');
      return;
    }
    const cola: QueueRequest = { nombre: this.colaNombre.trim(), durable: this.colaDurable };
    this.ejecutar(() => this.api.crearCola(cola), `Cola '${cola.nombre}' creada.`, () => (this.colaNombre = ''));
  }

  eliminarCola(): void {
    if (!this.colaNombre.trim()) {
      this.error.set('Escribe el nombre de la cola a eliminar.');
      return;
    }
    const nombre = this.colaNombre.trim();
    this.ejecutar(() => this.api.eliminarCola(nombre), `Cola '${nombre}' eliminada.`, () => (this.colaNombre = ''));
  }

  crearExchange(): void {
    if (!this.exchangeNombre.trim()) {
      this.error.set('El nombre del exchange no puede estar vacío.');
      return;
    }
    const exchange: ExchangeRequest = { nombre: this.exchangeNombre.trim(), tipo: this.exchangeTipo };
    this.ejecutar(
      () => this.api.crearExchange(exchange),
      `Exchange '${exchange.nombre}' (${exchange.tipo}) creado.`,
      () => (this.exchangeNombre = '')
    );
  }

  eliminarExchange(): void {
    if (!this.exchangeNombre.trim()) {
      this.error.set('Escribe el nombre del exchange a eliminar.');
      return;
    }
    const nombre = this.exchangeNombre.trim();
    this.ejecutar(
      () => this.api.eliminarExchange(nombre),
      `Exchange '${nombre}' eliminado.`,
      () => (this.exchangeNombre = '')
    );
  }

  crearBinding(): void {
    if (!this.bindingCola.trim() || !this.bindingExchange.trim() || !this.bindingRoutingKey.trim()) {
      this.error.set('Completa cola, exchange y routing key del binding.');
      return;
    }
    const binding: BindingRequest = {
      colaNombre: this.bindingCola.trim(),
      exchangeNombre: this.bindingExchange.trim(),
      routingKey: this.bindingRoutingKey.trim(),
    };
    this.ejecutar(
      () => this.api.crearBinding(binding),
      `Binding '${binding.exchangeNombre}' -> '${binding.colaNombre}' creado.`,
      () => {
        this.bindingCola = '';
        this.bindingExchange = '';
        this.bindingRoutingKey = '';
      }
    );
  }

  private ejecutar(operacion: () => import('rxjs').Observable<unknown>, ok: string, limpiar: () => void): void {
    this.trabajando.set(true);
    this.error.set(null);
    this.mensaje.set(null);
    operacion().subscribe({
      next: (res) => {
        this.mensaje.set(typeof res === 'string' && res ? res : ok);
        this.trabajando.set(false);
        limpiar();
      },
      error: (err) => {
        if (err?.status === 401 || err?.status === 403) {
          this.error.set('No autorizado. Inicia sesión con Microsoft con un JWT válido.');
        } else if (err?.error?.detail) {
          this.error.set(err.error.detail);
        } else {
          this.error.set(`Operación fallida: ${err?.message ?? 'error'}`);
        }
        this.trabajando.set(false);
      },
    });
  }
}
