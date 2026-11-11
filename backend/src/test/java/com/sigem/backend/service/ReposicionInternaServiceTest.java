package com.sigem.backend.service;

import com.sigem.backend.dto.ReposicionCreateDTO;
import com.sigem.backend.dto.ReposicionInternaUpdateDTO;
import com.sigem.backend.dto.ReposicionItemDTO;
import com.sigem.backend.dto.SolicitudReposicionDTO;
import com.sigem.backend.model.CategoriaInsumo;
import com.sigem.backend.model.EstadoReposicion;
import com.sigem.backend.model.Insumo;
import com.sigem.backend.model.PrioridadReposicion;
import com.sigem.backend.model.Rol;
import com.sigem.backend.model.SolicitudReposicion;
import com.sigem.backend.model.SolicitudReposicionItem;
import com.sigem.backend.model.StockDepositoCentral;
import com.sigem.backend.model.TipoInsumo;
import com.sigem.backend.model.Usuario;
import com.sigem.backend.repository.ConsumoInsumoRepository;
import com.sigem.backend.repository.GuardiaRepository;
import com.sigem.backend.repository.IncidenteRepository;
import com.sigem.backend.repository.InsumoRepository;
import com.sigem.backend.repository.MovilInsumoRepository;
import com.sigem.backend.repository.MovimientoDepositoCentralRepository;
import com.sigem.backend.repository.SolicitudReposicionItemRepository;
import com.sigem.backend.repository.SolicitudReposicionRepository;
import com.sigem.backend.repository.StockDepositoCentralRepository;
import com.sigem.backend.repository.StockEstandarMovilRepository;
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
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReposicionInternaServiceTest {

    @Mock private StockEstandarMovilRepository stockEstandarMovilRepository;
    @Mock private MovilInsumoRepository movilInsumoRepository;
    @Mock private GuardiaRepository guardiaRepository;
    @Mock private InsumoRepository insumoRepository;
    @Mock private IncidenteRepository incidenteRepository;
    @Mock private ConsumoInsumoRepository consumoInsumoRepository;
    @Mock private SolicitudReposicionRepository solicitudReposicionRepository;
    @Mock private SolicitudReposicionItemRepository solicitudReposicionItemRepository;
    @Mock private StockDepositoCentralRepository stockDepositoCentralRepository;
    @Mock private MovimientoDepositoCentralRepository movimientoDepositoCentralRepository;
    @Mock private EquiposOperativosMovilService equiposOperativosMovilService;

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
                equiposOperativosMovilService);
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

    @Test
    void alternarArchivoSolicitudInternaArchivaYDevuelveSolicitud() {
        Usuario solicitante = usuarioCoordinador();
        SolicitudReposicion solicitud = new SolicitudReposicion();
        solicitud.setId(42L);
        solicitud.setEnfermero(solicitante);
        solicitud.setEsInterna(true);
        solicitud.setFecha(LocalDateTime.now());
        solicitud.setEstado(EstadoReposicion.PENDIENTE);
        when(solicitudReposicionRepository.findByIdForUpdate(42L)).thenReturn(Optional.of(solicitud));
        when(solicitudReposicionRepository.save(solicitud)).thenReturn(solicitud);
        when(solicitudReposicionItemRepository.findBySolicitudId(42L)).thenReturn(List.of());

        SolicitudReposicionDTO response = service.alternarArchivoSolicitudInterna(42L, solicitante);

        assertTrue(solicitud.isArchivado());
        assertTrue(response.isArchivado());
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
