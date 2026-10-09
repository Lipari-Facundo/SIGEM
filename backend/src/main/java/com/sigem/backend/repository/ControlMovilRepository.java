package com.sigem.backend.repository;

import com.sigem.backend.model.ControlMovil;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ControlMovilRepository extends JpaRepository<ControlMovil, Long> {

    List<ControlMovil> findByEnfermeroUsernameOrderByFechaDesc(String username);

    List<ControlMovil> findAllByOrderByFechaDesc();

    List<ControlMovil> findByMovilIdOrderByFechaDesc(Long movilId);
}
