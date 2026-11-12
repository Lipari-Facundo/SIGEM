package com.sigem.backend.service;

import com.sigem.backend.dto.ControlCreateDTO;
import com.sigem.backend.dto.ControlItemInputDTO;
import com.sigem.backend.dto.ControlPlantillaItemDTO;
import com.sigem.backend.exception.ResourceConflictException;
import com.sigem.backend.model.AsignacionEquipo;
import com.sigem.backend.model.CategoriaInsumo;
import com.sigem.backend.model.ControlMovil;
import com.sigem.backend.model.ControlMovilItem;
import com.sigem.backend.model.EquipoMedico;
import com.sigem.backend.model.EstadoEquipo;
import com.sigem.backend.model.Guardia;
import com.sigem.backend.model.GuardiaEstado;
import com.sigem.backend.model.Insumo;
import com.sigem.backend.model.Movil;
import com.sigem.backend.model.Rol;
import com.sigem.backend.model.ResultadoControl;
import com.sigem.backend.model.StockEstandarMovil;
import com.sigem.backend.model.TipoEquipoMedico;
import com.sigem.backend.model.TipoInsumo;
import com.sigem.backend.model.TipoMovil;
import com.sigem.backend.model.Usuario;
import com.sigem.backend.repository.AsignacionEquipoRepository;
import com.sigem.backend.repository.ControlMovilItemRepository;
import com.sigem.backend.repository.ControlMovilRepository;
import com.sigem.backend.repository.EquipoMedicoRepository;
import com.sigem.backend.repository.GuardiaRepository;
import com.sigem.backend.repository.InsumoRepository;
import com.sigem.backend.repository.MovilInsumoRepository;
import com.sigem.backend.repository.MovilRepository;
import com.sigem.backend.repository.StockEstandarMovilRepository;
import com.sigem.backend.repository.TipoEquipoMedicoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ControlMovilServiceTest {

    @Mock private GuardiaRepository guardiaRepository;
    @Mock private StockEstandarMovilRepository stockRepository;
    @Mock private MovilInsumoRepository movilInsumoRepository;
    @Mock private InsumoRepository insumoRepository;
    @Mock private ControlMovilRepository controlRepository;
    @Mock private ControlMovilItemRepository itemRepository;
    @Mock private TipoEquipoMedicoRepository tipoRepository;
    @Mock private AsignacionEquipoRepository asignacionRepository;
    @Mock private EquipoMedicoRepository equipoRepository;
    @Mock private MovilRepository movilRepository;

    private ControlMovilService service;

    @BeforeEach
    void setUp() {
        service = new ControlMovilService(guardiaRepository, stockRepository, movilInsumoRepository,
                insumoRepository, controlRepository, itemRepository, tipoRepository, asignacionRepository,
                equipoRepository, movilRepository);
    }

    @Test
    void resultadoConNovedadesDebeSerValido() {
        assertEquals(ResultadoControl.CON_NOVEDADES, ResultadoControl.CON_NOVEDADES);
    }

    @Test
    void controlEnviandoUnaSerieAnteriorAlCambioDeAsignacionRespondeConflicto() {
        Usuario enfermero = new Usuario();
        enfermero.setUsername("enfermero");
        enfermero.setRol(Rol.ENF);
        Movil movil = new Movil();
        movil.setId(5L);
        movil.setTipoMovil(TipoMovil.AMBULANCIA_UTIM);
        Guardia guardia = new Guardia();
        guardia.setMovil(movil);

        Insumo insumo = new Insumo();
        insumo.setId(8L);
        insumo.setNombre("Electrocardiógrafo");
        insumo.setCategoria(CategoriaInsumo.EQUIPO_MEDICO);
        insumo.setTipo(TipoInsumo.REUTILIZABLE);
        insumo.setActivo(true);
        StockEstandarMovil stock = new StockEstandarMovil();
        stock.setInsumo(insumo);
        stock.setCantidadRecomendada(1);

        TipoEquipoMedico tipo = new TipoEquipoMedico("ELECTROCARDIOGRAFO", "Electrocardiógrafo");
        EquipoMedico equipoActual = new EquipoMedico();
        equipoActual.setId(12L);
        equipoActual.setTipoEquipo(tipo);
        equipoActual.setNumeroSerie("SERIE-NUEVA");
        AsignacionEquipo asignacionActual = new AsignacionEquipo();
        asignacionActual.setEquipo(equipoActual);
        asignacionActual.setTipoEquipo(tipo);
        asignacionActual.setMovil(movil);
        asignacionActual.setActivo(true);
        ReflectionTestUtils.setField(asignacionActual, "id", 100L);

        when(guardiaRepository.findByEnfermeroUsernameAndEstado("enfermero", GuardiaEstado.ACTIVA))
                .thenReturn(Optional.of(guardia));
        when(movilRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(movil));
        when(stockRepository.findByTipoMovil(TipoMovil.AMBULANCIA_UTIM)).thenReturn(List.of(stock));
        when(tipoRepository.findByInsumoId(8L)).thenReturn(Optional.of(tipo));
        when(asignacionRepository.findActivaPorMovilYTipo(5L, "ELECTROCARDIOGRAFO"))
                .thenReturn(List.of(asignacionActual));

        ControlItemInputDTO item = new ControlItemInputDTO();
        item.setInsumoId(8L);
        item.setEstadoEquipo(EstadoEquipo.OPERATIVO);
        item.setNumeroSerie("SERIE-ANTERIOR");
        item.setAsignacionEquipoId(100L);
        item.setAsignacionEquipoEnviada(true);
        ControlCreateDTO dto = new ControlCreateDTO();
        dto.setItems(List.of(item));

        assertThrows(ResourceConflictException.class, () -> service.crearControl(enfermero, dto));

        item.setNumeroSerie("SERIE-NUEVA");
        item.setAsignacionEquipoId(null);
        item.setAsignacionEquipoEnviada(false);
        assertThrows(ResourceConflictException.class, () -> service.crearControl(enfermero, dto));

        item.setEstadoEquipo(EstadoEquipo.FALTANTE);
        item.setNumeroSerie(null);
        item.setAsignacionEquipoId(99L);
        item.setAsignacionEquipoEnviada(true);
        assertThrows(ResourceConflictException.class, () -> service.crearControl(enfermero, dto));
    }

    @Test
    void plantillaUsaSerieDeLaAsignacionActivaYNoUnaSerieHistorica() {
        EquipoFixture fixture = prepararEquipoAsignado();

        ControlPlantillaItemDTO item = service.obtenerPlantilla(fixture.enfermero()).get(0);

        assertEquals(100L, item.getAsignacionEquipoId());
        assertEquals(12L, item.getEquipoMedicoId());
        assertEquals("SERIE-VIGENTE", item.getUltimoNumeroSerie());
    }

    @Test
    void plantillaDeEquipoSinAsignacionNoRecuperaSeriesHistoricas() {
        EquipoFixture fixture = prepararEquipoSinAsignacion();

        ControlPlantillaItemDTO item = service.obtenerPlantilla(fixture.enfermero()).get(0);

        assertEquals("CARDIODESFIBRILADOR", item.getTipoEquipoSnapshot());
        assertNull(item.getAsignacionEquipoId());
        assertNull(item.getEquipoMedicoId());
        assertNull(item.getUltimoNumeroSerie());
        verify(itemRepository, never()).findFirstByControlMovilIdAndInsumoIdAndNumeroSerieIsNotNullOrderByControlFechaDesc(
                5L, 8L);
    }

    @Test
    void discrepanciaDeEquipoSePersisteSinModificarStockReutilizable() {
        EquipoFixture fixture = prepararEquipoAsignado();
        when(movilRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(fixture.movil()));
        when(insumoRepository.findById(8L)).thenReturn(Optional.of(fixture.insumo()));
        when(equipoRepository.findById(12L)).thenReturn(Optional.of(fixture.equipo()));
        when(controlRepository.save(any(ControlMovil.class))).thenAnswer(invocation -> {
            ControlMovil control = invocation.getArgument(0);
            control.setId(50L);
            return control;
        });
        when(itemRepository.save(any(ControlMovilItem.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ControlItemInputDTO input = new ControlItemInputDTO();
        input.setInsumoId(8L);
        input.setEstadoEquipo(EstadoEquipo.OPERATIVO);
        input.setNumeroSerie("SERIE-VIGENTE");
        input.setAsignacionEquipoId(100L);
        input.setAsignacionEquipoEnviada(true);
        input.setTestOk(true);
        input.setEquipoNoCoincide(true);
        input.setEquipoObservado("Equipo observado · serie DIFERENTE");
        ControlCreateDTO request = new ControlCreateDTO();
        request.setItems(List.of(input));

        var response = service.crearControl(fixture.enfermero(), request);

        ArgumentCaptor<ControlMovilItem> captor = ArgumentCaptor.forClass(ControlMovilItem.class);
        verify(itemRepository).save(captor.capture());
        assertTrue(captor.getValue().isEquipoNoCoincide());
        assertEquals("Equipo observado · serie DIFERENTE", captor.getValue().getEquipoObservado());
        assertEquals("SERIE-VIGENTE", captor.getValue().getNumeroSerieSnapshot());
        assertEquals("Equipo observado · serie DIFERENTE", response.getItems().get(0).getEquipoObservado());
        assertTrue(response.getItems().get(0).isEquipoNoCoincide());
        verify(movilInsumoRepository, never()).save(any());
    }

    private EquipoFixture prepararEquipoAsignado() {
        EquipoFixture fixture = crearEquipoBase();
        EquipoMedico equipo = new EquipoMedico();
        equipo.setId(12L);
        equipo.setTipoEquipo(fixture.tipoEquipo());
        equipo.setNumeroSerie("SERIE-VIGENTE");
        AsignacionEquipo asignacion = new AsignacionEquipo();
        ReflectionTestUtils.setField(asignacion, "id", 100L);
        asignacion.setEquipo(equipo);
        asignacion.setTipoEquipo(fixture.tipoEquipo());
        asignacion.setMovil(fixture.movil());
        asignacion.setActivo(true);
        when(asignacionRepository.findActivaPorMovilYTipo(5L, "CARDIODESFIBRILADOR"))
                .thenReturn(List.of(asignacion));
        return new EquipoFixture(
                fixture.enfermero(), fixture.guardia(), fixture.movil(), fixture.insumo(),
                fixture.tipoEquipo(), equipo);
    }

    private EquipoFixture prepararEquipoSinAsignacion() {
        EquipoFixture fixture = crearEquipoBase();
        when(asignacionRepository.findActivaPorMovilYTipo(5L, "CARDIODESFIBRILADOR"))
                .thenReturn(List.of());
        return fixture;
    }

    private EquipoFixture crearEquipoBase() {
        Usuario enfermero = new Usuario();
        enfermero.setUsername("enfermero");
        enfermero.setRol(Rol.ENF);
        Movil movil = new Movil();
        movil.setId(5L);
        movil.setTipoMovil(TipoMovil.AMBULANCIA_UTIM);
        Guardia guardia = new Guardia();
        guardia.setId(11L);
        guardia.setMovil(movil);

        Insumo insumo = new Insumo();
        insumo.setId(8L);
        insumo.setNombre("Cardiodesfibrilador");
        insumo.setCategoria(CategoriaInsumo.EQUIPO_MEDICO);
        insumo.setTipo(TipoInsumo.REUTILIZABLE);
        insumo.setActivo(true);
        StockEstandarMovil stock = new StockEstandarMovil();
        stock.setInsumo(insumo);
        stock.setCantidadRecomendada(1);
        TipoEquipoMedico tipoEquipo = new TipoEquipoMedico(
                "CARDIODESFIBRILADOR", "Cardiodesfibrilador");
        tipoEquipo.setInsumo(insumo);

        when(guardiaRepository.findByEnfermeroUsernameAndEstado("enfermero", GuardiaEstado.ACTIVA))
                .thenReturn(Optional.of(guardia));
        when(stockRepository.findByTipoMovil(TipoMovil.AMBULANCIA_UTIM))
                .thenReturn(List.of(stock));
        when(tipoRepository.findByInsumoId(8L)).thenReturn(Optional.of(tipoEquipo));
        return new EquipoFixture(enfermero, guardia, movil, insumo, tipoEquipo, null);
    }

    private record EquipoFixture(
            Usuario enfermero,
            Guardia guardia,
            Movil movil,
            Insumo insumo,
            TipoEquipoMedico tipoEquipo,
            EquipoMedico equipo) {
    }
}
