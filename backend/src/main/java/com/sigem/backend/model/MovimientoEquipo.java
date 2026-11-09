package com.sigem.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import org.hibernate.annotations.Immutable;

import java.time.LocalDateTime;

@Entity
@Immutable
@Table(name = "movimientos_equipos")
public class MovimientoEquipo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "fecha_hora", nullable = false, updatable = false)
    private LocalDateTime fechaHora;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_movimiento", length = 40, nullable = false, updatable = false)
    private TipoMovimientoEquipo tipoMovimiento;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "actor_id", nullable = false, updatable = false)
    private Usuario actor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsable_id", updatable = false)
    private Usuario responsable;

    @Column(name = "actor_nombre_snapshot", length = 255, updatable = false)
    private String actorNombreSnapshot;

    @Column(name = "responsable_nombre_snapshot", length = 255, updatable = false)
    private String responsableNombreSnapshot;

    @Column(name = "motivo", length = 500, nullable = false, updatable = false)
    private String motivo;

    @Column(name = "observaciones", columnDefinition = "TEXT", updatable = false)
    private String observaciones;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "movimiento_original_id", updatable = false)
    private MovimientoEquipo movimientoOriginal;

    protected MovimientoEquipo() {
    }

    public MovimientoEquipo(
            LocalDateTime fechaHora,
            TipoMovimientoEquipo tipoMovimiento,
            Usuario actor,
            Usuario responsable,
            String actorNombreSnapshot,
            String responsableNombreSnapshot,
            String motivo,
            String observaciones,
            MovimientoEquipo movimientoOriginal) {
        this.fechaHora = fechaHora;
        this.tipoMovimiento = tipoMovimiento;
        this.actor = actor;
        this.responsable = responsable;
        this.actorNombreSnapshot = actorNombreSnapshot;
        this.responsableNombreSnapshot = responsableNombreSnapshot;
        this.motivo = motivo;
        this.observaciones = observaciones;
        this.movimientoOriginal = movimientoOriginal;
    }

    @PrePersist
    protected void onCreate() {
        if (fechaHora == null) {
            fechaHora = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public LocalDateTime getFechaHora() {
        return fechaHora;
    }

    public TipoMovimientoEquipo getTipoMovimiento() {
        return tipoMovimiento;
    }

    public Usuario getActor() {
        return actor;
    }

    public Usuario getResponsable() {
        return responsable;
    }

    public String getActorNombreSnapshot() {
        return actorNombreSnapshot;
    }

    public String getResponsableNombreSnapshot() {
        return responsableNombreSnapshot;
    }

    public String getMotivo() {
        return motivo;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public MovimientoEquipo getMovimientoOriginal() {
        return movimientoOriginal;
    }
}
