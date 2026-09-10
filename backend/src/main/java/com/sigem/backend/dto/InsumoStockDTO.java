package com.sigem.backend.dto;

import com.sigem.backend.model.CategoriaInsumo;
import com.sigem.backend.model.TipoInsumo;

public class InsumoStockDTO {

    private Long insumoId;
    private String nombre;
    private CategoriaInsumo categoria;
    private TipoInsumo tipo;
    private String unidadMedida;
    private Integer cantidadActual;

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

    public Integer getCantidadActual() { return cantidadActual; }
    public void setCantidadActual(Integer cantidadActual) { this.cantidadActual = cantidadActual; }
}