package com.sigem.backend.controller;

import com.sigem.backend.dto.AsignacionEquipoDTO;
import com.sigem.backend.dto.AsignacionEquipoResponseDTO;
import com.sigem.backend.dto.ModificarAsignacionDTO;
import com.sigem.backend.dto.ModificarEstadoEquipoDTO;
import com.sigem.backend.exception.ResourceConflictException;
import com.sigem.backend.model.Insumo;
import com.sigem.backend.model.Usuario;
import com.sigem.backend.service.AsignacionEquipoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/equipos")
public class EquipoMedicoController {
    private final AsignacionEquipoService asignacionService;

    public EquipoMedicoController(AsignacionEquipoService asignacionService) {
        this.asignacionService = asignacionService;
    }

    @GetMapping("/disponibles")
    @PreAuthorize("hasAnyRole('JEF', 'COORD_ENF', 'ADM')")
    public ResponseEntity<List<Insumo>> listarDisponibles() {
        return ResponseEntity.ok(asignacionService.listarDisponibles());
    }

    @GetMapping("/asignados")
    @PreAuthorize("hasAnyRole('JEF', 'COORD_ENF', 'ADM')")
    public ResponseEntity<List<AsignacionEquipoResponseDTO>> listarAsignados() {
        return ResponseEntity.ok(asignacionService.listarAsignados());
    }

    @PostMapping("/asignar")
    @PreAuthorize("hasAnyRole('JEF', 'COORD_ENF', 'ADM')")
    public ResponseEntity<AsignacionEquipoResponseDTO> asignar(
            @Valid @RequestBody AsignacionEquipoDTO dto,
            @AuthenticationPrincipal Usuario coordinador) {
        throw new ResourceConflictException("La asignación clásica fue sustituida por /api/equipos-medicos/movimientos/asignacion");
    }

    @PutMapping("/asignacion/{id}")
    @PreAuthorize("hasAnyRole('JEF', 'COORD_ENF', 'ADM')")
    public ResponseEntity<AsignacionEquipoResponseDTO> modificarAsignacion(
            @PathVariable Long id,
            @Valid @RequestBody ModificarAsignacionDTO dto,
            @AuthenticationPrincipal Usuario coordinador) {
        throw new ResourceConflictException("Use el movimiento de reemplazo de /api/equipos-medicos");
    }

    @PutMapping("/{id}/estado")
    @PreAuthorize("hasAnyRole('JEF', 'COORD_ENF', 'ADM')")
    public ResponseEntity<Void> modificarEstado(
            @PathVariable Long id,
            @Valid @RequestBody ModificarEstadoEquipoDTO dto) {
        throw new ResourceConflictException("Los cambios de estado deben registrarse desde /api/equipos-medicos");
    }

    @PutMapping("/{id}/desasignar")
    @PreAuthorize("hasAnyRole('JEF', 'COORD_ENF', 'ADM')")
    public ResponseEntity<Void> desasignar(@PathVariable Long id) {
        throw new ResourceConflictException("Use el movimiento de retiro de /api/equipos-medicos/movimientos/retiro");
    }
}
