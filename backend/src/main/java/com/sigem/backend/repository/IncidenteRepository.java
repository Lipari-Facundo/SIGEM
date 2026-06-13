package com.sigem.backend.repository;

import com.sigem.backend.model.Incidente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface IncidenteRepository extends JpaRepository<Incidente, Long> {

    List<Incidente> findByAsignadoAUsernameOrderByFechaAsignacionDesc(String username);

    Optional<Incidente> findByIdAndAsignadoAUsername(Long id, String username);

    @Query(value = "SELECT COALESCE(MAX(CAST(numero_incidente AS bigint)), 0) FROM incidentes", nativeQuery = true)
    Long findMaxNumeroIncidente();

    // Atenciones del día para el enfermero — para la tabla resumen de guardia
    @Query("SELECT i FROM Incidente i WHERE i.asignadoA.username = :username " +
           "AND i.fechaAsignacion >= :inicioDia AND i.fechaAsignacion <= :finDia " +
           "ORDER BY i.fechaAsignacion DESC")
    List<Incidente> findAtencionesDel(
            @Param("username") String username,
            @Param("inicioDia") LocalDateTime inicioDia,
            @Param("finDia") LocalDateTime finDia
    );
}