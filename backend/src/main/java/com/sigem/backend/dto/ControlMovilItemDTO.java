package com.sigem.backend.dto;

import com.sigem.backend.model.CategoriaInsumo;
import com.sigem.backend.model.EstadoEquipo;
import com.sigem.backend.model.TipoInsumo;

public class ControlMovilItemDTO {

    private String insumoNombre;
    private CategoriaInsumo categoria;
    private TipoInsumo tipo;
    private String unidadMedida;
    private Integer cantidadRecomendada;
    private Integer cantidadSistema;
    private Integer cantidadContada;
    private EstadoEquipo estadoEquipo;
    private String observacion;
    private String numeroSerie;
    private Boolean testOk;

    public String getInsumoNombre() {
        return insumoNombre;
    }

    public void setInsumoNombre(String insumoNombre) {
        this.insumoNombre = insumoNombre;
    }

    public CategoriaInsumo getCategoria() {
        return categoria;
    }

    public void setCategoria(CategoriaInsumo categoria) {
        this.categoria = categoria;
    }

    public TipoInsumo getTipo() {
        return tipo;
    }

    public void setTipo(TipoInsumo tipo) {
        this.tipo = tipo;
    }

    public String getUnidadMedida() {
        return unidadMedida;
    }

    public void setUnidadMedida(String unidadMedida) {
        this.unidadMedida = unidadMedida;
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
