package com.ev1.cloudnative.listener;

import com.rabbitmq.client.Channel;
import com.ev1.cloudnative.dtos.PedidoCreadoEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@Slf4j
public class DeadLetterQueueListener {

    //@RabbitListener(queues = "${app.rabbitmq.queues.pedido-procesamiento-dlq}")
    public void procesarMensajeFallido(
            PedidoCreadoEvent event,
            Channel channel,
            @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag) throws IOException {

        log.warn("REGISTRO DE DLQ: Se ha capturado un mensaje fallido en la DLQ. Pedido ID: {}, Usuario: {}", 
                event.idPedido(), event.usuarioEmail());

        // Confirmamos lectura de la DLQ tras registrar el log
        channel.basicAck(deliveryTag, false);
    }
}