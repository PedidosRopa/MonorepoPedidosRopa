package com.ev1.cloudnative.dtos;

import com.ev1.cloudnative.model.EstadoPedido;
import java.time.LocalDateTime;

public record PedidoEstadoEvent(
    String schemaVersion,
    Long idPedido,
    EstadoPedido estadoAnterior,
    EstadoPedido estadoNuevo,
    String repartidorEmail,
    LocalDateTime timestamp
) {}