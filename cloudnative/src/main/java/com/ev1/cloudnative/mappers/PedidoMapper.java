package com.ev1.cloudnative.mappers;

import com.ev1.cloudnative.dtos.DetalleResponseDto;
import com.ev1.cloudnative.dtos.PedidoResponseDto;
import com.ev1.cloudnative.model.DetallePedido;
import com.ev1.cloudnative.model.Pedido;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PedidoMapper {

    // MapStruct mapará la lista de detalles automáticamente usando toDetalleDto
    PedidoResponseDto toDto(Pedido entity);

    // Mapeo del detalle con atributos anidados de 'producto' y cálculo de subtotal
    @Mapping(target = "productoId", source = "producto.idProducto")
    @Mapping(target = "nombreProducto", source = "producto.nombre")
    @Mapping(target = "cantidad", source = "cantidad")
    @Mapping(target = "precioUnitario", source = "precioUnitario")
    @Mapping(target = "subtotal", expression = "java(detalle.getPrecioUnitario() * detalle.getCantidad())")
    DetalleResponseDto toDetalleDto(DetallePedido detalle);
}