package com.ev1.cloudnative.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
@Schema(description = "DTO para la creación y representación de un producto de vestuario")
public record ProductoDto(
    @Schema(description = "ID del producto")
    Long idProducto,
    @Schema(description = "Nombre del producto")    
    @NotBlank(message = "El nombre es obligatorio")
    String nombre,
    @Schema(description = "Descripción del producto")
    String descripcion,
    @NotNull @Positive(message = "El precio debe ser positivo") 
    Double precio,
    @NotNull @Min(value = 0, message = "El stock no puede ser negativo") 
    @Schema(description = "Stock del producto")
    Integer stock,
    @NotBlank(message = "La categoría es obligatoria") 
    @Schema(description = "Categoría del producto")
    String categoria,
    @NotBlank(message = "La talla es obligatoria") 
    @Schema(description = "Talla del producto")
    String talla,
    @Schema(description = "Género del producto")
    String genero
) {}