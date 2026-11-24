package com.ev1.cloudnative.mappers;

import com.ev1.cloudnative.dtos.ProductoDto;
import com.ev1.cloudnative.model.Producto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ProductoMapper {

    ProductoDto toDto(Producto entity);

    @Mapping(target = "imagenUrl", ignore = true)
    Producto toEntity(ProductoDto dto);
}