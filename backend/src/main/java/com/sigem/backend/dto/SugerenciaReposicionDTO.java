package com.sigem.backend.dto;

import com.sigem.backend.model.CategoriaInsumo;

public class SugerenciaReposicionDTO {
    private Long insumoId;
    private String nombre;
    private CategoriaInsumo categoria;
    private Integer cantidadActual;
    private Integer cantidadRecomendada;
    private Integer cantidadSugerida;

    public Long getInsumoId() { return insumoId; }
    public void setInsumoId(Long insumoId) { this.insumoId = insumoId; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public CategoriaInsumo getCategoria() { return categoria; }
    public void setCategoria(CategoriaInsumo categoria) { this.categoria = categoria; }
    public Integer getCantidadActual() { return cantidadActual; }
    public void setCantidadActual(Integer cantidadActual) { this.cantidadActual = cantidadActual; }
    public Integer getCantidadRecomendada() { return cantidadRecomendada; }
    public void setCantidadRecomendada(Integer cantidadRecomendada) { this.cantidadRecomendada = cantidadRecomendada; }
    public Integer getCantidadSugerida() { return cantidadSugerida; }
    public void setCantidadSugerida(Integer cantidadSugerida) { this.cantidadSugerida = cantidadSugerida; }
}