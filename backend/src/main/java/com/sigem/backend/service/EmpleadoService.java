package com.sigem.backend.service;

import com.sigem.backend.dto.EmpleadoDTO;
import com.sigem.backend.model.Empleado;
import com.sigem.backend.repository.EmpleadoRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class EmpleadoService {

    private final EmpleadoRepository empleadoRepository;

    public EmpleadoService(EmpleadoRepository empleadoRepository) {
        this.empleadoRepository = empleadoRepository;
    }

    public List<Empleado> listarTodos() {
        return empleadoRepository.findAll();
    }

    public Empleado buscarPorId(Long id) {
        return empleadoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));
    }

    public Empleado registrar(EmpleadoDTO dto) {
        if (empleadoRepository.existsByDni(dto.getDni()))
            throw new RuntimeException("Ya existe un empleado con ese DNI");
        if (empleadoRepository.existsByEmail(dto.getEmail()))
            throw new RuntimeException("Ya existe un empleado con ese email");

        Empleado e = new Empleado();
        e.setNombre(dto.getNombre());
        e.setApellido(dto.getApellido());
        e.setDni(dto.getDni());
        e.setEmail(dto.getEmail());
        e.setTelefono(dto.getTelefono());
        e.setRol(dto.getRol());
        e.setDisponible(dto.isDisponible());
        return empleadoRepository.save(e);
    }

    public Empleado modificar(Long id, EmpleadoDTO dto) {
        Empleado e = buscarPorId(id);
        e.setNombre(dto.getNombre());
        e.setApellido(dto.getApellido());
        e.setEmail(dto.getEmail());
        e.setTelefono(dto.getTelefono());
        e.setRol(dto.getRol());
        e.setDisponible(dto.isDisponible());
        return empleadoRepository.save(e);
    }

    public void eliminar(Long id) {
        Empleado e = buscarPorId(id);
        e.setActivo(false);
        empleadoRepository.save(e);
    }

    public long contarActivos() {
        return empleadoRepository.findAll().stream()
                .filter(Empleado::isActivo).count();
    }

    public long contarDisponibles() {
        return empleadoRepository.findAll().stream()
                .filter(e -> e.isActivo() && e.isDisponible()).count();
    }
}