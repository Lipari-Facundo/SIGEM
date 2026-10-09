package com.sigem.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "control_movil_item")
public class ControlMovilItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "control_id", nullable = false)
    private ControlMovil control;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "insumo_id", nullable = false)
    private Insumo insumo;

    @Column(name = "cantidad_recomendada", nullable = false)
    private Integer cantidadRecomendada;

    @Column(name = "cantidad_sistema", nullable = false)
    private Integer cantidadSistema;

    @Column(name = "cantidad_contada", nullable = false)
    private Integer cantidadContada;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_equipo")
    private EstadoEquipo estadoEquipo;

    @Column(length = 500)
    private String observacion;

    @Column(name = "numero_serie", length = 100)
    private String numeroSerie;

    @Column(name = "test_ok")
    private Boolean testOk;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public ControlMovil getControl() {
        return control;
    }

    public void setControl(ControlMovil control) {
        this.control = control;
    }

    public Insumo getInsumo() {
        return insumo;
    }

    public void setInsumo(Insumo insumo) {
        this.insumo = insumo;
    }

    public Integer getCantidadRecomendada() {
        return cantidadRecomendada;
    }

    public void setCantidadRecomendada(Integer cantidadRecomendada) {
        this.cantidadRecomendada = cantidadRecomendada;
    }

    public Integer getCantidadSistema() {
        return cantidadSistema;
    }

    public void setCantidadSistema(Integer cantidadSistema) {
        this.cantidadSistema = cantidadSistema;
    }

    public Integer getCantidadContada() {
        return cantidadContada;
    }

    public void setCantidadContada(Integer cantidadContada) {
        this.cantidadContada = cantidadContada;
    }

    public EstadoEquipo getEstadoEquipo() {
        return estadoEquipo;
    }

    public void setEstadoEquipo(EstadoEquipo estadoEquipo) {
        this.estadoEquipo = estadoEquipo;
    }

    public String getObservacion() {
        return observacion;
    }

    public void setObservacion(String observacion) {
        this.observacion = observacion;
    }

    public String getNumeroSerie() {
        return numeroSerie;
    }

    public void setNumeroSerie(String numeroSerie) {
        this.numeroSerie = numeroSerie;
    }

    public Boolean getTestOk() {
        return testOk;
    }

    public void setTestOk(Boolean testOk) {
        this.testOk = testOk;
    }
}
