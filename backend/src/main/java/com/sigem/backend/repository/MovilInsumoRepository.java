package com.sigem.backend.repository;

import com.sigem.backend.model.MovilInsumo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MovilInsumoRepository extends JpaRepository<MovilInsumo, Long> {

    List<MovilInsumo> findByMovilIdOrderByInsumoCategoriaAscInsumoNombreAsc(Long movilId);

    Optional<MovilInsumo> findByMovilIdAndInsumoId(Long movilId, Long insumoId);

    boolean existsByMovilIdAndInsumoId(Long movilId, Long insumoId);
}