package com.sigem.backend.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "moviles")
public class Movil {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ─── Datos generales ─────────────────────────────────────

    @Column(name = "tipo", nullable = false)
    private String tipo;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_movil", nullable = false)
    private TipoMovil tipoMovil;

    @Column(nullable = false)
    private String marca;

    @Column(nullable = false)
    private String modelo;

    @Column(nullable = false, unique = true)
    private String patente;

    @Column(nullable = false)
    private Integer anio;

    @Column(name = "numero_interno", nullable = false, unique = true)
    private String numeroInterno;

    @Column(name = "fecha_registro", nullable = false)
    private LocalDate fechaRegistro;

    @Column(name = "base_operativa", nullable = false)
    private String baseOperativa;

    // ─── Datos operativos ─────────────────────────────────────

    @Column(name = "kilometraje")
    private Integer kilometraje;

    @Column(name = "kilometraje_actual")
    private Integer kilometrajeActual;

    @Column(name = "capacidad_pacientes")
    private Integer capacidadPacientes;

    @Column(length = 500)
    private String observaciones;

    // ─── Estado ───────────────────────────────────────────────

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false)
    private EstadoMovil estado;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_movil", nullable = false)
    private EstadoMovil estadoMovil = EstadoMovil.OPERATIVO;

    // ─── Auditoría ────────────────────────────────────────────

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // ─── Getters y Setters ────────────────────────────────────

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public TipoMovil getTipoMovil() { return tipoMovil; }
    public void setTipoMovil(TipoMovil tipoMovil) { this.tipoMovil = tipoMovil; }

    public String getMarca() { return marca; }
    public void setMarca(String marca) { this.marca = marca; }

    public String getModelo() { return modelo; }
    public void setModelo(String modelo) { this.modelo = modelo; }

    public String getPatente() { return patente; }
    public void setPatente(String patente) { this.patente = patente; }

    public Integer getAnio() { return anio; }
    public void setAnio(Integer anio) { this.anio = anio; }

    public String getNumeroInterno() { return numeroInterno; }
    public void setNumeroInterno(String numeroInterno) { this.numeroInterno = numeroInterno; }

    public LocalDate getFechaRegistro() { return fechaRegistro; }
    public void setFechaRegistro(LocalDate fechaRegistro) { this.fechaRegistro = fechaRegistro; }

    public String getBaseOperativa() { return baseOperativa; }
    public void setBaseOperativa(String baseOperativa) { this.baseOperativa = baseOperativa; }

    public Integer getKilometraje() { return kilometraje; }
    public void setKilometraje(Integer kilometraje) { this.kilometraje = kilometraje; }

    public Integer getKilometrajeActual() { return kilometrajeActual; }
    public void setKilometrajeActual(Integer kilometrajeActual) { this.kilometrajeActual = kilometrajeActual; }

    public Integer getCapacidadPacientes() { return capacidadPacientes; }
    public void setCapacidadPacientes(Integer capacidadPacientes) { this.capacidadPacientes = capacidadPacientes; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }

    public EstadoMovil getEstado() { return estado; }
    public void setEstado(EstadoMovil estado) { this.estado = estado; }

    public EstadoMovil getEstadoMovil() { return estadoMovil; }
    public void setEstadoMovil(EstadoMovil estadoMovil) { this.estadoMovil = estadoMovil; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}