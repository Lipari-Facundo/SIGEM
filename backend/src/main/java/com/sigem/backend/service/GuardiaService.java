package com.sigem.backend.service;

import com.sigem.backend.dto.GuardiaDTO;
import com.sigem.backend.model.Guardia;
import com.sigem.backend.model.GuardiaEstado;
import com.sigem.backend.model.Movil;
import com.sigem.backend.model.Rol;
import com.sigem.backend.model.TipoGuardia;
import com.sigem.backend.model.Usuario;
import com.sigem.backend.repository.ControlMovilRepository;
import com.sigem.backend.repository.GuardiaRepository;
import com.sigem.backend.repository.MovilRepository;
import com.sigem.backend.repository.StockEstandarMovilRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class GuardiaService {

    private final GuardiaRepository guardiaRepository;
    private final MovilRepository movilRepository;
    private final StockEstandarMovilRepository stockEstandarMovilRepository;
    private final ControlMovilRepository controlMovilRepository;

    public GuardiaService(GuardiaRepository guardiaRepository,
                          MovilRepository movilRepository,
                          StockEstandarMovilRepository stockEstandarMovilRepository,
                          ControlMovilRepository controlMovilRepository) {
        this.guardiaRepository = guardiaRepository;
        this.movilRepository = movilRepository;
        this.stockEstandarMovilRepository = stockEstandarMovilRepository;
        this.controlMovilRepository = controlMovilRepository;
    }

    public List<Guardia> listarDeUsuario(Usuario usuario) {
        return guardiaRepository.findByEnfermeroUsernameOrderByFechaInicioDesc(usuario.getUsername());
    }

    public void exigirGuardiaCentralActiva(Usuario coordinador) {
        if (coordinador.getRol() != Rol.JEF) return;
        guardiaRepository.findByEnfermeroUsernameAndEstadoAndTipoGuardia(
                        coordinador.getUsername(), GuardiaEstado.ACTIVA, TipoGuardia.CENTRAL)
                .orElseThrow(() -> new RuntimeException(
                        "Iniciá tu guardia en la central de operaciones para acceder a esta sección"));
    }

    public Guardia iniciarGuardia(Usuario enfermero, GuardiaDTO dto) {
        if (isBlank(dto.getTurno())) {
            throw new RuntimeException("Debe seleccionarse un turno");
        }
        if (guardiaRepository.existsByEnfermeroUsernameAndEstado(enfermero.getUsername(), GuardiaEstado.ACTIVA)) {
            throw new RuntimeException("Ya existe una guardia activa para este enfermero");
        }

        boolean coordinador = enfermero.getRol() == Rol.JEF;
        Movil movil = null;
        if (coordinador) {
            if (dto.getMovilId() != null) {
                throw new RuntimeException("La guardia del coordinador se inicia en la central, sin asignar un móvil");
            }
        } else {
            if (dto.getMovilId() == null) {
                throw new RuntimeException("Debe seleccionarse un móvil operativo");
            }
            movil = movilRepository.findById(dto.getMovilId())
                    .orElseThrow(() -> new RuntimeException("Móvil no encontrado con id: " + dto.getMovilId()));
            boolean tienePlantilla = stockEstandarMovilRepository.findByTipoMovil(movil.getTipoMovil()).stream()
                    .anyMatch(stock -> stock.getInsumo() != null && stock.getInsumo().isActivo());
            if (!tienePlantilla) {
                throw new RuntimeException(
                        "No hay una plantilla de control activa para este móvil. Contactá a Administración antes de iniciar la guardia.");
            }
        }

        Guardia guardia = new Guardia();
        guardia.setEnfermero(enfermero);
        guardia.setMovil(movil);
        guardia.setTipoGuardia(coordinador ? TipoGuardia.CENTRAL : TipoGuardia.MOVIL);
        guardia.setTurno(dto.getTurno());
        guardia.setFechaInicio(LocalDateTime.now());
        guardia.setEstado(GuardiaEstado.ACTIVA);

        return guardiaRepository.save(guardia);
    }

    @Transactional
    public Guardia finalizarGuardia(Long id, Usuario enfermero) {
        Guardia guardia = guardiaRepository.findByIdAndEnfermeroUsername(id, enfermero.getUsername())
                .orElseThrow(() -> new RuntimeException("Guardia no encontrada o no perteneciente al usuario"));
        if (guardia.getEstado() == GuardiaEstado.FINALIZADA) {
            throw new RuntimeException("La guardia ya fue finalizada");
        }
        if (guardia.getTipoGuardia() == TipoGuardia.MOVIL) {
            movilRepository.findByIdForUpdate(guardia.getMovil().getId())
                    .orElseThrow(() -> new RuntimeException("No existe el móvil de la guardia"));
            if (!controlMovilRepository.existsByGuardiaId(guardia.getId())) {
                throw new RuntimeException(
                        "Antes de finalizar la guardia, completá el control inicial del móvil.");
            }
        }
        guardia.setEstado(GuardiaEstado.FINALIZADA);
        guardia.setFechaFin(LocalDateTime.now());
        return guardiaRepository.save(guardia);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
