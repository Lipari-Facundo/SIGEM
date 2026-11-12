package com.sigem.backend.repository;

import com.sigem.backend.model.ControlMovil;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ControlMovilRepository extends JpaRepository<ControlMovil, Long> {

    List<ControlMovil> findByEnfermeroUsernameOrderByFechaDesc(String username);

    List<ControlMovil> findAllByOrderByFechaDesc();

    List<ControlMovil> findByMovilIdOrderByFechaDesc(Long movilId);

    boolean existsByGuardia_IdAndEnfermero_Id(Long guardiaId, Long enfermeroId);

    @EntityGraph(attributePaths = {"guardia"})
    List<ControlMovil> findByGuardia_IdInOrderByFechaDesc(List<Long> guardiaIds);

    Optional<ControlMovil> findFirstByGuardia_IdOrderByFechaDesc(Long guardiaId);
}
