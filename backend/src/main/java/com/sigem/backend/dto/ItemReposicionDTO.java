package com.sigem.backend.dto;

import com.sigem.backend.model.CategoriaInsumo;
import com.sigem.backend.model.TipoInsumo;

import java.time.LocalDateTime;

public class ItemReposicionDTO {
    private Long id;
    private Long insumoId;
    private String insumoNombre;
    private CategoriaInsumo categoria;
    private TipoInsumo tipo;
    private Integer cantidadSolicitada;
    private Integer cantidadActualAlMomento;
    private Integer cantidadActualMovil;
    private Integer cantidadEntregada;
    private String motivoCambio;
    private String detalleCambio;
    private LocalDateTime controlFecha;
    private String controlResultado;
    private String controlNumeroSerie;
    private String controlObservacion;
    private boolean controlFaltante;
    private boolean controlNoCoincide;
    private String controlEquipoObservado;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getInsumoId() { return insumoId; }
    public void setInsumoId(Long insumoId) { this.insumoId = insumoId; }
    public String getInsumoNombre() { return insumoNombre; }
    public void setInsumoNombre(String insumoNombre) { this.insumoNombre = insumoNombre; }
    public CategoriaInsumo getCategoria() { return categoria; }
    public void setCategoria(CategoriaInsumo categoria) { this.categoria = categoria; }
    public TipoInsumo getTipo() { return tipo; }
    public void setTipo(TipoInsumo tipo) { this.tipo = tipo; }
    public Integer getCantidadSolicitada() { return cantidadSolicitada; }
    public void setCantidadSolicitada(Integer cantidadSolicitada) { this.cantidadSolicitada = cantidadSolicitada; }
    public Integer getCantidadEntregada() { return cantidadEntregada; }
    public void setCantidadEntregada(Integer cantidadEntregada) { this.cantidadEntregada = cantidadEntregada; }
    public Integer getCantidadActualAlMomento() { return cantidadActualAlMomento; }
    public void setCantidadActualAlMomento(Integer cantidadActualAlMomento) { this.cantidadActualAlMomento = cantidadActualAlMomento; }
    public Integer getCantidadActualMovil() { return cantidadActualMovil; }
    public void setCantidadActualMovil(Integer cantidadActualMovil) { this.cantidadActualMovil = cantidadActualMovil; }
    public String getMotivoCambio() { return motivoCambio; }
    public void setMotivoCambio(String motivoCambio) { this.motivoCambio = motivoCambio; }
    public String getDetalleCambio() { return detalleCambio; }
    public void setDetalleCambio(String detalleCambio) { this.detalleCambio = detalleCambio; }
    public LocalDateTime getControlFecha() { return controlFecha; }
    public void setControlFecha(LocalDateTime controlFecha) { this.controlFecha = controlFecha; }
    public String getControlResultado() { return controlResultado; }
    public void setControlResultado(String controlResultado) { this.controlResultado = controlResultado; }
    public String getControlNumeroSerie() { return controlNumeroSerie; }
    public void setControlNumeroSerie(String controlNumeroSerie) { this.controlNumeroSerie = controlNumeroSerie; }
    public String getControlObservacion() { return controlObservacion; }
    public void setControlObservacion(String controlObservacion) { this.controlObservacion = controlObservacion; }
    public boolean isControlFaltante() { return controlFaltante; }
    public void setControlFaltante(boolean controlFaltante) { this.controlFaltante = controlFaltante; }
    public boolean isControlNoCoincide() { return controlNoCoincide; }
    public void setControlNoCoincide(boolean controlNoCoincide) { this.controlNoCoincide = controlNoCoincide; }
    public String getControlEquipoObservado() { return controlEquipoObservado; }
    public void setControlEquipoObservado(String controlEquipoObservado) { this.controlEquipoObservado = controlEquipoObservado; }
}