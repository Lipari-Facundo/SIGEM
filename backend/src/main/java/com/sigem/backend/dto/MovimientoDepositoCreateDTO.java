package com.sigem.backend.dto;

import com.sigem.backend.model.TipoMovimientoDeposito;

public class MovimientoDepositoCreateDTO {
    private Long insumoId;
    private TipoMovimientoDeposito tipo;
    private Integer cantidad;
    private String motivo;

    public Long getInsumoId() { return insumoId; }
    public void setInsumoId(Long insumoId) { this.insumoId = insumoId; }
    public TipoMovimientoDeposito getTipo() { return tipo; }
    public void setTipo(TipoMovimientoDeposito tipo) { this.tipo = tipo; }
    public Integer getCantidad() { return cantidad; }
    public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }
    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }
}