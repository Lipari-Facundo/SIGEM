package com.sigem.backend.service;

import com.sigem.backend.dto.ConsumoBatchDTO;
import com.sigem.backend.dto.ConsumoItemDTO;
import com.sigem.backend.model.Guardia;
import com.sigem.backend.model.GuardiaEstado;
import com.sigem.backend.model.Movil;
import com.sigem.backend.model.Usuario;
import com.sigem.backend.repository.ConsumoInsumoRepository;
import com.sigem.backend.repository.ControlMovilRepository;
import com.sigem.backend.repository.GuardiaRepository;
import com.sigem.backend.repository.IncidenteRepository;
import com.sigem.backend.repository.InsumoRepository;
import com.sigem.backend.repository.MovilInsumoRepository;
import com.sigem.backend.repository.MovilRepository;
import com.sigem.backend.repository.MovimientoDepositoCentralRepository;
import com.sigem.backend.repository.SolicitudReposicionItemRepository;
import com.sigem.backend.repository.SolicitudReposicionRepository;
import com.sigem.backend.repository.StockDepositoCentralRepository;
import com.sigem.backend.repository.StockEstandarMovilRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InventarioMovilServiceTest {

    @Mock
    private StockEstandarMovilRepository stockEstandarMovilRepository;
    @Mock
    private MovilInsumoRepository movilInsumoRepository;
    @Mock
    private GuardiaRepository guardiaRepository;
    @Mock
    private InsumoRepository insumoRepository;
    @Mock
    private IncidenteRepository incidenteRepository;
    @Mock
    private ConsumoInsumoRepository consumoInsumoRepository;
    @Mock
    private SolicitudReposicionRepository solicitudReposicionRepository;
    @Mock
    private SolicitudReposicionItemRepository solicitudReposicionItemRepository;
    @Mock
    private StockDepositoCentralRepository stockDepositoCentralRepository;
    @Mock
    private MovimientoDepositoCentralRepository movimientoDepositoCentralRepository;
    @Mock
    private EquiposOperativosMovilService equiposOperativosMovilService;
    @Mock
    private ControlMovilRepository controlMovilRepository;
    @Mock
    private MovilRepository movilRepository;

    @InjectMocks
    private InventarioMovilService inventarioMovilService;

    @Test
    void noPermiteRegistrarConsumoAntesDelControlInicial() {
        Usuario enfermero = new Usuario();
        enfermero.setUsername("enfermero");
        Movil movil = new Movil();
        movil.setId(7L);
        Guardia guardia = new Guardia();
        guardia.setId(11L);
        guardia.setMovil(movil);

        ConsumoItemDTO item = new ConsumoItemDTO();
        item.setInsumoId(21L);
        item.setCantidad(1);
        ConsumoBatchDTO dto = new ConsumoBatchDTO();
        dto.setItems(List.of(item));

        when(guardiaRepository.findByEnfermeroUsernameAndEstado("enfermero", GuardiaEstado.ACTIVA))
                .thenReturn(Optional.of(guardia));
        when(movilRepository.findByIdForUpdate(7L)).thenReturn(Optional.of(movil));
        when(controlMovilRepository.existsByGuardiaId(11L)).thenReturn(false);

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> inventarioMovilService.registrarConsumo(enfermero, dto));

        assertEquals(
                "Completá el control inicial del móvil antes de registrar consumos o solicitar reposición.",
                exception.getMessage());
        verify(movilInsumoRepository, never()).save(org.mockito.ArgumentMatchers.any());
        verify(consumoInsumoRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }
}
