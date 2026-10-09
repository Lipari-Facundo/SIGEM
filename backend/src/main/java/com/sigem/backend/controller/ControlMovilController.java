package com.sigem.backend.controller;

import com.sigem.backend.dto.ControlCreateDTO;
import com.sigem.backend.dto.ControlMovilDetalleDTO;
import com.sigem.backend.dto.ControlMovilResumenDTO;
import com.sigem.backend.dto.ControlPlantillaItemDTO;
import com.sigem.backend.model.Usuario;
import com.sigem.backend.service.ControlMovilService;
import com.sigem.backend.service.GuardiaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/controles")
public class ControlMovilController {

    private final ControlMovilService controlMovilService;
    private final GuardiaService guardiaService;

    public ControlMovilController(ControlMovilService controlMovilService, GuardiaService guardiaService) {
        this.controlMovilService = controlMovilService;
        this.guardiaService = guardiaService;
    }

    @GetMapping("/mi-movil/plantilla")
    @PreAuthorize("hasRole('ENF')")
    public ResponseEntity<List<ControlPlantillaItemDTO>> obtenerPlantilla(
            @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(controlMovilService.obtenerPlantilla(usuario));
    }

    @PostMapping
    @PreAuthorize("hasRole('ENF')")
    public ResponseEntity<ControlMovilDetalleDTO> crearControl(
            @AuthenticationPrincipal Usuario usuario,
            @RequestBody ControlCreateDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(controlMovilService.crearControl(usuario, dto));
    }

    @GetMapping("/mis")
    @PreAuthorize("hasRole('ENF')")
    public ResponseEntity<List<ControlMovilResumenDTO>> listarMisControles(
            @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(controlMovilService.listarMisControles(usuario));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('JEF', 'ADM', 'DIR')")
    public ResponseEntity<List<ControlMovilResumenDTO>> listarTodos(
            @AuthenticationPrincipal Usuario usuario) {
        guardiaService.exigirGuardiaCentralActiva(usuario);
        return ResponseEntity.ok(controlMovilService.listarTodos());
    }

    @GetMapping("/{id:[0-9]+}")
    @PreAuthorize("hasAnyRole('ENF', 'JEF', 'ADM', 'DIR')")
    public ResponseEntity<ControlMovilDetalleDTO> obtenerDetalle(
            @PathVariable Long id,
            @AuthenticationPrincipal Usuario usuario) {
        guardiaService.exigirGuardiaCentralActiva(usuario);
        return ResponseEntity.ok(controlMovilService.obtenerDetalle(id, usuario));
    }
}
