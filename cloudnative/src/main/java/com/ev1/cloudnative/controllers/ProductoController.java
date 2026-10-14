package com.ev1.cloudnative.controllers;

import com.ev1.cloudnative.dtos.ProductoDto;
import com.ev1.cloudnative.services.ProductoService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/productos")
@RequiredArgsConstructor
@Tag(name = "Productos", description = "Catálogo de vestuario, consulta por filtros y administración de inventario")
public class ProductoController {

    private final ProductoService productoService;

    @GetMapping
    @Operation(summary = "Listar catálogo de productos", description = "Retorna todos los productos o los filtra opcionalmente por categoría y/o talla. Endpoint de lectura pública.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Catálogo obtenido exitosamente")})
    public ResponseEntity<List<ProductoDto>> listarProductos(
            @Parameter(description = "Filtrar por categoría (ej: Poleras, Pantalones)") @RequestParam(required = false) 
            String categoria,
            @Parameter(description = "Filtrar por talla (ej: S, M, L, XL)") @RequestParam(required = false) 
            String talla) {
        
        if (categoria != null || talla != null) {
            return ResponseEntity.ok(productoService.filtrarProductos(categoria, talla));
        }
        return ResponseEntity.ok(productoService.obtenerTodos());
    }
    @Operation(summary = "Obtener producto por ID", description = "Consulta los detalles de una prenda específica.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Producto encontrado"),
        @ApiResponse(responseCode = "404", description = "Producto no encontrado")
    })
    @GetMapping("/{id}")
    public ResponseEntity<ProductoDto> obtenerPorId(
            @Parameter(description = "ID del producto", example = "1") @PathVariable Long id) {
        return ResponseEntity.ok(productoService.obtenerPorId(id));
    }

    @PostMapping
    @Operation(summary = "Crear nuevo producto", description = "Registra un nuevo ítem en el catálogo de vestuario. Requiere token JWT válido.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Producto registrado exitosamente"),
        @ApiResponse(responseCode = "400", description = "Datos de entrada inválidos"),
        @ApiResponse(responseCode = "401", description = "No autorizado - Token JWT ausente o inválido")
    })
    public ResponseEntity<ProductoDto> crearProducto(@Valid @RequestBody ProductoDto dto) {
        ProductoDto nuevo = productoService.guardar(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(nuevo);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar producto", description = "Elimina un producto del catálogo. Requiere token JWT válido.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Producto eliminado exitosamente"),
        @ApiResponse(responseCode = "401", description = "No autorizado - Token JWT ausente o inválido"),
        @ApiResponse(responseCode = "404", description = "Producto no encontrado")
    })
    public ResponseEntity<Void> eliminarProducto(@Parameter(description = "ID del producto", example = "1") @PathVariable Long id) {
        productoService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}