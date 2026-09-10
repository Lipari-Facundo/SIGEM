package com.sigem.backend.repository;

import com.sigem.backend.model.EstadoReposicion;
import com.sigem.backend.model.SolicitudReposicion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SolicitudReposicionRepository extends JpaRepository<SolicitudReposicion, Long> {
    List<SolicitudReposicion> findByEnfermeroUsernameOrderByFechaDesc(String username);
    List<SolicitudReposicion> findByEstadoOrderByFechaDesc(EstadoReposicion estado);
    Optional<SolicitudReposicion> findByIdAndEnfermeroUsername(Long id, String username);
}