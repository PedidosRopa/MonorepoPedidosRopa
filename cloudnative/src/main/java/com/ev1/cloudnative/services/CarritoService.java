package com.ev1.cloudnative.services;

import com.ev1.cloudnative.dtos.DetalleItemDto;
import com.ev1.cloudnative.model.CarritoUsuario;
import com.ev1.cloudnative.repositories.CarritoUsuarioRepository;
import com.ev1.cloudnative.repositories.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CarritoService {

    private final CarritoUsuarioRepository carritoRepository;
    private final ProductoRepository productoRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public List<DetalleItemDto> obtenerCarrito(String entraOid) {
        return carritoRepository.findById(entraOid)
                .map(c -> objectMapper.readValue(c.getItemsJson(), new TypeReference<List<DetalleItemDto>>() {}))
                .orElse(List.of());
    }

    @Transactional
    public List<DetalleItemDto> guardarCarrito(String entraOid, List<DetalleItemDto> items) {
        List<DetalleItemDto> validos = items.stream()
                .filter(i -> i.cantidad() != null && i.cantidad() > 0 && productoRepository.existsById(i.productoId()))
                .toList();

        String json = objectMapper.writeValueAsString(validos);
        carritoRepository.save(new CarritoUsuario(entraOid, json));
        return validos;
    }

    @Transactional
    public void vaciarCarrito(String entraOid) {
        if (entraOid != null && carritoRepository.existsById(entraOid)) {
            carritoRepository.deleteById(entraOid);
        }
    }
}