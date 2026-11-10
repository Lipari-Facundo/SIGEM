package com.sigem.backend.repository;

import com.sigem.backend.model.TipoEquipoMedico;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TipoEquipoMedicoRepository extends JpaRepository<TipoEquipoMedico, String> {
    List<TipoEquipoMedico> findAllByOrderByNombreAsc();
    Optional<TipoEquipoMedico> findByInsumoId(Long insumoId);
    boolean existsByInsumoIdAndCodigoNot(Long insumoId, String codigo);
}
