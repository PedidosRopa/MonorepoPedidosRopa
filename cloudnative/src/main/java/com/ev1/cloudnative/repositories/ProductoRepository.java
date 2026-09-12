package com.ev1.cloudnative.repositories;

import com.ev1.cloudnative.model.Producto;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductoRepository extends JpaRepository<Producto, Long> {

}