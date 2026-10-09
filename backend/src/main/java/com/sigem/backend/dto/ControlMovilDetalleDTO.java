package com.sigem.backend.dto;

import java.util.List;

public class ControlMovilDetalleDTO extends ControlMovilResumenDTO {

    private String observaciones;
    private List<ControlMovilItemDTO> items;

    public String getObservaciones() {
        return observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }

    public List<ControlMovilItemDTO> getItems() {
        return items;
    }

    public void setItems(List<ControlMovilItemDTO> items) {
        this.items = items;
    }
}
