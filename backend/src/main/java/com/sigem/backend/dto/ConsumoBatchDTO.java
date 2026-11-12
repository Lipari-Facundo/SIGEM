package com.sigem.backend.dto;

import java.util.List;

public class ConsumoBatchDTO {

    private Long incidenteId;
    private List<ConsumoItemDTO> items;
    private String motivoExcepcionControl;
    private String observaciones;

    public Long getIncidenteId() { return incidenteId; }
    public void setIncidenteId(Long incidenteId) { this.incidenteId = incidenteId; }

    public List<ConsumoItemDTO> getItems() { return items; }
    public void setItems(List<ConsumoItemDTO> items) { this.items = items; }

    public String getMotivoExcepcionControl() { return motivoExcepcionControl; }
    public void setMotivoExcepcionControl(String motivoExcepcionControl) {
        this.motivoExcepcionControl = motivoExcepcionControl;
    }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
}