package com.sigem.backend.repository;

import com.sigem.backend.model.ControlMovilItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ControlMovilItemRepository extends JpaRepository<ControlMovilItem, Long> {

    List<ControlMovilItem> findByControlId(Long controlId);

        @Query(value = """
                        select cmi.*
                        from control_movil_item cmi
                        join control_movil cm on cm.id = cmi.control_id
                        where cm.movil_id = :movilId
                            and cmi.insumo_id = :insumoId
                            and cmi.numero_serie is not null
                        order by cm.fecha desc, cm.id desc, cmi.id desc
                        limit 1
                        """, nativeQuery = true)
        Optional<ControlMovilItem> findFirstByControlMovilIdAndInsumoIdAndNumeroSerieIsNotNullOrderByControlFechaDesc(
            @Param("movilId") Long movilId,
            @Param("insumoId") Long insumoId);
}
