package com.sigem.backend.service;

import com.sigem.backend.dto.IncidenteCreateDTO;
import com.sigem.backend.model.EstadoIncidente;
import com.sigem.backend.model.Guardia;
import com.sigem.backend.model.GuardiaEstado;
import com.sigem.backend.model.Incidente;
import com.sigem.backend.model.PrioridadIncidente;
import com.sigem.backend.model.Usuario;
import com.sigem.backend.repository.GuardiaRepository;
import com.sigem.backend.repository.IncidenteRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class IncidenteService {

    private final IncidenteRepository incidenteRepository;
    private final GuardiaRepository guardiaRepository;

    public IncidenteService(IncidenteRepository incidenteRepository, GuardiaRepository guardiaRepository) {
        this.incidenteRepository = incidenteRepository;
        this.guardiaRepository = guardiaRepository;
    }

    public List<Incidente> listarAsignados(Usuario usuario) {
        return incidenteRepository.findByAsignadoAUsernameOrderByFechaAsignacionDesc(usuario.getUsername());
    }

    public Incidente crearIncidente(IncidenteCreateDTO dto) {
        validarCreacion(dto);

        Guardia guardia = guardiaRepository.findByIdAndEstado(dto.getGuardiaId(), GuardiaEstado.ACTIVA)
                .orElseThrow(() -> new RuntimeException("Guardia activa no encontrada para el id proporcionado"));

        Incidente incidente = new Incidente();
        incidente.setTitulo(dto.getTitulo());
        incidente.setDescripcion(dto.getDescripcion());
        incidente.setUbicacion(dto.getUbicacion());
        incidente.setMotivo(dto.getMotivo());
        incidente.setPacienteNombre(dto.getPacienteNombre());
        incidente.setPacienteDni(dto.getPacienteDni());
        incidente.setPrioridad(dto.getPrioridad());
        Long maxNumero = incidenteRepository.findMaxNumeroIncidente();
        incidente.setNumeroIncidente(maxNumero == null ? 1L : maxNumero + 1);
        incidente.setAsignadoA(guardia.getEnfermero());
        incidente.setMovil(guardia.getMovil());
        incidente.setFechaAsignacion(LocalDateTime.now());
        incidente.setEstado(EstadoIncidente.PENDIENTE);

        return incidenteRepository.save(incidente);
    }

    public List<Guardia> listarGuardiasActivas() {
        return guardiaRepository.findByEstadoOrderByFechaInicioDesc(GuardiaEstado.ACTIVA);
    }

    public List<Incidente> listarTodos() {
        return incidenteRepository.findAll(Sort.by(Sort.Direction.DESC, "fechaAsignacion"));
    }

    public Incidente actualizarEstado(Long id, Usuario usuario, String estado) {
        Incidente incidente = incidenteRepository.findByIdAndAsignadoAUsername(id, usuario.getUsername())
                .orElseThrow(() -> new RuntimeException("Incidente no encontrado o no asignado al enfermero"));

        EstadoIncidente nuevoEstado;
        try {
            nuevoEstado = EstadoIncidente.valueOf(estado);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Estado de incidente inválido: " + estado);
        }

        if (incidente.getEstado() == EstadoIncidente.FINALIZADO) {
            throw new RuntimeException("El incidente ya se encuentra finalizado");
        }

        incidente.setEstado(nuevoEstado);
        if (nuevoEstado == EstadoIncidente.FINALIZADO) {
            incidente.setFechaCierre(LocalDateTime.now());
        }
        return incidenteRepository.save(incidente);
    }

    private void validarCreacion(IncidenteCreateDTO dto) {
        if (dto.getGuardiaId() == null) throw new IllegalArgumentException("Debe seleccionar una guardia activa");
        if (dto.getTitulo() == null || dto.getTitulo().isBlank()) throw new IllegalArgumentException("El título es obligatorio");
        if (dto.getUbicacion() == null || dto.getUbicacion().isBlank()) throw new IllegalArgumentException("La ubicación es obligatoria");
        if (dto.getMotivo() == null || dto.getMotivo().isBlank()) throw new IllegalArgumentException("El motivo es obligatorio");
        if (dto.getPacienteNombre() == null || dto.getPacienteNombre().isBlank()) throw new IllegalArgumentException("El nombre del paciente es obligatorio");
        if (dto.getPacienteDni() == null || dto.getPacienteDni().isBlank()) throw new IllegalArgumentException("El DNI del paciente es obligatorio");
        if (dto.getPrioridad() == null) throw new IllegalArgumentException("Debes seleccionar una prioridad");
    }
}
