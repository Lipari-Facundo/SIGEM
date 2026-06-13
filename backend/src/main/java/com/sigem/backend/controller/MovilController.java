package com.sigem.backend.controller;

import com.sigem.backend.dto.MovilDTO;
import com.sigem.backend.model.EstadoMovil;
import com.sigem.backend.model.Movil;
import com.sigem.backend.service.MovilService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/moviles")
public class MovilController {

    private final MovilService movilService;

    public MovilController(MovilService movilService) {
        this.movilService = movilService;
    }

    // PP1-76 — Consultar Móviles (ADM ve todos)
    @GetMapping
    @PreAuthorize("hasAnyRole('ADM', 'DES')")
    public ResponseEntity<List<Movil>> listar() {
        return ResponseEntity.ok(movilService.listarTodos());
    }

    // Para asignación de incidentes y guardia — solo operativos (Sprint 3)
    @GetMapping("/operativos")
    @PreAuthorize("hasAnyRole('ADM', 'DES', 'ENF', 'JEF')")
    public ResponseEntity<List<Movil>> listarOperativos() {
        return ResponseEntity.ok(movilService.listarOperativos());
    }

    // PP1-73 — Registrar Móvil (solo ADM)
    @PostMapping
    @PreAuthorize("hasRole('ADM')")
    public ResponseEntity<Movil> registrar(@RequestBody MovilDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(movilService.registrar(dto));
    }

    // PP1-74 — Modificar Móvil (solo ADM)
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADM')")
    public ResponseEntity<Movil> modificar(@PathVariable Long id, @RequestBody MovilDTO dto) {
        return ResponseEntity.ok(movilService.modificar(id, dto));
    }

    // PP1-41 — Cambiar estado (ADM y DES/UGL)
    @PutMapping("/{id}/estado")
    @PreAuthorize("hasAnyRole('ADM', 'DES')")
    public ResponseEntity<Movil> cambiarEstado(@PathVariable Long id,
                                               @RequestBody MovilDTO dto) {
        return ResponseEntity.ok(movilService.cambiarEstado(id, dto.getEstadoMovil()));
    }

    // PP1-75 — Eliminar Móvil (solo ADM)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADM')")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        movilService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}