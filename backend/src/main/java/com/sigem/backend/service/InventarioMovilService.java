package com.sigem.backend.service;

import com.sigem.backend.dto.ConsumoBatchDTO;
import com.sigem.backend.dto.ConsumoInsumoDTO;
import com.sigem.backend.dto.ConsumoItemDTO;
import com.sigem.backend.dto.InsumoStockDTO;
import com.sigem.backend.dto.ItemReposicionDTO;
import com.sigem.backend.dto.ReposicionCreateDTO;
import com.sigem.backend.dto.ReposicionItemDTO;
import com.sigem.backend.dto.SolicitudReposicionDTO;
import com.sigem.backend.dto.SugerenciaReposicionDTO;
import com.sigem.backend.model.ConsumoInsumo;
import com.sigem.backend.model.EstadoReposicion;
import com.sigem.backend.model.Incidente;
import com.sigem.backend.model.Guardia;
import com.sigem.backend.model.GuardiaEstado;
import com.sigem.backend.model.Insumo;
import com.sigem.backend.model.Movil;
import com.sigem.backend.model.MovilInsumo;
import com.sigem.backend.model.StockEstandarMovil;
import com.sigem.backend.model.SolicitudReposicion;
import com.sigem.backend.model.SolicitudReposicionItem;
import com.sigem.backend.model.TipoInsumo;
import com.sigem.backend.model.Usuario;
import com.sigem.backend.repository.GuardiaRepository;
import com.sigem.backend.repository.IncidenteRepository;
import com.sigem.backend.repository.InsumoRepository;
import com.sigem.backend.repository.ConsumoInsumoRepository;
import com.sigem.backend.repository.MovilInsumoRepository;
import com.sigem.backend.repository.StockEstandarMovilRepository;
import com.sigem.backend.repository.SolicitudReposicionItemRepository;
import com.sigem.backend.repository.SolicitudReposicionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class InventarioMovilService {

    private final StockEstandarMovilRepository stockEstandarMovilRepository;
    private final MovilInsumoRepository movilInsumoRepository;
    private final GuardiaRepository guardiaRepository;
    private final InsumoRepository insumoRepository;
    private final IncidenteRepository incidenteRepository;
    private final ConsumoInsumoRepository consumoInsumoRepository;
    private final SolicitudReposicionRepository solicitudReposicionRepository;
    private final SolicitudReposicionItemRepository solicitudReposicionItemRepository;

    public InventarioMovilService(StockEstandarMovilRepository stockEstandarMovilRepository,
                                  MovilInsumoRepository movilInsumoRepository,
                                  GuardiaRepository guardiaRepository,
                                  InsumoRepository insumoRepository,
                                  IncidenteRepository incidenteRepository,
                                  ConsumoInsumoRepository consumoInsumoRepository,
                                  SolicitudReposicionRepository solicitudReposicionRepository,
                                  SolicitudReposicionItemRepository solicitudReposicionItemRepository) {
        this.stockEstandarMovilRepository = stockEstandarMovilRepository;
        this.movilInsumoRepository = movilInsumoRepository;
        this.guardiaRepository = guardiaRepository;
        this.insumoRepository = insumoRepository;
        this.incidenteRepository = incidenteRepository;
        this.consumoInsumoRepository = consumoInsumoRepository;
        this.solicitudReposicionRepository = solicitudReposicionRepository;
        this.solicitudReposicionItemRepository = solicitudReposicionItemRepository;
    }

    @Transactional
    public void inicializarStockMovil(Movil movil) {
        List<StockEstandarMovil> stockEstandar = stockEstandarMovilRepository
                .findByTipoMovil(movil.getTipoMovil());

        for (StockEstandarMovil stock : stockEstandar) {
            Insumo insumo = stock.getInsumo();
            if (!movilInsumoRepository.existsByMovilIdAndInsumoId(movil.getId(), insumo.getId())) {
                MovilInsumo movilInsumo = new MovilInsumo();
                movilInsumo.setMovil(movil);
                movilInsumo.setInsumo(insumo);
                movilInsumo.setCantidadActual(stock.getCantidadRecomendada());
                movilInsumoRepository.save(movilInsumo);
            }
        }
    }

    @Transactional(readOnly = true)
    public List<InsumoStockDTO> obtenerInventarioDeMovil(Long movilId) {
        return movilInsumoRepository.findByMovilIdOrderByInsumoCategoriaAscInsumoNombreAsc(movilId)
                .stream()
                .map(this::mapearStock)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<InsumoStockDTO> obtenerInventarioDeMiMovil(Usuario enfermero) {
        Guardia guardia = guardiaRepository.findByEnfermeroUsernameAndEstado(
                        enfermero.getUsername(), GuardiaEstado.ACTIVA)
                .orElseThrow(() -> new RuntimeException(
                        "No tenés una guardia activa, no hay móvil asignado"));
        return obtenerInventarioDeMovil(guardia.getMovil().getId());
    }

    @Transactional
    public List<ConsumoInsumoDTO> registrarConsumo(Usuario enfermero, ConsumoBatchDTO dto) {
        if (dto == null || dto.getItems() == null || dto.getItems().isEmpty()) {
            throw new RuntimeException("Debe seleccionar al menos un insumo para registrar el consumo");
        }

        Guardia guardia = buscarGuardiaActiva(enfermero);
        Movil movil = guardia.getMovil();

        // Se agrupan duplicados para validar el total real solicitado por insumo.
        Map<Long, Integer> cantidadesPorInsumo = new LinkedHashMap<>();
        for (ConsumoItemDTO item : dto.getItems()) {
            if (item == null || item.getInsumoId() == null) {
                throw new RuntimeException("Cada ítem del consumo debe indicar un insumo");
            }
            if (item.getCantidad() == null || item.getCantidad() <= 0) {
                throw new RuntimeException("La cantidad a consumir debe ser mayor a cero");
            }
            cantidadesPorInsumo.merge(item.getInsumoId(), item.getCantidad(), Integer::sum);
        }

        Incidente incidente = dto.getIncidenteId() == null
                ? null
                : incidenteRepository.findById(dto.getIncidenteId())
                .orElseThrow(() -> new RuntimeException(
                        "No se encontró la atención indicada: " + dto.getIncidenteId()));

        // FASE 1: validar todo el lote antes de modificar cualquier stock.
        Map<Long, MovilInsumo> stockValidado = new LinkedHashMap<>();
        Map<Long, Insumo> insumosValidados = new LinkedHashMap<>();
        List<MovilInsumo> stockDelMovil = movilInsumoRepository
                .findByMovilIdOrderByInsumoCategoriaAscInsumoNombreAsc(movil.getId());

        for (Map.Entry<Long, Integer> entry : cantidadesPorInsumo.entrySet()) {
            Long insumoId = entry.getKey();
            Integer cantidadSolicitada = entry.getValue();
            Insumo insumo = insumoRepository.findById(insumoId)
                    .orElseThrow(() -> new RuntimeException(
                            "No existe el insumo con id: " + insumoId));

            if (insumo.getTipo() == TipoInsumo.REUTILIZABLE) {
                throw new RuntimeException("No se puede registrar consumo de un insumo reutilizable: "
                        + insumo.getNombre());
            }

            MovilInsumo movilInsumo = stockDelMovil.stream()
                    .filter(stock -> stock.getInsumo().getId().equals(insumoId))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("El insumo " + insumo.getNombre()
                            + " no forma parte del stock de este móvil"));

            if (movilInsumo.getCantidadActual() < cantidadSolicitada) {
                throw new RuntimeException("Stock insuficiente de " + insumo.getNombre()
                        + ": disponible " + movilInsumo.getCantidadActual()
                        + ", solicitado " + cantidadSolicitada);
            }

            stockValidado.put(insumoId, movilInsumo);
            insumosValidados.put(insumoId, insumo);
        }

        // FASE 2: como todo el lote es válido, se descuenta y se registra junto.
        String loteId = UUID.randomUUID().toString();
        List<ConsumoInsumoDTO> consumos = cantidadesPorInsumo.entrySet().stream().map(entry -> {
            Long insumoId = entry.getKey();
            Integer cantidad = entry.getValue();
            MovilInsumo movilInsumo = stockValidado.get(insumoId);
            movilInsumo.setCantidadActual(movilInsumo.getCantidadActual() - cantidad);
            movilInsumoRepository.save(movilInsumo);

            ConsumoInsumo consumo = new ConsumoInsumo();
            consumo.setMovil(movil);
            consumo.setInsumo(insumosValidados.get(insumoId));
            consumo.setCantidad(cantidad);
            consumo.setEnfermero(enfermero);
            consumo.setIncidente(incidente);
            consumo.setLoteId(loteId);
            consumo.setFecha(LocalDateTime.now());
            return mapearConsumo(consumoInsumoRepository.save(consumo));
        }).toList();

        return consumos;
    }

    @Transactional(readOnly = true)
    public List<ConsumoInsumoDTO> obtenerHistorialDeMovil(Long movilId) {
        return consumoInsumoRepository.findByMovilIdOrderByFechaDesc(movilId)
                .stream()
                .map(this::mapearConsumo)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ConsumoInsumoDTO> obtenerHistorialDeMiMovil(Usuario enfermero) {
        Guardia guardia = buscarGuardiaActiva(enfermero);
        return obtenerHistorialDeMovil(guardia.getMovil().getId());
    }

    @Transactional(readOnly = true)
    public List<SugerenciaReposicionDTO> sugerirReposicionParaMiMovil(Usuario enfermero) {
        Movil movil = buscarGuardiaActiva(enfermero).getMovil();
        Map<Long, MovilInsumo> stockActual = movilInsumoRepository
                .findByMovilIdOrderByInsumoCategoriaAscInsumoNombreAsc(movil.getId())
                .stream()
                .collect(java.util.stream.Collectors.toMap(
                        stock -> stock.getInsumo().getId(), stock -> stock));

        return stockEstandarMovilRepository.findByTipoMovil(movil.getTipoMovil()).stream()
                .map(stockEstandar -> crearSugerencia(stockEstandar, stockActual))
                .filter(sugerencia -> sugerencia.getCantidadSugerida() > 0)
                .toList();
    }

    @Transactional
    public SolicitudReposicionDTO crearSolicitudReposicion(Usuario enfermero, ReposicionCreateDTO dto) {
        if (dto == null || dto.getItems() == null || dto.getItems().isEmpty()) {
            throw new RuntimeException("Debe seleccionar al menos un insumo para solicitar reposición");
        }

        Movil movil = buscarGuardiaActiva(enfermero).getMovil();
        Map<Long, Integer> cantidades = new LinkedHashMap<>();
        for (ReposicionItemDTO item : dto.getItems()) {
            if (item == null || item.getInsumoId() == null) {
                throw new RuntimeException("Cada ítem de reposición debe indicar un insumo");
            }
            if (item.getCantidad() == null || item.getCantidad() <= 0) {
                throw new RuntimeException("La cantidad solicitada debe ser mayor a cero");
            }
            cantidades.merge(item.getInsumoId(), item.getCantidad(), Integer::sum);
        }

        Map<Long, MovilInsumo> stockActual = movilInsumoRepository
                .findByMovilIdOrderByInsumoCategoriaAscInsumoNombreAsc(movil.getId())
                .stream()
                .collect(java.util.stream.Collectors.toMap(
                        stock -> stock.getInsumo().getId(), stock -> stock));

        SolicitudReposicion solicitud = new SolicitudReposicion();
        solicitud.setMovil(movil);
        solicitud.setEnfermero(enfermero);
        solicitud.setEstado(EstadoReposicion.PENDIENTE);
        solicitud.setObservaciones(dto.getObservaciones());
        SolicitudReposicion solicitudGuardada = solicitudReposicionRepository.save(solicitud);

        for (Map.Entry<Long, Integer> entry : cantidades.entrySet()) {
            Insumo insumo = insumoRepository.findById(entry.getKey())
                    .orElseThrow(() -> new RuntimeException(
                            "No existe el insumo con id: " + entry.getKey()));
            MovilInsumo stock = stockActual.get(entry.getKey());

            SolicitudReposicionItem item = new SolicitudReposicionItem();
            item.setSolicitud(solicitudGuardada);
            item.setInsumo(insumo);
            item.setCantidadSolicitada(entry.getValue());
            item.setCantidadActualAlMomento(stock == null ? 0 : stock.getCantidadActual());
            solicitudReposicionItemRepository.save(item);
        }

        return mapearSolicitud(solicitudGuardada);
    }

    @Transactional(readOnly = true)
    public List<SolicitudReposicionDTO> listarMisSolicitudes(Usuario enfermero) {
        return solicitudReposicionRepository
                .findByEnfermeroUsernameOrderByFechaDesc(enfermero.getUsername())
                .stream()
                .map(this::mapearSolicitud)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SolicitudReposicionDTO> listarSolicitudesPendientes() {
        return solicitudReposicionRepository.findByEstadoOrderByFechaDesc(EstadoReposicion.PENDIENTE)
                .stream()
                .map(this::mapearSolicitud)
                .toList();
    }

    @Transactional
    public SolicitudReposicionDTO cancelarSolicitud(Long solicitudId, Usuario enfermero) {
        SolicitudReposicion solicitud = solicitudReposicionRepository
                .findByIdAndEnfermeroUsername(solicitudId, enfermero.getUsername())
                .orElseThrow(() -> new RuntimeException(
                        "No podés cancelar una solicitud que no te pertenece"));
        if (solicitud.getEstado() != EstadoReposicion.PENDIENTE) {
            throw new RuntimeException("Solo se pueden cancelar solicitudes pendientes");
        }
        solicitud.setEstado(EstadoReposicion.CANCELADA);
        return mapearSolicitud(solicitudReposicionRepository.save(solicitud));
    }

    private SugerenciaReposicionDTO crearSugerencia(StockEstandarMovil estandar,
                                                     Map<Long, MovilInsumo> stockActual) {
        Insumo insumo = estandar.getInsumo();
        MovilInsumo actual = stockActual.get(insumo.getId());
        int cantidadActual = actual == null ? 0 : actual.getCantidadActual();
        SugerenciaReposicionDTO dto = new SugerenciaReposicionDTO();
        dto.setInsumoId(insumo.getId());
        dto.setNombre(insumo.getNombre());
        dto.setCategoria(insumo.getCategoria());
        dto.setCantidadActual(cantidadActual);
        dto.setCantidadRecomendada(estandar.getCantidadRecomendada());
        dto.setCantidadSugerida(estandar.getCantidadRecomendada() - cantidadActual);
        return dto;
    }

    private SolicitudReposicionDTO mapearSolicitud(SolicitudReposicion solicitud) {
        SolicitudReposicionDTO dto = new SolicitudReposicionDTO();
        dto.setId(solicitud.getId());
        dto.setMovilNumeroInterno(solicitud.getMovil().getNumeroInterno());
        dto.setEnfermeroNombre(solicitud.getEnfermero().getNombre() + " "
                + solicitud.getEnfermero().getApellido());
        dto.setFecha(solicitud.getFecha());
        dto.setEstado(solicitud.getEstado());
        dto.setObservaciones(solicitud.getObservaciones());
        dto.setItems(solicitudReposicionItemRepository.findBySolicitudId(solicitud.getId()).stream()
                .map(this::mapearItemReposicion)
                .toList());
        return dto;
    }

    private ItemReposicionDTO mapearItemReposicion(SolicitudReposicionItem item) {
        ItemReposicionDTO dto = new ItemReposicionDTO();
        dto.setInsumoNombre(item.getInsumo().getNombre());
        dto.setCategoria(item.getInsumo().getCategoria());
        dto.setCantidadSolicitada(item.getCantidadSolicitada());
        dto.setCantidadActualAlMomento(item.getCantidadActualAlMomento());
        return dto;
    }

    private Guardia buscarGuardiaActiva(Usuario enfermero) {
        return guardiaRepository.findByEnfermeroUsernameAndEstado(
                        enfermero.getUsername(), GuardiaEstado.ACTIVA)
                .orElseThrow(() -> new RuntimeException(
                        "No tenés una guardia activa, no hay móvil asignado"));
    }

    private ConsumoInsumoDTO mapearConsumo(ConsumoInsumo consumo) {
        ConsumoInsumoDTO dto = new ConsumoInsumoDTO();
        dto.setId(consumo.getId());
        dto.setInsumoNombre(consumo.getInsumo().getNombre());
        dto.setCategoria(consumo.getInsumo().getCategoria());
        dto.setCantidad(consumo.getCantidad());
        dto.setEnfermeroNombre(consumo.getEnfermero().getNombre() + " "
                + consumo.getEnfermero().getApellido());
        if (consumo.getIncidente() != null) {
            dto.setIncidenteId(consumo.getIncidente().getId());
            dto.setIncidenteUbicacion(consumo.getIncidente().getUbicacion());
        }
        dto.setLoteId(consumo.getLoteId());
        dto.setFecha(consumo.getFecha());
        return dto;
    }

    private InsumoStockDTO mapearStock(MovilInsumo movilInsumo) {
        Insumo insumo = movilInsumo.getInsumo();
        InsumoStockDTO dto = new InsumoStockDTO();
        dto.setInsumoId(insumo.getId());
        dto.setNombre(insumo.getNombre());
        dto.setCategoria(insumo.getCategoria());
        dto.setTipo(insumo.getTipo());
        dto.setUnidadMedida(insumo.getUnidadMedida());
        dto.setCantidadActual(movilInsumo.getCantidadActual());
        return dto;
    }
}