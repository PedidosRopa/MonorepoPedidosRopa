package com.ev1.cloudnative.services.kafka;

import com.ev1.cloudnative.dtos.kafka.PedidoEstadoEvent;
import com.ev1.cloudnative.model.EstadoPedido;
import com.ev1.cloudnative.model.HistorialPedido;
import com.ev1.cloudnative.repositories.HistorialPedidoRepository;
import com.ev1.cloudnative.repositories.PedidoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PedidoEstadoConsumer {

    private final HistorialPedidoRepository historialRepository;
    private final PedidoRepository pedidoRepository;

    // Consumer Group 1: Persiste la línea de tiempo para el tracker del cliente
    @KafkaListener(
            topics = "${app.kafka.topics.pedidos-estados}",
            groupId = "tracker-group"
    )
    @Transactional
    public void registrarHistorialTracker(PedidoEstadoEvent event) {
        if (event == null || event.idPedido() == null || event.estadoNuevo() == null) {
            throw new IllegalArgumentException("Evento PedidoEstadoEvent inválido");
        }

        EstadoPedido anterior = event.estadoAnterior() != null
                ? EstadoPedido.valueOf(event.estadoAnterior())
                : null;
        EstadoPedido nuevo = EstadoPedido.valueOf(event.estadoNuevo());

        HistorialPedido hito = HistorialPedido.builder()
                .idPedido(event.idPedido())
                .estadoAnterior(anterior)
                .estadoNuevo(nuevo)
                .actualizadoPorEmail(event.actualizadoPorEmail())
                .fechaCambio(event.fechaCambio())
                .build();

        historialRepository.save(hito);
        log.info("[TRACKER-GROUP] Hito guardado para pedido #{}: {} -> {}",
                event.idPedido(), anterior, nuevo);
    }

    // Consumer Group 2: Sincroniza el estado maestro del pedido y registra analítica
    @KafkaListener(
            topics = "${app.kafka.topics.pedidos-estados}",
            groupId = "pedidos-group"
    )
    @Transactional
    public void sincronizarYAnalizarPedido(PedidoEstadoEvent event) {
        if (event == null || event.idPedido() == null || event.estadoNuevo() == null) {
            throw new IllegalArgumentException("Evento PedidoEstadoEvent inválido");
        }

        EstadoPedido nuevo = EstadoPedido.valueOf(event.estadoNuevo());

        pedidoRepository.findById(event.idPedido()).ifPresent(pedido -> {
            pedido.setEstado(nuevo);
            pedidoRepository.save(pedido);
        });

        if (nuevo == EstadoPedido.ENTREGADO) {
            log.info("[PEDIDOS-GROUP] Ciclo logístico completado para pedido #{} por repartidor {}",
                    event.idPedido(), event.actualizadoPorEmail());
        } else {
            log.info("[PEDIDOS-GROUP] Estado maestro sincronizado para pedido #{} -> {}",
                    event.idPedido(), nuevo);
        }
    }
}