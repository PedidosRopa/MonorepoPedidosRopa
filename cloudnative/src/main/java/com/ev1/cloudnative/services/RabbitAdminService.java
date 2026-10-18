package com.ev1.cloudnative.services;

import com.ev1.cloudnative.dtos.admin.BindingRequestDTO;
import com.ev1.cloudnative.dtos.admin.ExchangeRequestDTO;
import com.ev1.cloudnative.dtos.admin.QueueRequestDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.core.*;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RabbitAdminService {

    private final AmqpAdmin amqpAdmin;

    public void crearCola(QueueRequestDTO dto) {
        Queue queue = new Queue(dto.nombre(), dto.durable());
        amqpAdmin.declareQueue(queue);
    }

    public boolean eliminarCola(String nombreCola) {
        return amqpAdmin.deleteQueue(nombreCola);
    }

    public void crearExchange(ExchangeRequestDTO dto) {
        Exchange exchange = switch (dto.tipo().toLowerCase()) {
            case "topic" -> new TopicExchange(dto.nombre());
            case "fanout" -> new FanoutExchange(dto.nombre());
            default -> new DirectExchange(dto.nombre());
        };
        amqpAdmin.declareExchange(exchange);
    }

    public boolean eliminarExchange(String nombreExchange) {
        return amqpAdmin.deleteExchange(nombreExchange);
    }

    public void crearBinding(BindingRequestDTO dto) {
        Binding binding = new Binding(
                dto.colaNombre(),
                Binding.DestinationType.QUEUE,
                dto.exchangeNombre(),
                dto.routingKey(),
                null
        );
        amqpAdmin.declareBinding(binding);
    }
}