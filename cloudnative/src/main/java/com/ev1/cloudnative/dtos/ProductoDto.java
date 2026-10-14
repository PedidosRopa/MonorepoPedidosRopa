package com.ev1.cloudnative.dtos;

import jakarta.validation.constraints.*;

public record ProductoDto(
    Long idProducto,
    @NotBlank(message = "El nombre es obligatorio") String nombre,
    String descripcion,
    @NotNull @Positive(message = "El precio debe ser positivo") Double precio,
    @NotNull @Min(value = 0, message = "El stock no puede ser negativo") Integer stock,
    @NotBlank(message = "La categoría es obligatoria") String categoria,
    @NotBlank(message = "La talla es obligatoria") String talla,
    String genero
) {}