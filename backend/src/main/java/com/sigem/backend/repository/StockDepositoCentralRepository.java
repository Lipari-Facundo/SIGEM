package com.sigem.backend.repository;

import com.sigem.backend.model.StockDepositoCentral;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StockDepositoCentralRepository extends JpaRepository<StockDepositoCentral, Long> {

    List<StockDepositoCentral> findByActivoTrueOrderByInsumoCategoriaAscInsumoNombreAsc();

    Optional<StockDepositoCentral> findByInsumoId(Long insumoId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select stock from StockDepositoCentral stock where stock.id = :id")
    Optional<StockDepositoCentral> findByIdForUpdate(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select stock from StockDepositoCentral stock where stock.insumo.id = :insumoId and stock.activo = true")
    Optional<StockDepositoCentral> findActiveByInsumoIdForUpdate(@Param("insumoId") Long insumoId);
}