package com.sigem.backend.service;

import com.sigem.backend.dto.EquipoOperativoMovilDTO;
import com.sigem.backend.exception.ResourceConflictException;
import com.sigem.backend.model.AsignacionEquipo;
import com.sigem.backend.model.EquipoMedico;
import com.sigem.backend.model.EstadoEquipoMedico;
import com.sigem.backend.model.Movil;
import com.sigem.backend.model.TipoEquipoMedico;
import com.sigem.backend.repository.AsignacionEquipoRepository;
import com.sigem.backend.repository.TipoEquipoMedicoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class EquiposOperativosMovilService {
    private static final Set<String> TIPOS_ADMITIDOS =
            Set.of("CARDIODESFIBRILADOR", "ELECTROCARDIOGRAFO", "RESPIRADOR");

    private final AsignacionEquipoRepository asignacionRepository;
    private final TipoEquipoMedicoRepository tipoRepository;

    public EquiposOperativosMovilService(AsignacionEquipoRepository asignacionRepository,
                                         TipoEquipoMedicoRepository tipoRepository) {
        this.asignacionRepository = asignacionRepository;
        this.tipoRepository = tipoRepository;
    }

    @Transactional(readOnly = true)
    public EquipoOperativoMovilDTO obtenerParaMovil(Movil movil) {
        List<TipoEquipoMedico> tipos = tipoRepository.findAllByOrderByNombreAsc().stream()
                .filter(tipo -> TIPOS_ADMITIDOS.contains(tipo.getCodigo()))
                .toList();
        List<AsignacionEquipo> asignacionesActivas =
                asignacionRepository.findByMovilIdAndActivoTrue(movil.getId());

        if (asignacionesActivas.stream().anyMatch(asignacion ->
                asignacion.getTipoEquipo() == null && codigoTipo(asignacion.getEquipo()) == null)) {
            throw new ResourceConflictException(
                    "El móvil " + movil.getNumeroInterno()
                            + " tiene una asignación activa sin tipo; requiere clasificación verificada");
        }

        Map<String, List<AsignacionEquipo>> porTipo = asignacionesActivas.stream()
                .collect(Collectors.groupingBy(asignacion -> asignacion.getTipoEquipo() == null
                        ? codigoTipo(asignacion.getEquipo()) : asignacion.getTipoEquipo().getCodigo()));
        List<EquipoOperativoMovilDTO.EquipoOperativoItemDTO> equipos = tipos.stream()
                .map(tipo -> {
                    List<AsignacionEquipo> asignaciones = porTipo.getOrDefault(tipo.getCodigo(), List.of());
                    if (asignaciones.size() > 1) {
                        throw new ResourceConflictException(
                                "El móvil " + movil.getNumeroInterno()
                                        + " tiene varias asignaciones activas de tipo " + tipo.getCodigo());
                    }
                    AsignacionEquipo asignacion = asignaciones.isEmpty() ? null : asignaciones.get(0);
                    EquipoMedico equipo = asignacion == null ? null : asignacion.getEquipo();
                    boolean disponible = equipo != null
                            && (equipo.getEstado() == EstadoEquipoMedico.OPERATIVO
                                || equipo.getEstado() == EstadoEquipoMedico.EN_USO);
                    return new EquipoOperativoMovilDTO.EquipoOperativoItemDTO(
                            tipo.getCodigo(), tipo.getNombre(),
                            disponible ? equipo.getId() : null,
                            disponible ? equipo.getNumeroSerie() : null,
                            disponible ? equipo.getEstado().name() : null,
                            !disponible);
                })
                .toList();

        return new EquipoOperativoMovilDTO(movil.getId(),
                movil.getNumeroInterno() + " · " + movil.getPatente(), equipos);
    }

    private String codigoTipo(EquipoMedico equipo) {
        return equipo == null || equipo.getTipoEquipo() == null
                ? null : equipo.getTipoEquipo().getCodigo();
    }
}
