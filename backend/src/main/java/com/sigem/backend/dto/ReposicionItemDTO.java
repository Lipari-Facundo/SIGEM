package com.sigem.backend.dto;

public class ReposicionItemDTO {
    private Long insumoId;
    private Integer cantidad;

    public Long getInsumoId() { return insumoId; }
    public void setInsumoId(Long insumoId) { this.insumoId = insumoId; }
    public Integer getCantidad() { return cantidad; }
    public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }
}