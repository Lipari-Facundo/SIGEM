package com.sigem.backend.repository;

import com.sigem.backend.model.IncidenteHistorialAsignacion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IncidenteHistorialAsignacionRepository
        extends JpaRepository<IncidenteHistorialAsignacion, Long> {

    List<IncidenteHistorialAsignacion> findByIncidenteIdOrderByFechaDesc(Long incidenteId);
}