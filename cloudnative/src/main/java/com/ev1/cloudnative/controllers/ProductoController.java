package com.ev1.cloudnative.controllers;

import com.ev1.cloudnative.audit.AuditarAdmin;
import com.ev1.cloudnative.dtos.ProductoDto;
import com.ev1.cloudnative.services.ProductoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/productos")
@RequiredArgsConstructor
@Tag(name = "Productos", description = "Catálogo de vestuario, filtros e imágenes en AWS S3")
public class ProductoController {

    private final ProductoService productoService;

    @GetMapping
    @Operation(summary = "Listar o filtrar catálogo de productos (Público)")
    public ResponseEntity<List<ProductoDto>> listarProductos(
            @RequestParam(required = false) String categoria,
            @RequestParam(required = false) String talla) {
        if (categoria != null || talla != null) {
            return ResponseEntity.ok(productoService.filtrarProductos(categoria, talla));
        }
        return ResponseEntity.ok(productoService.obtenerTodos());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener producto por ID")
    public ResponseEntity<ProductoDto> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(productoService.obtenerPorId(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('Administrador')")
    @AuditarAdmin(
            accion = "CREAR_PRODUCTO",
            recurso = "PRODUCTOS",
            plantilla = "Creó un nuevo producto: {0}"
    )
    @Operation(summary = "Crear nuevo producto (Solo Administrador)")
    public ResponseEntity<ProductoDto> crearProducto(@Valid @RequestBody ProductoDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productoService.guardar(dto));
    }

    @PostMapping(value = "/{id}/imagen", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('Administrador')")
    @AuditarAdmin(
            accion = "ACTUALIZAR_IMAGEN_PRODUCTO",
            recurso = "PRODUCTOS",
            plantilla = "Actualizó la imagen del producto ID {0} con el archivo '{1}'"
    )
    @Operation(summary = "Subir imagen de producto a AWS S3 (Solo Administrador)")
    public ResponseEntity<ProductoDto> subirImagen(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(productoService.actualizarImagen(id, file));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('Administrador')")
    @AuditarAdmin(
            accion = "ELIMINAR_PRODUCTO",
            recurso = "PRODUCTOS",
            plantilla = "Eliminó el producto con ID {0}"
    )
    @Operation(summary = "Eliminar producto (Solo Administrador)")
    public ResponseEntity<Void> eliminarProducto(@PathVariable Long id) {
        productoService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}