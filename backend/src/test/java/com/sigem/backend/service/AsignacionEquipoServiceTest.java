package com.sigem.backend.service;

import com.sigem.backend.dto.AsignacionEquipoDTO;
import com.sigem.backend.model.Usuario;
import com.sigem.backend.repository.AsignacionEquipoRepository;
import com.sigem.backend.repository.EquipoMedicoRepository;
import com.sigem.backend.repository.InsumoRepository;
import com.sigem.backend.repository.MovilRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AsignacionEquipoServiceTest {

    @Mock
    private EquipoMedicoRepository equipoRepository;

    @Mock
    private AsignacionEquipoRepository asignacionRepository;

    @Mock
    private MovilRepository movilRepository;

    @Mock
    private InsumoRepository insumoRepository;

    private AsignacionEquipoService service;

    @BeforeEach
    void setUp() {
        service = new AsignacionEquipoService(
                equipoRepository, asignacionRepository, movilRepository, insumoRepository);
    }

    @Test
    void noCreaEquipoFisicoNiSerieSinteticaDesdeIdDeInsumo() {
        AsignacionEquipoDTO dto = new AsignacionEquipoDTO();
        dto.setEquipoId(42L);
        dto.setMovilId(7L);
        when(equipoRepository.findByIdForUpdate(42L)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> service.asignar(dto, new Usuario()));

        verify(insumoRepository, never()).findById(42L);
        verify(equipoRepository, never()).findFirstByNombreIgnoreCaseOrderByIdAsc(org.mockito.ArgumentMatchers.anyString());
        verify(equipoRepository, never()).save(org.mockito.ArgumentMatchers.any());
        verify(asignacionRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }
}
