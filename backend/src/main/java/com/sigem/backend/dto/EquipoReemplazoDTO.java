package com.sigem.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record EquipoReemplazoDTO(
        @NotNull Long equipoSalienteId,
        @NotNull Long equipoEntranteId,
        @NotNull Long movilId,
        Long responsableId,
        @NotBlank String motivo,
        @Size(max = 4000) String observaciones) {
}
