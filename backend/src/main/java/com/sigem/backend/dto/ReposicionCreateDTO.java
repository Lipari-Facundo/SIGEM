package com.sigem.backend.dto;

import com.sigem.backend.model.PrioridadReposicion;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public class ReposicionCreateDTO {
    private String observaciones;
    private PrioridadReposicion prioridad = PrioridadReposicion.NORMAL;

    @NotEmpty(message = "Debe seleccionar al menos un insumo")
    @Valid
    private List<ReposicionItemDTO> items;

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
    public PrioridadReposicion getPrioridad() { return prioridad; }
    public void setPrioridad(PrioridadReposicion prioridad) { this.prioridad = prioridad; }
    public List<ReposicionItemDTO> getItems() { return items; }
    public void setItems(List<ReposicionItemDTO> items) { this.items = items; }
}