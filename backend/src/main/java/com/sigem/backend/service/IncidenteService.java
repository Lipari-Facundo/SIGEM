package com.sigem.backend.service;

import com.sigem.backend.dto.IncidenteCreateDTO;
import com.sigem.backend.model.*;
import com.sigem.backend.repository.GuardiaRepository;
import com.sigem.backend.repository.IncidenteRepository;
import com.sigem.backend.repository.IncidenteHistorialAsignacionRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    private static final List<EstadoIncidente> ESTADOS_QUE_OCUPAN =
            List.of(EstadoIncidente.PENDIENTE, EstadoIncidente.EN_PROCESO);

    private final IncidenteRepository incidenteRepository;
    private final GuardiaRepository guardiaRepository;
    private final NotificacionService notificacionService;
    private final IncidenteHistorialAsignacionRepository historialRepository;

    public IncidenteService(IncidenteRepository incidenteRepository,
                            GuardiaRepository guardiaRepository,
                            NotificacionService notificacionService,
                            IncidenteHistorialAsignacionRepository historialRepository) {
        this.incidenteRepository = incidenteRepository;
        this.guardiaRepository = guardiaRepository;
        this.notificacionService = notificacionService;
        this.historialRepository = historialRepository;
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

        validarEnfermeroDisponible(guardia.getEnfermero());

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

        Incidente incidenteGuardado = incidenteRepository.save(incidente);
        notificacionService.crearNotificacionAsignacion(
            guardia.getEnfermero(), incidenteGuardado);

        return incidenteGuardado;
    }

    public List<Incidente> listarPorUsuarioRelacionado(Long userId) {
        return incidenteRepository.findByCreadoPorIdOrAsignadoAId(userId);
    }

    public List<Guardia> listarGuardiasActivas() {
        return guardiaRepository.findByEstadoOrderByFechaInicioDesc(GuardiaEstado.ACTIVA)
            .stream()
            .filter(guardia -> estaDisponible(guardia.getEnfermero()))
            .toList();
    }

        @Transactional
        public Incidente rechazarIncidente(Long incidenteId, Usuario enfermero, String motivo) {
        Incidente incidente = incidenteRepository.findById(incidenteId)
            .orElseThrow(() -> new RuntimeException("No se encontró el incidente " + incidenteId));

        if (incidente.getEstado() != EstadoIncidente.PENDIENTE) {
            throw new RuntimeException("No se puede rechazar el incidente porque está en estado "
                + incidente.getEstado());
        }
        if (incidente.getAsignadoA() == null
            || !incidente.getAsignadoA().getId().equals(enfermero.getId())) {
            throw new RuntimeException("No se puede rechazar el incidente porque no está asignado al enfermero autenticado");
        }
        if (motivo == null || motivo.isBlank()) {
            throw new RuntimeException("El motivo de rechazo es obligatorio");
        }

        Usuario enfermeroAnterior = incidente.getAsignadoA();
        Movil movilAnterior = incidente.getMovil();
        guardarHistorial(incidente, enfermeroAnterior, movilAnterior,
            TipoDesasignacion.RECHAZO, motivo.trim());

        incidente.setAsignadoA(null);
        incidente.setMovil(null);
        incidente.setEstado(EstadoIncidente.PENDIENTE_REASIGNACION);

        if (incidente.getCreadoPor() != null) {
            notificacionService.crearNotificacion(
                incidente.getCreadoPor(), incidente, TipoNotificacion.INCIDENTE_RECHAZADO,
                "Un enfermero rechazó el incidente: " + motivo.trim());
        }
        return incidenteRepository.save(incidente);
        }

        @Transactional
        public Incidente marcarLlegada(Long incidenteId, Usuario enfermero) {
        Incidente incidente = incidenteRepository.findById(incidenteId)
            .orElseThrow(() -> new RuntimeException("No se encontró el incidente " + incidenteId));

        if (incidente.getEstado() != EstadoIncidente.EN_PROCESO) {
            throw new RuntimeException("No se puede registrar la llegada porque el incidente no está en proceso");
        }
        if (incidente.getAsignadoA() == null
            || !incidente.getAsignadoA().getId().equals(enfermero.getId())) {
            throw new RuntimeException("No se puede registrar la llegada porque el incidente no está asignado al enfermero autenticado");
        }
        if (incidente.getFechaLlegadaLugar() != null) {
            throw new RuntimeException("Ya se registró la llegada a este incidente");
        }

        incidente.setFechaLlegadaLugar(LocalDateTime.now());
        return incidenteRepository.save(incidente);
        }

        @Transactional
        public Incidente reasignarIncidente(Long incidenteId, Long nuevaGuardiaId, Usuario despachador) {
        Incidente incidente = incidenteRepository.findById(incidenteId)
            .orElseThrow(() -> new RuntimeException("No se encontró el incidente " + incidenteId));

        EstadoIncidente estadoAnterior = incidente.getEstado();
        if (estadoAnterior == EstadoIncidente.EN_PROCESO
            && incidente.getFechaLlegadaLugar() != null) {
            throw new RuntimeException(
                "No se puede reasignar: el enfermero ya llegó al lugar y está atendiendo al paciente.");
        }
        if (estadoAnterior != EstadoIncidente.PENDIENTE
            && estadoAnterior != EstadoIncidente.PENDIENTE_REASIGNACION
            && estadoAnterior != EstadoIncidente.EN_PROCESO) {
            throw new RuntimeException("No se puede reasignar un incidente en estado "
                + incidente.getEstado());
        }
        if (nuevaGuardiaId == null) {
            throw new RuntimeException("Debe seleccionar una guardia activa para reasignar el incidente");
        }

        Guardia nuevaGuardia = guardiaRepository.findByIdAndEstado(nuevaGuardiaId, GuardiaEstado.ACTIVA)
            .orElseThrow(() -> new RuntimeException("La guardia seleccionada no existe o no está activa"));

        Usuario enfermeroAnterior = incidente.getAsignadoA();
        if (enfermeroAnterior == null
                || !enfermeroAnterior.getId().equals(nuevaGuardia.getEnfermero().getId())) {
            validarEnfermeroDisponible(nuevaGuardia.getEnfermero());
        }
        if (enfermeroAnterior != null) {
            guardarHistorial(incidente, enfermeroAnterior, incidente.getMovil(),
                TipoDesasignacion.REASIGNACION_DESPACHADOR, null);
            String mensaje = estadoAnterior == EstadoIncidente.EN_PROCESO
                ? "Se te reasignó un incidente que tenías en camino. El servicio fue derivado a otro móvil."
                : "Tu incidente fue reasignado a otro móvil: " + nuevaGuardia.getMovil().getPatente();
            notificacionService.crearNotificacion(
                enfermeroAnterior, incidente, TipoNotificacion.INCIDENTE_REASIGNADO, mensaje);
        }

        incidente.setAsignadoA(nuevaGuardia.getEnfermero());
        incidente.setMovil(nuevaGuardia.getMovil());
        incidente.setEstado(EstadoIncidente.PENDIENTE);
        incidente.setFechaLlegadaLugar(null);
        incidente.setFechaAsignacion(LocalDateTime.now());

        Incidente guardado = incidenteRepository.save(incidente);
        notificacionService.crearNotificacionAsignacion(nuevaGuardia.getEnfermero(), guardado);
        return guardado;
        }

        @Transactional
        public Incidente cancelarIncidente(Long incidenteId, String motivo) {
        if (motivo == null || motivo.isBlank()) {
            throw new RuntimeException("El motivo de cancelación es obligatorio");
        }

        Incidente incidente = incidenteRepository.findById(incidenteId)
            .orElseThrow(() -> new RuntimeException("No se encontró el incidente " + incidenteId));

        if (incidente.getEstado() != EstadoIncidente.PENDIENTE
            && incidente.getEstado() != EstadoIncidente.PENDIENTE_REASIGNACION
            && incidente.getEstado() != EstadoIncidente.EN_PROCESO) {
            throw new RuntimeException("No se puede cancelar un incidente en estado "
                + incidente.getEstado());
        }

        String motivoLimpio = motivo.trim();
        Usuario enfermero = incidente.getAsignadoA();
        Movil movil = incidente.getMovil();
        if (enfermero != null) {
            guardarHistorial(incidente, enfermero, movil, TipoDesasignacion.CANCELACION, motivoLimpio);
        }

        incidente.setMotivoCancelacion(motivoLimpio);
        incidente.setEstado(EstadoIncidente.CANCELADO);
        incidente.setFechaCierre(LocalDateTime.now());
        incidente.setAsignadoA(null);
        incidente.setMovil(null);

        Incidente cancelado = incidenteRepository.save(incidente);
        if (enfermero != null) {
            notificacionService.crearNotificacion(
                enfermero, cancelado, TipoNotificacion.INCIDENTE_CANCELADO,
                "El incidente fue cancelado. Motivo: " + motivoLimpio);
        }
        return cancelado;
        }

        @Transactional(readOnly = true)
        public List<Incidente> listarPendientesReasignacion() {
        List<Incidente> pendientes = incidenteRepository
            .findByEstadoOrderByFechaAsignacionAsc(EstadoIncidente.PENDIENTE_REASIGNACION);
        pendientes.forEach(incidente -> historialRepository
            .findByIncidenteIdOrderByFechaDesc(incidente.getId())
            .stream()
            .filter(historial -> historial.getTipo() == TipoDesasignacion.RECHAZO)
            .findFirst()
            .ifPresent(historial -> incidente.setMotivoUltimoRechazo(historial.getMotivo())));
        return pendientes;
        }

        private void guardarHistorial(Incidente incidente, Usuario enfermero, Movil movil,
                      TipoDesasignacion tipo, String motivo) {
        IncidenteHistorialAsignacion historial = new IncidenteHistorialAsignacion();
        historial.setIncidente(incidente);
        historial.setEnfermero(enfermero);
        historial.setMovil(movil);
        historial.setTipo(tipo);
        historial.setMotivo(motivo);
        historialRepository.save(historial);
        }

    private void validarEnfermeroDisponible(Usuario enfermero) {
        incidenteRepository
                .findFirstByAsignadoAIdAndEstadoInOrderByFechaAsignacionDesc(
                        enfermero.getId(), ESTADOS_QUE_OCUPAN)
                .ifPresent(incidente -> {
                    String nombre = enfermero.getNombre() + " " + enfermero.getApellido();
                    throw new RuntimeException("No se puede asignar: " + nombre
                            + " ya tiene el incidente #" + incidente.getNumeroIncidente()
                            + " activo y no puede atender dos casos a la vez.");
                });
    }

    private boolean estaDisponible(Usuario enfermero) {
        return !incidenteRepository.existsByAsignadoAIdAndEstadoIn(
                enfermero.getId(), ESTADOS_QUE_OCUPAN);
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

        if (nuevoEstado == EstadoIncidente.RECHAZADO) {
            throw new RuntimeException(
                    "El rechazo debe realizarse desde el endpoint de rechazo con un motivo obligatorio");
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