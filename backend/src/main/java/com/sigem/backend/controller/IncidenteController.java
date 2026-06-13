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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    // Seguimiento total (DES)
    @GetMapping("/seguimiento")
    @PreAuthorize("hasRole('DES')")
    public ResponseEntity<List<Incidente>> seguimiento() {
        return ResponseEntity.ok(incidenteService.listarTodos());
    }

    // Crear incidente (DES)
    @PostMapping
    @PreAuthorize("hasRole('DES')")
    public ResponseEntity<Incidente> crear(@RequestBody IncidenteCreateDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(incidenteService.crearIncidente(dto));
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
}