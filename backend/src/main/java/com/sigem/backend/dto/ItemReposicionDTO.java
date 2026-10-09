package com.sigem.backend.dto;

import com.sigem.backend.model.CategoriaInsumo;

public class ItemReposicionDTO {
    private Long id;
    private Long insumoId;
    private String insumoNombre;
    private CategoriaInsumo categoria;
    private Integer cantidadSolicitada;
    private Integer cantidadActualAlMomento;
    private Integer cantidadEntregada;
    private String motivoCambio;
    private String detalleCambio;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getInsumoId() { return insumoId; }
    public void setInsumoId(Long insumoId) { this.insumoId = insumoId; }
    public String getInsumoNombre() { return insumoNombre; }
    public void setInsumoNombre(String insumoNombre) { this.insumoNombre = insumoNombre; }
    public CategoriaInsumo getCategoria() { return categoria; }
    public void setCategoria(CategoriaInsumo categoria) { this.categoria = categoria; }
    public Integer getCantidadSolicitada() { return cantidadSolicitada; }
    public void setCantidadSolicitada(Integer cantidadSolicitada) { this.cantidadSolicitada = cantidadSolicitada; }
    public Integer getCantidadEntregada() { return cantidadEntregada; }
    public void setCantidadEntregada(Integer cantidadEntregada) { this.cantidadEntregada = cantidadEntregada; }
    public Integer getCantidadActualAlMomento() { return cantidadActualAlMomento; }
    public void setCantidadActualAlMomento(Integer cantidadActualAlMomento) { this.cantidadActualAlMomento = cantidadActualAlMomento; }
    public String getMotivoCambio() { return motivoCambio; }
    public void setMotivoCambio(String motivoCambio) { this.motivoCambio = motivoCambio; }
    public String getDetalleCambio() { return detalleCambio; }
    public void setDetalleCambio(String detalleCambio) { this.detalleCambio = detalleCambio; }
}