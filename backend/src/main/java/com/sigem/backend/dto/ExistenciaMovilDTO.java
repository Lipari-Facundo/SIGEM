package com.sigem.backend.dto;

import com.sigem.backend.model.CategoriaInsumo;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class ExistenciaMovilDTO {
    private Long insumoId;

    @NotBlank
    @Size(max = 255)
    private String nombre;

    @NotNull
    private CategoriaInsumo categoria;

    @NotNull
    @Min(0)
    private Integer cantidadMinima;

    private String unidadMedida;

    public Long getInsumoId() { return insumoId; }
    public void setInsumoId(Long insumoId) { this.insumoId = insumoId; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public CategoriaInsumo getCategoria() { return categoria; }
    public void setCategoria(CategoriaInsumo categoria) { this.categoria = categoria; }
    public Integer getCantidadMinima() { return cantidadMinima; }
    public void setCantidadMinima(Integer cantidadMinima) { this.cantidadMinima = cantidadMinima; }
    public String getUnidadMedida() { return unidadMedida; }
    public void setUnidadMedida(String unidadMedida) { this.unidadMedida = unidadMedida; }
}
