package com.ev1.cloudnative.dtos;

public record PreferenciaPagoDto(
        String preferenceId,
        String initPoint,
        String sandboxInitPoint
) {}