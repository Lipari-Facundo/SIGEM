package com.sigem.backend.dto;

import java.util.List;

public record EquipoOperativoMovilDTO(
        Long movilId,
        String movil,
        List<EquipoOperativoItemDTO> equipos) {
    public record EquipoOperativoItemDTO(
            String tipo,
            String tipoNombre,
            Long equipoId,
            String numeroSerie,
            String estado,
            boolean faltante) {
    }
}
