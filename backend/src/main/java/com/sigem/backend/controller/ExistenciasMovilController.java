package com.sigem.backend.controller;

import com.sigem.backend.dto.ExistenciaMovilDTO;
import com.sigem.backend.service.ExistenciasMovilService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/existencias-movil")
@PreAuthorize("hasRole('JEF')")
public class ExistenciasMovilController {

    private final ExistenciasMovilService service;

    public ExistenciasMovilController(ExistenciasMovilService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<ExistenciaMovilDTO>> listar(@RequestParam(defaultValue = "false") boolean archivado) {
        return ResponseEntity.ok(service.listar(archivado));
    }

    @GetMapping("/archivadas")
    public ResponseEntity<List<ExistenciaMovilDTO>> listarArchivadas() {
        return ResponseEntity.ok(service.listar(true));
    }

    @PostMapping
    public ResponseEntity<ExistenciaMovilDTO> crear(@Valid @RequestBody ExistenciaMovilDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.crear(dto));
    }

    @PutMapping("/{insumoId}")
    public ResponseEntity<ExistenciaMovilDTO> actualizar(
            @PathVariable Long insumoId,
            @Valid @RequestBody ExistenciaMovilDTO dto) {
        return ResponseEntity.ok(service.actualizar(insumoId, dto));
    }

    @PatchMapping("/{insumoId}/toggle-archivo")
    public ResponseEntity<Map<String, Boolean>> alternarArchivo(@PathVariable Long insumoId) {
        return ResponseEntity.ok(Map.of("archivado", service.alternarArchivo(insumoId)));
    }
}
