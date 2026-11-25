package com.ev1.cloudnative.audit;

import com.ev1.cloudnative.dtos.kafka.AdminAuditEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminAuditProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${app.kafka.topics.auditoria-admin}")
    private String auditoriaAdminTopic;

    public void publicarEvento(AdminAuditEvent event) {
        // Key = adminEmail para mantener orden cronológico por administrador
        kafkaTemplate.send(auditoriaAdminTopic, event.adminEmail(), event)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("[KAFKA-AUDIT] Error publicando evento {} en {}: {}",
                                event.eventoId(), auditoriaAdminTopic, ex.getMessage());
                    } else {
                        log.info("[KAFKA-AUDIT] Evento {} publicado en {} [partición={}, offset={}]",
                                event.accion(), auditoriaAdminTopic,
                                result.getRecordMetadata().partition(),
                                result.getRecordMetadata().offset());
                    }
                });
    }
}