package com.ev1.cloudnative.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "carritos_usuario")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CarritoUsuario {

    @Id
    @Column(name = "entra_oid", length = 100)
    private String entraOid; // Puntero directo al claim 'oid' de Entra ID

    @Column(name = "items_json", columnDefinition = "TEXT", nullable = false)
    private String itemsJson = "[]";
}