package com.sigem.backend.dto;

import com.sigem.backend.model.CategoriaInsumo;

public class ItemReposicionDTO {
    private String insumoNombre;
    private CategoriaInsumo categoria;
    private Integer cantidadSolicitada;
    private Integer cantidadActualAlMomento;

    public String getInsumoNombre() { return insumoNombre; }
    public void setInsumoNombre(String insumoNombre) { this.insumoNombre = insumoNombre; }
    public CategoriaInsumo getCategoria() { return categoria; }
    public void setCategoria(CategoriaInsumo categoria) { this.categoria = categoria; }
    public Integer getCantidadSolicitada() { return cantidadSolicitada; }
    public void setCantidadSolicitada(Integer cantidadSolicitada) { this.cantidadSolicitada = cantidadSolicitada; }
    public Integer getCantidadActualAlMomento() { return cantidadActualAlMomento; }
    public void setCantidadActualAlMomento(Integer cantidadActualAlMomento) { this.cantidadActualAlMomento = cantidadActualAlMomento; }
}