package com.sigem.backend.controller;

import com.sigem.backend.dto.UsuarioDTO;
import com.sigem.backend.model.Usuario;
import com.sigem.backend.service.UsuarioService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    // ─── Perfil propio (cualquier usuario autenticado) ───────

    @GetMapping("/me")
    public ResponseEntity<Usuario> miPerfil(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(usuarioService.buscarPorId(usuario.getId()));
    }

    @PutMapping("/me")
    public ResponseEntity<Usuario> actualizarMiPerfil(
            @AuthenticationPrincipal Usuario usuario,
            @RequestBody UsuarioDTO dto) {
        return ResponseEntity.ok(usuarioService.modificarPerfil(usuario.getId(), dto));
    }

    // ─── ABM de usuarios (solo ADM) ──────────────────────────

    @PostMapping
    @PreAuthorize("hasRole('ADM')")
    public ResponseEntity<Usuario> crear(@RequestBody UsuarioDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioService.crear(dto));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADM')")
    public ResponseEntity<List<Usuario>> listar() {
        return ResponseEntity.ok(usuarioService.listarTodos());
    }

    @GetMapping("/{id:[0-9]+}") 
    @PreAuthorize("hasRole('ADM')")
    public ResponseEntity<Usuario> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(usuarioService.buscarPorId(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADM')")
    public ResponseEntity<Usuario> modificar(@PathVariable Long id, @RequestBody UsuarioDTO dto) {
        return ResponseEntity.ok(usuarioService.modificar(id, dto));
    }

    @PutMapping("/{id}/estado")
    @PreAuthorize("hasRole('ADM')")
    public ResponseEntity<Usuario> cambiarEstado(@PathVariable Long id, @RequestBody UsuarioDTO dto) {
        return ResponseEntity.ok(usuarioService.cambiarEstado(id, dto.isActivo()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADM')")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        usuarioService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}