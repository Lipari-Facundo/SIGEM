package com.sigem.backend.controller;

import com.sigem.backend.dto.NotificacionDTO;
import com.sigem.backend.model.Usuario;
import com.sigem.backend.service.NotificacionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notificaciones")
public class NotificacionController {

    private final NotificacionService notificacionService;

    public NotificacionController(NotificacionService notificacionService) {
        this.notificacionService = notificacionService;
    }

    @GetMapping("/mias")
    @PreAuthorize("hasAnyRole('ENF', 'JEF')")
    public ResponseEntity<List<NotificacionDTO>> misNotificaciones(
            @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(notificacionService.listarMias(usuario));
    }

    @GetMapping("/mias/no-leidas/count")
    @PreAuthorize("hasAnyRole('ENF', 'JEF')")
    public ResponseEntity<Long> contarNoLeidas(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(notificacionService.contarNoLeidas(usuario));
    }

    @PutMapping("/{id}/leer")
    @PreAuthorize("hasAnyRole('ENF', 'JEF')")
    public ResponseEntity<NotificacionDTO> marcarComoLeida(
            @PathVariable Long id, @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(notificacionService.marcarComoLeida(id, usuario));
    }
}