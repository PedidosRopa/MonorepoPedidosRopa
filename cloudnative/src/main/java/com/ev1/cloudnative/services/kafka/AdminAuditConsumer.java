package com.ev1.cloudnative.services.kafka;

import com.ev1.cloudnative.dtos.kafka.AdminAuditEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
@Slf4j
public class AdminAuditConsumer {

    private static final Set<String> ACCIONES_CRITICAS = Set.of(
            "ELIMINAR_PRODUCTO",
            "ELIMINAR_TOPICO",
            "MODIFICAR_CONFIG_TOPICO",
            "ELIMINAR_COLA",
            "ELIMINAR_EXCHANGE"
    );

    // Consumer Group 1: Bitácora estructurada y validación de payload
    @KafkaListener(
            topics = "${app.kafka.topics.auditoria-admin}",
            groupId = "auditoria-logs-group"
    )
    public void registrarBitacoraAdmin(AdminAuditEvent event) {
        if (event == null || event.adminEmail() == null || event.accion() == null) {
            throw new IllegalArgumentException("Payload de auditoría inválido o incompleto");
        }

        log.info("[AUDIT-LOG] [{}] Admin={} (oid={}) | Acción={} | Recurso={} | Éxito={} | Detalle={}",
                event.fechaEvento(),
                event.adminEmail(),
                event.adminOid(),
                event.accion(),
                event.recurso(),
                event.exitoso(),
                event.detalle());
    }

    // Consumer Group 2: Detección y alerta de operaciones destructivas/críticas
    @KafkaListener(
            topics = "${app.kafka.topics.auditoria-admin}",
            groupId = "auditoria-alertas-group"
    )
    public void evaluarAlertasSeguridad(AdminAuditEvent event) {
        if (event != null && event.accion() != null && ACCIONES_CRITICAS.contains(event.accion())) {
            log.warn("[ALERTA-SEGURIDAD] Operación crítica ejecutada por {} -> Acción: {} sobre {} ({})",
                    event.adminEmail(), event.accion(), event.recurso(), event.detalle());
        }
    }
}