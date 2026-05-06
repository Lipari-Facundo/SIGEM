package com.sigem.backend.repository;

import com.sigem.backend.model.Empleado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EmpleadoRepository extends JpaRepository<Empleado, Long> {
    boolean existsByDni(String dni);
    boolean existsByEmail(String email);
}