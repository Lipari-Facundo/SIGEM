package com.sigem.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "asignaciones_equipos")
public class AsignacionEquipo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "equipo_id", nullable = false)
    private EquipoMedico equipo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "movil_id", nullable = false)
    private Movil movil;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "coordinador_id", nullable = false)
    private Usuario coordinador;

    @Column(name = "fecha_asignacion", nullable = false)
    private LocalDateTime fechaAsignacion;

    @Column(name = "fecha_desasignacion")
    private LocalDateTime fechaDesasignacion;

    @Column(nullable = false)
    private boolean activo = true;

    public Long getId() { return id; }
    public EquipoMedico getEquipo() { return equipo; }
    public void setEquipo(EquipoMedico equipo) { this.equipo = equipo; }
    public Movil getMovil() { return movil; }
    public void setMovil(Movil movil) { this.movil = movil; }
    public Usuario getCoordinador() { return coordinador; }
    public void setCoordinador(Usuario coordinador) { this.coordinador = coordinador; }
    public LocalDateTime getFechaAsignacion() { return fechaAsignacion; }
    public void setFechaAsignacion(LocalDateTime fechaAsignacion) { this.fechaAsignacion = fechaAsignacion; }
    public LocalDateTime getFechaDesasignacion() { return fechaDesasignacion; }
    public void setFechaDesasignacion(LocalDateTime fechaDesasignacion) { this.fechaDesasignacion = fechaDesasignacion; }
    public boolean isActivo() { return activo; }
    public void setActivo(boolean activo) { this.activo = activo; }
}
