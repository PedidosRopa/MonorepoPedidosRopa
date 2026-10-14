package com.ev1.cloudnative.services;

import com.ev1.cloudnative.dtos.ProductoDto;
import com.ev1.cloudnative.mappers.ProductoMapper;
import com.ev1.cloudnative.model.Producto;
import com.ev1.cloudnative.repositories.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductoService {

    private final ProductoRepository productoRepository;
    private final ProductoMapper productoMapper;

    @Transactional(readOnly = true)
    public List<ProductoDto> obtenerTodos() {
        return productoRepository.findAll()
                .stream()
                .map(productoMapper::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ProductoDto> filtrarProductos(String categoria, String talla) {
        List<Producto> resultados;

        if (categoria != null && talla != null) {
            resultados = productoRepository.findByCategoriaIgnoreCaseAndTallaIgnoreCase(categoria, talla);
        } else if (categoria != null) {
            resultados = productoRepository.findByCategoriaIgnoreCase(categoria);
        } else if (talla != null) {
            resultados = productoRepository.findByTallaIgnoreCase(talla);
        } else {
            resultados = productoRepository.findAll();
        }

        return resultados.stream()
                .map(productoMapper::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProductoDto obtenerPorId(Long id) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con el ID: " + id));
        return productoMapper.toDto(producto);
    }

    @Transactional
    public ProductoDto guardar(ProductoDto dto) {
        Producto producto = productoMapper.toEntity(dto);
        Producto guardado = productoRepository.save(producto);
        return productoMapper.toDto(guardado);
    }

    @Transactional
    public void eliminar(Long id) {
        if (!productoRepository.existsById(id)) {
            throw new RuntimeException("No se puede eliminar. Producto no encontrado con ID: " + id);
        }
        productoRepository.deleteById(id);
    }
}