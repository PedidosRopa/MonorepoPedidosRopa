package com.ev1.cloudnative.controllers;

import com.ev1.cloudnative.dtos.PedidoRequestDto;
import com.ev1.cloudnative.dtos.PedidoResponseDto;
import com.ev1.cloudnative.services.PedidoService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import com.ev1.cloudnative.config.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pedidos")
@RequiredArgsConstructor
@Tag(name = "Pedidos", description = "Gestión de órdenes de compra, cálculo automático de precios y vinculación de usuario Azure AD")
public class PedidoController {

    private final PedidoService pedidoService;
    @Operation(summary = "Listar la totalidad de pedidos", description = "Retorna todos los pedidos registrados en el sistema (Vista Administrador).")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Listado completo obtenido exitosamente"),
        @ApiResponse(responseCode = "401", description = "No autorizado")
      })
    @GetMapping
    public ResponseEntity<List<PedidoResponseDto>> listarTodos() {
        return ResponseEntity.ok(pedidoService.obtenerTodos());
    }
    @Operation(summary = "Listar pedidos del usuario autenticado", description = "Filtra y devuelve solo los pedidos creados por el usuario activo, extraído dinámicamente de los claims del JWT.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Mis pedidos obtenidos exitosamente"),
        @ApiResponse(responseCode = "401", description = "No autorizado - JWT no válido")
    })
    @GetMapping("/mis-pedidos")
    public ResponseEntity<List<PedidoResponseDto>> misPedidos(@AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        return ResponseEntity.ok(pedidoService.obtenerPorUsuario(email));
    }

    @PostMapping
    @Operation(summary = "Crear nuevo pedido", description = "Procesa una nueva orden de compra, valida el stock de cada producto, calcula el total del lado del servidor y vincula el email extraído del JWT.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Pedido registrado y stock descontado"),
        @ApiResponse(responseCode = "400", description = "Stock insuficiente o datos de solicitud inválidos"),
        @ApiResponse(responseCode = "401", description = "No autorizado")
    })
    public ResponseEntity<PedidoResponseDto> crearPedido(
            @Valid @RequestBody PedidoRequestDto requestDto,
            @AuthenticationPrincipal Jwt jwt) {
        
        String email = SecurityUtils.extractEmail(jwt);
        PedidoResponseDto nuevoPedido = pedidoService.crearPedido(requestDto, email);
        return ResponseEntity.status(HttpStatus.CREATED).body(nuevoPedido);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Cancelar pedido", description = "Cancela una orden de compra activa y reincorpora automáticamente las cantidades al inventario disponible.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Pedido cancelado y stock restituido"),
        @ApiResponse(responseCode = "404", description = "Pedido no encontrado"),
        @ApiResponse(responseCode = "400", description = "El pedido ya se encontraba cancelado")
    })
    public ResponseEntity<Void> cancelarPedido(@PathVariable Long id) {
        pedidoService.cancelarPedido(id);
        return ResponseEntity.noContent().build();
    }
}