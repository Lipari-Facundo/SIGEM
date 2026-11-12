package com.sigem.backend.service;

import com.sigem.backend.dto.ExistenciaMovilDTO;
import com.sigem.backend.model.CategoriaInsumo;
import com.sigem.backend.model.Insumo;
import com.sigem.backend.model.StockEstandarMovil;
import com.sigem.backend.model.TipoInsumo;
import com.sigem.backend.model.TipoMovil;
import com.sigem.backend.repository.InsumoRepository;
import com.sigem.backend.repository.StockEstandarMovilRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExistenciasMovilServiceTest {

    @Mock private InsumoRepository insumoRepository;
    @Mock private StockEstandarMovilRepository stockRepository;

    private ExistenciasMovilService service;

    @BeforeEach
    void setUp() {
        service = new ExistenciasMovilService(insumoRepository, stockRepository);
    }

    @Test
    void crearCreaLaMismaCantidadMinimaParaCadaTipoDeMovil() {
        when(insumoRepository.findByNombreIgnoreCase("Guantes")).thenReturn(Optional.empty());
        when(insumoRepository.save(any(Insumo.class))).thenAnswer(invocation -> {
            Insumo insumo = invocation.getArgument(0);
            insumo.setId(8L);
            return insumo;
        });

        ExistenciaMovilDTO dto = new ExistenciaMovilDTO();
        dto.setNombre("Guantes");
        dto.setCategoria(CategoriaInsumo.DESCARTABLE);
        dto.setCantidadMinima(12);

        ExistenciaMovilDTO creado = service.crear(dto);

        assertEquals(8L, creado.getInsumoId());
        assertEquals(12, creado.getCantidadMinima());
        ArgumentCaptor<Insumo> insumoCaptor = ArgumentCaptor.forClass(Insumo.class);
        verify(insumoRepository).save(insumoCaptor.capture());
        assertEquals(TipoInsumo.CONSUMIBLE, insumoCaptor.getValue().getTipo());
        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<StockEstandarMovil>> standardsCaptor =
                (ArgumentCaptor<List<StockEstandarMovil>>) (ArgumentCaptor<?>) ArgumentCaptor.forClass(List.class);
        verify(stockRepository).saveAll(standardsCaptor.capture());
        assertEquals(TipoMovil.values().length, standardsCaptor.getValue().size());
        assertTrue(standardsCaptor.getValue().stream().allMatch(item -> item.getCantidadRecomendada() == 12));
        assertTrue(standardsCaptor.getValue().stream().noneMatch(StockEstandarMovil::isArchivado));
    }

    @Test
    void alternarArchivoCambiaSoloLosRegistrosDeEstandarDelInsumo() {
        Insumo insumo = new Insumo();
        insumo.setId(8L);
        insumo.setActivo(true);
        List<StockEstandarMovil> registros = new ArrayList<>();
        for (TipoMovil tipo : List.of(TipoMovil.AMBULANCIA_UTIM, TipoMovil.OTRO)) {
            StockEstandarMovil stock = new StockEstandarMovil();
            stock.setInsumo(insumo);
            stock.setTipoMovil(tipo);
            stock.setCantidadRecomendada(4);
            registros.add(stock);
        }
        when(insumoRepository.findByIdForUpdate(8L)).thenReturn(Optional.of(insumo));
        when(stockRepository.findByInsumo_Id(8L)).thenReturn(registros);

        assertTrue(service.alternarArchivo(8L));

        assertTrue(registros.stream().allMatch(StockEstandarMovil::isArchivado));
        assertTrue(!service.alternarArchivo(8L));
        assertTrue(registros.stream().noneMatch(StockEstandarMovil::isArchivado));
        verify(stockRepository, org.mockito.Mockito.times(2)).saveAll(registros);
    }

    @Test
    void crearRechazaCantidadMinimaNegativa() {
        ExistenciaMovilDTO dto = new ExistenciaMovilDTO();
        dto.setNombre("Guantes");
        dto.setCategoria(CategoriaInsumo.DESCARTABLE);
        dto.setCantidadMinima(-1);

        assertThrows(IllegalArgumentException.class, () -> service.crear(dto));
    }
}
