package com.sigem.backend.dto;

public class ReposicionItemDTO {
    private Long insumoId;
    private Integer cantidad;
    private String motivoCambio;
    private String detalleCambio;

    public Long getInsumoId() { return insumoId; }
    public void setInsumoId(Long insumoId) { this.insumoId = insumoId; }
    public Integer getCantidad() { return cantidad; }
    public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }
    public String getMotivoCambio() { return motivoCambio; }
    public void setMotivoCambio(String motivoCambio) { this.motivoCambio = motivoCambio; }
    public String getDetalleCambio() { return detalleCambio; }
    public void setDetalleCambio(String detalleCambio) { this.detalleCambio = detalleCambio; }
}