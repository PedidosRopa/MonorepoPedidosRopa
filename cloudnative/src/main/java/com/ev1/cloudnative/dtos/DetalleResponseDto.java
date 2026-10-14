package com.ev1.cloudnative.dtos;

public record DetalleResponseDto(
    Long idProducto,
    String nombreProducto,
    Integer cantidad,
    Double precioUnitario,
    Double subtotal
) {}