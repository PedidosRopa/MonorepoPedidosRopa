package com.ev1.cloudnative.dtos.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record QueueRequestDTO(
    @NotBlank(message = "El nombre de la cola es obligatorio")
    @Pattern(regexp = "^[a-zA-Z0-9._-]+$", message = "El nombre contiene caracteres no permitidos")
    String nombre,
    boolean durable
) {}