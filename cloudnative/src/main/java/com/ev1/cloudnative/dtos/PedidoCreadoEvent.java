package com.ev1.cloudnative.dtos;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

public record PedidoCreadoEvent(
    Long idPedido,
    String usuarioEmail,
    Double montoTotal,
    LocalDateTime fecha,
    List<ItemResumen> items
) implements Serializable {
    public record ItemResumen(Long idProducto, String nombre, Integer cantidad) implements Serializable {}
}