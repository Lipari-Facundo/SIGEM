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

    @Query(value = "SELECT DATE_TRUNC('day', fecha_asignacion) AS period, COUNT(*) AS count " +
            "FROM incidentes " +
            "WHERE (:start IS NULL OR fecha_asignacion >= :start) " +
            "AND (:end IS NULL OR fecha_asignacion <= :end) " +
            "GROUP BY DATE_TRUNC('day', fecha_asignacion) ORDER BY period", nativeQuery = true)
    List<Object[]> countByDay(@Param("start") java.time.LocalDateTime start, @Param("end") java.time.LocalDateTime end);

    @Query(value = "SELECT m.numero_interno AS name, COUNT(*) AS count " +
            "FROM incidentes i JOIN moviles m ON i.movil_id = m.id " +
            "WHERE (:start IS NULL OR i.fecha_asignacion >= :start) " +
            "AND (:end IS NULL OR i.fecha_asignacion <= :end) " +
            "GROUP BY m.numero_interno ORDER BY count DESC, m.numero_interno LIMIT 6", nativeQuery = true)
    List<Object[]> countByVehicle(@Param("start") java.time.LocalDateTime start, @Param("end") java.time.LocalDateTime end);

    @Query(value = "SELECT motivo AS name, COUNT(*) AS count " +
            "FROM incidentes " +
            "WHERE (:start IS NULL OR fecha_asignacion >= :start) " +
            "AND (:end IS NULL OR fecha_asignacion <= :end) " +
            "GROUP BY motivo ORDER BY count DESC, motivo LIMIT 6", nativeQuery = true)
    List<Object[]> countByMotive(@Param("start") java.time.LocalDateTime start, @Param("end") java.time.LocalDateTime end);
}