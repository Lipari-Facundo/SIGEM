package com.sigem.backend.repository;

import com.sigem.backend.model.EstadoReposicion;
import com.sigem.backend.model.SolicitudReposicion;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SolicitudReposicionRepository extends JpaRepository<SolicitudReposicion, Long> {
    List<SolicitudReposicion> findByEnfermeroUsernameOrderByFechaDesc(String username);
    List<SolicitudReposicion> findByEstadoOrderByFechaDesc(EstadoReposicion estado);
    List<SolicitudReposicion> findByEstadoInOrderByFechaDesc(List<EstadoReposicion> estados);
    Optional<SolicitudReposicion> findByIdAndEnfermeroUsername(Long id, String username);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select solicitud from SolicitudReposicion solicitud where solicitud.id = :id")
    Optional<SolicitudReposicion> findByIdForUpdate(@Param("id") Long id);

        @Lock(LockModeType.PESSIMISTIC_WRITE)
        @Query("select solicitud from SolicitudReposicion solicitud "
            + "where solicitud.id = :id and solicitud.enfermero.username = :username")
        Optional<SolicitudReposicion> findByIdAndEnfermeroUsernameForUpdate(
            @Param("id") Long id,
            @Param("username") String username);
}