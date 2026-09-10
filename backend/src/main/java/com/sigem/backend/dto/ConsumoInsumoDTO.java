package com.sigem.backend.dto;

import com.sigem.backend.model.CategoriaInsumo;

import java.time.LocalDateTime;

public class ConsumoInsumoDTO {

    private Long id;
    private String insumoNombre;
    private CategoriaInsumo categoria;
    private Integer cantidad;
    private String enfermeroNombre;
    private Long incidenteId;
    private String incidenteUbicacion;
    private String loteId;
    private LocalDateTime fecha;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getInsumoNombre() { return insumoNombre; }
    public void setInsumoNombre(String insumoNombre) { this.insumoNombre = insumoNombre; }

    public CategoriaInsumo getCategoria() { return categoria; }
    public void setCategoria(CategoriaInsumo categoria) { this.categoria = categoria; }

    public Integer getCantidad() { return cantidad; }
    public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }

    public String getEnfermeroNombre() { return enfermeroNombre; }
    public void setEnfermeroNombre(String enfermeroNombre) { this.enfermeroNombre = enfermeroNombre; }

    public Long getIncidenteId() { return incidenteId; }
    public void setIncidenteId(Long incidenteId) { this.incidenteId = incidenteId; }

    public String getIncidenteUbicacion() { return incidenteUbicacion; }
    public void setIncidenteUbicacion(String incidenteUbicacion) { this.incidenteUbicacion = incidenteUbicacion; }

    public String getLoteId() { return loteId; }
    public void setLoteId(String loteId) { this.loteId = loteId; }

    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }
}