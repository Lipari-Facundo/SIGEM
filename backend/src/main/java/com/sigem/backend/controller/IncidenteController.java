package com.sigem.backend.controller;

import com.sigem.backend.dto.IncidenteCreateDTO;
import com.sigem.backend.dto.IncidenteEstadoDTO;
import com.sigem.backend.model.Guardia;
import com.sigem.backend.model.Incidente;
import com.sigem.backend.model.Usuario;
import com.sigem.backend.service.IncidenteService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/incidentes")
public class IncidenteController {

    private final IncidenteService incidenteService;

    public IncidenteController(IncidenteService incidenteService) {
        this.incidenteService = incidenteService;
    }

    // Incidentes asignados al enfermero logueado
    @GetMapping("/asignados")
    @PreAuthorize("hasAnyRole('ENF', 'JEF')")
    public ResponseEntity<List<Incidente>> asignados(
            @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(incidenteService.listarAsignados(usuario));
    }

    // Guardias activas para el despachador
    @GetMapping("/guardias-disponibles")
    @PreAuthorize("hasRole('DES')")
    public ResponseEntity<List<Guardia>> guardiasDisponibles() {
        return ResponseEntity.ok(incidenteService.listarGuardiasActivas());
    }

    // Seguimiento total (DES) filtrado por incidentes relacionados al despachador
    @GetMapping("/seguimiento")
    @PreAuthorize("hasRole('DES')")
    public ResponseEntity<List<Incidente>> seguimiento() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Object principal = authentication != null ? authentication.getPrincipal() : null;
        if (!(principal instanceof Usuario usuario)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(incidenteService.listarPorUsuarioRelacionado(usuario.getId()));
    }

    // Crear incidente (DES)
    @PostMapping
    @PreAuthorize("hasRole('DES')")
    public ResponseEntity<Incidente> crear(
            @RequestBody IncidenteCreateDTO dto,
            @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(incidenteService.crearIncidente(dto, usuario));
    }

    // Incidentes globales para Directivo/Gerencia/Administrador
    @GetMapping
    @PreAuthorize("hasAnyRole('DIR','ADM')")
    public ResponseEntity<List<Incidente>> listarTodos() {
        return ResponseEntity.ok(incidenteService.listarTodos());
    }

    @GetMapping("/metricas-ugl")
    @PreAuthorize("hasAnyRole('DIR','ADM')")
    public ResponseEntity<Map<String, Object>> metricasUGL() {
        return ResponseEntity.ok(incidenteService.getGlobalMetrics());
    }

    // Cambiar estado: aceptar (EN_PROCESO), rechazar (RECHAZADO), finalizar (FINALIZADO)
    @PutMapping("/{id}/estado")
    @PreAuthorize("hasAnyRole('ENF', 'JEF')")
    public ResponseEntity<Incidente> cambiarEstado(
            @PathVariable Long id,
            @AuthenticationPrincipal Usuario usuario,
            @RequestBody IncidenteEstadoDTO dto) {
        return ResponseEntity.ok(
                incidenteService.actualizarEstado(id, usuario, dto.getEstado()));
    }

    // Atenciones del día — tabla resumen del enfermero logueado
    @GetMapping("/atenciones-hoy")
    @PreAuthorize("hasAnyRole('ENF', 'JEF')")
    public ResponseEntity<List<Incidente>> atencionesDel(
            @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(incidenteService.atencionesDel(usuario));
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('ADM','DIR')")
    public ResponseEntity<Map<String, Object>> dashboard(
            @RequestParam(value = "startDate", required = false)
            @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE)
                    java.time.LocalDate startDate,
            @RequestParam(value = "endDate", required = false)
            @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE)
                    java.time.LocalDate endDate
    ) {
        java.time.LocalDateTime start = startDate != null ? startDate.atStartOfDay() : null;
        java.time.LocalDateTime end   = endDate != null ? endDate.atTime(java.time.LocalTime.MAX) : null;
        return ResponseEntity.ok(incidenteService.getDashboardData(start, end));
    }
}