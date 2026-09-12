package com.ev1.cloudnative.services;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.ev1.cloudnative.model.Producto;
import com.ev1.cloudnative.repositories.ProductoRepository;

import lombok.RequiredArgsConstructor;

@Service 
@RequiredArgsConstructor 
public class ProductoService {
    private final ProductoRepository productoRepository;

    public List<Producto> obtenerTodosLosProductos() {
        return productoRepository.findAll();
    }

    public Optional<Producto> obtenerPorId(Long id) {
        return productoRepository.findById(id);
    }

    public Producto guardar(Producto producto) {
        return productoRepository.save(producto);
    }

    public void eliminar(Long id) {
        productoRepository.deleteById(id);
    }
}
