package com.ev1.cloudnative.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class RabbitMQConfig {

    @Value("${app.rabbitmq.exchanges.pedidos}")
    private String exchangeName;

    @Value("${app.rabbitmq.exchanges.dlx}")
    private String dlxName;

    @Value("${app.rabbitmq.queues.pedido-procesamiento}")
    private String queueName;

    @Value("${app.rabbitmq.queues.pedido-procesamiento-dlq}")
    private String dlqName;

    @Value("${app.rabbitmq.routing-keys.pedido-creado}")
    private String routingKey;

    @Value("${app.rabbitmq.routing-keys.pedido-dlq}")
    private String dlqRoutingKey;

    // 1. Exchange Principal (Topic)
    @Bean
    public TopicExchange pedidosExchange() {
        return new TopicExchange(exchangeName);
    }

    // 2. Dead Letter Exchange (DLX)
    @Bean
    public DirectExchange deadLetterExchange() {
        return new DirectExchange(dlxName);
    }

    // 3. Cola Principal con configuración de DLX
    @Bean
    public Queue pedidoProcesamientoQueue() {
        Map<String, Object> args = new HashMap<>();
        args.put("x-dead-letter-exchange", dlxName);
        args.put("x-dead-letter-routing-key", dlqRoutingKey);
        return QueueBuilder.durable(queueName)
                .withArguments(args)
                .build();
    }

    // 4. Dead Letter Queue (DLQ)
    @Bean
    public Queue pedidoProcesamientoDLQ() {
        return QueueBuilder.durable(dlqName).build();
    }

    // 5. Bindings
    @Bean
    public Binding bindingPedidoProcesamiento() {
        return BindingBuilder
                .bind(pedidoProcesamientoQueue())
                .to(pedidosExchange())
                .with(routingKey);
    }

    @Bean
    public Binding bindingDLQ() {
        return BindingBuilder
                .bind(pedidoProcesamientoDLQ())
                .to(deadLetterExchange())
                .with(dlqRoutingKey);
    }

    // Conversor a JSON para publicar y consumir objetos DTO en la cola
    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}