package com.sigem.backend.service;

import com.sigem.backend.dto.GuardiaDTO;
import com.sigem.backend.model.Guardia;
import com.sigem.backend.model.GuardiaEstado;
import com.sigem.backend.model.Movil;
import com.sigem.backend.model.Usuario;
import com.sigem.backend.repository.GuardiaRepository;
import com.sigem.backend.repository.MovilRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class GuardiaService {

    private final GuardiaRepository guardiaRepository;
    private final MovilRepository movilRepository;

    public GuardiaService(GuardiaRepository guardiaRepository, MovilRepository movilRepository) {
        this.guardiaRepository = guardiaRepository;
        this.movilRepository = movilRepository;
    }

    public List<Guardia> listarDeUsuario(Usuario usuario) {
        return guardiaRepository.findByEnfermeroUsernameOrderByFechaInicioDesc(usuario.getUsername());
    }

    public Guardia iniciarGuardia(Usuario enfermero, GuardiaDTO dto) {
        if (dto.getMovilId() == null) {
            throw new RuntimeException("Debe seleccionarse un móvil operativo");
        }
        if (isBlank(dto.getTurno())) {
            throw new RuntimeException("Debe seleccionarse un turno");
        }
        if (guardiaRepository.existsByEnfermeroUsernameAndEstado(enfermero.getUsername(), GuardiaEstado.ACTIVA)) {
            throw new RuntimeException("Ya existe una guardia activa para este enfermero");
        }

        Movil movil = movilRepository.findById(dto.getMovilId())
                .orElseThrow(() -> new RuntimeException("Móvil no encontrado con id: " + dto.getMovilId()));

        Guardia guardia = new Guardia();
        guardia.setEnfermero(enfermero);
        guardia.setMovil(movil);
        guardia.setTurno(dto.getTurno());
        guardia.setFechaInicio(LocalDateTime.now());
        guardia.setEstado(GuardiaEstado.ACTIVA);

        return guardiaRepository.save(guardia);
    }

    public Guardia finalizarGuardia(Long id, Usuario enfermero) {
        Guardia guardia = guardiaRepository.findByIdAndEnfermeroUsername(id, enfermero.getUsername())
                .orElseThrow(() -> new RuntimeException("Guardia no encontrada o no perteneciente al usuario"));
        if (guardia.getEstado() == GuardiaEstado.FINALIZADA) {
            throw new RuntimeException("La guardia ya fue finalizada");
        }
        guardia.setEstado(GuardiaEstado.FINALIZADA);
        guardia.setFechaFin(LocalDateTime.now());
        return guardiaRepository.save(guardia);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
