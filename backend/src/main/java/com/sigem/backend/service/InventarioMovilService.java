package com.sigem.backend.service;

import com.sigem.backend.dto.ConsumoBatchDTO;
import com.sigem.backend.dto.ConsumoInsumoDTO;
import com.sigem.backend.dto.EstadoControlGuardiaDTO;
import com.sigem.backend.dto.ConsumoItemDTO;
import com.sigem.backend.dto.InsumoStockDTO;
import com.sigem.backend.dto.ItemReposicionDTO;
import com.sigem.backend.dto.ReposicionCreateDTO;
import com.sigem.backend.dto.ReposicionEntregaDTO;
import com.sigem.backend.dto.ReposicionInternaUpdateDTO;
import com.sigem.backend.dto.ReposicionItemDTO;
import com.sigem.backend.dto.SolicitudReposicionDTO;
import com.sigem.backend.dto.ReposicionEntregaHistorialDTO;
import com.sigem.backend.dto.SugerenciaReposicionDTO;
import com.sigem.backend.dto.EquipoOperativoMovilDTO;
import com.sigem.backend.dto.StockDepositoDTO;
import com.sigem.backend.model.ConsumoInsumo;
import com.sigem.backend.model.EstadoReposicion;
import com.sigem.backend.model.Incidente;
import com.sigem.backend.model.Guardia;
import com.sigem.backend.model.GuardiaEstado;
import com.sigem.backend.model.Insumo;
import com.sigem.backend.model.Movil;
import com.sigem.backend.model.MovilInsumo;
import com.sigem.backend.model.MovimientoDepositoCentral;
import com.sigem.backend.model.PrioridadReposicion;
import com.sigem.backend.model.Rol;
import com.sigem.backend.model.StockDepositoCentral;
import com.sigem.backend.model.StockEstandarMovil;
import com.sigem.backend.model.SolicitudReposicion;
import com.sigem.backend.model.SolicitudReposicionItem;
import com.sigem.backend.model.TipoInsumo;
import com.sigem.backend.model.TipoMovil;
import com.sigem.backend.model.TipoMovimientoDeposito;
import com.sigem.backend.model.Usuario;
import com.sigem.backend.repository.ControlMovilRepository;
import com.sigem.backend.repository.GuardiaRepository;
import com.sigem.backend.repository.IncidenteRepository;
import com.sigem.backend.repository.InsumoRepository;
import com.sigem.backend.repository.ConsumoInsumoRepository;
import com.sigem.backend.repository.MovilInsumoRepository;
import com.sigem.backend.repository.MovimientoDepositoCentralRepository;
import com.sigem.backend.repository.StockDepositoCentralRepository;
import com.sigem.backend.repository.StockEstandarMovilRepository;
import com.sigem.backend.repository.SolicitudReposicionItemRepository;
import com.sigem.backend.repository.SolicitudReposicionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
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
    private final StockDepositoCentralRepository stockDepositoCentralRepository;
    private final MovimientoDepositoCentralRepository movimientoDepositoCentralRepository;
    private final EquiposOperativosMovilService equiposOperativosMovilService;
    private final ControlMovilRepository controlMovilRepository;
    private final NotificacionService notificacionService;

    public InventarioMovilService(StockEstandarMovilRepository stockEstandarMovilRepository,
                                  MovilInsumoRepository movilInsumoRepository,
                                  GuardiaRepository guardiaRepository,
                                  InsumoRepository insumoRepository,
                                  IncidenteRepository incidenteRepository,
                                  ConsumoInsumoRepository consumoInsumoRepository,
                                  SolicitudReposicionRepository solicitudReposicionRepository,
                                  SolicitudReposicionItemRepository solicitudReposicionItemRepository,
                                  StockDepositoCentralRepository stockDepositoCentralRepository,
                                  MovimientoDepositoCentralRepository movimientoDepositoCentralRepository,
                                  EquiposOperativosMovilService equiposOperativosMovilService,
                                  ControlMovilRepository controlMovilRepository,
                                  NotificacionService notificacionService) {
        this.stockEstandarMovilRepository = stockEstandarMovilRepository;
        this.movilInsumoRepository = movilInsumoRepository;
        this.guardiaRepository = guardiaRepository;
        this.insumoRepository = insumoRepository;
        this.incidenteRepository = incidenteRepository;
        this.consumoInsumoRepository = consumoInsumoRepository;
        this.solicitudReposicionRepository = solicitudReposicionRepository;
        this.solicitudReposicionItemRepository = solicitudReposicionItemRepository;
        this.stockDepositoCentralRepository = stockDepositoCentralRepository;
        this.movimientoDepositoCentralRepository = movimientoDepositoCentralRepository;
        this.equiposOperativosMovilService = equiposOperativosMovilService;
        this.controlMovilRepository = controlMovilRepository;
        this.notificacionService = notificacionService;
    }

    @Transactional(readOnly = true)
    public List<StockDepositoDTO> catalogoReposicionEnfermeria(Usuario solicitante) {
        exigirPermisoReposicionInterna(solicitante);
        exigirGuardiaCentralActivaSiCoordinador(solicitante);
        return stockDepositoCentralRepository
                .findByActivoTrueAndInsumoActivoTrueOrderByInsumoCategoriaAscInsumoNombreAsc()
                .stream()
                .map(stock -> {
                    StockDepositoDTO dto = new StockDepositoDTO();
                    dto.setId(stock.getId());
                    dto.setInsumoId(stock.getInsumo().getId());
                    dto.setNombre(stock.getInsumo().getNombre());
                    dto.setCategoria(stock.getInsumo().getCategoria());
                    dto.setTipo(stock.getInsumo().getTipo());
                    dto.setUnidadMedida(stock.getInsumo().getUnidadMedida());
                    dto.setCantidadActual(stock.getCantidadActual());
                    dto.setCantidadMinima(stock.getCantidadMinima());
                    return dto;
                })
                .toList();
    }

    @Transactional
    public SolicitudReposicionDTO crearSolicitudInterna(Usuario solicitante, ReposicionCreateDTO dto) {
        exigirPermisoReposicionInterna(solicitante);
        exigirGuardiaCentralActivaSiCoordinador(solicitante);
        if (solicitante.getId() == null) {
            throw new IllegalArgumentException("No se pudo identificar al usuario autenticado");
        }
        if (dto == null || dto.getItems() == null || dto.getItems().isEmpty()) {
            throw new IllegalArgumentException("Agregá al menos un insumo a la solicitud");
        }

        Map<Long, Integer> cantidadesPorInsumo = new LinkedHashMap<>();
        Map<Long, StockDepositoCentral> stockPorInsumo = new LinkedHashMap<>();
        for (ReposicionItemDTO item : dto.getItems()) {
            if (item == null || item.getInsumoId() == null
                    || item.getCantidad() == null || item.getCantidad() <= 0) {
                throw new IllegalArgumentException("Cada insumo debe tener una cantidad mayor a cero");
            }
            if (cantidadesPorInsumo.putIfAbsent(item.getInsumoId(), item.getCantidad()) != null) {
                throw new IllegalArgumentException("No repitas un insumo en la solicitud");
            }

            StockDepositoCentral stock = stockDepositoCentralRepository
                    .findActiveByInsumoIdForUpdate(item.getInsumoId())
                    .filter(StockDepositoCentral::isActivo)
                    .filter(entry -> entry.getInsumo().isActivo())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "El insumo seleccionado no está autorizado en el depósito central"));
            stockPorInsumo.put(item.getInsumoId(), stock);
        }

        SolicitudReposicion solicitud = new SolicitudReposicion();
        solicitud.setEnfermero(solicitante);
        solicitud.setMovil(null);
        solicitud.setEsInterna(true);
        solicitud.setPrioridad(dto.getPrioridad() == null ? PrioridadReposicion.NORMAL : dto.getPrioridad());
        solicitud.setFecha(LocalDateTime.now());
        solicitud.setEstado(EstadoReposicion.PENDIENTE);
        solicitud.setObservaciones(dto.getObservaciones());
        SolicitudReposicion guardada = solicitudReposicionRepository.save(solicitud);

        cantidadesPorInsumo.forEach((insumoId, cantidad) -> {
            StockDepositoCentral stock = stockPorInsumo.get(insumoId);
            SolicitudReposicionItem item = new SolicitudReposicionItem();
            item.setSolicitud(guardada);
            item.setInsumo(stock.getInsumo());
            item.setCantidadSolicitada(cantidad);
            item.setCantidadEntregada(0);
            item.setCantidadActualAlMomento(stock.getCantidadActual());
            solicitudReposicionItemRepository.save(item);
        });

        return mapearSolicitud(guardada);
    }

    @Transactional(readOnly = true)
    public List<SolicitudReposicionDTO> listarSolicitudesInternas(Usuario solicitante) {
        exigirPermisoReposicionInterna(solicitante);
        exigirGuardiaCentralActivaSiCoordinador(solicitante);
        return solicitudReposicionRepository.findByEsInternaTrueAndArchivadoFalseOrderByFechaDesc()
                .stream()
                .map(this::mapearSolicitud)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SolicitudReposicionDTO> listarSolicitudesInternasArchivadas(Usuario solicitante) {
        exigirPermisoReposicionInterna(solicitante);
        exigirGuardiaCentralActivaSiCoordinador(solicitante);
        return solicitudReposicionRepository.findByEsInternaTrueAndArchivadoTrueOrderByFechaDesc()
                .stream()
                .map(this::mapearSolicitud)
                .toList();
    }

    @Transactional
    public SolicitudReposicionDTO alternarArchivoSolicitudInterna(Long solicitudId, Usuario solicitante) {
        exigirPermisoReposicionInterna(solicitante);
        exigirGuardiaCentralActivaSiCoordinador(solicitante);
        SolicitudReposicion solicitud = solicitudReposicionRepository.findByIdForUpdate(solicitudId)
                .filter(SolicitudReposicion::isEsInterna)
                .orElseThrow(() -> new IllegalArgumentException("No se encontró la solicitud interna"));
        solicitud.setArchivado(!solicitud.isArchivado());
        return mapearSolicitud(solicitudReposicionRepository.save(solicitud));
    }

    @Transactional
    public SolicitudReposicionDTO actualizarSolicitudInterna(
            Long solicitudId, Usuario solicitante, ReposicionInternaUpdateDTO dto) {
        exigirPermisoReposicionInterna(solicitante);
        exigirGuardiaCentralActivaSiCoordinador(solicitante);
        if (dto == null || dto.getPrioridad() == null
                || dto.getItems() == null || dto.getItems().isEmpty()) {
            throw new IllegalArgumentException("La prioridad y al menos un insumo son obligatorios");
        }

        SolicitudReposicion solicitud = solicitudReposicionRepository.findByIdForUpdate(solicitudId)
                .filter(SolicitudReposicion::isEsInterna)
                .orElseThrow(() -> new IllegalArgumentException("No se encontró la solicitud interna"));
        if (solicitud.getFecha() == null
                || solicitud.getFecha().isBefore(LocalDateTime.now().minusMinutes(10))) {
            throw new IllegalArgumentException(
                    "El tiempo límite de 10 minutos para modificar la solicitud ha expirado");
        }
        if (solicitud.getEstado() != EstadoReposicion.PENDIENTE) {
            throw new IllegalArgumentException("Solo se pueden modificar solicitudes pendientes");
        }

        Map<Long, Integer> cantidadesPorInsumo = new LinkedHashMap<>();
        Map<Long, StockDepositoCentral> stockPorInsumo = new LinkedHashMap<>();
        for (ReposicionItemDTO requestedItem : dto.getItems()) {
            if (requestedItem == null || requestedItem.getInsumoId() == null
                    || requestedItem.getCantidad() == null || requestedItem.getCantidad() <= 0) {
                throw new IllegalArgumentException("Cada insumo debe tener una cantidad mayor a cero");
            }
            if (cantidadesPorInsumo.putIfAbsent(
                    requestedItem.getInsumoId(), requestedItem.getCantidad()) != null) {
                throw new IllegalArgumentException("No repitas un insumo en la solicitud");
            }

            StockDepositoCentral stock = stockDepositoCentralRepository
                    .findActiveByInsumoIdForUpdate(requestedItem.getInsumoId())
                    .filter(StockDepositoCentral::isActivo)
                    .filter(entry -> entry.getInsumo().isActivo())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "El insumo seleccionado no está autorizado en el depósito central"));
            stockPorInsumo.put(requestedItem.getInsumoId(), stock);
        }

        Map<Long, SolicitudReposicionItem> itemsExistentes = solicitudReposicionItemRepository
                .findBySolicitudId(solicitudId)
                .stream()
                .collect(java.util.stream.Collectors.toMap(
                        item -> item.getInsumo().getId(), item -> item));

        for (SolicitudReposicionItem itemExistente : itemsExistentes.values()) {
            Integer nuevaCantidad = cantidadesPorInsumo.get(itemExistente.getInsumo().getId());
            if (nuevaCantidad == null) {
                solicitudReposicionItemRepository.delete(itemExistente);
            } else {
                itemExistente.setCantidadSolicitada(nuevaCantidad);
                solicitudReposicionItemRepository.save(itemExistente);
            }
        }

        cantidadesPorInsumo.forEach((insumoId, cantidad) -> {
            if (!itemsExistentes.containsKey(insumoId)) {
                StockDepositoCentral stock = stockPorInsumo.get(insumoId);
                SolicitudReposicionItem nuevoItem = new SolicitudReposicionItem();
                nuevoItem.setSolicitud(solicitud);
                nuevoItem.setInsumo(stock.getInsumo());
                nuevoItem.setCantidadSolicitada(cantidad);
                nuevoItem.setCantidadEntregada(0);
                nuevoItem.setCantidadActualAlMomento(stock.getCantidadActual());
                solicitudReposicionItemRepository.save(nuevoItem);
            }
        });

        solicitud.setPrioridad(dto.getPrioridad());
        return mapearSolicitud(solicitudReposicionRepository.save(solicitud));
    }

    @Transactional(readOnly = true)
    public byte[] exportarSolicitudInternaPdf(Long solicitudId, Usuario solicitante) {
        exigirPermisoReposicionInterna(solicitante);
        exigirGuardiaCentralActivaSiCoordinador(solicitante);
        SolicitudReposicion solicitud = solicitudReposicionRepository.findById(solicitudId)
                .filter(SolicitudReposicion::isEsInterna)
                .orElseThrow(() -> new IllegalArgumentException("No se encontró la solicitud interna"));
        List<SolicitudReposicionItem> items = solicitudReposicionItemRepository.findBySolicitudId(solicitudId);

        ByteArrayOutputStream output = new ByteArrayOutputStream();
        Document document = new Document();
        try {
            PdfWriter.getInstance(document, output);
            document.open();
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
            Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
            Paragraph title = new Paragraph("Solicitud interna de reposición", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            document.add(new Paragraph("Número: " + solicitud.getId(), bodyFont));
            document.add(new Paragraph("Solicitante: " + nombreCompleto(solicitud.getEnfermero()), bodyFont));
            document.add(new Paragraph("Fecha y hora: "
                    + solicitud.getFecha().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")), bodyFont));
            document.add(new Paragraph("Prioridad: " + solicitud.getPrioridad(), bodyFont));
            document.add(new Paragraph("Estado: " + solicitud.getEstado(), bodyFont));
            if (solicitud.getObservaciones() != null && !solicitud.getObservaciones().isBlank()) {
                document.add(new Paragraph("Observaciones: " + solicitud.getObservaciones(), bodyFont));
            }
            document.add(new Paragraph(" "));

            PdfPTable table = new PdfPTable(new float[] { 4, 2, 1.5f });
            table.setWidthPercentage(100);
            for (String heading : List.of("Insumo", "Categoría", "Cantidad")) {
                PdfPCell cell = new PdfPCell(new Phrase(heading, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10)));
                table.addCell(cell);
            }
            for (SolicitudReposicionItem item : items) {
                table.addCell(item.getInsumo().getNombre());
                table.addCell(item.getInsumo().getCategoria().name());
                table.addCell(item.getCantidadSolicitada().toString());
            }
            document.add(table);
            document.close();
            return output.toByteArray();
        } catch (DocumentException exception) {
            throw new IllegalStateException("No se pudo generar el PDF de la solicitud", exception);
        } finally {
            if (document.isOpen()) document.close();
        }
    }

    @Transactional
    public void inicializarStockMovil(Movil movil) {
        List<StockEstandarMovil> stockEstandar = stockEstandarMovilRepository
                .findByTipoMovil(movil.getTipoMovil())
                .stream()
                .filter(stock -> stock.getInsumo() != null && stock.getInsumo().isActivo())
                .toList();

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
        List<MovilInsumo> inventario = movilInsumoRepository
            .findByMovilIdOrderByInsumoCategoriaAscInsumoNombreAsc(movilId)
                .stream()
                .filter(stock -> stock.getInsumo() != null && stock.getInsumo().isActivo())
            .toList();
        if (inventario.isEmpty()) {
            return List.of();
        }

        Map<Long, Integer> cantidadesRecomendadas = stockEstandarMovilRepository
            .findByTipoMovil(inventario.get(0).getMovil().getTipoMovil()).stream()
            .collect(java.util.stream.Collectors.toMap(
                stock -> stock.getInsumo().getId(), StockEstandarMovil::getCantidadRecomendada,
                (primera, segunda) -> primera));

        return inventario.stream()
            .map(stock -> mapearStock(stock, cantidadesRecomendadas.get(stock.getInsumo().getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<InsumoStockDTO> obtenerInventarioDeMiMovil(Usuario enfermero) {
        Guardia guardia = guardiaRepository.findByEnfermeroUsernameAndEstado(
                        enfermero.getUsername(), GuardiaEstado.ACTIVA)
                .orElseThrow(() -> new RuntimeException(
                        "No tenés una guardia activa, no hay móvil asignado"));
        return obtenerInventarioDeMovil(
                guardia.getMovil().getId(), guardia.getMovil().getTipoMovil());
    }

    private List<InsumoStockDTO> obtenerInventarioDeMovil(Long movilId, TipoMovil tipoMovil) {
        List<InsumoStockDTO> inventario = new ArrayList<>(obtenerInventarioDeMovil(movilId));
        Set<Long> idsPresentes = new HashSet<>();
        inventario.forEach(item -> idsPresentes.add(item.getInsumoId()));

        stockEstandarMovilRepository.findByTipoMovil(tipoMovil).stream()
                .filter(stock -> stock.getInsumo() != null
                        && stock.getInsumo().isActivo()
                        && stock.getInsumo().getTipo() == TipoInsumo.REUTILIZABLE
                        && idsPresentes.add(stock.getInsumo().getId()))
                .map(stock -> mapearStock(
                        stock.getInsumo(), 0, stock.getCantidadRecomendada()))
                .forEach(inventario::add);

        inventario.sort(Comparator
                .comparing((InsumoStockDTO item) -> item.getCategoria().ordinal())
                .thenComparing(InsumoStockDTO::getNombre, String.CASE_INSENSITIVE_ORDER));
        return inventario;
    }

    @Transactional(readOnly = true)
    public EquipoOperativoMovilDTO obtenerEquiposMedicosDeMiMovil(Usuario enfermero) {
        Movil movil = buscarGuardiaActiva(enfermero).getMovil();
        return equiposOperativosMovilService.obtenerParaMovil(movil);
    }

    @Transactional
    public List<ConsumoInsumoDTO> registrarConsumo(Usuario enfermero, ConsumoBatchDTO dto) {
        if (dto == null || dto.getItems() == null || dto.getItems().isEmpty()) {
            throw new RuntimeException("Debe seleccionar al menos un insumo para registrar el consumo");
        }

        Guardia guardia = buscarGuardiaActiva(enfermero);
        String motivoExcepcion = validarControlOMotivo(
                enfermero, guardia, dto.getMotivoExcepcionControl());
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
        LocalDateTime fechaConsumo = LocalDateTime.now();
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
            consumo.setObservaciones(dto.getObservaciones() == null
                    ? null : dto.getObservaciones().trim());
            consumo.setEnfermero(enfermero);
            consumo.setIncidente(incidente);
            consumo.setLoteId(loteId);
            consumo.setFecha(fechaConsumo);
            if (motivoExcepcion != null) {
                consumo.setMotivoExcepcionControl(motivoExcepcion);
                consumo.setUsuarioExcepcionControl(enfermero);
                consumo.setFechaExcepcionControl(fechaConsumo);
            }
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
                .filter(stock -> stock.getInsumo() != null && stock.getInsumo().isActivo())
                .collect(java.util.stream.Collectors.toMap(
                        stock -> stock.getInsumo().getId(), stock -> stock));

        return stockEstandarMovilRepository.findByTipoMovil(movil.getTipoMovil()).stream()
                .filter(stock -> stock.getInsumo() != null && stock.getInsumo().isActivo())
                .map(stockEstandar -> crearSugerencia(stockEstandar, stockActual))
                .filter(sugerencia -> sugerencia.getCantidadSugerida() > 0)
                .toList();
    }

    @Transactional
    public SolicitudReposicionDTO crearSolicitudReposicion(Usuario enfermero, ReposicionCreateDTO dto) {
        if (dto == null || dto.getItems() == null || dto.getItems().isEmpty()) {
            throw new RuntimeException("Debe seleccionar al menos un insumo para solicitar reposición");
        }

        Guardia guardia = buscarGuardiaActiva(enfermero);
        String motivoExcepcion = validarControlOMotivo(
                enfermero, guardia, dto.getMotivoExcepcionControl());
        Movil movil = guardia.getMovil();
        Map<Long, Integer> cantidades = new LinkedHashMap<>();
        Map<Long, String> motivosCambio = new LinkedHashMap<>();
        Map<Long, String> detallesCambio = new LinkedHashMap<>();
        Set<Long> insumosUnicos = new java.util.HashSet<>();
        Set<String> motivosCambioPermitidos = Set.of("ROTURA", "FALTANTE", "FALLA", "DESGASTE", "OTRO");
        for (ReposicionItemDTO item : dto.getItems()) {
            if (item == null || item.getInsumoId() == null) {
                throw new RuntimeException("Cada ítem de reposición debe indicar un insumo");
            }
            if (!insumosUnicos.add(item.getInsumoId())) {
                throw new RuntimeException("La solicitud contiene un insumo repetido con id: " + item.getInsumoId());
            }
            if (item.getCantidad() == null || item.getCantidad() <= 0) {
                throw new RuntimeException("La cantidad solicitada debe ser mayor a cero");
            }
            Insumo insumo = insumoRepository.findById(item.getInsumoId())
                    .orElseThrow(() -> new RuntimeException("No existe el insumo con id: " + item.getInsumoId()));
            String motivoCambio = item.getMotivoCambio() == null ? null : item.getMotivoCambio().trim().toUpperCase();
            String detalleCambio = item.getDetalleCambio() == null ? null : item.getDetalleCambio().trim();

            if (insumo.getTipo() == TipoInsumo.REUTILIZABLE) {
                if (motivoCambio == null || !motivosCambioPermitidos.contains(motivoCambio)) {
                    throw new RuntimeException("Seleccioná un motivo de cambio para " + insumo.getNombre());
                }
                if (item.getCantidad() != 1) {
                    throw new RuntimeException("El cambio de equipo se solicita de a una unidad: " + insumo.getNombre());
                }
                if ("OTRO".equals(motivoCambio) && (detalleCambio == null || detalleCambio.isBlank())) {
                    throw new RuntimeException("Describí el motivo de cambio para " + insumo.getNombre());
                }
                if (detalleCambio != null && detalleCambio.length() > 500) {
                    throw new RuntimeException("El detalle del cambio de " + insumo.getNombre() + " no puede superar 500 caracteres");
                }
                motivosCambio.put(item.getInsumoId(), motivoCambio);
                detallesCambio.put(item.getInsumoId(), detalleCambio);
            } else if (motivoCambio != null || detalleCambio != null) {
                throw new RuntimeException("El motivo de cambio solo corresponde a equipos reutilizables: " + insumo.getNombre());
            }
            cantidades.merge(item.getInsumoId(), item.getCantidad(), Integer::sum);
        }

        Map<Long, StockEstandarMovil> estandaresPorInsumo = stockEstandarMovilRepository
                .findByTipoMovil(movil.getTipoMovil()).stream()
                .filter(stock -> stock.getInsumo() != null && stock.getInsumo().isActivo())
                .collect(java.util.stream.Collectors.toMap(
                stock -> stock.getInsumo().getId(), stock -> stock,
                        (primera, segunda) -> primera));
        for (Map.Entry<Long, Integer> entry : cantidades.entrySet()) {
            StockEstandarMovil estandar = estandaresPorInsumo.get(entry.getKey());
            if (estandar == null) {
            String nombre = insumoRepository.findById(entry.getKey())
                .map(Insumo::getNombre)
                .orElse("con id " + entry.getKey());
            throw new RuntimeException("El insumo " + nombre
                        + " no forma parte del estándar de este móvil");
            }
            Integer recomendada = estandar.getCantidadRecomendada();
            if (entry.getValue() > recomendada) {
            throw new RuntimeException("La cantidad solicitada para " + estandar.getInsumo().getNombre()
                        + " no puede superar la cantidad recomendada de " + recomendada);
            }
        }

        Map<Long, MovilInsumo> stockActual = movilInsumoRepository
                .findByMovilIdOrderByInsumoCategoriaAscInsumoNombreAsc(movil.getId())
                .stream()
                .filter(stock -> stock.getInsumo() != null && stock.getInsumo().isActivo())
                .collect(java.util.stream.Collectors.toMap(
                        stock -> stock.getInsumo().getId(), stock -> stock));

        SolicitudReposicion solicitud = new SolicitudReposicion();
        solicitud.setMovil(movil);
        solicitud.setEnfermero(enfermero);
        solicitud.setEstado(EstadoReposicion.PENDIENTE);
        solicitud.setPrioridad(dto.getPrioridad() == null ? PrioridadReposicion.NORMAL : dto.getPrioridad());
        solicitud.setEsInterna(false);
        solicitud.setObservaciones(dto.getObservaciones());
        if (motivoExcepcion != null) {
            solicitud.setMotivoExcepcionControl(motivoExcepcion);
            solicitud.setUsuarioExcepcionControl(enfermero);
            solicitud.setFechaExcepcionControl(LocalDateTime.now());
        }
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
            item.setCantidadEntregada(0);
            item.setMotivoCambio(motivosCambio.get(entry.getKey()));
            item.setDetalleCambio(detallesCambio.get(entry.getKey()));
            solicitudReposicionItemRepository.save(item);
        }

        return mapearSolicitud(solicitudGuardada);
    }

    @Transactional(readOnly = true)
    public List<SolicitudReposicionDTO> listarMisSolicitudes(Usuario enfermero) {
        return solicitudReposicionRepository
                .findByEnfermeroUsernameAndEsInternaFalseOrderByFechaDesc(enfermero.getUsername())
                .stream()
                .map(this::mapearSolicitud)
                .toList();
    }

    @Transactional(readOnly = true)
    public SolicitudReposicionDTO obtenerMiSolicitud(Long solicitudId, Usuario enfermero) {
        SolicitudReposicion solicitud = solicitudReposicionRepository
                .findByIdAndEnfermeroUsername(solicitudId, enfermero.getUsername())
                .filter(solicitudPropia -> !solicitudPropia.isEsInterna())
                .orElseThrow(() -> new RuntimeException("No se encontró una solicitud propia"));
        return mapearSolicitud(solicitud);
    }

    @Transactional(readOnly = true)
    public List<SolicitudReposicionDTO> listarSolicitudesPendientes(Usuario solicitante) {
        exigirGuardiaCentralActivaSiCoordinador(solicitante);
        return solicitudReposicionRepository.findByEstadoInAndEsInternaFalseOrderByFechaDesc(
                        List.of(EstadoReposicion.PENDIENTE, EstadoReposicion.PARCIAL))
                .stream()
                .map(this::mapearSolicitud)
                .toList();
    }

    @Transactional
    public SolicitudReposicionDTO entregarSolicitudReposicion(Long solicitudId,
                                                              ReposicionEntregaDTO dto,
                                                              Usuario coordinador) {
        exigirGuardiaCentralActivaSiCoordinador(coordinador);
        if (dto == null || dto.getItems() == null || dto.getItems().isEmpty()) {
            throw new RuntimeException("Indicá al menos un ítem y una cantidad para entregar");
        }
        SolicitudReposicion solicitud = solicitudReposicionRepository.findByIdForUpdate(solicitudId)
                .orElseThrow(() -> new RuntimeException("No se encontró la solicitud " + solicitudId));
        validarSolicitudAbierta(solicitud);
        if (solicitud.isEsInterna()) {
            throw new IllegalArgumentException("La solicitud interna no puede procesarse como reposición de móvil");
        }

        Map<Long, SolicitudReposicionItem> itemsSolicitud = solicitudReposicionItemRepository
                .findBySolicitudId(solicitudId).stream()
                .collect(java.util.stream.Collectors.toMap(SolicitudReposicionItem::getId, item -> item));
        Map<Long, Integer> cantidades = new LinkedHashMap<>();
        for (com.sigem.backend.dto.ReposicionEntregaItemDTO entrega : dto.getItems()) {
            if (entrega == null || entrega.getItemId() == null || entrega.getCantidad() == null
                    || entrega.getCantidad() <= 0) {
                throw new RuntimeException("Cada entrega debe indicar un ítem y una cantidad mayor a cero");
            }
            if (cantidades.putIfAbsent(entrega.getItemId(), entrega.getCantidad()) != null) {
                throw new RuntimeException("La entrega contiene un ítem repetido");
            }
            SolicitudReposicionItem item = itemsSolicitud.get(entrega.getItemId());
            if (item == null) {
                throw new RuntimeException("El ítem " + entrega.getItemId() + " no pertenece a esta solicitud");
            }
            if (item.getInsumo().getTipo() == TipoInsumo.REUTILIZABLE) {
                throw new IllegalArgumentException(
                        "Los cambios de equipos reutilizables se gestionan desde Equipos Médicos y no generan movimientos de stock");
            }
            int pendiente = item.getCantidadSolicitada() - item.getCantidadEntregada();
            if (entrega.getCantidad() > pendiente) {
                throw new RuntimeException("La entrega de " + item.getInsumo().getNombre()
                        + " supera lo pendiente (" + pendiente + ")");
            }
        }

        Map<Long, StockDepositoCentral> stockValidado = new LinkedHashMap<>();
        Map<Long, MovilInsumo> stockMovilValidado = new LinkedHashMap<>();
        for (Long itemId : cantidades.keySet().stream().sorted().toList()) {
            SolicitudReposicionItem item = itemsSolicitud.get(itemId);
            StockDepositoCentral stock = stockDepositoCentralRepository
                    .findActiveByInsumoIdForUpdate(item.getInsumo().getId())
                    .orElseThrow(() -> new RuntimeException("No hay stock central activo de "
                            + item.getInsumo().getNombre()));
            if (stock.getCantidadActual() < cantidades.get(itemId)) {
                throw new RuntimeException("Stock central insuficiente de " + item.getInsumo().getNombre()
                        + ": disponible " + stock.getCantidadActual()
                        + ", solicitado " + cantidades.get(itemId));
            }
            stockValidado.put(itemId, stock);

            MovilInsumo stockMovil = movilInsumoRepository
                    .findByMovilIdAndInsumoIdForUpdate(
                            solicitud.getMovil().getId(), item.getInsumo().getId())
                    .orElseGet(() -> {
                        MovilInsumo nuevo = new MovilInsumo();
                        nuevo.setMovil(solicitud.getMovil());
                        nuevo.setInsumo(item.getInsumo());
                        nuevo.setCantidadActual(0);
                        return nuevo;
                    });
            stockMovilValidado.put(itemId, stockMovil);
        }

        for (Map.Entry<Long, Integer> entrega : cantidades.entrySet()) {
            SolicitudReposicionItem item = itemsSolicitud.get(entrega.getKey());
            StockDepositoCentral stock = stockValidado.get(entrega.getKey());
            MovilInsumo stockMovil = stockMovilValidado.get(entrega.getKey());
            int cantidadEntregada = entrega.getValue();

            int anterior = stock.getCantidadActual();
            int nuevo = anterior - cantidadEntregada;
            stock.setCantidadActual(nuevo);
            stockDepositoCentralRepository.save(stock);
            stockMovil.setCantidadActual(stockMovil.getCantidadActual() + cantidadEntregada);
            movilInsumoRepository.save(stockMovil);
            item.setCantidadEntregada(item.getCantidadEntregada() + cantidadEntregada);
            solicitudReposicionItemRepository.save(item);

            MovimientoDepositoCentral movimiento = new MovimientoDepositoCentral();
            movimiento.setStock(stock);
            movimiento.setUsuario(coordinador);
            movimiento.setSolicitud(solicitud);
            movimiento.setTipo(TipoMovimientoDeposito.ENTREGA_REPOSICION);
            movimiento.setCantidad(cantidadEntregada);
            movimiento.setCantidadAnterior(anterior);
            movimiento.setCantidadNueva(nuevo);
                String detalleCambio = item.getMotivoCambio() == null ? ""
                    : " · cambio " + item.getMotivoCambio()
                    + (item.getDetalleCambio() == null ? "" : ": " + item.getDetalleCambio());
                    String motivoMovimiento = "Entrega de " + item.getInsumo().getNombre()
                        + " para solicitud #" + solicitudId + detalleCambio;
                    movimiento.setMotivo(motivoMovimiento.substring(0, Math.min(500, motivoMovimiento.length())));
            movimientoDepositoCentralRepository.save(movimiento);
        }

        boolean completa = itemsSolicitud.values().stream()
                .allMatch(item -> item.getCantidadEntregada() >= item.getCantidadSolicitada());
        solicitud.setEstado(completa ? EstadoReposicion.COMPLETADA : EstadoReposicion.PARCIAL);
        solicitud.setUsuarioUltimaGestion(coordinador);
        solicitud.setFechaUltimaGestion(LocalDateTime.now());
        SolicitudReposicion guardada = solicitudReposicionRepository.save(solicitud);
        notificacionService.crearNotificacionReposicion(guardada, !completa);
        return mapearSolicitud(guardada);
    }

    @Transactional
    public SolicitudReposicionDTO rechazarSolicitudReposicion(Long solicitudId, String motivo, Usuario coordinador) {
        exigirGuardiaCentralActivaSiCoordinador(coordinador);
        if (motivo == null || motivo.isBlank()) {
            throw new RuntimeException("El motivo del rechazo es obligatorio");
        }
        if (motivo.trim().length() > 500) {
            throw new RuntimeException("El motivo no puede superar 500 caracteres");
        }
        SolicitudReposicion solicitud = solicitudReposicionRepository.findByIdForUpdate(solicitudId)
                .orElseThrow(() -> new RuntimeException("No se encontró la solicitud " + solicitudId));
        validarSolicitudAbierta(solicitud);
        solicitud.setEstado(EstadoReposicion.RECHAZADA);
        solicitud.setMotivoResolucion(motivo.trim());
        solicitud.setUsuarioUltimaGestion(coordinador);
        solicitud.setFechaUltimaGestion(LocalDateTime.now());
        return mapearSolicitud(solicitudReposicionRepository.save(solicitud));
    }

    private void validarSolicitudAbierta(SolicitudReposicion solicitud) {
        if (solicitud.getEstado() != EstadoReposicion.PENDIENTE
                && solicitud.getEstado() != EstadoReposicion.PARCIAL) {
            throw new RuntimeException("La solicitud ya no está abierta para despacho");
        }
    }

    private void exigirGuardiaCentralActivaSiCoordinador(Usuario usuario) {
        if (usuario != null && usuario.getRol() == Rol.JEF) {
            guardiaRepository.findByEnfermeroUsernameAndEstadoAndTipoGuardia(
                            usuario.getUsername(), GuardiaEstado.ACTIVA,
                            com.sigem.backend.model.TipoGuardia.CENTRAL)
                    .orElseThrow(() -> new RuntimeException(
                            "Iniciá tu guardia en la central de operaciones para gestionar estas solicitudes"));
        }
    }

    @Transactional(readOnly = true)
    public EstadoControlGuardiaDTO obtenerEstadoControlGuardia(Usuario enfermero) {
        EstadoControlGuardiaDTO dto = new EstadoControlGuardiaDTO();
        guardiaRepository.findByEnfermeroUsernameAndEstado(
                        enfermero.getUsername(), GuardiaEstado.ACTIVA)
                .ifPresent(guardia -> {
                    dto.setGuardiaActiva(true);
                    dto.setMovilNumeroInterno(guardia.getMovil().getNumeroInterno());
                    dto.setControlCompletado(controlMovilRepository.existsByGuardia_IdAndEnfermero_Id(
                            guardia.getId(), enfermero.getId()));
                });
        return dto;
    }

    private String validarControlOMotivo(Usuario enfermero, Guardia guardia, String motivo) {
        boolean controlCompletado = controlMovilRepository.existsByGuardia_IdAndEnfermero_Id(
                guardia.getId(), enfermero.getId());
        if (controlCompletado) {
            return null;
        }
        if (motivo == null || motivo.isBlank()) {
            throw new RuntimeException(
                    "Debés completar el control del móvil de la guardia activa o indicar un motivo de excepción");
        }
        String motivoNormalizado = motivo.trim();
        if (motivoNormalizado.length() > 500) {
            throw new RuntimeException("El motivo de excepción no puede superar 500 caracteres");
        }
        return motivoNormalizado;
    }

    private void exigirPermisoReposicionInterna(Usuario usuario) {
        if (usuario == null || (usuario.getRol() != Rol.JEF && usuario.getRol() != Rol.ADM)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "No tenés permiso para gestionar solicitudes internas");
        }
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
        dto.setMovilNumeroInterno(solicitud.getMovil() == null
                ? null : solicitud.getMovil().getNumeroInterno());
        dto.setEnfermeroNombre(nombreCompleto(solicitud.getEnfermero()));
        dto.setSolicitanteId(solicitud.getEnfermero().getId());
        dto.setSolicitanteNombre(nombreCompleto(solicitud.getEnfermero()));
        dto.setFecha(solicitud.getFecha());
        dto.setFechaEmision(solicitud.getFecha());
        dto.setFechaEmisionEpochMillis(solicitud.getFecha()
                .atZone(ZoneId.systemDefault())
                .toInstant()
                .toEpochMilli());
        dto.setEstado(solicitud.getEstado());
        dto.setPrioridad(solicitud.getPrioridad());
        dto.setInterna(solicitud.isEsInterna());
        dto.setArchivado(solicitud.isArchivado());
        dto.setObservaciones(solicitud.getObservaciones());
        dto.setMotivoResolucion(solicitud.getMotivoResolucion());
        if (solicitud.getUsuarioUltimaGestion() != null) {
            dto.setUsuarioUltimaGestion(solicitud.getUsuarioUltimaGestion().getNombre() + " "
                + solicitud.getUsuarioUltimaGestion().getApellido());
        }
        dto.setFechaUltimaGestion(solicitud.getFechaUltimaGestion());
        dto.setMotivoExcepcionControl(solicitud.getMotivoExcepcionControl());
        if (solicitud.getUsuarioExcepcionControl() != null) {
            dto.setUsuarioExcepcionControl(nombreCompleto(solicitud.getUsuarioExcepcionControl()));
        }
        dto.setFechaExcepcionControl(solicitud.getFechaExcepcionControl());
        dto.setEntregas(movimientoDepositoCentralRepository
                .findBySolicitudIdOrderByFechaAsc(solicitud.getId()).stream()
                .filter(movimiento -> movimiento.getTipo() == TipoMovimientoDeposito.ENTREGA_REPOSICION)
                .map(this::mapearEntrega)
                .toList());
        dto.setItems(solicitudReposicionItemRepository.findBySolicitudId(solicitud.getId()).stream()
                .map(this::mapearItemReposicion)
                .toList());
        return dto;
    }

    private String nombreCompleto(Usuario usuario) {
        return usuario.getNombre() + " " + usuario.getApellido();
    }

    private ItemReposicionDTO mapearItemReposicion(SolicitudReposicionItem item) {
        ItemReposicionDTO dto = new ItemReposicionDTO();
        dto.setId(item.getId());
        dto.setInsumoId(item.getInsumo().getId());
        dto.setInsumoNombre(item.getInsumo().getNombre());
        dto.setCategoria(item.getInsumo().getCategoria());
        dto.setTipo(item.getInsumo().getTipo());
        dto.setCantidadSolicitada(item.getCantidadSolicitada());
        dto.setCantidadEntregada(item.getCantidadEntregada());
        dto.setCantidadActualAlMomento(item.getCantidadActualAlMomento());
        dto.setMotivoCambio(item.getMotivoCambio());
        dto.setDetalleCambio(item.getDetalleCambio());
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
        dto.setObservaciones(consumo.getObservaciones());
        dto.setMovilNumeroInterno(consumo.getMovil().getNumeroInterno());
        if (consumo.getIncidente() != null) {
            dto.setNumeroIncidente(consumo.getIncidente().getNumeroIncidente());
        }
        dto.setMotivoExcepcionControl(consumo.getMotivoExcepcionControl());
        if (consumo.getUsuarioExcepcionControl() != null) {
            dto.setUsuarioExcepcionControl(nombreCompleto(consumo.getUsuarioExcepcionControl()));
        }
        dto.setFechaExcepcionControl(consumo.getFechaExcepcionControl());
        return dto;
    }

    private ReposicionEntregaHistorialDTO mapearEntrega(MovimientoDepositoCentral movimiento) {
        ReposicionEntregaHistorialDTO dto = new ReposicionEntregaHistorialDTO();
        dto.setFecha(movimiento.getFecha());
        dto.setInsumoNombre(movimiento.getStock().getInsumo().getNombre());
        dto.setCantidad(movimiento.getCantidad());
        dto.setDetalle(movimiento.getMotivo());
        dto.setUsuario(nombreCompleto(movimiento.getUsuario()));
        return dto;
    }

    private InsumoStockDTO mapearStock(MovilInsumo movilInsumo, Integer cantidadRecomendada) {
        return mapearStock(movilInsumo.getInsumo(),
                movilInsumo.getCantidadActual(), cantidadRecomendada);
    }

    private InsumoStockDTO mapearStock(Insumo insumo, Integer cantidadActual, Integer cantidadRecomendada) {
        InsumoStockDTO dto = new InsumoStockDTO();
        dto.setInsumoId(insumo.getId());
        dto.setNombre(insumo.getNombre());
        dto.setCategoria(insumo.getCategoria());
        dto.setTipo(insumo.getTipo());
        dto.setUnidadMedida(insumo.getUnidadMedida());
        dto.setCantidadActual(cantidadActual);
        dto.setCantidadRecomendada(cantidadRecomendada);
        return dto;
    }
}