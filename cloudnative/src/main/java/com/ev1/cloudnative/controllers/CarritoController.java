package com.ev1.cloudnative.controllers;

import com.ev1.cloudnative.config.SecurityUtils;
import com.ev1.cloudnative.dtos.DetalleItemDto;
import com.ev1.cloudnative.services.CarritoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/carrito")
@RequiredArgsConstructor
@Tag(name = "Carrito", description = "Persistencia ligera del carrito en JSON indexado por OID de Entra ID")
public class CarritoController {

    private final CarritoService carritoService;

    @GetMapping
    @Operation(summary = "Recuperar carrito guardado del usuario")
    public ResponseEntity<List<DetalleItemDto>> obtenerCarrito(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(carritoService.obtenerCarrito(SecurityUtils.extractOid(jwt)));
    }

    @PutMapping
    @Operation(summary = "Sincronizar ítems del carrito en base de datos")
    public ResponseEntity<List<DetalleItemDto>> guardarCarrito(
            @Valid @RequestBody List<DetalleItemDto> items,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(carritoService.guardarCarrito(SecurityUtils.extractOid(jwt), items));
    }

    @DeleteMapping
    @Operation(summary = "Vaciar carrito del usuario")
    public ResponseEntity<Void> vaciarCarrito(@AuthenticationPrincipal Jwt jwt) {
        carritoService.vaciarCarrito(SecurityUtils.extractOid(jwt));
        return ResponseEntity.noContent().build();
    }
}