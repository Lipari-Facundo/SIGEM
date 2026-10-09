package com.sigem.backend.repository;

import com.sigem.backend.model.Insumo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InsumoRepository extends JpaRepository<Insumo, Long> {

    List<Insumo> findByActivoTrueOrderByCategoriaAscNombreAsc();

    Optional<Insumo> findByNombreIgnoreCase(String nombre);
}