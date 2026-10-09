package com.sigem.backend.dto;

public class ReposicionEntregaItemDTO {
    private Long itemId;
    private Integer cantidad;

    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }
    public Integer getCantidad() { return cantidad; }
    public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }
}