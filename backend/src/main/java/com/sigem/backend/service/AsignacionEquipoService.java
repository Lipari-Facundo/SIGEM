package com.sigem.backend.service;

import com.sigem.backend.dto.AsignacionEquipoDTO;
import com.sigem.backend.dto.AsignacionEquipoResponseDTO;
import com.sigem.backend.dto.ModificarAsignacionDTO;
import com.sigem.backend.model.*;
import com.sigem.backend.repository.AsignacionEquipoRepository;
import com.sigem.backend.repository.EquipoMedicoRepository;
import com.sigem.backend.repository.InsumoRepository;
import com.sigem.backend.repository.MovilRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AsignacionEquipoService {
    private final EquipoMedicoRepository equipoRepository;
    private final AsignacionEquipoRepository asignacionRepository;
    private final MovilRepository movilRepository;
    private final InsumoRepository insumoRepository;

    public AsignacionEquipoService(EquipoMedicoRepository equipoRepository,
                                   AsignacionEquipoRepository asignacionRepository,
                                   MovilRepository movilRepository,
                                   InsumoRepository insumoRepository) {
        this.equipoRepository = equipoRepository;
        this.asignacionRepository = asignacionRepository;
        this.movilRepository = movilRepository;
        this.insumoRepository = insumoRepository;
    }

    @Transactional(readOnly = true)
    public List<Insumo> listarDisponibles() {
        return insumoRepository.findByCategoriaAndTipoAndActivoTrueOrderByNombreAsc(
                CategoriaInsumo.EQUIPO_MEDICO,
                TipoInsumo.REUTILIZABLE);
    }

    @Transactional(readOnly = true)
    public List<AsignacionEquipoResponseDTO> listarAsignados() {
        return asignacionRepository.findByActivoTrueOrderByFechaAsignacionDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void desasignar(Long equipoId) {
        EquipoMedico equipo = equipoRepository.findByIdForUpdate(equipoId)
                .orElseThrow(() -> new IllegalArgumentException("Equipo médico no encontrado"));

        AsignacionEquipo asignacion = asignacionRepository.findByEquipoIdAndActivoTrue(equipoId)
                .orElseThrow(() -> new IllegalArgumentException("El equipo no tiene una asignación activa"));

        asignacion.setActivo(false);
        asignacion.setFechaDesasignacion(LocalDateTime.now());
        asignacionRepository.save(asignacion);

        equipo.setEstado(EstadoEquipoMedico.DISPONIBLE);
        equipoRepository.save(equipo);
    }

    private AsignacionEquipoResponseDTO toResponse(AsignacionEquipo asignacion) {
        EquipoMedico equipo = asignacion.getEquipo();
        Movil movil = asignacion.getMovil();
        AsignacionEquipoResponseDTO response = new AsignacionEquipoResponseDTO();
        response.setAsignacionId(asignacion.getId());
        response.setEquipoId(equipo.getId());
        response.setEquipoNombre(equipo.getNombre());
        response.setEquipoNumeroSerie(equipo.getNumeroSerie());
        response.setMovilId(movil.getId());
        response.setMovilNumeroInterno(movil.getNumeroInterno());
        response.setEstadoEquipo(equipo.getEstado());
        response.setFechaAsignacion(asignacion.getFechaAsignacion());
        response.setCoordinadorId(asignacion.getCoordinador().getId());
        response.setCoordinadorUsername(asignacion.getCoordinador().getUsername());
        return response;
    }

    @Transactional
    public AsignacionEquipoResponseDTO asignar(AsignacionEquipoDTO dto, Usuario coordinador) {
        if (dto == null || dto.getEquipoId() == null || dto.getMovilId() == null) {
            throw new IllegalArgumentException("Equipo y móvil son obligatorios");
        }

        EquipoMedico equipo = equipoRepository.findByIdForUpdate(dto.getEquipoId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Equipo médico registrado no encontrado; el catálogo de insumos no identifica equipos físicos"));
        if (equipo.getEstado() != EstadoEquipoMedico.DISPONIBLE) {
            throw new IllegalArgumentException("El equipo ya no está disponible para asignación");
        }

        Movil movil = movilRepository.findById(dto.getMovilId())
                .orElseThrow(() -> new IllegalArgumentException("Móvil no encontrado"));
        if (movil.getEstadoMovil() != EstadoMovil.OPERATIVO) {
            throw new IllegalArgumentException("El móvil destino debe estar operativo");
        }

        LocalDateTime ahora = LocalDateTime.now();
        equipo.setEstado(EstadoEquipoMedico.EN_USO);
        equipoRepository.save(equipo);

        AsignacionEquipo asignacion = new AsignacionEquipo();
        asignacion.setEquipo(equipo);
        asignacion.setMovil(movil);
        asignacion.setCoordinador(coordinador);
        asignacion.setFechaAsignacion(ahora);
        asignacion = asignacionRepository.save(asignacion);

        AsignacionEquipoResponseDTO response = new AsignacionEquipoResponseDTO();
        response.setAsignacionId(asignacion.getId());
        response.setEquipoId(equipo.getId());
        response.setEquipoNombre(equipo.getNombre());
        response.setEquipoNumeroSerie(equipo.getNumeroSerie());
        response.setMovilId(movil.getId());
        response.setMovilNumeroInterno(movil.getNumeroInterno());
        response.setEstadoEquipo(equipo.getEstado());
        response.setFechaAsignacion(ahora);
        response.setCoordinadorId(coordinador.getId());
        response.setCoordinadorUsername(coordinador.getUsername());
        return response;
    }

    @Transactional
    public AsignacionEquipoResponseDTO modificarAsignacion(
            Long asignacionId,
            ModificarAsignacionDTO dto,
            Usuario coordinador) {
        AsignacionEquipo asignacion = asignacionRepository.findById(asignacionId)
                .filter(AsignacionEquipo::isActivo)
                .orElseThrow(() -> new IllegalArgumentException("Asignación activa no encontrada"));

        EquipoMedico equipoAnterior = asignacion.getEquipo();
        EquipoMedico equipoNuevo = equipoAnterior;

        if (!dto.getEquipoId().equals(equipoAnterior.getId())) {
            EquipoMedico equipoSeleccionado = equipoRepository.findByIdForUpdate(dto.getEquipoId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Equipo médico registrado no encontrado; el catálogo de insumos no identifica equipos físicos"));

            if (equipoSeleccionado.getId().equals(equipoAnterior.getId())) {
                equipoNuevo = equipoAnterior;
            } else {
                if (equipoSeleccionado.getEstado() != EstadoEquipoMedico.DISPONIBLE) {
                    throw new IllegalArgumentException("El equipo seleccionado ya no está disponible");
                }
                equipoNuevo = equipoSeleccionado;
            }
        }

        if (!equipoNuevo.getId().equals(equipoAnterior.getId())) {
            equipoAnterior.setEstado(EstadoEquipoMedico.DISPONIBLE);
            equipoRepository.save(equipoAnterior);
            equipoNuevo.setEstado(EstadoEquipoMedico.EN_USO);
            equipoRepository.save(equipoNuevo);
        }

        Movil movil = movilRepository.findById(dto.getMovilId())
                .orElseThrow(() -> new IllegalArgumentException("Móvil no encontrado"));
        if (movil.getEstadoMovil() != EstadoMovil.OPERATIVO) {
            throw new IllegalArgumentException("El móvil destino debe estar operativo");
        }

        asignacion.setEquipo(equipoNuevo);
        asignacion.setMovil(movil);
        asignacion.setCoordinador(coordinador);
        asignacion = asignacionRepository.save(asignacion);
        return toResponse(asignacion);
    }

    private EquipoMedico resolverEquipoDisponible(Long equipoId) {
        EquipoMedico equipo = equipoRepository.findByIdForUpdate(equipoId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Equipo médico registrado no encontrado; el catálogo de insumos no identifica equipos físicos"));

        if (equipo.getEstado() != EstadoEquipoMedico.DISPONIBLE) {
            throw new IllegalArgumentException("El equipo seleccionado ya no está disponible");
        }
        return equipo;
    }

    @Transactional
    public void modificarEstado(Long equipoId, String estado) {
        EquipoMedico equipo = equipoRepository.findByIdForUpdate(equipoId)
                .orElseThrow(() -> new IllegalArgumentException("Equipo médico no encontrado"));

        EstadoEquipoMedico estadoPersistido = switch (estado.trim().toUpperCase()) {
            case "FUNCIONANDO" -> EstadoEquipoMedico.DISPONIBLE;
            case "ASIGNADO" -> EstadoEquipoMedico.EN_USO;
            case "AVERIADO" -> EstadoEquipoMedico.FUERA_DE_SERVICIO;
            case "EN MANTENIMIENTO" -> EstadoEquipoMedico.MANTENIMIENTO;
            default -> throw new IllegalArgumentException("Estado de equipo no válido");
        };

        boolean estaAsignado = asignacionRepository
                .findByEquipoIdAndActivoTrue(equipo.getId())
                .isPresent();
        if (estaAsignado
                && (estadoPersistido == EstadoEquipoMedico.DISPONIBLE
                || estadoPersistido == EstadoEquipoMedico.MANTENIMIENTO)) {
            throw new IllegalArgumentException(
                    "Un equipo asignado no puede cambiarse a FUNCIONANDO ni EN MANTENIMIENTO");
        }

        equipo.setEstado(estadoPersistido);
        equipoRepository.save(equipo);
    }
}
