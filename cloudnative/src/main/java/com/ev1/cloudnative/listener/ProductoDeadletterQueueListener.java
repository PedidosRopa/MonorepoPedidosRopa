package com.ev1.cloudnative.listener;

import java.io.IOException;
import com.rabbitmq.client.Channel;
import com.ev1.cloudnative.dtos.ProductoDto;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class ProductoDeadletterQueueListener {
    //@RabbitListener(queues = "${app.rabbitmq.queues.producto-procesamiento-dlq}")
    public void procesarProductoFallido(
            ProductoDto event,
            Channel channel,
            @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag) throws IOException {

        log.warn("REGISTRO DE DLQ PRODUCTOS: Se ha capturado un producto fallido. Producto ID: {}, Nombre: {}", 
                event.idProducto(), event.nombre());

        // Confirmamos lectura de la DLQ para limpiarla
        channel.basicAck(deliveryTag, false);
    }
}
