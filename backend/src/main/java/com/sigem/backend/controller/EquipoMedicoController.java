package com.sigem.backend.controller;

import com.sigem.backend.dto.AsignacionEquipoDTO;
import com.sigem.backend.dto.AsignacionEquipoResponseDTO;
import com.sigem.backend.dto.ModificarAsignacionDTO;
import com.sigem.backend.dto.ModificarEstadoEquipoDTO;
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
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(asignacionService.asignar(dto, coordinador));
    }

    @PutMapping("/asignacion/{id}")
    @PreAuthorize("hasAnyRole('JEF', 'COORD_ENF', 'ADM')")
    public ResponseEntity<AsignacionEquipoResponseDTO> modificarAsignacion(
            @PathVariable Long id,
            @Valid @RequestBody ModificarAsignacionDTO dto,
            @AuthenticationPrincipal Usuario coordinador) {
        return ResponseEntity.ok(asignacionService.modificarAsignacion(id, dto, coordinador));
    }

    @PutMapping("/{id}/estado")
    @PreAuthorize("hasAnyRole('JEF', 'COORD_ENF', 'ADM')")
    public ResponseEntity<Void> modificarEstado(
            @PathVariable Long id,
            @Valid @RequestBody ModificarEstadoEquipoDTO dto) {
        asignacionService.modificarEstado(id, dto.getEstado());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/desasignar")
    @PreAuthorize("hasAnyRole('JEF', 'COORD_ENF', 'ADM')")
    public ResponseEntity<Void> desasignar(@PathVariable Long id) {
        asignacionService.desasignar(id);
        return ResponseEntity.noContent().build();
    }
}
