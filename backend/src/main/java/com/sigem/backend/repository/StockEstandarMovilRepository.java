package com.sigem.backend.repository;

import com.sigem.backend.model.StockEstandarMovil;
import com.sigem.backend.model.TipoMovil;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StockEstandarMovilRepository extends JpaRepository<StockEstandarMovil, Long> {

    List<StockEstandarMovil> findByTipoMovil(TipoMovil tipoMovil);

    List<StockEstandarMovil> findByTipoMovilAndInsumo_ActivoTrue(TipoMovil tipoMovil);

    List<StockEstandarMovil> findByTipoMovilAndArchivadoFalseAndInsumo_ActivoTrue(TipoMovil tipoMovil);

    List<StockEstandarMovil> findByTipoMovilAndArchivadoTrueAndInsumo_ActivoTrue(TipoMovil tipoMovil);

    List<StockEstandarMovil> findByInsumo_Id(Long insumoId);

    List<StockEstandarMovil> findByArchivadoFalseAndInsumo_ActivoTrueOrderByInsumo_CategoriaAscInsumo_NombreAscTipoMovilAsc();

    List<StockEstandarMovil> findByArchivadoTrueAndInsumo_ActivoTrueOrderByInsumo_CategoriaAscInsumo_NombreAscTipoMovilAsc();

    List<StockEstandarMovil> findByInsumo_IdAndArchivadoFalse(Long insumoId);
}