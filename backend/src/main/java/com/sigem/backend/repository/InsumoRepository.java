package com.sigem.backend.repository;

import com.sigem.backend.model.Insumo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InsumoRepository extends JpaRepository<Insumo, Long> {

    List<Insumo> findByActivoTrueOrderByCategoriaAscNombreAsc();
}