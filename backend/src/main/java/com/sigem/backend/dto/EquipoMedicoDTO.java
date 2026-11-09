package com.sigem.backend.dto;

import java.time.LocalDate;

public record EquipoMedicoDTO(
        Long id,
        String tipo,
        String tipoNombre,
        String numeroSerie,
        String marca,
        String modelo,
        String estado,
        String ubicacion,
        Long movilId,
        String movilNombre,
        String mantenimientoPreventivo,
        LocalDate proximoVencimiento) {
}
