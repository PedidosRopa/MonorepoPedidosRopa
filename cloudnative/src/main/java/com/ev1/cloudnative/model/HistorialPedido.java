package com.ev1.cloudnative.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "historial_pedidos")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistorialPedido {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idHistorial;

    @Column(nullable = false)
    private Long idPedido;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private EstadoPedido estadoAnterior;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EstadoPedido estadoNuevo;

    @Column(length = 150)
    private String actualizadoPorEmail;

    @Column(nullable = false)
    private LocalDateTime fechaCambio;
}