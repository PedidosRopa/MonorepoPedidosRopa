package com.ev1.cloudnative.listener;

import java.io.IOException;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import com.ev1.cloudnative.dtos.PedidoCreadoEvent;
import com.rabbitmq.client.Channel;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class PedidoProcesamientoListener {

    @RabbitListener(queues = "${app.rabbitmq.queues.pedido-procesamiento}")
    public void procesarPedido(
            PedidoCreadoEvent event,
            Channel channel,
            @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag) throws IOException {

        try {
            log.info("Mensaje recibido de RabbitMQ para el Pedido ID: {}", event.idPedido());

            // Simulación de validación / procesamiento en bodega
                        // Validar nulo antes de comparar <= 0
            if (event.montoTotal() == null || event.montoTotal() <= 0) {
                throw new IllegalArgumentException("El monto del pedido es nulo o inválido. Enviando a DLQ.");
            }

            log.info("Pedido ID: {} procesado exitosamente por la bodega.", event.idPedido());

            // ACK Explícito: Mensaje procesado correctamente (Indicador 5)
            channel.basicAck(deliveryTag, false);

        } catch (Exception e) {
            log.error("Error al procesar el mensaje para Pedido ID: {}. Causa: {}", event.idPedido(), e.getMessage());

            // NACK Explícito con requeue = false -> Envía el mensaje a la DLQ (Indicador 5)
            channel.basicNack(deliveryTag, false, false);
        }
    }
}