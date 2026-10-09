package com.sigem.backend.dto;

import java.util.List;

public class ReposicionEntregaDTO {
    private List<ReposicionEntregaItemDTO> items;

    public List<ReposicionEntregaItemDTO> getItems() { return items; }
    public void setItems(List<ReposicionEntregaItemDTO> items) { this.items = items; }
}