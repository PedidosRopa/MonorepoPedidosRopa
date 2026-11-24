package com.ev1.cloudnative.dtos.kafka;

import java.time.LocalDateTime;
import java.util.UUID;

public record AdminAuditEvent(
        String schemaVersion,
        String eventoId,
        String adminOid,
        String adminEmail,
        String accion,
        String recurso,
        String detalle,
        boolean exitoso,
        LocalDateTime fechaEvento
) {
    public static AdminAuditEvent crear(String adminOid, String adminEmail, String accion,
                                        String recurso, String detalle, boolean exitoso) {
        return new AdminAuditEvent(
                "1.0",
                UUID.randomUUID().toString(),
                adminOid,
                adminEmail,
                accion,
                recurso,
                detalle,
                exitoso,
                LocalDateTime.now()
        );
    }
}