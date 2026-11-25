package com.ev1.cloudnative.config;

import org.springframework.security.oauth2.jwt.Jwt;
import java.util.List;

public class SecurityUtils {

    public static String extractEmail(Jwt jwt) {
        if (jwt == null) {
            throw new IllegalArgumentException("El token JWT no puede ser nulo.");
        }
        if (jwt.getClaim("preferred_username") != null) {
            return jwt.getClaim("preferred_username");
        } else if (jwt.getClaim("email") != null) {
            return jwt.getClaim("email");
        }
        return jwt.getSubject();
    }
    public static String extractOid(Jwt jwt) {
        String oid = jwt.getClaim("oid");
        return oid != null ? oid : jwt.getSubject();
    }

    public static String extractNombre(Jwt jwt) {
        String name = jwt.getClaim("name");
        return name != null ? name : extractEmail(jwt);
    }

    public static String extractRolPrincipal(Jwt jwt) {
    List<String> roles = jwt.getClaimAsStringList("roles");
    if (roles == null || roles.isEmpty()) {
        return "Cliente";
    }
    if (roles.stream().anyMatch(r -> r.equalsIgnoreCase("Administrador") || r.equalsIgnoreCase("ADMIN"))) {
        return "Administrador";
    }
    if (roles.stream().anyMatch(r -> r.equalsIgnoreCase("Repartidor"))) {
        return "Repartidor";
    }
    return roles.get(0);
}
}