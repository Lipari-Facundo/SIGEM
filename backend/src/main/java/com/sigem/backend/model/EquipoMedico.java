package com.sigem.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "equipos_medicos")
public class EquipoMedico {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @Column(name = "numero_serie", nullable = false, unique = true)
    private String numeroSerie;

    private String marca;
    private String modelo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoEquipoMedico estado = EstadoEquipoMedico.DISPONIBLE;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getNumeroSerie() { return numeroSerie; }
    public void setNumeroSerie(String numeroSerie) { this.numeroSerie = numeroSerie; }
    public String getMarca() { return marca; }
    public void setMarca(String marca) { this.marca = marca; }
    public String getModelo() { return modelo; }
    public void setModelo(String modelo) { this.modelo = modelo; }
    public EstadoEquipoMedico getEstado() { return estado; }
    public void setEstado(EstadoEquipoMedico estado) { this.estado = estado; }
}
