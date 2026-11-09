package com.sigem.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record EquipoMedicoCreateDTO(
        @NotBlank String tipo,
        @NotBlank @Size(max = 100) String numeroSerie,
        @Size(max = 255) String marca,
        @Size(max = 255) String modelo) {
}
