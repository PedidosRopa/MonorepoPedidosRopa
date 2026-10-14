package com.ev1.cloudnative.dtos;

import jakarta.validation.constraints.*;
import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;
@Schema(description = "DTO de solicitud para la creación de una nueva orden de compra")
public record PedidoRequestDto(
    @Schema(description = "Notas adicionales u observaciones del pedido", example = "Despachar en horario de tarde")
    String descPedido,
    @Schema(description = "Lista de prendas y cantidades solicitadas")
    @NotEmpty(message = "El pedido debe contener al menos un producto") 
    List<DetalleItemDto> items
) {}