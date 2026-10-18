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
}

/** Filtros opcionales de GET /api/productos?categoria=..&talla=.. */
export interface ProductoFiltros {
  categoria?: string;
  talla?: string;
}

/** Estados del enum com.ev1.cloudnative.model.EstadoPedido. */
export type EstadoPedido =
  | 'PENDIENTE'
  | 'PENDIENTE_APROBACION'
  | 'PROCESANDO'
  | 'COMPLETADO'
  | 'CANCELADO';

/** Refleja com.ev1.cloudnative.dtos.DetalleItemDto (body de creación). */
export interface DetalleItem {
  productoId: number;
  cantidad: number;
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
