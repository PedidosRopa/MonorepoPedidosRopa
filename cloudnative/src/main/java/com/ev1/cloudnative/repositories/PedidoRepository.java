package com.ev1.cloudnative.repositories;

import com.ev1.cloudnative.model.Pedido;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {
    // Método útil para consultar solo los pedidos del usuario autenticado
    List<Pedido> findByUsuarioEmail(String usuarioEmail);
}