package com.sigem.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EquipoCorreccionDTO(
        @NotBlank @Size(max = 500) String motivo,
        @Size(max = 4000) String observaciones) {
}
