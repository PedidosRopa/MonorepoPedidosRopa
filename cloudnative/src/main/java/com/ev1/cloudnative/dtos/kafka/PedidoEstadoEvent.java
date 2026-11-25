package com.ev1.cloudnative.dtos.kafka;

import java.time.LocalDateTime;

public record PedidoEstadoEvent(
        String schemaVersion,
        Long idPedido,
        String estadoAnterior,
        String estadoNuevo,
        String actualizadoPorEmail,
        LocalDateTime fechaCambio
) {
    public PedidoEstadoEvent(Long idPedido, String estadoAnterior, String estadoNuevo, String actualizadoPorEmail) {
        this("1.0", idPedido, estadoAnterior, estadoNuevo, actualizadoPorEmail, LocalDateTime.now());
    }
}