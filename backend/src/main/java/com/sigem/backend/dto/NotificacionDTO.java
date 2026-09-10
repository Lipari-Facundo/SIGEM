package com.sigem.backend.dto;

import java.time.LocalDateTime;

public class NotificacionDTO {

    private Long id;
    private String mensaje;
    private boolean leida;
    private LocalDateTime fechaCreacion;
    private Long incidenteId;
    private String ubicacionIncidente;
    private String tipo;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getMensaje() { return mensaje; }
    public void setMensaje(String mensaje) { this.mensaje = mensaje; }

    public boolean isLeida() { return leida; }
    public void setLeida(boolean leida) { this.leida = leida; }

    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }

    public Long getIncidenteId() { return incidenteId; }
    public void setIncidenteId(Long incidenteId) { this.incidenteId = incidenteId; }

    public String getUbicacionIncidente() { return ubicacionIncidente; }
    public void setUbicacionIncidente(String ubicacionIncidente) { this.ubicacionIncidente = ubicacionIncidente; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }
}