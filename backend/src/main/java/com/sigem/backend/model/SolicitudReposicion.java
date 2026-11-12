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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "movil_id")
    private Movil movil;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "guardia_id")
    private Guardia guardia;

    @JsonIgnoreProperties({"password", "authorities"})
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "enfermero_id", nullable = false)
    private Usuario enfermero;

    @Column(nullable = false)
    private LocalDateTime fecha;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoReposicion estado = EstadoReposicion.PENDIENTE;

    @Enumerated(EnumType.STRING)
    @Column(name = "prioridad", nullable = false, length = 20)
    private PrioridadReposicion prioridad = PrioridadReposicion.NORMAL;

    @Column(name = "es_interna", nullable = false)
    private boolean esInterna = true;

    @Column(name = "archivado", nullable = false)
    private boolean archivado = false;

    @Column(columnDefinition = "TEXT")
    private String observaciones;

    @Column(name = "motivo_resolucion", length = 500)
    private String motivoResolucion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_ultima_gestion_id")
    private Usuario usuarioUltimaGestion;

    @Column(name = "fecha_ultima_gestion")
    private LocalDateTime fechaUltimaGestion;

    @Column(name = "motivo_excepcion_control", length = 500)
    private String motivoExcepcionControl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_excepcion_control_id")
    private Usuario usuarioExcepcionControl;

    @Column(name = "fecha_excepcion_control")
    private LocalDateTime fechaExcepcionControl;

    @PrePersist
    protected void onCreate() {
        if (fecha == null) fecha = LocalDateTime.now();
        if (estado == null) estado = EstadoReposicion.PENDIENTE;
        if (prioridad == null) prioridad = PrioridadReposicion.NORMAL;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Movil getMovil() { return movil; }
    public void setMovil(Movil movil) { this.movil = movil; }
    public Guardia getGuardia() { return guardia; }
    public void setGuardia(Guardia guardia) { this.guardia = guardia; }
    public Usuario getEnfermero() { return enfermero; }
    public void setEnfermero(Usuario enfermero) { this.enfermero = enfermero; }
    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }
    public EstadoReposicion getEstado() { return estado; }
    public void setEstado(EstadoReposicion estado) { this.estado = estado; }
    public PrioridadReposicion getPrioridad() { return prioridad; }
    public void setPrioridad(PrioridadReposicion prioridad) { this.prioridad = prioridad; }
    public boolean isEsInterna() { return esInterna; }
    public void setEsInterna(boolean esInterna) { this.esInterna = esInterna; }
    public boolean isArchivado() { return archivado; }
    public void setArchivado(boolean archivado) { this.archivado = archivado; }
    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
    public String getMotivoResolucion() { return motivoResolucion; }
    public void setMotivoResolucion(String motivoResolucion) { this.motivoResolucion = motivoResolucion; }
    public Usuario getUsuarioUltimaGestion() { return usuarioUltimaGestion; }
    public void setUsuarioUltimaGestion(Usuario usuarioUltimaGestion) { this.usuarioUltimaGestion = usuarioUltimaGestion; }
    public LocalDateTime getFechaUltimaGestion() { return fechaUltimaGestion; }
    public void setFechaUltimaGestion(LocalDateTime fechaUltimaGestion) { this.fechaUltimaGestion = fechaUltimaGestion; }
    public String getMotivoExcepcionControl() { return motivoExcepcionControl; }
    public void setMotivoExcepcionControl(String motivoExcepcionControl) {
        this.motivoExcepcionControl = motivoExcepcionControl;
    }
    public Usuario getUsuarioExcepcionControl() { return usuarioExcepcionControl; }
    public void setUsuarioExcepcionControl(Usuario usuarioExcepcionControl) {
        this.usuarioExcepcionControl = usuarioExcepcionControl;
    }
    public LocalDateTime getFechaExcepcionControl() { return fechaExcepcionControl; }
    public void setFechaExcepcionControl(LocalDateTime fechaExcepcionControl) {
        this.fechaExcepcionControl = fechaExcepcionControl;
    }
}