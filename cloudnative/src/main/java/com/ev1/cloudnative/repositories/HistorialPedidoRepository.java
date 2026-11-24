package com.ev1.cloudnative.repositories;

import com.ev1.cloudnative.model.HistorialPedido;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface HistorialPedidoRepository extends JpaRepository<HistorialPedido, Long> {
    List<HistorialPedido> findByIdPedidoOrderByFechaCambioAsc(Long idPedido);
}