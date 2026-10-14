package com.ev1.cloudnative.dtos.admin;

import jakarta.validation.constraints.NotBlank;

public record BindingRequestDTO(
    @NotBlank(message = "El nombre de la cola es obligatorio") String colaNombre,
    @NotBlank(message = "El nombre del exchange es obligatorio") String exchangeNombre,
    @NotBlank(message = "La routing key es obligatoria") String routingKey
) {}