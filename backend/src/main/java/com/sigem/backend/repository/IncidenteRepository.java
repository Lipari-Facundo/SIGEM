package com.sigem.backend.repository;

import com.sigem.backend.model.Incidente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface IncidenteRepository extends JpaRepository<Incidente, Long> {

    List<Incidente> findByAsignadoAUsernameOrderByFechaAsignacionDesc(String username);

    Optional<Incidente> findByIdAndAsignadoAUsername(Long id, String username);

    @Query(value = "SELECT COALESCE(MAX(CAST(numero_incidente AS bigint)), 0) FROM incidentes", nativeQuery = true)
    Long findMaxNumeroIncidente();
}
