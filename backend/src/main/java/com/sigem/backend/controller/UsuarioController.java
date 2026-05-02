package com.sigem.backend.controller;

import com.sigem.backend.dto.UsuarioDTO;
import com.sigem.backend.model.Usuario;
import com.sigem.backend.service.UsuarioService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    // CU-A05 — Crear usuario (solo ADM)
    @PostMapping
    @PreAuthorize("hasRole('ADM')")
    public ResponseEntity<Usuario> crear(@RequestBody UsuarioDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioService.crear(dto));
    }

    // CU-A08 — Listar usuarios (solo ADM)
    @GetMapping
    @PreAuthorize("hasRole('ADM')")
    public ResponseEntity<List<Usuario>> listar() {
        return ResponseEntity.ok(usuarioService.listarTodos());
    }

    // CU-A08 — Buscar por ID (solo ADM)
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADM')")
    public ResponseEntity<Usuario> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(usuarioService.buscarPorId(id));
    }

    // CU-A06 — Modificar usuario (solo ADM)
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADM')")
    public ResponseEntity<Usuario> modificar(@PathVariable Long id, @RequestBody UsuarioDTO dto) {
        return ResponseEntity.ok(usuarioService.modificar(id, dto));
    }

    // CU-A07 — Desactivar usuario (solo ADM)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADM')")
    public ResponseEntity<Void> desactivar(@PathVariable Long id) {
        usuarioService.desactivar(id);
        return ResponseEntity.noContent().build();
    }
}