package com.ev1.cloudnative.audit;

import com.ev1.cloudnative.dtos.kafka.AdminAuditEvent;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;

@Aspect
@Component
@RequiredArgsConstructor
public class AdminAuditAspect {

    private final AdminAuditProducer auditProducer;

    @Around("@annotation(auditarAdmin)")
    public Object auditarOperacionAdmin(ProceedingJoinPoint joinPoint, AuditarAdmin auditarAdmin) throws Throwable {
        String oid = "desconocido";
        String email = "sistema@local";

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Jwt jwt) {
            oid = jwt.getClaimAsString("oid") != null ? jwt.getClaimAsString("oid") : jwt.getSubject();
            email = jwt.getClaimAsString("preferred_username") != null
                    ? jwt.getClaimAsString("preferred_username")
                    : (jwt.getClaimAsString("email") != null ? jwt.getClaimAsString("email") : oid);
        }

        List<String> argsLimpios = Arrays.stream(joinPoint.getArgs())
                .filter(arg -> !(arg instanceof Jwt))
                .map(this::formatearArgumento)
                .toList();

        String detalleExito = construirDetalle(auditarAdmin.plantilla(), argsLimpios);

        try {
            Object resultado = joinPoint.proceed();
            auditProducer.publicarEvento(AdminAuditEvent.crear(
                    oid, email, auditarAdmin.accion(), auditarAdmin.recurso(),
                    detalleExito, true
            ));
            return resultado;
        } catch (Throwable ex) {
            auditProducer.publicarEvento(AdminAuditEvent.crear(
                    oid, email, auditarAdmin.accion(), auditarAdmin.recurso(),
                    detalleExito + " | Error (" + ex.getClass().getSimpleName() + "): " + ex.getMessage(), false
            ));
            throw ex;
        }
    }

    private String construirDetalle(String plantilla, List<String> args) {
        if (plantilla == null || plantilla.isBlank()) {
            return "Args: " + args;
        }
        String resultado = plantilla;
        for (int i = 0; i < args.size(); i++) {
            resultado = resultado.replace("{" + i + "}", args.get(i));
        }
        return resultado;
    }

    private String formatearArgumento(Object arg) {
        if (arg == null) {
            return "null";
        }
        if (arg instanceof MultipartFile file) {
            return file.getOriginalFilename() != null ? file.getOriginalFilename() : "archivo";
        }
        return String.valueOf(arg);
    }
}