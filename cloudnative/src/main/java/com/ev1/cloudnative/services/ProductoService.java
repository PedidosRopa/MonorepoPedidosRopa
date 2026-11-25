package com.ev1.cloudnative.services;

import com.ev1.cloudnative.dtos.ProductoDto;
import com.ev1.cloudnative.exceptions.ResourceNotFoundException;
import com.ev1.cloudnative.mappers.ProductoMapper;
import com.ev1.cloudnative.model.Producto;
import com.ev1.cloudnative.repositories.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductoService {

    private final ProductoRepository productoRepository;
    private final ProductoMapper productoMapper;
    private final S3Service s3Service;

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
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado con el ID: " + id));
        return productoMapper.toDto(producto);
    }

    @Transactional
    public ProductoDto guardar(ProductoDto dto) {
        Producto producto = productoMapper.toEntity(dto);
        Producto guardado = productoRepository.save(producto);
        return productoMapper.toDto(guardado);
    }

    @Transactional
    public ProductoDto actualizarImagen(Long idProducto, MultipartFile file) throws IOException {
        Producto producto = productoRepository.findById(idProducto)
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado con el ID: " + idProducto));

        String urlS3 = s3Service.subirImagenProducto(file);
        producto.setImagenUrl(urlS3);

        Producto actualizado = productoRepository.save(producto);
        return productoMapper.toDto(actualizado);
    }

    @Transactional
    public void eliminar(Long id) {
        if (!productoRepository.existsById(id)) {
            throw new ResourceNotFoundException("No se puede eliminar. Producto no encontrado con ID: " + id);
        }
        productoRepository.deleteById(id);
    }
}