package com.ev1.cloudnative.services;

import com.ev1.cloudnative.dtos.*;
import com.ev1.cloudnative.exceptions.ResourceNotFoundException;
import com.ev1.cloudnative.exceptions.StockInsuficienteException;
import com.ev1.cloudnative.mappers.PedidoMapper;
import com.ev1.cloudnative.model.DetallePedido;
import com.ev1.cloudnative.model.EstadoPedido;
import com.ev1.cloudnative.model.Pedido;
import com.ev1.cloudnative.model.Producto;
import com.ev1.cloudnative.repositories.HistorialPedidoRepository;
import com.ev1.cloudnative.repositories.PedidoRepository;
import com.ev1.cloudnative.repositories.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PedidoService {

    private final PedidoRepository pedidoRepository;
    private final ProductoRepository productoRepository;
    private final HistorialPedidoRepository historialRepository;
    private final PedidoMapper pedidoMapper;
    private final RabbitTemplate rabbitTemplate;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final CarritoService carritoService;

    @Value("${app.rabbitmq.exchanges.pedidos}")
    private String exchangeName;

    @Value("${app.rabbitmq.routing-keys.pedido-creado}")
    private String routingKey;

    @Value("${app.kafka.topics.pedidos-estados}")
    private String pedidosEstadosTopic;

    @Transactional
    public PedidoResponseDto crearPedido(PedidoRequestDto requestDto, String usuarioEmail) {
        double montoTotalCalculado = 0.0;
        List<DetallePedido> detalles = new ArrayList<>();

        for (DetalleItemDto item : requestDto.items()) {
            Producto producto = productoRepository.findById(item.productoId())
                    .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado con ID: " + item.productoId()));

            if (producto.getStock() < item.cantidad()) {
                throw new StockInsuficienteException(
                    String.format("Stock insuficiente para '%s'. Disponible: %d, Solicitado: %d",
                        producto.getNombre(), producto.getStock(), item.cantidad())
                );
            }

            producto.setStock(producto.getStock() - item.cantidad());
            montoTotalCalculado += producto.getPrecio() * item.cantidad();

            detalles.add(DetallePedido.builder()
                    .producto(producto)
                    .cantidad(item.cantidad())
                    .precioUnitario(producto.getPrecio())
                    .build());
        }

        Pedido pedido = Pedido.builder()
                .descPedido(requestDto.descPedido())
                .usuarioEmail(usuarioEmail)
                .montoTotal(montoTotalCalculado)
                .estado(EstadoPedido.PENDIENTE)
                .detalles(detalles)
                .build();

        Pedido pedidoGuardado = pedidoRepository.save(pedido);

        // 1. Publicar evento en RabbitMQ (procesamiento de bodega / DLQ)
        List<PedidoCreadoEvent.ItemResumen> itemsResumen = detalles.stream()
                .map(d -> new PedidoCreadoEvent.ItemResumen(
                        d.getProducto().getIdProducto(),
                        d.getProducto().getNombre(),
                        d.getCantidad()
                ))
                .toList();

        PedidoCreadoEvent rabbitEvent = new PedidoCreadoEvent(
                pedidoGuardado.getIdPedido(),
                usuarioEmail,
                pedidoGuardado.getMontoTotal(),
                pedidoGuardado.getFechaPedido(),
                itemsResumen
        );
        rabbitTemplate.convertAndSend(exchangeName, routingKey, rabbitEvent);

        // 2. Publicar hito inicial en Kafka (Tracker de estados) con clave idPedido
        PedidoEstadoEvent kafkaEvent = new PedidoEstadoEvent(
                "1.0",
                pedidoGuardado.getIdPedido(),
                null,
                EstadoPedido.PENDIENTE,
                usuarioEmail,
                LocalDateTime.now()
        );
        kafkaTemplate.send(pedidosEstadosTopic, pedidoGuardado.getIdPedido().toString(), kafkaEvent);

        // 3. Limpiar el carrito persistido del usuario tras concretar la compra
        carritoService.vaciarCarrito(usuarioEmail);

        return pedidoMapper.toDto(pedidoGuardado);
    }

    @Transactional
    public PedidoResponseDto actualizarEstadoPedido(Long idPedido, EstadoPedido nuevoEstado, String repartidorEmail) {
        Pedido pedido = pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido no encontrado con ID: " + idPedido));

        EstadoPedido estadoAnterior = pedido.getEstado();

        if (estadoAnterior == EstadoPedido.CANCELADO || estadoAnterior == EstadoPedido.ENTREGADO) {
            throw new IllegalStateException("No se puede modificar un pedido en estado terminal: " + estadoAnterior);
        }

        if (estadoAnterior == nuevoEstado) {
            throw new IllegalArgumentException("El pedido ya se encuentra en estado: " + nuevoEstado);
        }

        // Publicar evento de cambio de estado a Kafka (particionado por idPedido)
        PedidoEstadoEvent event = new PedidoEstadoEvent(
                "1.0",
                idPedido,
                estadoAnterior,
                nuevoEstado,
                repartidorEmail,
                LocalDateTime.now()
        );
        kafkaTemplate.send(pedidosEstadosTopic, idPedido.toString(), event);

        // Devolver DTO reflejando el estado emitido para respuesta inmediata en UI
        pedido.setEstado(nuevoEstado);
        return pedidoMapper.toDto(pedido);
    }

    @Transactional(readOnly = true)
    public List<HistorialPedidoResponseDto> obtenerHistorialPedido(Long idPedido) {
        if (!pedidoRepository.existsById(idPedido)) {
            throw new ResourceNotFoundException("Pedido no encontrado con ID: " + idPedido);
        }
        return historialRepository.findByIdPedidoOrderByFechaCambioAsc(idPedido)
                .stream()
                .map(h -> new HistorialPedidoResponseDto(
                        h.getIdHistorial(),
                        h.getIdPedido(),
                        h.getEstadoAnterior(),
                        h.getEstadoNuevo(),
                        h.getActualizadoPorEmail(),
                        h.getFechaCambio()
                ))
                .toList();
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
    public void cancelarPedido(Long idPedido, String usuarioEmail) {
        Pedido pedido = pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido no encontrado con ID: " + idPedido));

        if (pedido.getEstado() == EstadoPedido.CANCELADO) {
            throw new IllegalStateException("El pedido ya se encuentra cancelado.");
        }

        EstadoPedido estadoAnterior = pedido.getEstado();

        for (DetallePedido detalle : pedido.getDetalles()) {
            Producto producto = detalle.getProducto();
            producto.setStock(producto.getStock() + detalle.getCantidad());
        }

        pedido.setEstado(EstadoPedido.CANCELADO);
        pedidoRepository.save(pedido);

        PedidoEstadoEvent event = new PedidoEstadoEvent(
                "1.0",
                idPedido,
                estadoAnterior,
                EstadoPedido.CANCELADO,
                usuarioEmail,
                LocalDateTime.now()
        );
        kafkaTemplate.send(pedidosEstadosTopic, idPedido.toString(), event);
    }
}