package com.ev1.cloudnative.repositories;

import com.ev1.cloudnative.model.CarritoUsuario;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CarritoUsuarioRepository extends JpaRepository<CarritoUsuario, String> {
}