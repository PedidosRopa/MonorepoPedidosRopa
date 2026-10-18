package com.ev1.cloudnative.config;

import org.springframework.security.oauth2.jwt.Jwt;

public class SecurityUtils {

    /**
     * Extrae la identidad del usuario desde las claims del JWT emitido por Azure AD.
     * Prioriza 'preferred_username', luego 'email', y finalmente el Subject ('sub').
     */
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
}