package com.sigem.backend.dto;

import java.util.List;

public class ReposicionCreateDTO {
    private String observaciones;
    private List<ReposicionItemDTO> items;

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
    public List<ReposicionItemDTO> getItems() { return items; }
    public void setItems(List<ReposicionItemDTO> items) { this.items = items; }
}