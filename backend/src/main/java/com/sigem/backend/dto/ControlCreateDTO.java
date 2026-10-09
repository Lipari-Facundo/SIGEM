package com.sigem.backend.dto;

import java.util.List;

public class ControlCreateDTO {

    private String observaciones;
    private List<ControlItemInputDTO> items;

    public String getObservaciones() {
        return observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }

    public List<ControlItemInputDTO> getItems() {
        return items;
    }

    public void setItems(List<ControlItemInputDTO> items) {
        this.items = items;
    }
}
