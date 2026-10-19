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

    // ==========================================
    // PROPIEDADES PEDIDOS
    // ==========================================
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

    // ==========================================
    // PROPIEDADES PRODUCTOS
    // ==========================================
    @Value("${app.rabbitmq.exchanges.productos:productos.exchange}")
    private String productosExchangeName;

    @Value("${app.rabbitmq.exchanges.productos-dlx:productos.dlx}")
    private String productosDlxName;

    @Value("${app.rabbitmq.queues.producto-procesamiento:productos.procesamiento.queue}")
    private String productosQueueName;

    @Value("${app.rabbitmq.queues.producto-procesamiento-dlq:productos.procesamiento.dlq}")
    private String productosDlqName;

    @Value("${app.rabbitmq.routing-keys.producto-creado:productos.routing.key}")
    private String productosRoutingKey;

    @Value("${app.rabbitmq.routing-keys.producto-dlq:productos.dlq.routing.key}")
    private String productosDlqRoutingKey;

    // ------------------------------------------
    // CONFIGURACIÓN PEDIDOS
    // ------------------------------------------

    @Bean
    public TopicExchange pedidosExchange() {
        return new TopicExchange(exchangeName);
    }

    @Bean
    public DirectExchange deadLetterExchange() {
        return new DirectExchange(dlxName);
    }

    @Bean
    public Queue pedidoProcesamientoQueue() {
        Map<String, Object> args = new HashMap<>();
        args.put("x-dead-letter-exchange", dlxName);
        args.put("x-dead-letter-routing-key", dlqRoutingKey);
        return QueueBuilder.durable(queueName)
                .withArguments(args)
                .build();
    }

    @Bean
    public Queue pedidoProcesamientoDLQ() {
        return QueueBuilder.durable(dlqName).build();
    }

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

    // ------------------------------------------
    // CONFIGURACIÓN PRODUCTOS
    // ------------------------------------------

    @Bean
    public DirectExchange productosExchange() {
        return new DirectExchange(productosExchangeName);
    }

    @Bean
    public DirectExchange productosDeadLetterExchange() {
        return new DirectExchange(productosDlxName);
    }

    @Bean
    public Queue productoProcesamientoQueue() {
        Map<String, Object> args = new HashMap<>();
        args.put("x-dead-letter-exchange", productosDlxName);
        args.put("x-dead-letter-routing-key", productosDlqRoutingKey);
        return QueueBuilder.durable(productosQueueName)
                .withArguments(args)
                .build();
    }

    @Bean
    public Queue productoProcesamientoDLQ() {
        return QueueBuilder.durable(productosDlqName).build();
    }

    @Bean
    public Binding bindingProductoProcesamiento() {
        return BindingBuilder
                .bind(productoProcesamientoQueue())
                .to(productosExchange())
                .with(productosRoutingKey);
    }

    @Bean
    public Binding bindingProductoDLQ() {
        return BindingBuilder
                .bind(productoProcesamientoDLQ())
                .to(productosDeadLetterExchange())
                .with(productosDlqRoutingKey);
    }

    // ------------------------------------------
    // CONVERSOR JSON
    // ------------------------------------------

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}