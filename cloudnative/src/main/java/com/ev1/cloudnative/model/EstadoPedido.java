package com.ev1.cloudnative.model;

public enum EstadoPedido {
    PENDIENTE,            // Creado por el usuario, stock reservado
    PENDIENTE_APROBACION, // Operación que requiere revisión manual
    PROCESANDO,           // Enviado a bodega / cola de despacho
    COMPLETADO,           // Entregado exitosamente
    CANCELADO             // Anulado (devuelve stock)
}