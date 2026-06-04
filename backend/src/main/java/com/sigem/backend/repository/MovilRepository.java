package com.sigem.backend.repository;

import com.sigem.backend.model.EstadoMovil;
import com.sigem.backend.model.Movil;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MovilRepository extends JpaRepository<Movil, Long> {

    boolean existsByPatente(String patente);

    boolean existsByNumeroInterno(String numeroInterno);

    // Para validar unicidad en edición (excluir el propio registro)
    boolean existsByPatenteAndIdNot(String patente, Long id);

    boolean existsByNumeroInternoAndIdNot(String numeroInterno, Long id);

    // Para el módulo UGL: solo traer operativos disponibles para asignación
    List<Movil> findByEstadoMovil(EstadoMovil estadoMovil);
}