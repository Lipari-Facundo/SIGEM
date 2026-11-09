package com.sigem.backend.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record EquipoHistorialDTO(
        Long id,
        String tipoEvento,
        LocalDateTime fechaHora,
        LocalDate fechaRealizacion,
        Long equipoId,
        String tipoEquipo,
        String numeroSerie,
        String marca,
        String modelo,
        Long movilAnteriorId,
        String movilAnterior,
        Long movilNuevoId,
        String movilNuevo,
        String actor,
        String responsable,
        String motivo,
        String observaciones,
        String estadoAnterior,
        String estadoNuevo,
        String ubicacionAnterior,
        String ubicacionNueva,
        Long movimientoRelacionadoId) {
}
