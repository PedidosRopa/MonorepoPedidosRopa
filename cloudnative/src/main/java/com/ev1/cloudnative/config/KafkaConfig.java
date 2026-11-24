package com.ev1.cloudnative.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaConfig {

    @Value("${app.kafka.topics.pedidos-estados}")
    private String pedidosEstadosTopic;

    @Bean
    public NewTopic pedidosEstadosTopic() {
        // 3 particiones para escalar consumidores manteniendo orden por idPedido (Message Key)
        return TopicBuilder.name(pedidosEstadosTopic)
                .partitions(3)
                .replicas(1)
                .build();
    }
}