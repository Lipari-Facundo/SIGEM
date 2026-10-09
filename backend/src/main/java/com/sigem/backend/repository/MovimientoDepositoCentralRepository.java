package com.sigem.backend.repository;

import com.sigem.backend.model.MovimientoDepositoCentral;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MovimientoDepositoCentralRepository extends JpaRepository<MovimientoDepositoCentral, Long> {

    List<MovimientoDepositoCentral> findTop200ByOrderByFechaDesc();
}