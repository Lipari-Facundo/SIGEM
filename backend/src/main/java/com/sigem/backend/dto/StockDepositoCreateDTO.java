package com.sigem.backend.dto;

import com.sigem.backend.model.CategoriaInsumo;
import com.sigem.backend.model.TipoInsumo;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class StockDepositoCreateDTO {

    @NotBlank(message = "El nombre del insumo es obligatorio")
    private String nombre;

    @NotNull(message = "La categoría es obligatoria")
    private CategoriaInsumo categoria;

    private TipoInsumo tipo = TipoInsumo.CONSUMIBLE;

    private String unidadMedida;

    @Min(value = 0, message = "La cantidad inicial no puede ser negativa")
    private Integer cantidadInicial = 0;

    @Min(value = 0, message = "La cantidad mínima no puede ser negativa")
    private Integer cantidadMinima = 0;

    public StockDepositoCreateDTO() {}

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