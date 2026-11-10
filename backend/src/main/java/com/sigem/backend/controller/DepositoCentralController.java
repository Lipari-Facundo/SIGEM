package com.sigem.backend.controller;

import com.sigem.backend.dto.CantidadMinimaDepositoDTO;
import com.sigem.backend.dto.InsumoStockDTO;
import com.sigem.backend.dto.MovimientoDepositoCreateDTO;
import com.sigem.backend.dto.MovimientoDepositoDTO;
import com.sigem.backend.dto.StockDepositoCreateDTO;
import com.sigem.backend.dto.StockDepositoDTO;
import com.sigem.backend.model.Usuario;
import com.sigem.backend.service.DepositoCentralService;
import com.sigem.backend.service.GuardiaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/deposito-central")
@PreAuthorize("hasAnyRole('JEF', 'ADM')")
public class DepositoCentralController {

    private final DepositoCentralService depositoCentralService;
    private final GuardiaService guardiaService;

    public DepositoCentralController(DepositoCentralService depositoCentralService,
                                     GuardiaService guardiaService) {
        this.depositoCentralService = depositoCentralService;
        this.guardiaService = guardiaService;
    }

    @GetMapping("/stock")
    public ResponseEntity<List<StockDepositoDTO>> listarStock(
            @RequestParam(defaultValue = "true") boolean activo,
            @AuthenticationPrincipal Usuario usuario) {
        guardiaService.exigirGuardiaCentralActiva(usuario);
        return ResponseEntity.ok(depositoCentralService.listarStock(activo));
    }

    @GetMapping("/catalogo")
    public ResponseEntity<List<InsumoStockDTO>> listarCatalogo(@AuthenticationPrincipal Usuario usuario) {
        guardiaService.exigirGuardiaCentralActiva(usuario);
        return ResponseEntity.ok(depositoCentralService.listarCatalogo());
    }

    @PostMapping("/stock")
    public ResponseEntity<StockDepositoDTO> agregarInsumo(
            @Valid @RequestBody StockDepositoCreateDTO dto,
            @AuthenticationPrincipal Usuario usuario) {
        guardiaService.exigirGuardiaCentralActiva(usuario);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(depositoCentralService.agregarInsumo(dto, usuario));
    }

    @PutMapping("/stock/{stockId}/minimo")
    public ResponseEntity<StockDepositoDTO> actualizarMinimo(
            @PathVariable Long stockId,
            @Valid @RequestBody CantidadMinimaDepositoDTO dto,
            @AuthenticationPrincipal Usuario usuario) {
        guardiaService.exigirGuardiaCentralActiva(usuario);
        return ResponseEntity.ok(depositoCentralService.actualizarMinimo(stockId, dto, usuario));
    }

    @PostMapping("/movimientos")
    public ResponseEntity<StockDepositoDTO> registrarMovimiento(
            @Valid @RequestBody MovimientoDepositoCreateDTO dto,
            @AuthenticationPrincipal Usuario usuario) {
        guardiaService.exigirGuardiaCentralActiva(usuario);
        return ResponseEntity.ok(depositoCentralService.registrarMovimiento(dto, usuario));
    }

    @GetMapping("/movimientos")
    public ResponseEntity<List<MovimientoDepositoDTO>> listarMovimientos(
            @AuthenticationPrincipal Usuario usuario) {
        guardiaService.exigirGuardiaCentralActiva(usuario);
        return ResponseEntity.ok(depositoCentralService.listarMovimientos());
    }
}