package com.sigem.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EquipoClasificacionDTO(
        @NotBlank String tipo,
        @Size(max = 4000) String observaciones) {
}
