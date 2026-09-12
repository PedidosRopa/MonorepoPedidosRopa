package com.ev1.cloudnative.controllers;

import com.ev1.cloudnative.model.Pedido;
import com.ev1.cloudnative.services.PedidoService;
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
public class PedidoController {

    private final PedidoService pedidoService;

    // Endpoint para ver todos los pedidos
    @GetMapping
    public ResponseEntity<List<Pedido>> listarTodos() {
        return ResponseEntity.ok(pedidoService.obtenerTodos());
    }

    // Endpoint para ver solo los pedidos del usuario autenticado
    @GetMapping("/mis-pedidos")
    public ResponseEntity<List<Pedido>> obtenerMisPedidos(@AuthenticationPrincipal Jwt jwt) {
        String email = obtenerEmailDeJwt(jwt);
        return ResponseEntity.ok(pedidoService.obtenerPorUsuario(email));
    }

    // Endpoint para crear un pedido asignándolo al usuario del token
    @PostMapping
    public ResponseEntity<Pedido> crearPedido(@RequestBody Pedido pedido, @AuthenticationPrincipal Jwt jwt) {
        String email = obtenerEmailDeJwt(jwt);
        Pedido nuevoPedido = pedidoService.crearPedido(pedido, email);
        return ResponseEntity.status(HttpStatus.CREATED).body(nuevoPedido);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarPedido(@PathVariable Long id) {
        pedidoService.eliminarPedido(id);
        return ResponseEntity.noContent().build();
    }

    // Método auxiliar para leer los claims del token de Azure AD
    private String obtenerEmailDeJwt(Jwt jwt) {
        if (jwt == null) {
            return "max.olguin@duocuc.com"; // Fallback para pruebas sin token
        }
        // Azure AD suele empaquetar el correo en preferred_username, email o upn
        String email = jwt.getClaimAsString("preferred_username");
        if (email == null) {
            email = jwt.getClaimAsString("email");
        }
        if (email == null) {
            email = jwt.getClaimAsString("upn");
        }
        return (email != null) ? email : jwt.getSubject();
    }
}