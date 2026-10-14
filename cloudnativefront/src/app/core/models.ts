/** Refleja com.ev1.cloudnative.model.Producto del backend. */
export interface Producto {
  idProducto?: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
}

/** Refleja com.ev1.cloudnative.model.Pedido del backend. */
export interface Pedido {
  idPedido?: number;
  descPedido: string;
  usuarioEmail?: string;
  montoTotal: number;
  fechaPedido?: string;
  estado?: string;
}
