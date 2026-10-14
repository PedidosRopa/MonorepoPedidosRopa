package com.ev1.cloudnative.controllers;

import com.ev1.cloudnative.dtos.admin.BindingRequestDTO;
import com.ev1.cloudnative.dtos.admin.ExchangeRequestDTO;
import com.ev1.cloudnative.dtos.admin.QueueRequestDTO;
import com.ev1.cloudnative.services.RabbitAdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/rabbitmq")
@RequiredArgsConstructor
@Tag(name = "Administración RabbitMQ", description = "Endpoints para gestión dinámica de colas, exchanges y bindings")
public class RabbitAdminController {

    private final RabbitAdminService rabbitAdminService;

    @PostMapping("/queues")
    @Operation(summary = "Crear nueva cola")
    public ResponseEntity<String> crearCola(@Valid @RequestBody QueueRequestDTO dto) {
        rabbitAdminService.crearCola(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body("Cola '" + dto.nombre() + "' creada exitosamente.");
    }

    @DeleteMapping("/queues/{nombre}")
    @Operation(summary = "Eliminar cola por nombre")
    public ResponseEntity<Void> eliminarCola(@PathVariable String nombre) {
        boolean eliminada = rabbitAdminService.eliminarCola(nombre);
        if (eliminada) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/exchanges")
    @Operation(summary = "Crear nuevo exchange")
    public ResponseEntity<String> crearExchange(@Valid @RequestBody ExchangeRequestDTO dto) {
        rabbitAdminService.crearExchange(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body("Exchange '" + dto.nombre() + "' de tipo " + dto.tipo() + " creado exitosamente.");
    }

    @DeleteMapping("/exchanges/{nombre}")
    @Operation(summary = "Eliminar exchange por nombre")
    public ResponseEntity<Void> eliminarExchange(@PathVariable String nombre) {
        boolean eliminado = rabbitAdminService.eliminarExchange(nombre);
        if (eliminado) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/bindings")
    @Operation(summary = "Crear binding entre cola y exchange")
    public ResponseEntity<String> crearBinding(@Valid @RequestBody BindingRequestDTO dto) {
        rabbitAdminService.crearBinding(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body("Binding creado correctamente entre " + dto.colaNombre() + " y " + dto.exchangeNombre());
    }
}