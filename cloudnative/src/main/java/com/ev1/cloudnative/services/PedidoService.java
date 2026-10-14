package com.ev1.cloudnative.services;

import com.ev1.cloudnative.dtos.DetalleItemDto;
import com.ev1.cloudnative.dtos.PedidoRequestDto;
import com.ev1.cloudnative.dtos.PedidoResponseDto;
import com.ev1.cloudnative.mappers.PedidoMapper;
import com.ev1.cloudnative.model.DetallePedido;
import com.ev1.cloudnative.model.EstadoPedido;
import com.ev1.cloudnative.model.Pedido;
import com.ev1.cloudnative.model.Producto;
import com.ev1.cloudnative.repositories.PedidoRepository;
import com.ev1.cloudnative.repositories.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PedidoService {

    private final PedidoRepository pedidoRepository;
    private final ProductoRepository productoRepository;
    private final PedidoMapper pedidoMapper;

    @Transactional
    public PedidoResponseDto crearPedido(PedidoRequestDto requestDto, String usuarioEmail) {
        double montoTotalCalculado = 0.0;
        List<DetallePedido> detalles = new ArrayList<>();

        for (DetalleItemDto item : requestDto.items()) {
            // 1. Obtener producto de la base de datos
            Producto producto = productoRepository.findById(item.productoId())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado con ID: " + item.productoId()));

            // 2. Validar stock disponible
            if (producto.getStock() < item.cantidad()) {
                throw new IllegalArgumentException(
                    String.format("Stock insuficiente para '%s'. Disponible: %d, Solicitado: %d", 
                        producto.getNombre(), producto.getStock(), item.cantidad())
                );
            }

            // 3. Descontar stock
            producto.setStock(producto.getStock() - item.cantidad());

            // 4. Calcular acumulado del total
            double subtotal = producto.getPrecio() * item.cantidad();
            montoTotalCalculado += subtotal;

            // 5. Crear detalle congelando el precio unitario actual
            DetallePedido detalle = DetallePedido.builder()
                    .producto(producto)
                    .cantidad(item.cantidad())
                    .precioUnitario(producto.getPrecio())
                    .build();

            detalles.add(detalle);
        }

        // 6. Construir entidad de Pedido
        Pedido pedido = Pedido.builder()
                .descPedido(requestDto.descPedido())
                .usuarioEmail(usuarioEmail)
                .montoTotal(montoTotalCalculado)
                .estado(EstadoPedido.PENDIENTE)
                .detalles(detalles)
                .build();

        // 7. Persistir pedido y sus detalles (CascadeType.ALL)
        Pedido pedidoGuardado = pedidoRepository.save(pedido);

        return pedidoMapper.toDto(pedidoGuardado);
    }

    @Transactional(readOnly = true)
    public List<PedidoResponseDto> obtenerTodos() {
        return pedidoRepository.findAll()
                .stream()
                .map(pedidoMapper::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PedidoResponseDto> obtenerPorUsuario(String usuarioEmail) {
        return pedidoRepository.findByUsuarioEmail(usuarioEmail)
                .stream()
                .map(pedidoMapper::toDto)
                .toList();
    }

    @Transactional
    public void cancelarPedido(Long idPedido) {
        Pedido pedido = pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado con ID: " + idPedido));

        if (pedido.getEstado() == EstadoPedido.CANCELADO) {
            throw new IllegalStateException("El pedido ya se encuentra cancelado.");
        }

        // Devolver el stock a cada producto involucrado
        for (DetallePedido detalle : pedido.getDetalles()) {
            Producto producto = detalle.getProducto();
            producto.setStock(producto.getStock() + detalle.getCantidad());
        }

        pedido.setEstado(EstadoPedido.CANCELADO);
        pedidoRepository.save(pedido);
    }
}