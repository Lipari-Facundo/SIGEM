package com.sigem.backend.repository;

import com.sigem.backend.model.SolicitudReposicionGestion;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SolicitudReposicionGestionRepository extends JpaRepository<SolicitudReposicionGestion, Long> {
    @EntityGraph(attributePaths = {"coordinador"})
    List<SolicitudReposicionGestion> findBySolicitudIdOrderByFechaAsc(Long solicitudId);
    @EntityGraph(attributePaths = {"coordinador"})
    List<SolicitudReposicionGestion> findBySolicitudIdInOrderByFechaAsc(List<Long> solicitudIds);
}
