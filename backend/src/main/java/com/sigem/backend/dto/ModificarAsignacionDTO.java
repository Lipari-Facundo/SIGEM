package com.sigem.backend.dto;

import jakarta.validation.constraints.NotNull;

public class ModificarAsignacionDTO {
    @NotNull(message = "El equipo es obligatorio")
    private Long equipoId;

    @NotNull(message = "El móvil destino es obligatorio")
    private Long movilId;

    public Long getEquipoId() { return equipoId; }
    public void setEquipoId(Long equipoId) { this.equipoId = equipoId; }
    public Long getMovilId() { return movilId; }
    public void setMovilId(Long movilId) { this.movilId = movilId; }
}
