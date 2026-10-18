package com.ev1.cloudnative.dtos;

import jakarta.validation.constraints.*;

public record DetalleItemDto(
    @NotNull(message = "El ID del producto es obligatorio") 
    Long productoId,
    @NotNull @Min(value = 1, message = "La cantidad mínima es 1") 
    Integer cantidad
) {}