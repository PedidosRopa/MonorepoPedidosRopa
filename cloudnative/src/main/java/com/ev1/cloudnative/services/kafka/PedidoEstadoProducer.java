package com.ev1.cloudnative.services.kafka;

import com.ev1.cloudnative.dtos.kafka.PedidoEstadoEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class PedidoEstadoProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${app.kafka.topics.pedidos-estados}")
    private String pedidosEstadosTopic;

    public void publicarCambioEstado(PedidoEstadoEvent event) {
        // Key = idPedido para garantizar orden estricto por orden en la misma partición
        kafkaTemplate.send(pedidosEstadosTopic, String.valueOf(event.idPedido()), event)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("[KAFKA-PEDIDOS] Error publicando cambio de estado pedido #{}: {}",
                                event.idPedido(), ex.getMessage());
                    } else {
                        log.info("[KAFKA-PEDIDOS] Pedido #{} -> {} publicado [partición={}, offset={}]",
                                event.idPedido(), event.estadoNuevo(),
                                result.getRecordMetadata().partition(),
                                result.getRecordMetadata().offset());
                    }
                });
    }
}