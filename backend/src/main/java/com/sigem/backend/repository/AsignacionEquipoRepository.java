package com.sigem.backend.repository;

import com.sigem.backend.model.AsignacionEquipo;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AsignacionEquipoRepository extends JpaRepository<AsignacionEquipo, Long> {
    List<AsignacionEquipo> findByActivoTrueOrderByFechaAsignacionDesc();
    Optional<AsignacionEquipo> findByEquipoIdAndActivoTrue(Long equipoId);

    @Query("""
            select a from AsignacionEquipo a
            left join a.tipoEquipo asignacionTipo
            left join a.equipo.tipoEquipo equipoTipo
            where a.movil.id = :movilId
              and coalesce(asignacionTipo.codigo, equipoTipo.codigo) = :tipo
              and a.activo = true
            """)
    List<AsignacionEquipo> findActivaPorMovilYTipo(
            @Param("movilId") Long movilId, @Param("tipo") String tipo);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select a from AsignacionEquipo a
            left join a.tipoEquipo asignacionTipo
            left join a.equipo.tipoEquipo equipoTipo
            where a.movil.id = :movilId
              and coalesce(asignacionTipo.codigo, equipoTipo.codigo) = :tipo
              and a.activo = true
            """)
    Optional<AsignacionEquipo> findActivaPorMovilYTipoForUpdate(
            @Param("movilId") Long movilId, @Param("tipo") String tipo);

    List<AsignacionEquipo> findByMovilIdAndActivoTrue(Long movilId);
}
