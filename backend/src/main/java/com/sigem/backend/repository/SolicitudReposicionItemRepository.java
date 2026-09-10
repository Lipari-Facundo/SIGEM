package com.sigem.backend.repository;

import com.sigem.backend.model.SolicitudReposicionItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SolicitudReposicionItemRepository extends JpaRepository<SolicitudReposicionItem, Long> {
    List<SolicitudReposicionItem> findBySolicitudId(Long solicitudId);
}