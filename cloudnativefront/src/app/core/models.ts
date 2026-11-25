/** Refleja com.ev1.cloudnative.dtos.ProductoDto del backend. */
export interface Producto {
  idProducto?: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  categoria: string;
  talla: string;
  genero?: string;
  imagenUrl?: string;
}

/** Filtros opcionales de GET /api/productos?categoria=..&talla=.. */
export interface ProductoFiltros {
  categoria?: string;
  talla?: string;
}

/** Estados del enum com.ev1.cloudnative.model.EstadoPedido (9 valores). */
export type EstadoPedido =
  | 'PENDIENTE'
  | 'PAGADO'
  | 'PENDIENTE_APROBACION'
  | 'PROCESANDO'
  | 'EN_PREPARACION'
  | 'EN_CAMINO'
  | 'ENTREGADO'
  | 'COMPLETADO'
  | 'CANCELADO';

/** Roles de usuario del backend (claim 'roles' del JWT de Entra ID). */
export type RolUsuario = 'ADMINISTRADOR' | 'REPARTIDOR' | 'CLIENTE';

/** Refleja com.ev1.cloudnative.dtos.DetalleItemDto (body de creación). */
export interface DetalleItem {
  productoId: number;
  cantidad: number;
}

/** Item del carrito de compras (UI). */
export interface CarritoItem {
  productoId: number;
  nombre: string;
  precio: number;
  cantidad: number;
  imagenUrl?: string;
  /** Stock disponible al momento de agregar; sirve para limitar cantidades. */
  stock?: number;
}

/** Body de POST /api/pedidos: PedidoRequestDto. El monto y estado los calcula el backend. */
export interface PedidoRequest {
  descPedido?: string;
  items: DetalleItem[];
}

/** Refleja com.ev1.cloudnative.dtos.DetalleResponseDto. */
export interface DetalleResponse {
  idProducto: number;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

/** Refleja com.ev1.cloudnative.dtos.PedidoResponseDto del backend. */
export interface Pedido {
  idPedido?: number;
  descPedido?: string;
  usuarioEmail?: string;
  montoTotal: number;
  fechaPedido?: string;
  estado?: EstadoPedido;
  detalles?: DetalleResponse[];
}

/** Refleja HistorialPedido (línea de tiempo de estados). */
export interface HistorialPedido {
  idHistorial?: number;
  idPedido: number;
  estadoAnterior?: EstadoPedido;
  estadoNuevo: EstadoPedido;
  actualizadoPorEmail?: string;
  fechaCambio?: string;
}

/** Refleja com.ev1.cloudnative.dtos.PreferenciaPagoDto (POST /api/pagos/preferencia/{idPedido}). */
export interface PreferenciaPago {
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint?: string;
}

/** Body de PATCH /api/pedidos/{id}/estado. */
export interface ActualizarEstadoRequest {
  nuevoEstado: EstadoPedido;
}

/* ==== Microservicio administrador de RabbitMQ (dtos.admin) ==== */

/** Refleja com.ev1.cloudnative.dtos.admin.QueueRequestDTO (POST /api/admin/rabbitmq/queues). */
export interface QueueRequest {
  nombre: string;
  durable: boolean;
}

/** Refleja com.ev1.cloudnative.dtos.admin.ExchangeRequestDTO (POST /api/admin/rabbitmq/exchanges). */
export interface ExchangeRequest {
  nombre: string;
  tipo: 'direct' | 'topic' | 'fanout';
}

/** Refleja com.ev1.cloudnative.dtos.admin.BindingRequestDTO (POST /api/admin/rabbitmq/bindings). */
export interface BindingRequest {
  colaNombre: string;
  exchangeNombre: string;
  routingKey: string;
}

/* ==== Admin Kafka (dtos.admin.kafka) ==== */

/** Refleja TopicRequestDTO (POST /api/admin/kafka/topics). */
export interface TopicRequest {
  nombre: string;
  particiones: number;
  replicas: number;
  retentionMs?: number;
  cleanupPolicy?: 'delete' | 'compact';
}

/** Refleja TopicInfoDto (GET /api/admin/kafka/topics). */
export interface TopicInfo {
  nombre: string;
  particiones: number;
  factorReplicacion: number;
  configuraciones: Record<string, string>;
}

/** Refleja TopicConfigUpdateDto (PATCH /api/admin/kafka/topics/{nombre}/config). */
export interface TopicConfigUpdate {
  retentionMs?: number;
  cleanupPolicy?: 'delete' | 'compact';
}

/** Refleja ConsumerGroupInfoDto (GET /api/admin/kafka/consumer-groups). */
export interface ConsumerGroupInfo {
  id: string;
  groupState: string;
  miembros: number;
  topicos: string[];
}
