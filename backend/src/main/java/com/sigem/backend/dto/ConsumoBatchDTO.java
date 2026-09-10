package com.sigem.backend.dto;

import java.util.List;

public class ConsumoBatchDTO {

    private Long incidenteId;
    private List<ConsumoItemDTO> items;

    public Long getIncidenteId() { return incidenteId; }
    public void setIncidenteId(Long incidenteId) { this.incidenteId = incidenteId; }

    public List<ConsumoItemDTO> getItems() { return items; }
    public void setItems(List<ConsumoItemDTO> items) { this.items = items; }
}