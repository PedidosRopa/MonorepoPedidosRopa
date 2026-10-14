package com.ev1.cloudnative.mappers;

import com.ev1.cloudnative.dtos.ProductoDto;
import com.ev1.cloudnative.model.Producto;
import org.springframework.stereotype.Component;

@Component
public class ProductoMapper {

    public ProductoDto toDto(Producto entity) {
        if (entity == null) return null;
        return new ProductoDto(
            entity.getIdProducto(),
            entity.getNombre(),
            entity.getDescripcion(),
            entity.getPrecio(),
            entity.getStock(),
            entity.getCategoria(),
            entity.getTalla(),
            entity.getGenero()
        );
    }

    public Producto toEntity(ProductoDto dto) {
        if (dto == null) return null;
        return Producto.builder()
            .idProducto(dto.idProducto())
            .nombre(dto.nombre())
            .descripcion(dto.descripcion())
            .precio(dto.precio())
            .stock(dto.stock())
            .categoria(dto.categoria())
            .talla(dto.talla())
            .genero(dto.genero())
            .build();
    }
}