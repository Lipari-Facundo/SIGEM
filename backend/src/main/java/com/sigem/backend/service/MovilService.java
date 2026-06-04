package com.sigem.backend.service;

import com.sigem.backend.dto.MovilDTO;
import com.sigem.backend.model.EstadoMovil;
import com.sigem.backend.model.Movil;
import com.sigem.backend.repository.MovilRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MovilService {

    private final MovilRepository movilRepository;

    public MovilService(MovilRepository movilRepository) {
        this.movilRepository = movilRepository;
    }

    // ─── Listar todos ─────────────────────────────────────────

    public List<Movil> listarTodos() {
        return movilRepository.findAll();
    }

    // ─── Solo operativos (para asignación de incidentes) ──────

    public List<Movil> listarOperativos() {
        return movilRepository.findByEstadoMovil(EstadoMovil.OPERATIVO);
    }

    // ─── Buscar por ID ────────────────────────────────────────

    public Movil buscarPorId(Long id) {
        return movilRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Móvil no encontrado con id: " + id));
    }

    // ─── Registrar ────────────────────────────────────────────

    public Movil registrar(MovilDTO dto) {
        validarCamposObligatorios(dto);

        if (movilRepository.existsByPatente(dto.getPatente())) {
            throw new RuntimeException("Ya existe un móvil con la patente: " + dto.getPatente());
        }
        if (movilRepository.existsByNumeroInterno(dto.getNumeroInterno())) {
            throw new RuntimeException("Ya existe un móvil con el número interno: " + dto.getNumeroInterno());
        }

        Movil m = new Movil();
        mapearDesdeDTO(m, dto);
        return movilRepository.save(m);
    }

    // ─── Modificar ────────────────────────────────────────────

    public Movil modificar(Long id, MovilDTO dto) {
        validarCamposObligatorios(dto);

        Movil m = buscarPorId(id);

        // Valida unicidad excluyendo el registro actual
        if (movilRepository.existsByPatenteAndIdNot(dto.getPatente(), id)) {
            throw new RuntimeException("Ya existe otro móvil con la patente: " + dto.getPatente());
        }
        if (movilRepository.existsByNumeroInternoAndIdNot(dto.getNumeroInterno(), id)) {
            throw new RuntimeException("Ya existe otro móvil con el número interno: " + dto.getNumeroInterno());
        }

        mapearDesdeDTO(m, dto);
        return movilRepository.save(m);
    }

    // ─── Cambiar estado (usado por UGL en Sprint 3) ───────────

    public Movil cambiarEstado(Long id, EstadoMovil nuevoEstado) {
        Movil m = buscarPorId(id);
        m.setEstadoMovil(nuevoEstado);
        return movilRepository.save(m);
    }

    // ─── Eliminar ─────────────────────────────────────────────

    public void eliminar(Long id) {
        Movil m = buscarPorId(id);
        movilRepository.delete(m);
    }

    // ─── Helpers privados ─────────────────────────────────────

    private void validarCamposObligatorios(MovilDTO dto) {
        if (dto.getTipoMovil() == null)      throw new RuntimeException("El tipo de móvil es obligatorio");
        if (isBlank(dto.getMarca()))          throw new RuntimeException("La marca es obligatoria");
        if (isBlank(dto.getModelo()))         throw new RuntimeException("El modelo es obligatorio");
        if (isBlank(dto.getPatente()))        throw new RuntimeException("La patente es obligatoria");
        if (dto.getAnio() == null)            throw new RuntimeException("El año es obligatorio");
        if (isBlank(dto.getNumeroInterno()))  throw new RuntimeException("El número interno es obligatorio");
        if (dto.getFechaRegistro() == null)   throw new RuntimeException("La fecha de registro es obligatoria");
        if (isBlank(dto.getBaseOperativa()))  throw new RuntimeException("La base operativa es obligatoria");
    }

    private void mapearDesdeDTO(Movil m, MovilDTO dto) {
        m.setTipo(dto.getTipoMovil() != null ? dto.getTipoMovil().name() : null);
        m.setTipoMovil(dto.getTipoMovil());
        m.setMarca(dto.getMarca());
        m.setModelo(dto.getModelo());
        m.setPatente(dto.getPatente().toUpperCase().trim());
        m.setAnio(dto.getAnio());
        m.setNumeroInterno(dto.getNumeroInterno().toUpperCase().trim());
        m.setFechaRegistro(dto.getFechaRegistro());
        m.setBaseOperativa(dto.getBaseOperativa());
        m.setKilometraje(dto.getKilometrajeActual());
        m.setKilometrajeActual(dto.getKilometrajeActual());
        m.setCapacidadPacientes(dto.getCapacidadPacientes());
        m.setObservaciones(dto.getObservaciones());
        EstadoMovil estadoValor = dto.getEstadoMovil() != null
                ? dto.getEstadoMovil()
                : (m.getEstado() != null ? m.getEstado() : (m.getEstadoMovil() != null ? m.getEstadoMovil() : EstadoMovil.OPERATIVO));
        m.setEstado(estadoValor);
        m.setEstadoMovil(estadoValor);
    }

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}