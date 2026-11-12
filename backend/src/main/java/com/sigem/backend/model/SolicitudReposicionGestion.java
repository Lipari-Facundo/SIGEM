package com.sigem.backend.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "solicitud_reposicion_gestion")
public class SolicitudReposicionGestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "solicitud_id", nullable = false)
    private SolicitudReposicion solicitud;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "coordinador_id", nullable = false)
    private Usuario coordinador;

    @Column(nullable = false, length = 30)
    private String accion;

    @Column(nullable = false, columnDefinition = "text")
    private String detalle;

    @Column(columnDefinition = "text")
    private String observaciones;

    @Column(nullable = false)
    private LocalDateTime fecha;

    @PrePersist
    protected void onCreate() {
        if (fecha == null) fecha = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public SolicitudReposicion getSolicitud() { return solicitud; }
    public void setSolicitud(SolicitudReposicion solicitud) { this.solicitud = solicitud; }
    public Usuario getCoordinador() { return coordinador; }
    public void setCoordinador(Usuario coordinador) { this.coordinador = coordinador; }
    public String getAccion() { return accion; }
    public void setAccion(String accion) { this.accion = accion; }
    public String getDetalle() { return detalle; }
    public void setDetalle(String detalle) { this.detalle = detalle; }
    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }
}
