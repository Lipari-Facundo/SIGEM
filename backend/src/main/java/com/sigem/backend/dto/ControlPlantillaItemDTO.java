package com.sigem.backend.dto;

import com.sigem.backend.model.CategoriaInsumo;
import com.sigem.backend.model.TipoInsumo;

public class ControlPlantillaItemDTO {

    private Long insumoId;
    private String nombre;
    private CategoriaInsumo categoria;
    private TipoInsumo tipo;
    private String unidadMedida;
    private Integer cantidadRecomendada;
    private boolean requiereSerie;
    private boolean requiereTest;
    private String ultimoNumeroSerie;

    public Long getInsumoId() {
        return insumoId;
    }

    public void setInsumoId(Long insumoId) {
        this.insumoId = insumoId;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
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

    public boolean isRequiereSerie() {
        return requiereSerie;
    }

    public void setRequiereSerie(boolean requiereSerie) {
        this.requiereSerie = requiereSerie;
    }

    public boolean isRequiereTest() {
        return requiereTest;
    }

    public void setRequiereTest(boolean requiereTest) {
        this.requiereTest = requiereTest;
    }

    public String getUltimoNumeroSerie() {
        return ultimoNumeroSerie;
    }

    public void setUltimoNumeroSerie(String ultimoNumeroSerie) {
        this.ultimoNumeroSerie = ultimoNumeroSerie;
    }
}
