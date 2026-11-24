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

import java.util.Arrays;

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

        String argsResumen = Arrays.stream(joinPoint.getArgs())
                .filter(arg -> !(arg instanceof Jwt))
                .map(String::valueOf)
                .toList()
                .toString();

        try {
            Object resultado = joinPoint.proceed();
            auditProducer.publicarEvento(AdminAuditEvent.crear(
                    oid, email, auditarAdmin.accion(), auditarAdmin.recurso(),
                    "Args: " + argsResumen, true
            ));
            return resultado;
        } catch (Throwable ex) {
            auditProducer.publicarEvento(AdminAuditEvent.crear(
                    oid, email, auditarAdmin.accion(), auditarAdmin.recurso(),
                    "Fallo (" + ex.getClass().getSimpleName() + "): " + ex.getMessage(), false
            ));
            throw ex;
        }
    }
}