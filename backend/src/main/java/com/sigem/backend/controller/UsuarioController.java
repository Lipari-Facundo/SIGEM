package com.sigem.backend.controller;

import com.sigem.backend.dto.UsuarioDTO;
import com.sigem.backend.model.Rol;
import com.sigem.backend.model.Usuario;
import com.sigem.backend.service.UsuarioService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
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
    public ResponseEntity<List<Usuario>> listar(@RequestParam(value = "buscar", required = false) String buscar) {
        return ResponseEntity.ok(usuarioService.listarTodos(buscar));
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

    @GetMapping("/export")
    @PreAuthorize("hasRole('ADM')")
    public ResponseEntity<byte[]> exportar(
            @RequestParam(value = "formato", defaultValue = "pdf") String formato,
            @RequestParam(value = "rol", required = false) String rol,
            @RequestParam(value = "buscar", required = false) String buscar) {

        List<Usuario> usuarios = usuarioService.listarTodos(buscar);
        List<Usuario> usuariosExportables = usuarios.stream()
                .filter(u -> u.getRol() != null && u.getRol() != Rol.ADM)
                .filter(u -> rol == null || rol.isBlank() || "TODOS".equalsIgnoreCase(rol) || u.getRol().name().equalsIgnoreCase(rol))
                .sorted(Comparator
                        .comparingInt((Usuario u) -> obtenerOrdenRol(u.getRol()))
                        .thenComparing(u -> u.getApellido() == null ? "" : u.getApellido(), String.CASE_INSENSITIVE_ORDER))
                .toList();

        if ("csv".equalsIgnoreCase(formato)) {
            String csv = generarCsv(usuariosExportables);
            String fecha = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
            String nombreArchivo = "SIGEM_Usuarios_" + fecha + ".csv";
            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=\"" + nombreArchivo + "\"")
                    .header("Cache-Control", "no-store")
                    .contentType(MediaType.parseMediaType("text/csv;charset=UTF-8"))
                    .body(csv.getBytes(StandardCharsets.UTF_8));
        }

        return ResponseEntity.badRequest()
                .body("Formato no soportado".getBytes(StandardCharsets.UTF_8));
    }

    private int obtenerOrdenRol(Rol rol) {
        if (rol == null) return 99;
        return switch (rol) {
            case JEF -> 1;
            case DES -> 2;
            case ENF -> 3;
            case DIR -> 4;
            case ADM -> 99;
        };
    }

    private String generarCsv(List<Usuario> usuarios) {
        StringBuilder builder = new StringBuilder();
        builder.append("Apellido,Nombre,DNI,Correo electrónico,Rol,Estado\n");
        for (Usuario usuario : usuarios) {
            builder.append(escapeCsv(usuario.getApellido()))
                    .append(',')
                    .append(escapeCsv(usuario.getNombre()))
                    .append(',')
                    .append(escapeCsv(usuario.getDni()))
                    .append(',')
                    .append(escapeCsv(usuario.getEmail()))
                    .append(',')
                    .append(escapeCsv(obtenerEtiquetaRol(usuario.getRol())))
                    .append(',')
                    .append(escapeCsv(usuario.isActivo() ? "Activo" : "Inactivo"))
                    .append('\n');
        }
        return builder.toString();
    }

    private String obtenerEtiquetaRol(Rol rol) {
        if (rol == null) return "Sin rol";
        return switch (rol) {
            case JEF -> "Jefe de Enfermería";
            case DES -> "Despachador";
            case ENF -> "Enfermero";
            case DIR -> "Directivo";
            case ADM -> "Administrador";
        };
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        String escaped = value.replace("\"", "\"\"");
        return "\"" + escaped + "\"";
    }
}