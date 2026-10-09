package com.sigem.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "solicitud_reposicion")
public class SolicitudReposicion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "movil_id", nullable = false)
    private Movil movil;

    @JsonIgnoreProperties({"password", "authorities"})
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "enfermero_id", nullable = false)
    private Usuario enfermero;

    @Column(nullable = false)
    private LocalDateTime fecha;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoReposicion estado = EstadoReposicion.PENDIENTE;

    @Column(columnDefinition = "TEXT")
    private String observaciones;

    @Column(name = "motivo_resolucion", length = 500)
    private String motivoResolucion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_ultima_gestion_id")
    private Usuario usuarioUltimaGestion;

    @Column(name = "fecha_ultima_gestion")
    private LocalDateTime fechaUltimaGestion;

    @PrePersist
    protected void onCreate() {
        if (fecha == null) fecha = LocalDateTime.now();
        if (estado == null) estado = EstadoReposicion.PENDIENTE;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Movil getMovil() { return movil; }
    public void setMovil(Movil movil) { this.movil = movil; }
    public Usuario getEnfermero() { return enfermero; }
    public void setEnfermero(Usuario enfermero) { this.enfermero = enfermero; }
    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }
    public EstadoReposicion getEstado() { return estado; }
    public void setEstado(EstadoReposicion estado) { this.estado = estado; }
    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
    public String getMotivoResolucion() { return motivoResolucion; }
    public void setMotivoResolucion(String motivoResolucion) { this.motivoResolucion = motivoResolucion; }
    public Usuario getUsuarioUltimaGestion() { return usuarioUltimaGestion; }
    public void setUsuarioUltimaGestion(Usuario usuarioUltimaGestion) { this.usuarioUltimaGestion = usuarioUltimaGestion; }
    public LocalDateTime getFechaUltimaGestion() { return fechaUltimaGestion; }
    public void setFechaUltimaGestion(LocalDateTime fechaUltimaGestion) { this.fechaUltimaGestion = fechaUltimaGestion; }
}