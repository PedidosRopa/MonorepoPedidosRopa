package com.ev1.cloudnative.mappers;

import com.ev1.cloudnative.dtos.ProductoDto;
import com.ev1.cloudnative.model.Producto;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ProductoMapper {

    ProductoDto toDto(Producto entity);

    Producto toEntity(ProductoDto dto);
}