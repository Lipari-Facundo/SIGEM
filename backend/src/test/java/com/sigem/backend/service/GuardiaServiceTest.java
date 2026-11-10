package com.sigem.backend.service;

import com.sigem.backend.model.Guardia;
import com.sigem.backend.model.GuardiaEstado;
import com.sigem.backend.model.Movil;
import com.sigem.backend.model.Rol;
import com.sigem.backend.model.TipoGuardia;
import com.sigem.backend.model.TipoMovil;
import com.sigem.backend.model.Usuario;
import com.sigem.backend.repository.ControlMovilRepository;
import com.sigem.backend.repository.GuardiaRepository;
import com.sigem.backend.repository.MovilRepository;
import com.sigem.backend.repository.StockEstandarMovilRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GuardiaServiceTest {

    @Mock
    private GuardiaRepository guardiaRepository;
    @Mock
    private MovilRepository movilRepository;
    @Mock
    private StockEstandarMovilRepository stockEstandarMovilRepository;
    @Mock
    private ControlMovilRepository controlMovilRepository;

    @InjectMocks
    private GuardiaService guardiaService;

    @Test
    void noPermiteIniciarGuardiaSinPlantillaActiva() {
        Usuario enfermero = new Usuario();
        enfermero.setUsername("enfermero");
        enfermero.setRol(Rol.ENF);
        Movil movil = new Movil();
        movil.setId(7L);
        movil.setTipoMovil(TipoMovil.AMBULANCIA_UTIM);

        when(guardiaRepository.existsByEnfermeroUsernameAndEstado("enfermero", GuardiaEstado.ACTIVA))
                .thenReturn(false);
        when(movilRepository.findById(7L)).thenReturn(Optional.of(movil));

        var dto = new com.sigem.backend.dto.GuardiaDTO();
        dto.setMovilId(7L);
        dto.setTurno("7-19");

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> guardiaService.iniciarGuardia(enfermero, dto));

        assertEquals(
                "No hay una plantilla de control activa para este móvil. Contactá a Administración antes de iniciar la guardia.",
                exception.getMessage());
        verify(guardiaRepository, never()).save(org.mockito.ArgumentMatchers.any(Guardia.class));
    }

    @Test
    void noPermiteFinalizarGuardiaMovilSinControlInicial() {
        Usuario enfermero = new Usuario();
        enfermero.setUsername("enfermero");
        Movil movil = new Movil();
        movil.setId(7L);
        Guardia guardia = new Guardia();
        guardia.setId(11L);
        guardia.setMovil(movil);
        guardia.setTipoGuardia(TipoGuardia.MOVIL);
        guardia.setEstado(GuardiaEstado.ACTIVA);

        when(guardiaRepository.findByIdAndEnfermeroUsername(11L, "enfermero"))
                .thenReturn(Optional.of(guardia));
        when(movilRepository.findByIdForUpdate(7L)).thenReturn(Optional.of(movil));
        when(controlMovilRepository.existsByGuardiaId(11L)).thenReturn(false);

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> guardiaService.finalizarGuardia(11L, enfermero));

        assertEquals(
                "Antes de finalizar la guardia, completá el control inicial del móvil.",
                exception.getMessage());
        verify(guardiaRepository, never()).save(guardia);
    }
}
