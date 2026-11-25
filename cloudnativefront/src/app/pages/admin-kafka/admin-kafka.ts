import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { KafkaAdminService } from '../../core/kafka-admin.service';
import { TopicInfo, ConsumerGroupInfo } from '../../core/models';

/**
 * Panel de administración de Kafka (solo ADMINISTRADOR).
 * Permite listar, crear, actualizar y eliminar topics, e inspeccionar consumer groups.
 */
@Component({
  selector: 'app-admin-kafka',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './admin-kafka.html',
  styleUrl: './admin-kafka.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminKafkaComponent implements OnInit {
  private readonly api = inject(KafkaAdminService);

  protected readonly topics = signal<TopicInfo[]>([]);
  protected readonly consumerGroups = signal<ConsumerGroupInfo[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly mensaje = signal<string | null>(null);

  // Formulario crear topic
  protected topicNombre = '';
  protected topicParticiones = 1;
  protected topicReplicas = 1;

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.api.listarTopics().subscribe({
      next: (data) => {
        this.topics.set(data);
        this.api.listarConsumerGroups().subscribe({
          next: (cg) => {
            this.consumerGroups.set(cg);
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        });
      },
      error: (err) => {
        this.error.set(`No se pudieron cargar los topics: ${err?.message ?? 'error'}`);
        this.loading.set(false);
      },
    });
  }

  crearTopic(): void {
    if (!this.topicNombre.trim()) {
      this.error.set('El nombre del topic no puede estar vacío.');
      return;
    }
    this.api
      .crearTopic({
        nombre: this.topicNombre.trim(),
        particiones: this.topicParticiones,
        replicas: this.topicReplicas,
      })
      .subscribe({
        next: () => {
          this.mensaje.set(`Topic '${this.topicNombre}' creado.`);
          this.topicNombre = '';
          this.cargar();
        },
        error: (err) => {
          this.error.set(`No se pudo crear el topic: ${err?.message ?? 'error'}`);
        },
      });
  }

  eliminarTopic(nombre: string): void {
    if (!confirm(`¿Eliminar el topic '${nombre}'? Esta acción no se puede deshacer.`)) return;
    this.api.eliminarTopic(nombre).subscribe({
      next: () => {
        this.mensaje.set(`Topic '${nombre}' eliminado.`);
        this.cargar();
      },
      error: (err) => {
        this.error.set(`No se pudo eliminar el topic: ${err?.message ?? 'error'}`);
      },
    });
  }
}
