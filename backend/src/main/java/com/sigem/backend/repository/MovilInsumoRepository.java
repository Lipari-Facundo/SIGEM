package com.sigem.backend.repository;

import com.sigem.backend.model.MovilInsumo;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MovilInsumoRepository extends JpaRepository<MovilInsumo, Long> {

    List<MovilInsumo> findByMovilIdOrderByInsumoCategoriaAscInsumoNombreAsc(Long movilId);

    Optional<MovilInsumo> findByMovilIdAndInsumoId(Long movilId, Long insumoId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select stock from MovilInsumo stock where stock.movil.id = :movilId and stock.insumo.id = :insumoId")
    Optional<MovilInsumo> findByMovilIdAndInsumoIdForUpdate(
            @Param("movilId") Long movilId,
            @Param("insumoId") Long insumoId);

    boolean existsByMovilIdAndInsumoId(Long movilId, Long insumoId);
}