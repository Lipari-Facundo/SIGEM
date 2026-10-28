package com.sigem.backend.service;

import com.sigem.backend.dto.AsignacionEquipoDTO;
import com.sigem.backend.dto.AsignacionEquipoResponseDTO;
import com.sigem.backend.model.*;
import com.sigem.backend.repository.AsignacionEquipoRepository;
import com.sigem.backend.repository.EquipoMedicoRepository;
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

    public AsignacionEquipoService(EquipoMedicoRepository equipoRepository,
                                   AsignacionEquipoRepository asignacionRepository,
                                   MovilRepository movilRepository) {
        this.equipoRepository = equipoRepository;
        this.asignacionRepository = asignacionRepository;
        this.movilRepository = movilRepository;
    }

    @Transactional(readOnly = true)
    public List<EquipoMedico> listarDisponibles() {
        return equipoRepository.findByEstadoOrderByNombreAscNumeroSerieAsc(EstadoEquipoMedico.DISPONIBLE);
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
                .orElseThrow(() -> new IllegalArgumentException("Equipo médico no encontrado"));
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
}
