package com.ev1.cloudnative.controllers;

import com.ev1.cloudnative.config.SecurityUtils;
import com.ev1.cloudnative.dtos.*;
import com.ev1.cloudnative.services.PedidoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pedidos")
@RequiredArgsConstructor
@Tag(name = "Pedidos", description = "Gestión de órdenes, actualizaciones de repartidor vía Kafka y tracker de estados")
public class PedidoController {

    private final PedidoService pedidoService;

    @GetMapping
    @PreAuthorize("hasAnyRole('Administrador', 'Repartidor')")
    @Operation(summary = "Listar todos los pedidos (Vista Administrador y Repartidor)")
    public ResponseEntity<List<PedidoResponseDto>> listarTodos() {
        return ResponseEntity.ok(pedidoService.obtenerTodos());
    }

    @GetMapping("/mis-pedidos")
    @Operation(summary = "Listar pedidos del usuario autenticado")
    public ResponseEntity<List<PedidoResponseDto>> misPedidos(@AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        return ResponseEntity.ok(pedidoService.obtenerPorUsuario(email));
    }

    @GetMapping("/{id}/historial")
    @Operation(summary = "Obtener línea de tiempo (Tracker) de estados del pedido")
    public ResponseEntity<List<HistorialPedidoResponseDto>> obtenerHistorial(@PathVariable Long id) {
        return ResponseEntity.ok(pedidoService.obtenerHistorialPedido(id));
    }

    @PostMapping
    @Operation(summary = "Crear nuevo pedido")
    public ResponseEntity<PedidoResponseDto> crearPedido(
            @Valid @RequestBody PedidoRequestDto requestDto,
            @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        String oid = SecurityUtils.extractOid(jwt);
        return ResponseEntity.status(HttpStatus.CREATED).body(pedidoService.crearPedido(requestDto, email, oid));
    }

    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasAnyRole('Repartidor', 'Administrador')")
    @Operation(summary = "Actualizar estado del pedido (Dispara evento a Kafka)")
    public ResponseEntity<PedidoResponseDto> actualizarEstado(
            @PathVariable Long id,
            @Valid @RequestBody ActualizarEstadoRequestDto request,
            @AuthenticationPrincipal Jwt jwt) {
        String repartidorEmail = SecurityUtils.extractEmail(jwt);
        return ResponseEntity.ok(pedidoService.actualizarEstadoPedido(id, request.nuevoEstado(), repartidorEmail));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Cancelar pedido y restituir stock")
    public ResponseEntity<Void> cancelarPedido(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        pedidoService.cancelarPedido(id, email);
        return ResponseEntity.noContent().build();
    }
}