package com.sigem.backend.dto;

import com.sigem.backend.model.TipoMovimientoDeposito;

import java.time.LocalDateTime;

public class MovimientoDepositoDTO {
    private Long id;
    private Long insumoId;
    private String insumoNombre;
    private TipoMovimientoDeposito tipo;
    private Integer cantidad;
    private Integer cantidadAnterior;
    private Integer cantidadNueva;
    private String motivo;
    private String usuarioNombre;
    private Long solicitudId;
    private LocalDateTime fecha;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getInsumoId() { return insumoId; }
    public void setInsumoId(Long insumoId) { this.insumoId = insumoId; }
    public String getInsumoNombre() { return insumoNombre; }
    public void setInsumoNombre(String insumoNombre) { this.insumoNombre = insumoNombre; }
    public TipoMovimientoDeposito getTipo() { return tipo; }
    public void setTipo(TipoMovimientoDeposito tipo) { this.tipo = tipo; }
    public Integer getCantidad() { return cantidad; }
    public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }
    public Integer getCantidadAnterior() { return cantidadAnterior; }
    public void setCantidadAnterior(Integer cantidadAnterior) { this.cantidadAnterior = cantidadAnterior; }
    public Integer getCantidadNueva() { return cantidadNueva; }
    public void setCantidadNueva(Integer cantidadNueva) { this.cantidadNueva = cantidadNueva; }
    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }
    public String getUsuarioNombre() { return usuarioNombre; }
    public void setUsuarioNombre(String usuarioNombre) { this.usuarioNombre = usuarioNombre; }
    public Long getSolicitudId() { return solicitudId; }
    public void setSolicitudId(Long solicitudId) { this.solicitudId = solicitudId; }
    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }
}