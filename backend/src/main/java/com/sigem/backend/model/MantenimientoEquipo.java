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
import jakarta.persistence.Table;
import org.hibernate.annotations.Immutable;

import java.time.LocalDate;

@Entity
@Immutable
@Table(name = "mantenimientos_equipos")
public class MantenimientoEquipo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "equipo_id", nullable = false, updatable = false)
    private EquipoMedico equipo;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", length = 20, nullable = false, updatable = false)
    private TipoMantenimientoEquipo tipo;

    @Column(name = "fecha_realizacion", nullable = false, updatable = false)
    private LocalDate fechaRealizacion;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "responsable_id", nullable = false, updatable = false)
    private Usuario responsable;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id", updatable = false)
    private Usuario actor;

    @Column(name = "tipo_equipo_snapshot", length = 50, updatable = false)
    private String tipoEquipoSnapshot;

    @Column(name = "numero_serie_snapshot", length = 100, updatable = false)
    private String numeroSerieSnapshot;

    @Column(name = "marca_snapshot", length = 100, updatable = false)
    private String marcaSnapshot;

    @Column(name = "modelo_snapshot", length = 100, updatable = false)
    private String modeloSnapshot;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_anterior_snapshot", length = 40, updatable = false)
    private EstadoEquipoMedico estadoAnteriorSnapshot;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_nuevo_snapshot", length = 40, updatable = false)
    private EstadoEquipoMedico estadoNuevoSnapshot;

    @Enumerated(EnumType.STRING)
    @Column(name = "ubicacion_anterior_snapshot", length = 40, updatable = false)
    private UbicacionEquipoMedico ubicacionAnteriorSnapshot;

    @Enumerated(EnumType.STRING)
    @Column(name = "ubicacion_nueva_snapshot", length = 40, updatable = false)
    private UbicacionEquipoMedico ubicacionNuevaSnapshot;

    @Column(name = "movil_id_snapshot", updatable = false)
    private Long movilIdSnapshot;

    @Column(name = "movil_nombre_snapshot", length = 255, updatable = false)
    private String movilNombreSnapshot;

    @Column(name = "actor_nombre_snapshot", length = 255, updatable = false)
    private String actorNombreSnapshot;

    @Column(name = "responsable_nombre_snapshot", length = 255, updatable = false)
    private String responsableNombreSnapshot;

    @Column(name = "observaciones", columnDefinition = "TEXT", updatable = false)
    private String observaciones;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "movimiento_id", updatable = false)
    private MovimientoEquipo movimiento;

    protected MantenimientoEquipo() {
    }

    public MantenimientoEquipo(
            EquipoMedico equipo,
            TipoMantenimientoEquipo tipo,
            LocalDate fechaRealizacion,
            Usuario actor,
            Usuario responsable,
            String observaciones,
            MovimientoEquipo movimiento,
            EstadoEquipoMedico estadoAnterior,
            EstadoEquipoMedico estadoNuevo,
            UbicacionEquipoMedico ubicacionAnterior,
            UbicacionEquipoMedico ubicacionNueva,
            AsignacionEquipo asignacion) {
        this.equipo = equipo;
        this.tipo = tipo;
        this.fechaRealizacion = fechaRealizacion;
        this.actor = actor;
        this.responsable = responsable;
        this.observaciones = observaciones;
        this.movimiento = movimiento;
        this.tipoEquipoSnapshot = equipo.getTipoEquipo() == null ? null : equipo.getTipoEquipo().getCodigo();
        this.numeroSerieSnapshot = equipo.getNumeroSerie();
        this.marcaSnapshot = equipo.getMarca();
        this.modeloSnapshot = equipo.getModelo();
        this.estadoAnteriorSnapshot = estadoAnterior;
        this.estadoNuevoSnapshot = estadoNuevo;
        this.ubicacionAnteriorSnapshot = ubicacionAnterior;
        this.ubicacionNuevaSnapshot = ubicacionNueva;
        if (asignacion != null && asignacion.getMovil() != null) {
            this.movilIdSnapshot = asignacion.getMovil().getId();
            this.movilNombreSnapshot = asignacion.getMovil().getNumeroInterno()
                    + " · " + asignacion.getMovil().getPatente();
        }
        this.actorNombreSnapshot = nombreUsuario(actor);
        this.responsableNombreSnapshot = nombreUsuario(responsable);
    }

    public MantenimientoEquipo(
            EquipoMedico equipo,
            TipoMantenimientoEquipo tipo,
            LocalDate fechaRealizacion,
            Usuario responsable,
            String observaciones,
            MovimientoEquipo movimiento) {
        this(equipo, tipo, fechaRealizacion, null, responsable, observaciones, movimiento,
                null, null, null, null, null);
    }

    public Long getId() {
        return id;
    }

    public EquipoMedico getEquipo() {
        return equipo;
    }

    public TipoMantenimientoEquipo getTipo() {
        return tipo;
    }

    public LocalDate getFechaRealizacion() {
        return fechaRealizacion;
    }

    public Usuario getResponsable() {
        return responsable;
    }

    public Usuario getActor() {
        return actor;
    }

    public String getTipoEquipoSnapshot() {
        return tipoEquipoSnapshot;
    }

    public String getNumeroSerieSnapshot() {
        return numeroSerieSnapshot;
    }

    public String getMarcaSnapshot() {
        return marcaSnapshot;
    }

    public String getModeloSnapshot() {
        return modeloSnapshot;
    }

    public EstadoEquipoMedico getEstadoAnteriorSnapshot() {
        return estadoAnteriorSnapshot;
    }

    public EstadoEquipoMedico getEstadoNuevoSnapshot() {
        return estadoNuevoSnapshot;
    }

    public UbicacionEquipoMedico getUbicacionAnteriorSnapshot() {
        return ubicacionAnteriorSnapshot;
    }

    public UbicacionEquipoMedico getUbicacionNuevaSnapshot() {
        return ubicacionNuevaSnapshot;
    }

    public Long getMovilIdSnapshot() {
        return movilIdSnapshot;
    }

    public String getMovilNombreSnapshot() {
        return movilNombreSnapshot;
    }

    public String getActorNombreSnapshot() {
        return actorNombreSnapshot;
    }

    public String getResponsableNombreSnapshot() {
        return responsableNombreSnapshot;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public MovimientoEquipo getMovimiento() {
        return movimiento;
    }

    private static String nombreUsuario(Usuario usuario) {
        return usuario == null ? null : usuario.getNombre() + " " + usuario.getApellido();
    }
}
