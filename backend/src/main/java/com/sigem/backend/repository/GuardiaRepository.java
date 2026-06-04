package com.sigem.backend.repository;

import com.sigem.backend.model.Guardia;
import com.sigem.backend.model.GuardiaEstado;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GuardiaRepository extends JpaRepository<Guardia, Long> {

    List<Guardia> findByEnfermeroUsernameOrderByFechaInicioDesc(String username);

    Optional<Guardia> findByIdAndEnfermeroUsername(Long id, String username);

    boolean existsByEnfermeroUsernameAndEstado(String username, GuardiaEstado estado);

    List<Guardia> findByEstadoOrderByFechaInicioDesc(GuardiaEstado estado);

    Optional<Guardia> findByIdAndEstado(Long id, GuardiaEstado estado);
}
