package com.ev1.cloudnative.model;

public enum EstadoPedido {
    PENDIENTE,            // Creado por el usuario, stock reservado
    PAGADO,               // Pago confirmado por Mercado Pago
    PENDIENTE_APROBACION, // Operación que requiere revisión manual
    PROCESANDO,           // Confirmado en bodega
    EN_PREPARACION,       // Repartidor / bodega preparando paquete
    EN_CAMINO,            // Repartidor en ruta de entrega
    ENTREGADO,            // Entregado al cliente
    COMPLETADO,           // Cierre administrativo
    CANCELADO             // Anulado (devuelve stock)
}