package com.sigem.backend.repository;

import com.sigem.backend.model.AsignacionEquipo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AsignacionEquipoRepository extends JpaRepository<AsignacionEquipo, Long> {
    List<AsignacionEquipo> findByActivoTrueOrderByFechaAsignacionDesc();
    Optional<AsignacionEquipo> findByEquipoIdAndActivoTrue(Long equipoId);
}
