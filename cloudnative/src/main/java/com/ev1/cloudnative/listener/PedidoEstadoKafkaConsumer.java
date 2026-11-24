package com.ev1.cloudnative.listener;

import com.ev1.cloudnative.dtos.PedidoEstadoEvent;
import com.ev1.cloudnative.model.HistorialPedido;
import com.ev1.cloudnative.repositories.HistorialPedidoRepository;
import com.ev1.cloudnative.repositories.PedidoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Slf4j
@RequiredArgsConstructor
public class PedidoEstadoKafkaConsumer {

    private final HistorialPedidoRepository historialRepository;
    private final PedidoRepository pedidoRepository;

    // Consumidor 1: Construye la línea de tiempo (Tracker) para el Cliente
    @KafkaListener(topics = "${app.kafka.topics.pedidos-estados}", groupId = "tracker-group")
    @Transactional
    public void registrarHitoTracker(PedidoEstadoEvent event) {
        log.info("[Kafka - tracker-group] Registrando hito Pedido #{} -> {} (v{})",
                event.idPedido(), event.estadoNuevo(), event.schemaVersion());

        HistorialPedido hito = HistorialPedido.builder()
                .idPedido(event.idPedido())
                .estadoAnterior(event.estadoAnterior())
                .estadoNuevo(event.estadoNuevo())
                .actualizadoPorEmail(event.repartidorEmail())
                .fechaCambio(event.timestamp())
                .build();

        historialRepository.save(hito);
    }

    // Consumidor 2: Sincroniza el estado maestro del Pedido
    @KafkaListener(topics = "${app.kafka.topics.pedidos-estados}", groupId = "pedidos-group")
    @Transactional
    public void sincronizarEstadoPedido(PedidoEstadoEvent event) {
        log.info("[Kafka - pedidos-group] Actualizando estado maestro Pedido #{} a {}",
                event.idPedido(), event.estadoNuevo());

        pedidoRepository.findById(event.idPedido()).ifPresent(pedido -> {
            pedido.setEstado(event.estadoNuevo());
            pedidoRepository.save(pedido);
        });
    }
}