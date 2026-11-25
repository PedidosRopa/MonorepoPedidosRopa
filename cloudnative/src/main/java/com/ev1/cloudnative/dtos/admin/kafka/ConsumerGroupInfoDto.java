package com.ev1.cloudnative.dtos.admin.kafka;

import java.util.List;

public record ConsumerGroupInfoDto(
        String groupId,
        String estado,
        int miembrosActivos,
        List<String> topicosAsignados
) {}