package com.sigem.backend.repository;

import com.sigem.backend.model.MovimientoEquipo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MovimientoEquipoRepository extends JpaRepository<MovimientoEquipo, Long> {
    List<MovimientoEquipo> findAllByOrderByFechaHoraDescIdDesc();
    boolean existsByActorIdOrResponsableId(Long actorId, Long responsableId);
}
