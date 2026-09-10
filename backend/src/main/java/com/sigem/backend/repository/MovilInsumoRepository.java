package com.sigem.backend.repository;

import com.sigem.backend.model.MovilInsumo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MovilInsumoRepository extends JpaRepository<MovilInsumo, Long> {

    List<MovilInsumo> findByMovilIdOrderByInsumoCategoriaAscInsumoNombreAsc(Long movilId);

    boolean existsByMovilIdAndInsumoId(Long movilId, Long insumoId);
}