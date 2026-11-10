package com.sigem.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record EquipoMantenimientoDTO(
        @NotNull Long equipoId,
        @NotNull LocalDate fechaRealizacion,
        @NotNull Long responsableId,
        @Size(max = 4000) String observaciones) {
}
