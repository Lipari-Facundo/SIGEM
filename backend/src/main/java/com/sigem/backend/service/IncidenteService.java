package com.sigem.backend.service;

import com.sigem.backend.dto.IncidenteCreateDTO;
import com.sigem.backend.model.*;
import com.sigem.backend.repository.GuardiaRepository;
import com.sigem.backend.repository.IncidenteRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class IncidenteService {

    private final IncidenteRepository incidenteRepository;
    private final GuardiaRepository guardiaRepository;

    public IncidenteService(IncidenteRepository incidenteRepository,
                            GuardiaRepository guardiaRepository) {
        this.incidenteRepository = incidenteRepository;
        this.guardiaRepository = guardiaRepository;
    }

    public List<Incidente> listarAsignados(Usuario usuario) {
        return incidenteRepository
                .findByAsignadoAUsernameOrderByFechaAsignacionDesc(usuario.getUsername());
    }

    public Incidente crearIncidente(IncidenteCreateDTO dto, Usuario creador) {
        validarCreacion(dto);

        Guardia guardia = guardiaRepository
                .findByIdAndEstado(dto.getGuardiaId(), GuardiaEstado.ACTIVA)
                .orElseThrow(() -> new RuntimeException(
                        "Guardia activa no encontrada para el id proporcionado"));

        Incidente incidente = new Incidente();
        incidente.setTitulo(dto.getTitulo() != null && !dto.getTitulo().isBlank()
                ? dto.getTitulo() : "Sin título");
        incidente.setDescripcion(dto.getDescripcion());
        incidente.setUbicacion(dto.getUbicacion());
        incidente.setMotivo(dto.getMotivo());
        incidente.setPacienteNombre(dto.getPacienteNombre() != null
                ? dto.getPacienteNombre() : "");
        incidente.setPacienteDni(dto.getPacienteDni() != null
                ? dto.getPacienteDni() : "");
        incidente.setPrioridad(dto.getPrioridad());

        Long max = incidenteRepository.findMaxNumeroIncidente();
        incidente.setNumeroIncidente(max == null ? 1L : max + 1);

        incidente.setAsignadoA(guardia.getEnfermero());
        incidente.setCreadoPor(creador);
        incidente.setMovil(guardia.getMovil());
        incidente.setFechaAsignacion(LocalDateTime.now());
        incidente.setEstado(EstadoIncidente.PENDIENTE);

        return incidenteRepository.save(incidente);
    }

    public List<Incidente> listarPorUsuarioRelacionado(Long userId) {
        return incidenteRepository.findByCreadoPorIdOrAsignadoAId(userId);
    }

    public List<Guardia> listarGuardiasActivas() {
        return guardiaRepository.findByEstadoOrderByFechaInicioDesc(GuardiaEstado.ACTIVA);
    }

    public List<Incidente> listarTodos() {
        return incidenteRepository.findAll(
                Sort.by(Sort.Direction.DESC, "fechaAsignacion"));
    }

    // ─── Actualizar estado con lógica de RECHAZADO ────────────

    public Incidente actualizarEstado(Long id, Usuario usuario, String estado) {
        Incidente incidente = incidenteRepository
                .findByIdAndAsignadoAUsername(id, usuario.getUsername())
                .orElseThrow(() -> new RuntimeException(
                        "Incidente no encontrado o no asignado al enfermero"));

        EstadoIncidente nuevoEstado;
        try {
            nuevoEstado = EstadoIncidente.valueOf(estado);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Estado de incidente inválido: " + estado);
        }

        if (incidente.getEstado() == EstadoIncidente.FINALIZADO) {
            throw new RuntimeException("El incidente ya se encuentra finalizado");
        }
        if (incidente.getEstado() == EstadoIncidente.RECHAZADO) {
            throw new RuntimeException("El incidente fue rechazado y no puede modificarse");
        }

        // RECHAZADO solo desde PENDIENTE
        if (nuevoEstado == EstadoIncidente.RECHAZADO
                && incidente.getEstado() != EstadoIncidente.PENDIENTE) {
            throw new RuntimeException(
                    "Solo se puede rechazar un incidente en estado PENDIENTE");
        }

        incidente.setEstado(nuevoEstado);

        if (nuevoEstado == EstadoIncidente.FINALIZADO
                || nuevoEstado == EstadoIncidente.RECHAZADO) {
            incidente.setFechaCierre(LocalDateTime.now());
        }

        return incidenteRepository.save(incidente);
    }

    // ─── Atenciones del día (para tabla resumen del enfermero) ─

    public List<Incidente> atencionesDel(Usuario usuario) {
        LocalDateTime inicioDia = LocalDate.now().atStartOfDay();
        LocalDateTime finDia    = LocalDate.now().atTime(LocalTime.MAX);
        return incidenteRepository.findAtencionesDel(
                usuario.getUsername(), inicioDia, finDia);
    }

    public Map<String, Object> getDashboardData(java.time.LocalDateTime start, java.time.LocalDateTime end) {
        List<Map<String, Object>> overTime = new ArrayList<>();
        for (Object[] row : incidenteRepository.countByDay(start, end)) {
            Object periodValue = row[0];
            LocalDateTime period;
            if (periodValue instanceof Timestamp timestamp) {
                period = timestamp.toLocalDateTime();
            } else if (periodValue instanceof LocalDateTime localDateTime) {
                period = localDateTime;
            } else if (periodValue instanceof java.sql.Date sqlDate) {
                period = sqlDate.toLocalDate().atStartOfDay();
            } else {
                continue;
            }
            Number count = (Number) row[1];
            overTime.add(Map.of(
                    "period", period.format(DateTimeFormatter.ofPattern("dd/MM")),
                    "count", count.intValue()
            ));
        }

        List<Map<String, Object>> vehicles = new ArrayList<>();
        for (Object[] row : incidenteRepository.countByVehicle(start, end)) {
            vehicles.add(Map.of(
                    "name", String.valueOf(row[0]),
                    "count", ((Number) row[1]).intValue()
            ));
        }

        List<Map<String, Object>> motives = new ArrayList<>();
        for (Object[] row : incidenteRepository.countByMotive(start, end)) {
            motives.add(Map.of(
                    "name", String.valueOf(row[0]),
                    "count", ((Number) row[1]).intValue()
            ));
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("overTime", overTime);
        result.put("vehicles", vehicles);
        result.put("motives", motives);
        result.put("totalIncidents", incidenteRepository.countIncidentsInRange(start, end));
        result.put("activeVehicles", incidenteRepository.countActiveVehicles());
        result.put("vehiclesWithIncidents", incidenteRepository.countVehiclesWithIncidents(start, end));

        List<Object[]> topMotive = incidenteRepository.findTopMotive(start, end);
        result.put("mostFrequentMotive", topMotive.isEmpty() ? "N/A" : String.valueOf(topMotive.get(0)[0]));

        List<Object[]> peakDay = incidenteRepository.findPeakDay(start, end);
        if (!peakDay.isEmpty()) {
            Object dayValue = peakDay.get(0)[0];
            result.put("peakIncidentDay", dayValue instanceof java.sql.Timestamp ts ? ts.toLocalDateTime().toLocalDate().toString() : String.valueOf(dayValue));
        } else {
            result.put("peakIncidentDay", "N/A");
        }

        result.put("averageIncidentsPerDay", calculateAveragePerDay(overTime, start, end));
        return result;
    }

    public Map<String, Object> getGlobalMetrics() {
        Map<String, Object> metrics = new LinkedHashMap<>();
        metrics.put("totalIncidents", incidenteRepository.count());
        metrics.put("incidentsByPriority", mapCounts(incidenteRepository.countByPriority()));
        metrics.put("incidentsByStatus", mapCounts(incidenteRepository.countByStatus()));
        return metrics;
    }

    private Map<String, Long> mapCounts(List<Object[]> rows) {
        Map<String, Long> mapped = new LinkedHashMap<>();
        for (Object[] row : rows) {
            String key = String.valueOf(row[0]);
            Long count = row[1] instanceof Number ? ((Number) row[1]).longValue() : 0L;
            mapped.put(key, count);
        }
        return mapped;
    }

    private double calculateAveragePerDay(List<Map<String, Object>> overTime, java.time.LocalDateTime start, java.time.LocalDateTime end) {
        if (overTime.isEmpty()) return 0;
        long daysCount = java.time.Duration.between(start, end).toDays() + 1;
        if (daysCount <= 0) daysCount = overTime.size();
        int total = overTime.stream().mapToInt(item -> ((Number) item.get("count")).intValue()).sum();
        return daysCount == 0 ? 0 : Math.round((total / (double) daysCount) * 100.0) / 100.0;
    }

    // ─── Validación de creación ───────────────────────────────

    private void validarCreacion(IncidenteCreateDTO dto) {
        if (dto.getGuardiaId() == null)
            throw new IllegalArgumentException("Debe seleccionar una guardia activa");
        if (dto.getUbicacion() == null || dto.getUbicacion().isBlank())
            throw new IllegalArgumentException("La ubicación es obligatoria");
        if (dto.getMotivo() == null || dto.getMotivo().isBlank())
            throw new IllegalArgumentException("El motivo es obligatorio");
        if (dto.getPrioridad() == null)
            throw new IllegalArgumentException("Debes seleccionar una prioridad");
    }
}