package com.ev1.cloudnative.dtos.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ExchangeRequestDTO(
    @NotBlank(message = "El nombre del exchange es obligatorio")
    String nombre,
    
    @NotBlank(message = "El tipo de exchange es obligatorio (direct, topic, fanout)")
    @Pattern(regexp = "^(direct|topic|fanout)$", message = "El tipo debe ser direct, topic o fanout")
    String tipo
) {}