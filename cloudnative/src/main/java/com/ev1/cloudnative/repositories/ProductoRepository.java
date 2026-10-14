package com.ev1.cloudnative.repositories;
import com.ev1.cloudnative.model.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {
    List<Producto> findByCategoriaIgnoreCase(String categoria);
    List<Producto> findByTallaIgnoreCase(String talla);
    List<Producto> findByCategoriaIgnoreCaseAndTallaIgnoreCase(String categoria, String talla);
}