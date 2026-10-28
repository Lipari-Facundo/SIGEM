package com.sigem.backend.dto;

import com.sigem.backend.model.EstadoEquipoMedico;
import java.time.LocalDateTime;

public class AsignacionEquipoResponseDTO {
    private Long asignacionId;
    private Long equipoId;
    private String equipoNombre;
    private String equipoNumeroSerie;
    private Long movilId;
    private String movilNumeroInterno;
    private EstadoEquipoMedico estadoEquipo;
    private LocalDateTime fechaAsignacion;
    private Long coordinadorId;
    private String coordinadorUsername;

    public Long getAsignacionId() { return asignacionId; }
    public void setAsignacionId(Long asignacionId) { this.asignacionId = asignacionId; }
    public Long getEquipoId() { return equipoId; }
    public void setEquipoId(Long equipoId) { this.equipoId = equipoId; }
    public String getEquipoNombre() { return equipoNombre; }
    public void setEquipoNombre(String equipoNombre) { this.equipoNombre = equipoNombre; }
    public String getEquipoNumeroSerie() { return equipoNumeroSerie; }
    public void setEquipoNumeroSerie(String equipoNumeroSerie) { this.equipoNumeroSerie = equipoNumeroSerie; }
    public Long getMovilId() { return movilId; }
    public void setMovilId(Long movilId) { this.movilId = movilId; }
    public String getMovilNumeroInterno() { return movilNumeroInterno; }
    public void setMovilNumeroInterno(String movilNumeroInterno) { this.movilNumeroInterno = movilNumeroInterno; }
    public EstadoEquipoMedico getEstadoEquipo() { return estadoEquipo; }
    public void setEstadoEquipo(EstadoEquipoMedico estadoEquipo) { this.estadoEquipo = estadoEquipo; }
    public LocalDateTime getFechaAsignacion() { return fechaAsignacion; }
    public void setFechaAsignacion(LocalDateTime fechaAsignacion) { this.fechaAsignacion = fechaAsignacion; }
    public Long getCoordinadorId() { return coordinadorId; }
    public void setCoordinadorId(Long coordinadorId) { this.coordinadorId = coordinadorId; }
    public String getCoordinadorUsername() { return coordinadorUsername; }
    public void setCoordinadorUsername(String coordinadorUsername) { this.coordinadorUsername = coordinadorUsername; }
}
