package com.sigem.backend.service;

import com.sigem.backend.dto.ReposicionCreateDTO;
import com.sigem.backend.dto.ConsumoBatchDTO;
import com.sigem.backend.dto.ConsumoItemDTO;
import com.sigem.backend.dto.ReposicionEntregaDTO;
import com.sigem.backend.dto.ReposicionEntregaItemDTO;
import com.sigem.backend.dto.ReposicionInternaUpdateDTO;
import com.sigem.backend.dto.ReposicionItemDTO;
import com.sigem.backend.dto.SolicitudReposicionDTO;
import com.sigem.backend.model.CategoriaInsumo;
import com.sigem.backend.model.ConsumoInsumo;
import com.sigem.backend.model.EstadoReposicion;
import com.sigem.backend.model.Guardia;
import com.sigem.backend.model.GuardiaEstado;
import com.sigem.backend.model.Insumo;
import com.sigem.backend.model.Movil;
import com.sigem.backend.model.MovilInsumo;
import com.sigem.backend.model.MovimientoDepositoCentral;
import com.sigem.backend.model.PrioridadReposicion;
import com.sigem.backend.model.Rol;
import com.sigem.backend.model.SolicitudReposicion;
import com.sigem.backend.model.SolicitudReposicionGestion;
import com.sigem.backend.model.SolicitudReposicionItem;
import com.sigem.backend.model.StockEstandarMovil;
import com.sigem.backend.model.StockDepositoCentral;
import com.sigem.backend.model.TipoInsumo;
import com.sigem.backend.model.TipoMovil;
import com.sigem.backend.model.Usuario;
import com.sigem.backend.repository.ConsumoInsumoRepository;
import com.sigem.backend.repository.ControlMovilRepository;
import com.sigem.backend.repository.ControlMovilItemRepository;
import com.sigem.backend.repository.GuardiaRepository;
import com.sigem.backend.repository.IncidenteRepository;
import com.sigem.backend.repository.InsumoRepository;
import com.sigem.backend.repository.MovilInsumoRepository;
import com.sigem.backend.repository.MovimientoDepositoCentralRepository;
import com.sigem.backend.repository.SolicitudReposicionItemRepository;
import com.sigem.backend.repository.SolicitudReposicionRepository;
import com.sigem.backend.repository.SolicitudReposicionGestionRepository;
import com.sigem.backend.repository.StockDepositoCentralRepository;
import com.sigem.backend.repository.StockEstandarMovilRepository;
import com.sigem.backend.service.NotificacionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReposicionInternaServiceTest {

    @Mock private StockEstandarMovilRepository stockEstandarMovilRepository;
    @Mock private MovilInsumoRepository movilInsumoRepository;
    @Mock private GuardiaRepository guardiaRepository;
    @Mock private InsumoRepository insumoRepository;
    @Mock private IncidenteRepository incidenteRepository;
    @Mock private ConsumoInsumoRepository consumoInsumoRepository;
    @Mock private ControlMovilRepository controlMovilRepository;
    @Mock private ControlMovilItemRepository controlMovilItemRepository;
    @Mock private SolicitudReposicionRepository solicitudReposicionRepository;
    @Mock private SolicitudReposicionGestionRepository solicitudReposicionGestionRepository;
    @Mock private SolicitudReposicionItemRepository solicitudReposicionItemRepository;
    @Mock private StockDepositoCentralRepository stockDepositoCentralRepository;
    @Mock private MovimientoDepositoCentralRepository movimientoDepositoCentralRepository;
    @Mock private EquiposOperativosMovilService equiposOperativosMovilService;
    @Mock private NotificacionService notificacionService;

    private InventarioMovilService service;

    @BeforeEach
    void setUp() {
        service = new InventarioMovilService(
                stockEstandarMovilRepository,
                movilInsumoRepository,
                guardiaRepository,
                insumoRepository,
                incidenteRepository,
                consumoInsumoRepository,
                solicitudReposicionRepository,
                solicitudReposicionItemRepository,
                stockDepositoCentralRepository,
                movimientoDepositoCentralRepository,
                equiposOperativosMovilService,
                controlMovilRepository,
                controlMovilItemRepository,
                solicitudReposicionGestionRepository,
                notificacionService);
    }

    @Test
    void archivarSolicitudExternaConservaEstadoYRegistraAuditoria() {
        Usuario admin = new Usuario();
        admin.setRol(Rol.ADM);
        SolicitudReposicion solicitud = new SolicitudReposicion();
        solicitud.setId(4L);
        solicitud.setEstado(EstadoReposicion.PARCIAL);
        solicitud.setEsInterna(false);
        when(solicitudReposicionRepository.findByIdForUpdate(4L)).thenReturn(Optional.of(solicitud));

        service.archivarSolicitudReposicion(4L, admin);

        assertTrue(solicitud.isArchivado());
        assertEquals(EstadoReposicion.PARCIAL, solicitud.getEstado());
        verify(solicitudReposicionRepository).save(solicitud);
        ArgumentCaptor<SolicitudReposicionGestion> gestionCaptor =
                ArgumentCaptor.forClass(SolicitudReposicionGestion.class);
        verify(solicitudReposicionGestionRepository).save(gestionCaptor.capture());
        assertEquals("ARCHIVAR", gestionCaptor.getValue().getAccion());
        assertEquals(solicitud, gestionCaptor.getValue().getSolicitud());
    }

    @Test
    void archivarSolicitudYaArchivadaNoDuplicaAuditoria() {
        Usuario admin = new Usuario();
        admin.setRol(Rol.ADM);
        SolicitudReposicion solicitud = new SolicitudReposicion();
        solicitud.setEsInterna(false);
        solicitud.setArchivado(true);
        when(solicitudReposicionRepository.findByIdForUpdate(4L)).thenReturn(Optional.of(solicitud));

        service.archivarSolicitudReposicion(4L, admin);

        verify(solicitudReposicionRepository, never()).save(any(SolicitudReposicion.class));
        verifyNoInteractions(solicitudReposicionGestionRepository);
    }

    @Test
    void crearSolicitudReposicionRequiereControlDeGuardiaActiva() {
        Usuario enfermero = usuarioEnfermero();
        Guardia guardia = new Guardia();
        guardia.setId(11L);
        guardia.setEnfermero(enfermero);
        Movil movil = new Movil();
        movil.setId(7L);
        movil.setTipoMovil(TipoMovil.AMBULANCIA_UTIM);
        guardia.setMovil(movil);
        guardia.setEstado(GuardiaEstado.ACTIVA);
        when(guardiaRepository.findByEnfermeroUsernameAndEstado(enfermero.getUsername(), GuardiaEstado.ACTIVA))
                .thenReturn(Optional.of(guardia));
        when(controlMovilRepository.existsByGuardia_IdAndEnfermero_Id(11L, 77L)).thenReturn(false);

        ReposicionItemDTO requestedItem = new ReposicionItemDTO();
        requestedItem.setInsumoId(9L);
        requestedItem.setCantidad(1);
        ReposicionCreateDTO request = new ReposicionCreateDTO();
        request.setItems(List.of(requestedItem));

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> service.crearSolicitudReposicion(enfermero, request));

        assertTrue(exception.getMessage().contains("motivo de excepción"));
    }

    @Test
    void entregarSolicitudDeEquipoReutilizableNoAlteraStock() {
        Usuario coordinador = usuarioCoordinador();
        Insumo equipo = insumo();
        equipo.setNombre("Respirador");
        equipo.setTipo(TipoInsumo.REUTILIZABLE);

        SolicitudReposicion solicitud = new SolicitudReposicion();
        solicitud.setId(42L);
        solicitud.setEnfermero(usuarioEnfermero());
        solicitud.setEsInterna(false);
        solicitud.setEstado(EstadoReposicion.PENDIENTE);

        SolicitudReposicionItem item = new SolicitudReposicionItem();
        item.setId(55L);
        item.setSolicitud(solicitud);
        item.setInsumo(equipo);
        item.setCantidadSolicitada(1);
        item.setCantidadEntregada(0);

        when(solicitudReposicionRepository.findByIdForUpdate(42L)).thenReturn(Optional.of(solicitud));
        when(solicitudReposicionItemRepository.findBySolicitudId(42L)).thenReturn(List.of(item));
        ReposicionEntregaItemDTO entrega = new ReposicionEntregaItemDTO();
        entrega.setItemId(55L);
        entrega.setCantidad(1);
        ReposicionEntregaDTO request = new ReposicionEntregaDTO();
        request.setItems(List.of(entrega));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> service.entregarSolicitudReposicion(42L, request, coordinador));

        assertTrue(exception.getMessage().contains("se gestionan desde Equipos Médicos"));
        verifyNoInteractions(stockDepositoCentralRepository);
        verify(movimientoDepositoCentralRepository, never()).save(any());
        verifyNoInteractions(notificacionService);
    }

    @Test
    void inventarioDelMovilIncluyeEquipoEstandarSinCrearSaldo() {
        Usuario enfermero = usuarioEnfermero();
        Guardia guardia = prepararGuardiaMovilConControl(enfermero);
        Insumo respirador = insumo();
        respirador.setNombre("Respirador");
        respirador.setTipo(TipoInsumo.REUTILIZABLE);
        StockEstandarMovil estandar = new StockEstandarMovil();
        estandar.setInsumo(respirador);
        estandar.setCantidadRecomendada(1);
        when(movilInsumoRepository.findByMovilIdOrderByInsumoCategoriaAscInsumoNombreAsc(7L))
                .thenReturn(List.of());
        when(stockEstandarMovilRepository.findByTipoMovilAndArchivadoFalseAndInsumo_ActivoTrue(guardia.getMovil().getTipoMovil()))
                .thenReturn(List.of(estandar));

        var inventario = service.obtenerInventarioDeMiMovil(enfermero);

        assertEquals(1, inventario.size());
        assertEquals("Respirador", inventario.get(0).getNombre());
        assertEquals(0, inventario.get(0).getCantidadActual());
        assertEquals(1, inventario.get(0).getCantidadRecomendada());
        verify(movilInsumoRepository, never()).save(any());
    }

    @Test
    void inventarioIncluyeEstandaresActivosSinSaldoYExcluyeLosArchivados() {
        Usuario enfermero = usuarioEnfermero();
        Guardia guardia = prepararGuardiaMovilConControl(enfermero);
        Insumo consumible = insumo();
        Insumo reutilizable = insumo();
        reutilizable.setId(10L);
        reutilizable.setNombre("Oxímetro");
        reutilizable.setTipo(TipoInsumo.REUTILIZABLE);
        Insumo archivado = insumo();
        archivado.setId(11L);
        archivado.setNombre("Material archivado");

        StockEstandarMovil estandarConsumible = stockEstandar(consumible, false);
        StockEstandarMovil estandarReutilizable = stockEstandar(reutilizable, false);
        StockEstandarMovil estandarArchivado = stockEstandar(archivado, true);
        when(movilInsumoRepository.findByMovilIdOrderByInsumoCategoriaAscInsumoNombreAsc(7L))
                .thenReturn(List.of());
        when(stockEstandarMovilRepository.findByTipoMovilAndArchivadoFalseAndInsumo_ActivoTrue(
                guardia.getMovil().getTipoMovil()))
                .thenReturn(List.of(estandarConsumible, estandarReutilizable));
        when(stockEstandarMovilRepository.findByTipoMovilAndArchivadoTrueAndInsumo_ActivoTrue(
                guardia.getMovil().getTipoMovil()))
                .thenReturn(List.of(estandarArchivado));

        var inventario = service.obtenerInventarioDeMiMovil(enfermero);

        assertEquals(2, inventario.size());
        assertTrue(inventario.stream().allMatch(item -> item.getCantidadActual() == 0));
        assertTrue(inventario.stream().anyMatch(item -> item.getNombre().equals("Guantes")));
        assertTrue(inventario.stream().anyMatch(item -> item.getNombre().equals("Oxímetro")));
        assertTrue(inventario.stream().noneMatch(item -> item.getNombre().equals("Material archivado")));
        verify(movilInsumoRepository, never()).save(any());
    }

    @Test
    void solicitarCambioDeRespiradorExigeMotivo() {
        Usuario enfermero = usuarioEnfermero();
        prepararGuardiaMovilConControl(enfermero);
        when(controlMovilRepository.existsByGuardia_IdAndEnfermero_Id(11L, 77L)).thenReturn(true);
        Insumo respirador = insumo();
        respirador.setNombre("Respirador");
        respirador.setTipo(TipoInsumo.REUTILIZABLE);
        when(insumoRepository.findById(9L)).thenReturn(Optional.of(respirador));

        ReposicionItemDTO item = new ReposicionItemDTO();
        item.setInsumoId(9L);
        item.setCantidad(1);
        ReposicionCreateDTO request = new ReposicionCreateDTO();
        request.setItems(List.of(item));

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> service.crearSolicitudReposicion(enfermero, request));

        assertTrue(exception.getMessage().contains("motivo de cambio"));
        verify(solicitudReposicionRepository, never()).save(any(SolicitudReposicion.class));
        verifyNoInteractions(stockDepositoCentralRepository);
        verify(movimientoDepositoCentralRepository, never()).save(any());
    }

    @Test
    void solicitudDeCambioDeEquipoNoModificaSaldos() {
        Usuario enfermero = usuarioEnfermero();
        Guardia guardia = prepararGuardiaMovilConControl(enfermero);
        when(controlMovilRepository.existsByGuardia_IdAndEnfermero_Id(11L, 77L)).thenReturn(true);
        Insumo respirador = insumo();
        respirador.setNombre("Respirador");
        respirador.setTipo(TipoInsumo.REUTILIZABLE);
        StockEstandarMovil estandar = new StockEstandarMovil();
        estandar.setInsumo(respirador);
        estandar.setCantidadRecomendada(1);
        when(insumoRepository.findById(9L)).thenReturn(Optional.of(respirador));
        when(stockEstandarMovilRepository.findByTipoMovilAndArchivadoFalseAndInsumo_ActivoTrue(guardia.getMovil().getTipoMovil()))
                .thenReturn(List.of(estandar));
        when(movilInsumoRepository.findByMovilIdOrderByInsumoCategoriaAscInsumoNombreAsc(
                guardia.getMovil().getId())).thenReturn(List.of());
        when(solicitudReposicionRepository.save(any(SolicitudReposicion.class)))
                .thenAnswer(invocation -> {
                    SolicitudReposicion saved = invocation.getArgument(0);
                    saved.setId(42L);
                    saved.setFecha(LocalDateTime.now());
                    return saved;
                });
        SolicitudReposicionItem savedItem = new SolicitudReposicionItem();
        savedItem.setId(55L);
        savedItem.setInsumo(respirador);
        savedItem.setCantidadSolicitada(1);
        savedItem.setCantidadEntregada(0);
        savedItem.setMotivoCambio("FALLA");
        when(solicitudReposicionItemRepository.save(any(SolicitudReposicionItem.class)))
                .thenAnswer(invocation -> {
                    SolicitudReposicionItem saved = invocation.getArgument(0);
                    saved.setId(55L);
                    return saved;
                });
        when(solicitudReposicionItemRepository.findBySolicitudId(42L)).thenReturn(List.of(savedItem));

        ReposicionItemDTO item = new ReposicionItemDTO();
        item.setInsumoId(9L);
        item.setCantidad(1);
        item.setMotivoCambio("FALLA");
        ReposicionCreateDTO request = new ReposicionCreateDTO();
        request.setItems(List.of(item));

        SolicitudReposicionDTO response = service.crearSolicitudReposicion(enfermero, request);

        assertEquals(42L, response.getId());
        assertEquals("FALLA", response.getItems().get(0).getMotivoCambio());
        verify(movilInsumoRepository, never()).save(any());
        verifyNoInteractions(stockDepositoCentralRepository);
        verify(movimientoDepositoCentralRepository, never()).save(any());
    }

    @Test
    void registrarConsumoConExcepcionPersisteMotivoUsuarioYFechaSinCambiarLaValidacionDeStock() {
        Usuario enfermero = usuarioEnfermero();
        Guardia guardia = prepararGuardiaMovilConControl(enfermero);
        when(controlMovilRepository.existsByGuardia_IdAndEnfermero_Id(11L, 77L)).thenReturn(false);
        Insumo guantes = insumo();
        MovilInsumo stockMovil = new MovilInsumo();
        stockMovil.setMovil(guardia.getMovil());
        stockMovil.setInsumo(guantes);
        stockMovil.setCantidadActual(5);
        when(movilInsumoRepository.findByMovilIdOrderByInsumoCategoriaAscInsumoNombreAsc(7L))
                .thenReturn(List.of(stockMovil));
        when(insumoRepository.findById(9L)).thenReturn(Optional.of(guantes));
        when(consumoInsumoRepository.save(any(ConsumoInsumo.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ConsumoItemDTO item = new ConsumoItemDTO();
        item.setInsumoId(9L);
        item.setCantidad(2);
        ConsumoBatchDTO request = new ConsumoBatchDTO();
        request.setItems(List.of(item));
        request.setMotivoExcepcionControl("Control no disponible por urgencia");
        request.setObservaciones("Uso en atención urgente");

        var consumos = service.registrarConsumo(enfermero, request);

        ArgumentCaptor<ConsumoInsumo> consumoCaptor = ArgumentCaptor.forClass(ConsumoInsumo.class);
        verify(consumoInsumoRepository).save(consumoCaptor.capture());
        ConsumoInsumo consumo = consumoCaptor.getValue();
        assertEquals("Control no disponible por urgencia", consumo.getMotivoExcepcionControl());
        assertEquals(enfermero, consumo.getUsuarioExcepcionControl());
        assertNotNull(consumo.getFechaExcepcionControl());
        assertEquals("Uso en atención urgente", consumo.getObservaciones());
        assertEquals(2, consumos.get(0).getCantidad());
        assertEquals(3, stockMovil.getCantidadActual());
    }

    @Test
    void registrarConsumoSinControlYSinMotivoDeExcepcionEsRechazadoAntesDeConsultarStock() {
        Usuario enfermero = usuarioEnfermero();
        prepararGuardiaMovilConControl(enfermero);
        when(controlMovilRepository.existsByGuardia_IdAndEnfermero_Id(11L, 77L)).thenReturn(false);
        ConsumoItemDTO item = new ConsumoItemDTO();
        item.setInsumoId(9L);
        item.setCantidad(1);
        ConsumoBatchDTO request = new ConsumoBatchDTO();
        request.setItems(List.of(item));

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> service.registrarConsumo(enfermero, request));

        assertTrue(exception.getMessage().contains("motivo de excepción"));
        verifyNoInteractions(movilInsumoRepository, insumoRepository, consumoInsumoRepository);
    }

    @Test
    void estadoControlSeEvaluaContraLaGuardiaActivaDelEnfermero() {
        Usuario enfermero = usuarioEnfermero();
        prepararGuardiaMovilConControl(enfermero);
        when(controlMovilRepository.existsByGuardia_IdAndEnfermero_Id(11L, 77L)).thenReturn(true);

        var estado = service.obtenerEstadoControlGuardia(enfermero);

        assertTrue(estado.isGuardiaActiva());
        assertTrue(estado.isControlCompletado());
    }

    @Test
    void solicitudConExcepcionGuardaAuditoriaEnLaSolicitud() {
        Usuario enfermero = usuarioEnfermero();
        Guardia guardia = prepararGuardiaMovilConControl(enfermero);
        when(controlMovilRepository.existsByGuardia_IdAndEnfermero_Id(11L, 77L)).thenReturn(false);
        Insumo guantes = insumo();
        when(insumoRepository.findById(9L)).thenReturn(Optional.of(guantes));
        StockEstandarMovil estandar = new StockEstandarMovil();
        estandar.setInsumo(guantes);
        estandar.setCantidadRecomendada(5);
        when(stockEstandarMovilRepository.findByTipoMovilAndArchivadoFalseAndInsumo_ActivoTrue(guardia.getMovil().getTipoMovil()))
                .thenReturn(List.of(estandar));
        when(movilInsumoRepository.findByMovilIdOrderByInsumoCategoriaAscInsumoNombreAsc(7L))
                .thenReturn(List.of());
        when(solicitudReposicionRepository.save(any(SolicitudReposicion.class)))
                .thenAnswer(invocation -> {
                    SolicitudReposicion saved = invocation.getArgument(0);
                    saved.setId(42L);
                    saved.setFecha(LocalDateTime.now());
                    return saved;
                });
        when(solicitudReposicionItemRepository.save(any(SolicitudReposicionItem.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(solicitudReposicionItemRepository.findBySolicitudId(42L)).thenReturn(List.of());

        ReposicionItemDTO item = new ReposicionItemDTO();
        item.setInsumoId(9L);
        item.setCantidad(2);
        ReposicionCreateDTO request = new ReposicionCreateDTO();
        request.setItems(List.of(item));
        request.setMotivoExcepcionControl("No se pudo completar el control");

        service.crearSolicitudReposicion(enfermero, request);

        ArgumentCaptor<SolicitudReposicion> solicitudCaptor =
                ArgumentCaptor.forClass(SolicitudReposicion.class);
        verify(solicitudReposicionRepository).save(solicitudCaptor.capture());
        SolicitudReposicion solicitud = solicitudCaptor.getValue();
        assertEquals("No se pudo completar el control", solicitud.getMotivoExcepcionControl());
        assertEquals(enfermero, solicitud.getUsuarioExcepcionControl());
        assertNotNull(solicitud.getFechaExcepcionControl());
        verify(movilInsumoRepository, never()).save(any());
    }

    @Test
    void entregaCompletaNotificaQueElStockDelMovilFueActualizado() {
        verificarEntregaNotificada(2, 2, EstadoReposicion.COMPLETADA, false);
    }

    @Test
    void entregaParcialNotificaElEstadoParcialYActualizacionDeStock() {
        verificarEntregaNotificada(3, 1, EstadoReposicion.PARCIAL, true);
    }

    @Test
    void modificarSolicitudParcialPreservaLoEntregadoYRegistraAuditoriaSinMoverStock() {
        Usuario coordinador = usuarioCoordinador();
        Usuario enfermero = usuarioEnfermero();
        Movil movil = new Movil();
        movil.setId(7L);
        movil.setTipoMovil(TipoMovil.AMBULANCIA_UTIM);
        SolicitudReposicion solicitud = new SolicitudReposicion();
        solicitud.setId(42L);
        solicitud.setMovil(movil);
        solicitud.setEnfermero(enfermero);
        solicitud.setEsInterna(false);
        solicitud.setEstado(EstadoReposicion.PARCIAL);
        solicitud.setFecha(LocalDateTime.now());
        solicitud.setObservaciones("Antes");

        Insumo guantes = insumo();
        SolicitudReposicionItem existente = new SolicitudReposicionItem();
        existente.setId(55L);
        existente.setSolicitud(solicitud);
        existente.setInsumo(guantes);
        existente.setCantidadSolicitada(5);
        existente.setCantidadEntregada(2);
        existente.setCantidadActualAlMomento(1);

        StockEstandarMovil estandar = new StockEstandarMovil();
        estandar.setInsumo(guantes);
        estandar.setCantidadRecomendada(8);
        when(solicitudReposicionRepository.findByIdForUpdate(42L)).thenReturn(Optional.of(solicitud));
        when(solicitudReposicionItemRepository.findBySolicitudId(42L)).thenReturn(List.of(existente));
        when(solicitudReposicionItemRepository.save(any(SolicitudReposicionItem.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(stockEstandarMovilRepository.findByTipoMovilAndArchivadoFalseAndInsumo_ActivoTrue(TipoMovil.AMBULANCIA_UTIM))
                .thenReturn(List.of(estandar));
        when(movilInsumoRepository.findByMovilIdOrderByInsumoCategoriaAscInsumoNombreAsc(7L))
                .thenReturn(List.of());
        when(solicitudReposicionRepository.save(any(SolicitudReposicion.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ReposicionItemDTO nuevoPedido = new ReposicionItemDTO();
        nuevoPedido.setInsumoId(9L);
        nuevoPedido.setCantidad(4);
        ReposicionCreateDTO update = new ReposicionCreateDTO();
        update.setItems(List.of(nuevoPedido));
        update.setObservaciones("Después");

        SolicitudReposicionDTO response = service.modificarSolicitudReposicion(42L, update, coordinador);

        assertEquals(4, existente.getCantidadSolicitada());
        assertEquals(2, existente.getCantidadEntregada());
        assertEquals(EstadoReposicion.PARCIAL, response.getEstado());
        assertEquals("Después", response.getObservaciones());
        ArgumentCaptor<SolicitudReposicionGestion> gestionCaptor =
                ArgumentCaptor.forClass(SolicitudReposicionGestion.class);
        verify(solicitudReposicionGestionRepository).save(gestionCaptor.capture());
        assertEquals("MODIFICACION", gestionCaptor.getValue().getAccion());
        assertTrue(gestionCaptor.getValue().getDetalle().contains("solicitado=5, entregado=2"));
        assertTrue(gestionCaptor.getValue().getDetalle().contains("solicitado=4, entregado=2"));
        verify(movilInsumoRepository, never()).save(any());
        verify(movimientoDepositoCentralRepository, never()).save(any());
    }

    @Test
    void modificarSolicitudNoPermiteReducirDebajoDeLoYaEntregado() {
        Usuario coordinador = usuarioCoordinador();
        SolicitudReposicion solicitud = new SolicitudReposicion();
        solicitud.setId(42L);
        solicitud.setMovil(movilPrueba());
        solicitud.setEsInterna(false);
        solicitud.setEstado(EstadoReposicion.PARCIAL);
        SolicitudReposicionItem existente = new SolicitudReposicionItem();
        existente.setInsumo(insumo());
        existente.setCantidadSolicitada(4);
        existente.setCantidadEntregada(3);
        StockEstandarMovil estandar = new StockEstandarMovil();
        estandar.setInsumo(insumo());
        estandar.setCantidadRecomendada(8);
        when(solicitudReposicionRepository.findByIdForUpdate(42L)).thenReturn(Optional.of(solicitud));
        when(solicitudReposicionItemRepository.findBySolicitudId(42L)).thenReturn(List.of(existente));
        when(stockEstandarMovilRepository.findByTipoMovilAndArchivadoFalseAndInsumo_ActivoTrue(TipoMovil.AMBULANCIA_UTIM))
                .thenReturn(List.of(estandar));

        ReposicionItemDTO pedido = new ReposicionItemDTO();
        pedido.setInsumoId(9L);
        pedido.setCantidad(2);
        ReposicionCreateDTO update = new ReposicionCreateDTO();
        update.setItems(List.of(pedido));

        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                () -> service.modificarSolicitudReposicion(42L, update, coordinador));

        assertTrue(error.getMessage().contains("menor a lo ya entregado"));
        verify(solicitudReposicionGestionRepository, never()).save(any());
        verify(movimientoDepositoCentralRepository, never()).save(any());
    }

    @Test
    void historialIncluyeTodosLosCoordinadoresDeLosMovimientos() {
        Usuario nurse = usuarioEnfermero();
        Usuario firstCoordinator = usuarioCoordinador();
        firstCoordinator.setUsername("coord-uno");
        firstCoordinator.setNombre("Ana");
        firstCoordinator.setApellido("Pérez");
        Usuario secondCoordinator = usuarioCoordinador();
        secondCoordinator.setId(13L);
        secondCoordinator.setUsername("coord-dos");
        secondCoordinator.setNombre("Ana");
        secondCoordinator.setApellido("Pérez");
        SolicitudReposicion solicitud = new SolicitudReposicion();
        solicitud.setId(42L);
        solicitud.setMovil(movilPrueba());
        solicitud.setEnfermero(nurse);
        solicitud.setEsInterna(false);
        solicitud.setEstado(EstadoReposicion.PARCIAL);
        solicitud.setFecha(LocalDateTime.now());
        Insumo guantes = insumo();
        StockDepositoCentral stock = new StockDepositoCentral();
        stock.setInsumo(guantes);
        MovimientoDepositoCentral firstMovement = movimientoReposicion(solicitud, stock, firstCoordinator);
        MovimientoDepositoCentral secondMovement = movimientoReposicion(solicitud, stock, secondCoordinator);
        when(solicitudReposicionRepository.findByEsInternaFalseAndArchivadoFalseOrderByFechaDesc())
                .thenReturn(List.of(solicitud));
        when(movimientoDepositoCentralRepository.findBySolicitudIdInOrderByFechaAsc(List.of(42L)))
                .thenReturn(List.of(firstMovement, secondMovement));
        when(solicitudReposicionItemRepository.findBySolicitudIdIn(List.of(42L))).thenReturn(List.of());
        when(movilInsumoRepository.findByMovilIdInOrderByInsumoCategoriaAscInsumoNombreAsc(List.of(7L)))
                .thenReturn(List.of());

        List<SolicitudReposicionDTO> historial = service.listarHistorialSolicitudesReposicion(usuarioCoordinador());

        assertEquals(1, historial.size());
        assertEquals(List.of("Ana Pérez (coord-uno)", "Ana Pérez (coord-dos)"),
                historial.get(0).getCoordinadoresPrepararon());
        assertEquals(2, historial.get(0).getEntregas().size());
    }

    private MovimientoDepositoCentral movimientoReposicion(
            SolicitudReposicion solicitud, StockDepositoCentral stock, Usuario coordinador) {
        MovimientoDepositoCentral movimiento = new MovimientoDepositoCentral();
        movimiento.setSolicitud(solicitud);
        movimiento.setStock(stock);
        movimiento.setUsuario(coordinador);
        movimiento.setTipo(com.sigem.backend.model.TipoMovimientoDeposito.ENTREGA_REPOSICION);
        movimiento.setCantidad(1);
        movimiento.setFecha(LocalDateTime.now());
        return movimiento;
    }

    private Movil movilPrueba() {
        Movil movil = new Movil();
        movil.setId(7L);
        movil.setTipoMovil(TipoMovil.AMBULANCIA_UTIM);
        return movil;
    }

    private StockEstandarMovil stockEstandar(Insumo insumo, boolean archivado) {
        StockEstandarMovil stock = new StockEstandarMovil();
        stock.setInsumo(insumo);
        stock.setTipoMovil(TipoMovil.AMBULANCIA_UTIM);
        stock.setCantidadRecomendada(4);
        stock.setArchivado(archivado);
        return stock;
    }

    private void verificarEntregaNotificada(int cantidadSolicitada,
                                             int cantidadEntregada,
                                             EstadoReposicion estadoEsperado,
                                             boolean parcial) {
        Usuario enfermero = usuarioEnfermero();
        Usuario coordinador = usuarioCoordinador();
        Movil movil = new Movil();
        movil.setId(7L);
        SolicitudReposicion solicitud = new SolicitudReposicion();
        solicitud.setId(42L);
        solicitud.setMovil(movil);
        solicitud.setEnfermero(enfermero);
        solicitud.setEsInterna(false);
        solicitud.setEstado(EstadoReposicion.PENDIENTE);
        solicitud.setFecha(LocalDateTime.now());

        Insumo guantes = insumo();
        SolicitudReposicionItem item = new SolicitudReposicionItem();
        item.setId(55L);
        item.setSolicitud(solicitud);
        item.setInsumo(guantes);
        item.setCantidadSolicitada(cantidadSolicitada);
        item.setCantidadEntregada(0);

        StockDepositoCentral stockCentral = new StockDepositoCentral();
        stockCentral.setInsumo(guantes);
        stockCentral.setCantidadActual(10);
        stockCentral.setActivo(true);
        MovilInsumo stockMovil = new MovilInsumo();
        stockMovil.setMovil(movil);
        stockMovil.setInsumo(guantes);
        stockMovil.setCantidadActual(2);
        when(solicitudReposicionRepository.findByIdForUpdate(42L)).thenReturn(Optional.of(solicitud));
        when(solicitudReposicionItemRepository.findBySolicitudId(42L)).thenReturn(List.of(item));
        when(stockDepositoCentralRepository.findActiveByInsumoIdForUpdate(9L))
                .thenReturn(Optional.of(stockCentral));
        when(movilInsumoRepository.findByMovilIdAndInsumoIdForUpdate(7L, 9L))
                .thenReturn(Optional.of(stockMovil));
        when(solicitudReposicionRepository.save(any(SolicitudReposicion.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(solicitudReposicionItemRepository.save(any(SolicitudReposicionItem.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ReposicionEntregaItemDTO entrega = new ReposicionEntregaItemDTO();
        entrega.setItemId(55L);
        entrega.setCantidad(cantidadEntregada);
        ReposicionEntregaDTO request = new ReposicionEntregaDTO();
        request.setItems(List.of(entrega));
        request.setObservaciones("Entrega preparada por el coordinador");

        SolicitudReposicionDTO response = service.entregarSolicitudReposicion(42L, request, coordinador);

        assertEquals(estadoEsperado, response.getEstado());
        assertEquals(10 - cantidadEntregada, stockCentral.getCantidadActual());
        assertEquals(2 + cantidadEntregada, stockMovil.getCantidadActual());
        verify(notificacionService).crearNotificacionReposicion(solicitud, parcial);
        verify(movimientoDepositoCentralRepository).save(any(MovimientoDepositoCentral.class));
        ArgumentCaptor<SolicitudReposicionGestion> gestionCaptor =
                ArgumentCaptor.forClass(SolicitudReposicionGestion.class);
        verify(solicitudReposicionGestionRepository).save(gestionCaptor.capture());
        assertEquals("ENTREGA", gestionCaptor.getValue().getAccion());
        assertEquals("Entrega preparada por el coordinador", gestionCaptor.getValue().getObservaciones());
        assertTrue(gestionCaptor.getValue().getDetalle().contains("Guantes: " + cantidadEntregada));
    }

    private Guardia prepararGuardiaMovilConControl(Usuario enfermero) {
        Guardia guardia = new Guardia();
        guardia.setId(11L);
        guardia.setEnfermero(enfermero);
        Movil movil = new Movil();
        movil.setId(7L);
        movil.setTipoMovil(TipoMovil.AMBULANCIA_UTIM);
        guardia.setMovil(movil);
        guardia.setEstado(GuardiaEstado.ACTIVA);
        when(guardiaRepository.findByEnfermeroUsernameAndEstado(enfermero.getUsername(), GuardiaEstado.ACTIVA))
                .thenReturn(Optional.of(guardia));
        return guardia;
    }

    @Test
    void crearSolicitudInternaTomaSolicitanteFechaPrioridadYStockAutorizado() {
        Usuario solicitante = usuarioCoordinador();
        Insumo insumo = insumo();
        StockDepositoCentral stock = new StockDepositoCentral();
        stock.setInsumo(insumo);
        stock.setCantidadActual(6);
        stock.setActivo(true);
        when(stockDepositoCentralRepository.findActiveByInsumoIdForUpdate(9L))
                .thenReturn(Optional.of(stock));
        when(solicitudReposicionRepository.save(any(SolicitudReposicion.class)))
                .thenAnswer(invocation -> {
                    SolicitudReposicion saved = invocation.getArgument(0);
                    saved.setId(42L);
                    return saved;
                });
        when(solicitudReposicionItemRepository.save(any(SolicitudReposicionItem.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(solicitudReposicionItemRepository.findBySolicitudId(anyLong())).thenReturn(List.of());

        ReposicionItemDTO requestedItem = new ReposicionItemDTO();
        requestedItem.setInsumoId(9L);
        requestedItem.setCantidad(3);
        ReposicionCreateDTO request = new ReposicionCreateDTO();
        request.setPrioridad(PrioridadReposicion.URGENTE);
        request.setItems(List.of(requestedItem));

        SolicitudReposicionDTO response = service.crearSolicitudInterna(solicitante, request);
        assertNotNull(response.getFechaEmisionEpochMillis());

        ArgumentCaptor<SolicitudReposicion> requestCaptor = ArgumentCaptor.forClass(SolicitudReposicion.class);
        verify(solicitudReposicionRepository).save(requestCaptor.capture());
        SolicitudReposicion savedRequest = requestCaptor.getValue();
        assertEquals(solicitante, savedRequest.getEnfermero());
        assertEquals(PrioridadReposicion.URGENTE, savedRequest.getPrioridad());
        assertEquals(EstadoReposicion.PENDIENTE, savedRequest.getEstado());
        assertTrue(savedRequest.isEsInterna());
        assertNull(savedRequest.getMovil());
        assertNotNull(savedRequest.getFecha());

        ArgumentCaptor<SolicitudReposicionItem> itemCaptor =
                ArgumentCaptor.forClass(SolicitudReposicionItem.class);
        verify(solicitudReposicionItemRepository).save(itemCaptor.capture());
        assertEquals(3, itemCaptor.getValue().getCantidadSolicitada());
        assertEquals(6, itemCaptor.getValue().getCantidadActualAlMomento());
    }

    @Test
    void exportarSolicitudInternaGeneraPdf() {
        Usuario solicitante = usuarioCoordinador();
        Insumo insumo = insumo();
        SolicitudReposicion solicitud = new SolicitudReposicion();
        solicitud.setId(42L);
        solicitud.setEnfermero(solicitante);
        solicitud.setEsInterna(true);
        solicitud.setFecha(LocalDateTime.of(2026, 11, 10, 21, 0));
        solicitud.setPrioridad(PrioridadReposicion.NORMAL);
        solicitud.setEstado(EstadoReposicion.PENDIENTE);

        SolicitudReposicionItem item = new SolicitudReposicionItem();
        item.setInsumo(insumo);
        item.setCantidadSolicitada(2);
        when(solicitudReposicionRepository.findById(42L)).thenReturn(Optional.of(solicitud));
        when(solicitudReposicionItemRepository.findBySolicitudId(42L)).thenReturn(List.of(item));

        byte[] pdf = service.exportarSolicitudInternaPdf(42L, solicitante);

        assertTrue(pdf.length > 5);
        assertArrayEquals("%PDF-".getBytes(), java.util.Arrays.copyOf(pdf, 5));
    }

    @Test
    void actualizarSolicitudInternaPermiteCambiarPrioridadYCantidadDentroDeDiezMinutos() {
        Usuario solicitante = usuarioCoordinador();
        Insumo insumo = insumo();
        StockDepositoCentral stock = new StockDepositoCentral();
        stock.setInsumo(insumo);
        stock.setCantidadActual(6);
        stock.setActivo(true);
        SolicitudReposicion solicitud = new SolicitudReposicion();
        solicitud.setId(42L);
        solicitud.setEnfermero(solicitante);
        solicitud.setEsInterna(true);
        solicitud.setFecha(LocalDateTime.now().minusMinutes(2));
        solicitud.setEstado(EstadoReposicion.PENDIENTE);
        SolicitudReposicionItem existingItem = new SolicitudReposicionItem();
        existingItem.setSolicitud(solicitud);
        existingItem.setInsumo(insumo);
        existingItem.setCantidadSolicitada(2);
        existingItem.setCantidadEntregada(0);

        when(solicitudReposicionRepository.findByIdForUpdate(42L)).thenReturn(Optional.of(solicitud));
        when(stockDepositoCentralRepository.findActiveByInsumoIdForUpdate(9L))
                .thenReturn(Optional.of(stock));
        when(solicitudReposicionItemRepository.findBySolicitudId(42L)).thenReturn(List.of(existingItem));
        when(solicitudReposicionItemRepository.save(any(SolicitudReposicionItem.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(solicitudReposicionRepository.save(any(SolicitudReposicion.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ReposicionItemDTO itemUpdate = new ReposicionItemDTO();
        itemUpdate.setInsumoId(9L);
        itemUpdate.setCantidad(4);
        ReposicionInternaUpdateDTO update = new ReposicionInternaUpdateDTO();
        update.setPrioridad(PrioridadReposicion.URGENTE);
        update.setItems(List.of(itemUpdate));

        SolicitudReposicionDTO response = service.actualizarSolicitudInterna(42L, solicitante, update);

        assertEquals(PrioridadReposicion.URGENTE, response.getPrioridad());
        assertEquals(4, existingItem.getCantidadSolicitada());
    }

    @Test
    void actualizarSolicitudInternaRechazaCambiosPasadosDiezMinutos() {
        Usuario solicitante = usuarioCoordinador();
        SolicitudReposicion solicitud = new SolicitudReposicion();
        solicitud.setId(42L);
        solicitud.setEnfermero(solicitante);
        solicitud.setEsInterna(true);
        solicitud.setFecha(LocalDateTime.now().minusMinutes(11));
        solicitud.setEstado(EstadoReposicion.PENDIENTE);
        when(solicitudReposicionRepository.findByIdForUpdate(42L)).thenReturn(Optional.of(solicitud));

        ReposicionItemDTO itemUpdate = new ReposicionItemDTO();
        itemUpdate.setInsumoId(9L);
        itemUpdate.setCantidad(4);
        ReposicionInternaUpdateDTO update = new ReposicionInternaUpdateDTO();
        update.setPrioridad(PrioridadReposicion.URGENTE);
        update.setItems(List.of(itemUpdate));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> service.actualizarSolicitudInterna(42L, solicitante, update));

        assertEquals("El tiempo límite de 10 minutos para modificar la solicitud ha expirado",
                exception.getMessage());
    }

    private Usuario usuarioEnfermero() {
        Usuario usuario = new Usuario();
        usuario.setId(77L);
        usuario.setUsername("enfermero");
        usuario.setNombre("Luis");
        usuario.setApellido("García");
        usuario.setRol(Rol.ENF);
        return usuario;
    }

    private Usuario usuarioCoordinador() {
        Usuario usuario = new Usuario();
        usuario.setId(12L);
        usuario.setUsername("coordinacion");
        usuario.setNombre("Ana");
        usuario.setApellido("Pérez");
        usuario.setRol(Rol.ADM);
        return usuario;
    }

    private Insumo insumo() {
        Insumo insumo = new Insumo();
        insumo.setId(9L);
        insumo.setNombre("Guantes");
        insumo.setCategoria(CategoriaInsumo.DESCARTABLE);
        insumo.setTipo(TipoInsumo.CONSUMIBLE);
        insumo.setUnidadMedida("Caja");
        insumo.setActivo(true);
        return insumo;
    }
}
