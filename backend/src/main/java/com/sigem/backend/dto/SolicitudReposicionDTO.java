package com.sigem.backend.dto;

import com.sigem.backend.model.EstadoReposicion;

import java.time.LocalDateTime;
import java.util.List;

public class SolicitudReposicionDTO {
    private Long id;
    private String movilNumeroInterno;
    private String enfermeroNombre;
    private LocalDateTime fecha;
    private EstadoReposicion estado;
    private String observaciones;
    private List<ItemReposicionDTO> items;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getMovilNumeroInterno() { return movilNumeroInterno; }
    public void setMovilNumeroInterno(String movilNumeroInterno) { this.movilNumeroInterno = movilNumeroInterno; }
    public String getEnfermeroNombre() { return enfermeroNombre; }
    public void setEnfermeroNombre(String enfermeroNombre) { this.enfermeroNombre = enfermeroNombre; }
    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }
    public EstadoReposicion getEstado() { return estado; }
    public void setEstado(EstadoReposicion estado) { this.estado = estado; }
    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
    public List<ItemReposicionDTO> getItems() { return items; }
    public void setItems(List<ItemReposicionDTO> items) { this.items = items; }
}