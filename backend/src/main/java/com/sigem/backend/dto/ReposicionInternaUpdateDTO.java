package com.sigem.backend.dto;

import com.sigem.backend.model.PrioridadReposicion;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public class ReposicionInternaUpdateDTO {
    @NotNull(message = "Debe indicar la prioridad")
    private PrioridadReposicion prioridad;

    @NotEmpty(message = "Debe seleccionar al menos un insumo")
    @Valid
    private List<ReposicionItemDTO> items;

    public PrioridadReposicion getPrioridad() { return prioridad; }
    public void setPrioridad(PrioridadReposicion prioridad) { this.prioridad = prioridad; }
    public List<ReposicionItemDTO> getItems() { return items; }
    public void setItems(List<ReposicionItemDTO> items) { this.items = items; }
}
