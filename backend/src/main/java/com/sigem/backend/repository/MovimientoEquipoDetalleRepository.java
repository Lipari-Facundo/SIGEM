package com.sigem.backend.repository;

import com.sigem.backend.model.MovimientoEquipoDetalle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MovimientoEquipoDetalleRepository extends JpaRepository<MovimientoEquipoDetalle, Long> {
    List<MovimientoEquipoDetalle> findByEquipoIdOrderByMovimientoFechaHoraDesc(Long equipoId);
    List<MovimientoEquipoDetalle> findByMovimientoId(Long movimientoId);
}
