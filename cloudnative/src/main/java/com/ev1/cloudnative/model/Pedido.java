package com.ev1.cloudnative.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "pedidos")
@Data
@NoArgsConstructor 
@AllArgsConstructor 
public class Pedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idPedido;

    private String descPedido;

    // Email extraído del claim del JWT de Azure AD
    private String usuarioEmail; 

    private Double montoTotal;

    private LocalDateTime fechaPedido;

    private String estado; // Ej: "PENDIENTE", "PROCESADO", "ENTREGADO"
}