package com.sigem.backend.service;

import com.sigem.backend.dto.InsumoEstandarUpdateDTO;
import com.sigem.backend.dto.IngresoStockDTO;
import com.sigem.backend.model.Insumo;
import com.sigem.backend.model.MovimientoDepositoCentral;
import com.sigem.backend.model.StockDepositoCentral;
import com.sigem.backend.model.StockEstandarMovil;
import com.sigem.backend.model.TipoMovimientoDeposito;
import com.sigem.backend.model.TipoMovil;
import com.sigem.backend.repository.InsumoRepository;
import com.sigem.backend.repository.MovimientoDepositoCentralRepository;
import com.sigem.backend.repository.StockDepositoCentralRepository;
import com.sigem.backend.repository.StockEstandarMovilRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.ArgumentCaptor;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DepositoCentralServiceTest {

    @Mock private StockDepositoCentralRepository stockRepository;
    @Mock private MovimientoDepositoCentralRepository movimientoRepository;
    @Mock private InsumoRepository insumoRepository;
    @Mock private StockEstandarMovilRepository stockEstandarRepository;

    private DepositoCentralService service;

    @BeforeEach
    void setUp() {
        service = new DepositoCentralService(
                stockRepository, movimientoRepository, insumoRepository, stockEstandarRepository);
    }

    @Test
    void actualizarInsumoActualizaNombreYRecomendacionesParaCadaTipoDeMovil() {
        Insumo insumo = new Insumo();
        insumo.setId(12L);
        insumo.setNombre("Nombre anterior");
        insumo.setActivo(true);
        when(insumoRepository.findByIdForUpdate(12L)).thenReturn(Optional.of(insumo));
        when(insumoRepository.findByNombreIgnoreCase("Nombre actualizado")).thenReturn(Optional.empty());
        when(stockEstandarRepository.findByInsumo_Id(12L)).thenReturn(List.of());

        InsumoEstandarUpdateDTO dto = new InsumoEstandarUpdateDTO();
        dto.setNombre("Nombre actualizado");
        dto.setCantidadesEstandar(cantidadesEstandar());

        InsumoEstandarUpdateDTO actualizado = service.actualizarInsumoEstandar(12L, dto);

        assertEquals("Nombre actualizado", insumo.getNombre());
        assertEquals("Nombre actualizado", actualizado.getNombre());
        assertEquals(4, actualizado.getCantidadesEstandar().size());
        assertEquals(8, actualizado.getCantidadesEstandar().get(TipoMovil.AMBULANCIA_UTIM));
        assertEquals(6, actualizado.getCantidadesEstandar().get(TipoMovil.AMBULANCIA_TRASLADO));
        assertEquals(3, actualizado.getCantidadesEstandar().get(TipoMovil.VEHICULO_APOYO));
        assertEquals(1, actualizado.getCantidadesEstandar().get(TipoMovil.OTRO));
        verify(insumoRepository).save(insumo);
        verify(stockEstandarRepository).saveAll(anyList());
    }

    @Test
    void actualizarInsumoRechazaCantidadEstandarIncompleta() {
        InsumoEstandarUpdateDTO dto = new InsumoEstandarUpdateDTO();
        dto.setNombre("Nombre válido");
        dto.setCantidadesEstandar(Map.of(TipoMovil.AMBULANCIA_UTIM, 1));

        assertThrows(IllegalArgumentException.class, () -> service.actualizarInsumoEstandar(12L, dto));
    }

    @Test
    void registrarIngresoAumentaStockYGuardaMovimientoAuditable() {
        Insumo insumo = new Insumo();
        insumo.setId(12L);
        insumo.setNombre("Guantes");
        StockDepositoCentral stock = new StockDepositoCentral();
        stock.setId(3L);
        stock.setInsumo(insumo);
        stock.setCantidadActual(10);
        stock.setCantidadMinima(2);
        stock.setActivo(true);
        when(stockRepository.findActiveByInsumoIdForUpdate(12L)).thenReturn(Optional.of(stock));
        when(stockRepository.save(stock)).thenReturn(stock);
        IngresoStockDTO dto = new IngresoStockDTO();
        dto.setCantidad(5);

        var actualizado = service.registrarIngresoStock(12L, dto, null);

        assertEquals(15, stock.getCantidadActual());
        assertEquals(15, actualizado.getCantidadActual());
        verify(stockRepository).save(stock);
        ArgumentCaptor<MovimientoDepositoCentral> movimientoCaptor =
                ArgumentCaptor.forClass(MovimientoDepositoCentral.class);
        verify(movimientoRepository).save(movimientoCaptor.capture());
        MovimientoDepositoCentral movimiento = movimientoCaptor.getValue();
        assertEquals(TipoMovimientoDeposito.INGRESO, movimiento.getTipo());
        assertEquals(5, movimiento.getCantidad());
        assertEquals(10, movimiento.getCantidadAnterior());
        assertEquals(15, movimiento.getCantidadNueva());
    }

    @Test
    void registrarIngresoRechazaCantidadCero() {
        IngresoStockDTO dto = new IngresoStockDTO();
        dto.setCantidad(0);

        assertThrows(IllegalArgumentException.class, () -> service.registrarIngresoStock(12L, dto, null));
    }

    private Map<TipoMovil, Integer> cantidadesEstandar() {
        Map<TipoMovil, Integer> cantidades = new EnumMap<>(TipoMovil.class);
        cantidades.put(TipoMovil.AMBULANCIA_UTIM, 8);
        cantidades.put(TipoMovil.AMBULANCIA_TRASLADO, 6);
        cantidades.put(TipoMovil.VEHICULO_APOYO, 3);
        cantidades.put(TipoMovil.OTRO, 1);
        return cantidades;
    }
}
