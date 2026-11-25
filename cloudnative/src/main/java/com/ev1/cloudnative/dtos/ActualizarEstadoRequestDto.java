package com.ev1.cloudnative.dtos;

import com.ev1.cloudnative.model.EstadoPedido;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

@Schema(description = "Solicitud de cambio de estado de un pedido por parte del repartidor o administrador")
public record ActualizarEstadoRequestDto(
    @NotNull(message = "El nuevo estado es obligatorio")
    @Schema(description = "Nuevo estado del pedido", example = "EN_CAMINO")
    EstadoPedido nuevoEstado
) {}