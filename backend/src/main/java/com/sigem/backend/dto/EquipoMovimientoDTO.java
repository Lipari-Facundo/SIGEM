package com.sigem.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record EquipoMovimientoDTO(
        @NotNull Long equipoId,
        Long movilId,
        Long responsableId,
        @NotBlank @Size(max = 500) String motivo,
        @Size(max = 4000) String observaciones) {
}
