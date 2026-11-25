package com.ev1.cloudnative.dtos;

import com.ev1.cloudnative.model.EstadoPedido;
import java.time.LocalDateTime;

public record HistorialPedidoResponseDto(
    Long idHistorial,
    Long idPedido,
    EstadoPedido estadoAnterior,
    EstadoPedido estadoNuevo,
    String actualizadoPorEmail,
    LocalDateTime fechaCambio
) {}