package com.ev1.cloudnative.listener;

import com.rabbitmq.client.Channel;
import com.ev1.cloudnative.dtos.ProductoDto; 
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@Slf4j
public class ProductoProcesamientoListener {

    @RabbitListener(queues = "${app.rabbitmq.queues.producto-procesamiento}")
    public void procesarProducto(
            ProductoDto event,
            Channel channel,
            @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag) throws IOException {

        try {
            log.info("Mensaje recibido de RabbitMQ para el Producto ID: {}", event.idProducto());

            // Regla de negocio para simular error y enviar a la DLQ
            if (event.precio() == null || event.precio() <= 0) {
                throw new IllegalArgumentException("El precio del producto es inválido. Enviando a DLQ.");
            }

            log.info("Producto ID: {} ({}) procesado exitosamente.", event.idProducto(), event.nombre());

            // ACK Explícito: Mensaje procesado correctamente
            channel.basicAck(deliveryTag, false);

        } catch (Exception e) {
            log.error("Error al procesar el producto ID: {}. Causa: {}", event.idProducto(), e.getMessage());

            // NACK Explícito con requeue = false -> Envía el mensaje a la DLQ de productos
            channel.basicNack(deliveryTag, false, false);
        }
    }
}