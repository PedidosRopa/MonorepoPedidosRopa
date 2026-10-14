package com.ev1.cloudnative.mappers;

import com.ev1.cloudnative.dtos.DetalleResponseDto;
import com.ev1.cloudnative.dtos.PedidoResponseDto;
import com.ev1.cloudnative.model.DetallePedido;
import com.ev1.cloudnative.model.Pedido;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class PedidoMapper {

    public PedidoResponseDto toDto(Pedido entity) {
        if (entity == null) return null;

        List<DetalleResponseDto> detallesDto = entity.getDetalles().stream()
            .map(this::toDetalleDto)
            .toList();

        return new PedidoResponseDto(
            entity.getIdPedido(),
            entity.getDescPedido(),
            entity.getUsuarioEmail(),
            entity.getMontoTotal(),
            entity.getEstado(),
            entity.getFechaPedido(),
            detallesDto
        );
    }

    private DetalleResponseDto toDetalleDto(DetallePedido detalle) {
        double subtotal = detalle.getPrecioUnitario() * detalle.getCantidad();
        return new DetalleResponseDto(
            detalle.getProducto().getIdProducto(),
            detalle.getProducto().getNombre(),
            detalle.getCantidad(),
            detalle.getPrecioUnitario(),
            subtotal
        );
    }
}