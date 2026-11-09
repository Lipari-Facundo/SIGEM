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

@Entity
@Immutable
@Table(name = "movimientos_equipos_detalle")
public class MovimientoEquipoDetalle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "movimiento_id", nullable = false, updatable = false)
    private MovimientoEquipo movimiento;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "equipo_id", nullable = false, updatable = false)
    private EquipoMedico equipo;

    @Column(name = "tipo_equipo_snapshot", length = 50, updatable = false)
    private String tipoEquipoSnapshot;

    @Column(name = "numero_serie_snapshot", length = 100, updatable = false)
    private String numeroSerieSnapshot;

    @Column(name = "marca_snapshot", length = 100, updatable = false)
    private String marcaSnapshot;

    @Column(name = "modelo_snapshot", length = 100, updatable = false)
    private String modeloSnapshot;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_anterior", length = 40, updatable = false)
    private EstadoEquipoMedico estadoAnterior;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_nuevo", length = 40, nullable = false, updatable = false)
    private EstadoEquipoMedico estadoNuevo;

    @Enumerated(EnumType.STRING)
    @Column(name = "ubicacion_anterior", length = 40, updatable = false)
    private UbicacionEquipoMedico ubicacionAnterior;

    @Enumerated(EnumType.STRING)
    @Column(name = "ubicacion_nueva", length = 40, nullable = false, updatable = false)
    private UbicacionEquipoMedico ubicacionNueva;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "movil_anterior_id", updatable = false)
    private Movil movilAnterior;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "movil_nuevo_id", updatable = false)
    private Movil movilNuevo;

    @Column(name = "movil_anterior_nombre_snapshot", length = 255, updatable = false)
    private String movilAnteriorNombreSnapshot;

    @Column(name = "movil_nuevo_nombre_snapshot", length = 255, updatable = false)
    private String movilNuevoNombreSnapshot;

    protected MovimientoEquipoDetalle() {
    }

    public MovimientoEquipoDetalle(
            MovimientoEquipo movimiento,
            EquipoMedico equipo,
            EstadoEquipoMedico estadoAnterior,
            EstadoEquipoMedico estadoNuevo,
            UbicacionEquipoMedico ubicacionAnterior,
            UbicacionEquipoMedico ubicacionNueva,
            Movil movilAnterior,
            Movil movilNuevo) {
        this.movimiento = movimiento;
        this.equipo = equipo;
        this.tipoEquipoSnapshot = equipo.getTipoEquipo() == null ? null : equipo.getTipoEquipo().getCodigo();
        this.numeroSerieSnapshot = equipo.getNumeroSerie();
        this.marcaSnapshot = equipo.getMarca();
        this.modeloSnapshot = equipo.getModelo();
        this.estadoAnterior = estadoAnterior;
        this.estadoNuevo = estadoNuevo;
        this.ubicacionAnterior = ubicacionAnterior;
        this.ubicacionNueva = ubicacionNueva;
        this.movilAnterior = movilAnterior;
        this.movilNuevo = movilNuevo;
        this.movilAnteriorNombreSnapshot = nombreMovil(movilAnterior);
        this.movilNuevoNombreSnapshot = nombreMovil(movilNuevo);
    }

    public Long getId() {
        return id;
    }

    public MovimientoEquipo getMovimiento() {
        return movimiento;
    }

    public EquipoMedico getEquipo() {
        return equipo;
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

    public EstadoEquipoMedico getEstadoAnterior() {
        return estadoAnterior;
    }

    public EstadoEquipoMedico getEstadoNuevo() {
        return estadoNuevo;
    }

    public UbicacionEquipoMedico getUbicacionAnterior() {
        return ubicacionAnterior;
    }

    public UbicacionEquipoMedico getUbicacionNueva() {
        return ubicacionNueva;
    }

    public Movil getMovilAnterior() {
        return movilAnterior;
    }

    public Movil getMovilNuevo() {
        return movilNuevo;
    }

    public String getMovilAnteriorNombreSnapshot() {
        return movilAnteriorNombreSnapshot;
    }

    public String getMovilNuevoNombreSnapshot() {
        return movilNuevoNombreSnapshot;
    }

    private static String nombreMovil(Movil movil) {
        return movil == null ? null : movil.getNumeroInterno() + " · " + movil.getPatente();
    }
}
