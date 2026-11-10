package com.sigem.backend.repository;

import com.sigem.backend.model.MantenimientoEquipo;
import com.sigem.backend.model.TipoMantenimientoEquipo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MantenimientoEquipoRepository extends JpaRepository<MantenimientoEquipo, Long> {
    List<MantenimientoEquipo> findByEquipoIdOrderByFechaRealizacionDescIdDesc(Long equipoId);
    List<MantenimientoEquipo> findAllByOrderByFechaRealizacionDescIdDesc();
    Optional<MantenimientoEquipo> findFirstByEquipoIdAndTipoOrderByFechaRealizacionDescIdDesc(
            Long equipoId, TipoMantenimientoEquipo tipo);
    boolean existsByResponsableId(Long responsableId);
    boolean existsByActorId(Long actorId);
}
