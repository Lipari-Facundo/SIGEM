package com.sigem.backend.dto;

import com.sigem.backend.model.TipoMovil;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.Map;

public class InsumoEstandarUpdateDTO {
    @NotBlank
    @Size(max = 255)
    private String nombre;

    private Map<TipoMovil, Integer> cantidadesEstandar;

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public Map<TipoMovil, Integer> getCantidadesEstandar() { return cantidadesEstandar; }
    public void setCantidadesEstandar(Map<TipoMovil, Integer> cantidadesEstandar) {
        this.cantidadesEstandar = cantidadesEstandar;
    }
}
