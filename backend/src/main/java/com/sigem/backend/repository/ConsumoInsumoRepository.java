package com.sigem.backend.repository;

import com.sigem.backend.model.ConsumoInsumo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface ConsumoInsumoRepository extends JpaRepository<ConsumoInsumo, Long> {

    List<ConsumoInsumo> findByMovilIdOrderByFechaDesc(Long movilId);

    List<ConsumoInsumo> findByMovilIdAndFechaBetweenOrderByFechaDesc(
            Long movilId, LocalDateTime desde, LocalDateTime hasta);
}