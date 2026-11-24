package com.ev1.cloudnative.dtos.admin.kafka;

public record TopicConfigUpdateDto(
        Long retentionMs,
        String cleanupPolicy
) {}