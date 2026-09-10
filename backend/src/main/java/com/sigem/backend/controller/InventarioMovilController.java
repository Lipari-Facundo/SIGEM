package com.sigem.backend.controller;

import com.sigem.backend.dto.ConsumoBatchDTO;
import com.sigem.backend.dto.ConsumoInsumoDTO;
import com.sigem.backend.dto.InsumoStockDTO;
import com.sigem.backend.dto.ReposicionCreateDTO;
import com.sigem.backend.dto.SolicitudReposicionDTO;
import com.sigem.backend.dto.SugerenciaReposicionDTO;
import com.sigem.backend.model.Movil;
import com.sigem.backend.model.Usuario;
import com.sigem.backend.service.InventarioMovilService;
import com.sigem.backend.service.MovilService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventario")
public class InventarioMovilController {

    private final InventarioMovilService inventarioMovilService;
    private final MovilService movilService;

    public InventarioMovilController(InventarioMovilService inventarioMovilService,
                                     MovilService movilService) {
        this.inventarioMovilService = inventarioMovilService;
        this.movilService = movilService;
    }

    @GetMapping("/mi-movil")
    @PreAuthorize("hasAnyRole('ENF', 'JEF')")
    public ResponseEntity<List<InsumoStockDTO>> inventarioDeMiMovil(
            @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(inventarioMovilService.obtenerInventarioDeMiMovil(usuario));
    }

    @GetMapping("/movil/{movilId}")
    @PreAuthorize("hasAnyRole('ADM', 'DES', 'JEF')")
    public ResponseEntity<List<InsumoStockDTO>> inventarioDeMovil(@PathVariable Long movilId) {
        return ResponseEntity.ok(inventarioMovilService.obtenerInventarioDeMovil(movilId));
    }

    @PostMapping("/movil/{movilId}/inicializar")
    @PreAuthorize("hasRole('ADM')")
    public ResponseEntity<Void> inicializar(@PathVariable Long movilId) {
        Movil movil = movilService.buscarPorId(movilId);
        inventarioMovilService.inicializarStockMovil(movil);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/consumo")
    @PreAuthorize("hasAnyRole('ENF', 'JEF')")
    public ResponseEntity<List<ConsumoInsumoDTO>> registrarConsumo(
            @AuthenticationPrincipal Usuario usuario,
            @RequestBody ConsumoBatchDTO dto) {
        return ResponseEntity.ok(inventarioMovilService.registrarConsumo(usuario, dto));
    }

    @GetMapping("/mi-movil/historial")
    @PreAuthorize("hasAnyRole('ENF', 'JEF')")
    public ResponseEntity<List<ConsumoInsumoDTO>> historialDeMiMovil(
            @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(inventarioMovilService.obtenerHistorialDeMiMovil(usuario));
    }

    @GetMapping("/movil/{movilId}/historial")
    @PreAuthorize("hasAnyRole('ADM', 'DES', 'JEF')")
    public ResponseEntity<List<ConsumoInsumoDTO>> historialDeMovil(@PathVariable Long movilId) {
        return ResponseEntity.ok(inventarioMovilService.obtenerHistorialDeMovil(movilId));
    }

    @GetMapping("/mi-movil/sugerencia-reposicion")
    @PreAuthorize("hasAnyRole('ENF', 'JEF')")
    public ResponseEntity<List<SugerenciaReposicionDTO>> sugerenciaReposicion(
            @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(inventarioMovilService.sugerirReposicionParaMiMovil(usuario));
    }

    @PostMapping("/reposicion")
    @PreAuthorize("hasAnyRole('ENF', 'JEF')")
    public ResponseEntity<SolicitudReposicionDTO> crearReposicion(
            @AuthenticationPrincipal Usuario usuario,
            @RequestBody ReposicionCreateDTO dto) {
        return ResponseEntity.ok(inventarioMovilService.crearSolicitudReposicion(usuario, dto));
    }

    @GetMapping("/reposicion/mias")
    @PreAuthorize("hasAnyRole('ENF', 'JEF')")
    public ResponseEntity<List<SolicitudReposicionDTO>> misReposiciones(
            @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(inventarioMovilService.listarMisSolicitudes(usuario));
    }

    @PutMapping("/reposicion/{id}/cancelar")
    @PreAuthorize("hasAnyRole('ENF', 'JEF')")
    public ResponseEntity<SolicitudReposicionDTO> cancelarReposicion(
            @PathVariable Long id,
            @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(inventarioMovilService.cancelarSolicitud(id, usuario));
    }

    @GetMapping("/reposicion/pendientes")
    @PreAuthorize("hasAnyRole('DES', 'ADM')")
    public ResponseEntity<List<SolicitudReposicionDTO>> reposicionesPendientes() {
        return ResponseEntity.ok(inventarioMovilService.listarSolicitudesPendientes());
    }
}