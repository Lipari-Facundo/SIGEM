package com.sigem.backend.controller;

import com.sigem.backend.model.Usuario;
import com.sigem.backend.service.DepositoCentralService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/insumos")
@PreAuthorize("hasAnyRole('ADM', 'JEF')")
public class InsumoController {

    private final DepositoCentralService depositoCentralService;

    public InsumoController(DepositoCentralService depositoCentralService) {
        this.depositoCentralService = depositoCentralService;
    }

    @PutMapping("/{id}/archivar")
    public ResponseEntity<Void> archivar(
            @PathVariable Long id,
            @AuthenticationPrincipal Usuario usuario) {
        depositoCentralService.archivarInsumo(id, usuario);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/desarchivar")
    public ResponseEntity<Void> desarchivar(
            @PathVariable Long id,
            @AuthenticationPrincipal Usuario usuario) {
        depositoCentralService.desarchivarInsumo(id, usuario);
        return ResponseEntity.noContent().build();
    }
}
