package com.ev1.cloudnative.mappers;

import com.ev1.cloudnative.dtos.DetalleResponseDto;
import com.ev1.cloudnative.dtos.PedidoResponseDto;
import com.ev1.cloudnative.model.DetallePedido;
import com.ev1.cloudnative.model.Pedido;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PedidoMapper {

    // Mapea la entidad Pedido y sus colecciones automáticamente
    PedidoResponseDto toDto(Pedido entity);

    // Mapeo preciso hacia el Record DetalleResponseDto
    @Mapping(target = "idProducto", source = "producto.idProducto")
    @Mapping(target = "nombreProducto", source = "producto.nombre")
    @Mapping(target = "subtotal", expression = "java(detalle.getPrecioUnitario() * detalle.getCantidad())")
    DetalleResponseDto toDetalleDto(DetallePedido detalle);
}