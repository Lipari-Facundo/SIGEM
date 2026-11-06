package com.sigem.backend.repository;

import com.sigem.backend.model.Insumo;
import com.sigem.backend.model.CategoriaInsumo;
import com.sigem.backend.model.TipoInsumo;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InsumoRepository extends JpaRepository<Insumo, Long> {

    List<Insumo> findByActivoTrueOrderByCategoriaAscNombreAsc();

    List<Insumo> findByCategoriaAndTipoAndActivoTrueOrderByNombreAsc(
            CategoriaInsumo categoria,
            TipoInsumo tipo);

    Optional<Insumo> findByNombreIgnoreCase(String nombre);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select insumo from Insumo insumo where insumo.id = :id")
    Optional<Insumo> findByIdForUpdate(@Param("id") Long id);
}