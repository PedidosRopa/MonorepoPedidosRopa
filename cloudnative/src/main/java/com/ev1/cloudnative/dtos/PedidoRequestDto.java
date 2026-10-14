package com.ev1.cloudnative.dtos;

import jakarta.validation.constraints.*;
import java.util.List;

public record PedidoRequestDto(
    String descPedido,
    @NotEmpty(message = "El pedido debe contener al menos un producto") 
    List<DetalleItemDto> items
) {}