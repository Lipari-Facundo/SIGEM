package com.sigem.backend.dto;

import com.sigem.backend.model.EstadoEquipo;

public class ControlItemInputDTO {

    private Long insumoId;
    private Integer cantidadContada;
    private EstadoEquipo estadoEquipo;
    private String observacion;
    private String numeroSerie;
    private Boolean testOk;

    public Long getInsumoId() {
        return insumoId;
    }

    public void setInsumoId(Long insumoId) {
        this.insumoId = insumoId;
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
