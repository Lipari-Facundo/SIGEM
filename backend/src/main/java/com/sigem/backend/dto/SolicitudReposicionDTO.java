package com.sigem.backend.dto;

import com.sigem.backend.model.EstadoReposicion;
import com.sigem.backend.model.PrioridadReposicion;

import java.time.LocalDateTime;
import java.util.List;

public class SolicitudReposicionDTO {
    private Long id;
    private String movilNumeroInterno;
    private String enfermeroNombre;
    private LocalDateTime fecha;
    private LocalDateTime fechaEmision;
    private Long fechaEmisionEpochMillis;
    private EstadoReposicion estado;
    private PrioridadReposicion prioridad;
    private boolean interna;
    private boolean archivado;
    private Long solicitanteId;
    private String solicitanteNombre;
    private String observaciones;
    private String motivoResolucion;
    private String usuarioUltimaGestion;
    private LocalDateTime fechaUltimaGestion;
    private String motivoExcepcionControl;
    private String usuarioExcepcionControl;
    private LocalDateTime fechaExcepcionControl;
    private List<ReposicionEntregaHistorialDTO> entregas;
    private List<ItemReposicionDTO> items;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getMovilNumeroInterno() { return movilNumeroInterno; }
    public void setMovilNumeroInterno(String movilNumeroInterno) { this.movilNumeroInterno = movilNumeroInterno; }
    public String getEnfermeroNombre() { return enfermeroNombre; }
    public void setEnfermeroNombre(String enfermeroNombre) { this.enfermeroNombre = enfermeroNombre; }
    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }
    public LocalDateTime getFechaEmision() { return fechaEmision; }
    public void setFechaEmision(LocalDateTime fechaEmision) { this.fechaEmision = fechaEmision; }
    public Long getFechaEmisionEpochMillis() { return fechaEmisionEpochMillis; }
    public void setFechaEmisionEpochMillis(Long fechaEmisionEpochMillis) {
        this.fechaEmisionEpochMillis = fechaEmisionEpochMillis;
    }
    public EstadoReposicion getEstado() { return estado; }
    public void setEstado(EstadoReposicion estado) { this.estado = estado; }
    public PrioridadReposicion getPrioridad() { return prioridad; }
    public void setPrioridad(PrioridadReposicion prioridad) { this.prioridad = prioridad; }
    public boolean isInterna() { return interna; }
    public void setInterna(boolean interna) { this.interna = interna; }
    public boolean isArchivado() { return archivado; }
    public void setArchivado(boolean archivado) { this.archivado = archivado; }
    public Long getSolicitanteId() { return solicitanteId; }
    public void setSolicitanteId(Long solicitanteId) { this.solicitanteId = solicitanteId; }
    public String getSolicitanteNombre() { return solicitanteNombre; }
    public void setSolicitanteNombre(String solicitanteNombre) { this.solicitanteNombre = solicitanteNombre; }
    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
    public String getMotivoResolucion() { return motivoResolucion; }
    public void setMotivoResolucion(String motivoResolucion) { this.motivoResolucion = motivoResolucion; }
    public String getUsuarioUltimaGestion() { return usuarioUltimaGestion; }
    public void setUsuarioUltimaGestion(String usuarioUltimaGestion) { this.usuarioUltimaGestion = usuarioUltimaGestion; }
    public LocalDateTime getFechaUltimaGestion() { return fechaUltimaGestion; }
    public void setFechaUltimaGestion(LocalDateTime fechaUltimaGestion) { this.fechaUltimaGestion = fechaUltimaGestion; }
    public String getMotivoExcepcionControl() { return motivoExcepcionControl; }
    public void setMotivoExcepcionControl(String motivoExcepcionControl) {
        this.motivoExcepcionControl = motivoExcepcionControl;
    }
    public String getUsuarioExcepcionControl() { return usuarioExcepcionControl; }
    public void setUsuarioExcepcionControl(String usuarioExcepcionControl) {
        this.usuarioExcepcionControl = usuarioExcepcionControl;
    }
    public LocalDateTime getFechaExcepcionControl() { return fechaExcepcionControl; }
    public void setFechaExcepcionControl(LocalDateTime fechaExcepcionControl) {
        this.fechaExcepcionControl = fechaExcepcionControl;
    }
    public List<ReposicionEntregaHistorialDTO> getEntregas() { return entregas; }
    public void setEntregas(List<ReposicionEntregaHistorialDTO> entregas) { this.entregas = entregas; }
    public List<ItemReposicionDTO> getItems() { return items; }
    public void setItems(List<ItemReposicionDTO> items) { this.items = items; }
}