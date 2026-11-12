package com.sigem.backend.dto;

import java.time.LocalDateTime;

public class SolicitudReposicionGestionDTO {
    private LocalDateTime fecha;
    private String coordinador;
    private String coordinadorUsername;
    private String accion;
    private String detalle;
    private String observaciones;

    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }
    public String getCoordinador() { return coordinador; }
    public void setCoordinador(String coordinador) { this.coordinador = coordinador; }
    public String getCoordinadorUsername() { return coordinadorUsername; }
    public void setCoordinadorUsername(String coordinadorUsername) { this.coordinadorUsername = coordinadorUsername; }
    public String getAccion() { return accion; }
    public void setAccion(String accion) { this.accion = accion; }
    public String getDetalle() { return detalle; }
    public void setDetalle(String detalle) { this.detalle = detalle; }
    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
}
