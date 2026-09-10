package com.sigem.backend.repository;

import com.sigem.backend.model.StockEstandarMovil;
import com.sigem.backend.model.TipoMovil;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StockEstandarMovilRepository extends JpaRepository<StockEstandarMovil, Long> {

    List<StockEstandarMovil> findByTipoMovil(TipoMovil tipoMovil);
}