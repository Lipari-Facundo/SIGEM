package com.sigem.backend.repository;

import com.sigem.backend.model.EquipoMedico;
import com.sigem.backend.model.EstadoEquipoMedico;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface EquipoMedicoRepository extends JpaRepository<EquipoMedico, Long> {
    List<EquipoMedico> findByEstadoOrderByNombreAscNumeroSerieAsc(EstadoEquipoMedico estado);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from EquipoMedico e where e.id = :id")
    Optional<EquipoMedico> findByIdForUpdate(@Param("id") Long id);
}
