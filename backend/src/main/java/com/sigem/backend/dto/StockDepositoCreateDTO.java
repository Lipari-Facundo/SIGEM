package com.sigem.backend.dto;

import com.sigem.backend.model.CategoriaInsumo;
import com.sigem.backend.model.TipoInsumo;

public class StockDepositoCreateDTO {
    private Long insumoId;
    private String nombre;
    private CategoriaInsumo categoria;
    private TipoInsumo tipo;
    private String unidadMedida;
    private Integer cantidadInicial;
    private Integer cantidadMinima;

    public Long getInsumoId() { return insumoId; }
    public void setInsumoId(Long insumoId) { this.insumoId = insumoId; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public CategoriaInsumo getCategoria() { return categoria; }
    public void setCategoria(CategoriaInsumo categoria) { this.categoria = categoria; }
    public TipoInsumo getTipo() { return tipo; }
    public void setTipo(TipoInsumo tipo) { this.tipo = tipo; }
    public String getUnidadMedida() { return unidadMedida; }
    public void setUnidadMedida(String unidadMedida) { this.unidadMedida = unidadMedida; }
    public Integer getCantidadInicial() { return cantidadInicial; }
    public void setCantidadInicial(Integer cantidadInicial) { this.cantidadInicial = cantidadInicial; }
    public Integer getCantidadMinima() { return cantidadMinima; }
    public void setCantidadMinima(Integer cantidadMinima) { this.cantidadMinima = cantidadMinima; }
}