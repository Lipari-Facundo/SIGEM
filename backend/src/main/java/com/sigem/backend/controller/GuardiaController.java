package com.sigem.backend.controller;

import com.sigem.backend.dto.GuardiaDTO;
import com.sigem.backend.model.Guardia;
import com.sigem.backend.model.Usuario;
import com.sigem.backend.service.GuardiaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/guardias")
public class GuardiaController {

    private final GuardiaService guardiaService;

    public GuardiaController(GuardiaService guardiaService) {
        this.guardiaService = guardiaService;
    }

    @GetMapping("/mias")
    @PreAuthorize("hasAnyRole('ENF', 'JEF')")
    public ResponseEntity<List<Guardia>> misGuardias(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(guardiaService.listarDeUsuario(usuario));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ENF', 'JEF')")
    public ResponseEntity<Guardia> iniciarGuardia(@AuthenticationPrincipal Usuario usuario,
                                                  @RequestBody GuardiaDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(guardiaService.iniciarGuardia(usuario, dto));
    }

    @PutMapping("/{id}/finalizar")
    @PreAuthorize("hasAnyRole('ENF', 'JEF')")
    public ResponseEntity<Guardia> finalizarGuardia(@PathVariable Long id,
                                                    @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(guardiaService.finalizarGuardia(id, usuario));
    }
}
