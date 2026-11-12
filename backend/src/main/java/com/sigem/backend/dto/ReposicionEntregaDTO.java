package com.sigem.backend.dto;

import java.util.List;

public class ReposicionEntregaDTO {
    private List<ReposicionEntregaItemDTO> items;
    private String observaciones;

    public List<ReposicionEntregaItemDTO> getItems() { return items; }
    public void setItems(List<ReposicionEntregaItemDTO> items) { this.items = items; }
    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
}