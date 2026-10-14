package com.ev1.cloudnative.dtos;

import java.io.Serializable;

public record StockBajoEvent(
    Long idProducto,
    String nombreProducto,
    Integer stockRestante
) implements Serializable {}