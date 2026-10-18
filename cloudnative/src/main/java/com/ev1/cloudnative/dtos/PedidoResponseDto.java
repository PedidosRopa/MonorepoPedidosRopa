package com.ev1.cloudnative.dtos;

import com.ev1.cloudnative.model.EstadoPedido;
import java.time.LocalDateTime;
import java.util.List;

public record PedidoResponseDto(
    Long idPedido,
    String descPedido,
    String usuarioEmail,
    Double montoTotal,
    EstadoPedido estado,
    LocalDateTime fechaPedido,
    List<DetalleResponseDto> detalles
) {}