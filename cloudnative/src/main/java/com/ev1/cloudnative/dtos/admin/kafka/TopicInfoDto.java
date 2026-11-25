package com.ev1.cloudnative.dtos.admin.kafka;

import java.util.Map;

public record TopicInfoDto(
        String nombre,
        int particiones,
        int factorReplicacion,
        Map<String, String> configuraciones
) {}