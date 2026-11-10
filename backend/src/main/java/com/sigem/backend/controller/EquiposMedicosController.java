package com.sigem.backend.controller;

import com.sigem.backend.dto.EquipoBajaDTO;
import com.sigem.backend.dto.EquipoClasificacionDTO;
import com.sigem.backend.dto.EquipoCorreccionDTO;
import com.sigem.backend.dto.EquipoHistorialDTO;
import com.sigem.backend.dto.EquipoInsumoDTO;
import com.sigem.backend.dto.EquipoMantenimientoDTO;
import com.sigem.backend.dto.EquipoMedicoCreateDTO;
import com.sigem.backend.dto.EquipoMedicoDTO;
import com.sigem.backend.dto.EquipoMovimientoDTO;
import com.sigem.backend.dto.EquipoOperativoMovilDTO;
import com.sigem.backend.dto.EquipoReemplazoDTO;
import com.sigem.backend.dto.EquipoMovilOpcionDTO;
import com.sigem.backend.dto.EquipoResponsableDTO;
import com.sigem.backend.dto.TipoEquipoMedicoDTO;
import com.sigem.backend.dto.TipoEquipoInsumoDTO;
import com.sigem.backend.model.Usuario;
import com.sigem.backend.service.EquiposMedicosService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/equipos-medicos")
@PreAuthorize("hasAnyRole('ADM', 'JEF', 'COORD_ENF')")
public class EquiposMedicosController {
    private final EquiposMedicosService service;

    public EquiposMedicosController(EquiposMedicosService service) {
        this.service = service;
    }

    @GetMapping("/tipos")
    public List<TipoEquipoMedicoDTO> tipos(@AuthenticationPrincipal Usuario actor) {
        return service.listarTipos(actor);
    }

    @GetMapping("/insumos-reutilizables")
    public List<EquipoInsumoDTO> insumosReutilizables(@AuthenticationPrincipal Usuario actor) {
        return service.listarInsumosReutilizables(actor);
    }

    @PutMapping("/tipos/{codigo}/insumo")
    public TipoEquipoMedicoDTO asociarInsumo(
            @AuthenticationPrincipal Usuario actor,
            @PathVariable String codigo,
            @Valid @RequestBody TipoEquipoInsumoDTO dto) {
        return service.asociarInsumo(actor, codigo, dto.insumoId());
    }

    @DeleteMapping("/tipos/{codigo}/insumo")
    public TipoEquipoMedicoDTO desvincularInsumo(
            @AuthenticationPrincipal Usuario actor,
            @PathVariable String codigo) {
        return service.desvincularInsumo(actor, codigo);
    }

    @GetMapping("/moviles")
    public List<EquipoMovilOpcionDTO> moviles(@AuthenticationPrincipal Usuario actor) {
        return service.listarMoviles(actor);
    }

    @GetMapping("/responsables")
    public List<EquipoResponsableDTO> responsables(@AuthenticationPrincipal Usuario actor) {
        return service.listarResponsables(actor);
    }

    @GetMapping({"", "/inventario"})
    public List<EquipoMedicoDTO> inventario(
            @AuthenticationPrincipal Usuario actor,
            @RequestParam(required = false) String tipo,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) String ubicacion,
            @RequestParam(required = false) String mantenimiento) {
        return service.listarInventario(actor, tipo, estado, ubicacion, mantenimiento);
    }

    @GetMapping("/{id}")
    public EquipoMedicoDTO detalle(@AuthenticationPrincipal Usuario actor, @PathVariable Long id) {
        return service.obtenerEquipo(actor, id);
    }

    @PutMapping("/{id}/tipo")
    public EquipoHistorialDTO clasificarEquipo(
            @AuthenticationPrincipal Usuario actor,
            @PathVariable Long id,
            @Valid @RequestBody EquipoClasificacionDTO dto) {
        return service.clasificarEquipoExistente(actor, id, dto);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EquipoMedicoDTO alta(
            @AuthenticationPrincipal Usuario actor,
            @Valid @RequestBody EquipoMedicoCreateDTO dto) {
        return service.registrarEquipo(actor, dto);
    }

    @PostMapping("/{id}/baja")
    public EquipoMedicoDTO baja(
            @AuthenticationPrincipal Usuario actor,
            @PathVariable Long id,
            @Valid @RequestBody EquipoBajaDTO dto) {
        return service.darDeBaja(actor, id, dto.motivo(), dto.observaciones());
    }

    @GetMapping("/operativos")
    public List<EquipoOperativoMovilDTO> operativos(@AuthenticationPrincipal Usuario actor) {
        return service.listarOperativosPorMovil(actor);
    }

    @GetMapping({"/historial", "/movimientos"})
    public List<EquipoHistorialDTO> historial(
            @AuthenticationPrincipal Usuario actor,
            @RequestParam(required = false) Long equipoId) {
        return service.listarHistorial(actor, equipoId);
    }

    @PostMapping("/movimientos/asignacion")
    @ResponseStatus(HttpStatus.CREATED)
    public EquipoHistorialDTO asignar(
            @AuthenticationPrincipal Usuario actor,
            @Valid @RequestBody EquipoMovimientoDTO dto) {
        return service.asignarInicialmente(actor, dto);
    }

    @PostMapping("/movimientos/reemplazo")
    @ResponseStatus(HttpStatus.CREATED)
    public List<EquipoHistorialDTO> reemplazar(
            @AuthenticationPrincipal Usuario actor,
            @Valid @RequestBody EquipoReemplazoDTO dto) {
        return service.reemplazar(actor, dto);
    }

    @PostMapping("/movimientos/retiro")
    @ResponseStatus(HttpStatus.CREATED)
    public EquipoHistorialDTO retirar(
            @AuthenticationPrincipal Usuario actor,
            @Valid @RequestBody EquipoMovimientoDTO dto) {
        return service.retirar(actor, dto);
    }

    @PostMapping("/movimientos/envio-mantenimiento")
    @ResponseStatus(HttpStatus.CREATED)
    public EquipoHistorialDTO enviarAMantenimiento(
            @AuthenticationPrincipal Usuario actor,
            @Valid @RequestBody EquipoMovimientoDTO dto) {
        return service.enviarAMantenimiento(actor, dto);
    }

    @PostMapping("/movimientos/{id}/correcciones")
    @ResponseStatus(HttpStatus.CREATED)
    public EquipoHistorialDTO corregir(
            @AuthenticationPrincipal Usuario actor,
            @PathVariable Long id,
            @Valid @RequestBody EquipoCorreccionDTO dto) {
        return service.corregirMovimiento(actor, id, dto);
    }

    @GetMapping("/mantenimientos")
    public List<EquipoHistorialDTO> mantenimientos(
            @AuthenticationPrincipal Usuario actor,
            @RequestParam(required = false) Long equipoId) {
        return service.listarMantenimientos(actor, equipoId);
    }

    @PostMapping("/mantenimientos")
    @ResponseStatus(HttpStatus.CREATED)
    public EquipoHistorialDTO registrarMantenimientoPreventivo(
            @AuthenticationPrincipal Usuario actor,
            @Valid @RequestBody EquipoMantenimientoDTO dto) {
        return service.registrarMantenimientoPreventivo(actor, dto);
    }

    @PostMapping("/mantenimientos/recepcion-correctiva")
    @ResponseStatus(HttpStatus.CREATED)
    public EquipoHistorialDTO recibirMantenimientoCorrectivo(
            @AuthenticationPrincipal Usuario actor,
            @Valid @RequestBody EquipoMantenimientoDTO dto) {
        return service.recibirDeMantenimiento(actor, dto);
    }
}
