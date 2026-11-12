package com.sigem.backend.service;

import com.sigem.backend.dto.ControlCreateDTO;
import com.sigem.backend.dto.ControlItemInputDTO;
import com.sigem.backend.dto.ControlMovilDetalleDTO;
import com.sigem.backend.dto.ControlMovilItemDTO;
import com.sigem.backend.dto.ControlMovilResumenDTO;
import com.sigem.backend.dto.ControlPlantillaItemDTO;
import com.sigem.backend.model.CategoriaInsumo;
import com.sigem.backend.model.ControlMovil;
import com.sigem.backend.model.ControlMovilItem;
import com.sigem.backend.model.EstadoEquipo;
import com.sigem.backend.model.Guardia;
import com.sigem.backend.model.GuardiaEstado;
import com.sigem.backend.model.AsignacionEquipo;
import com.sigem.backend.model.EquipoMedico;
import com.sigem.backend.model.Insumo;
import com.sigem.backend.model.Movil;
import com.sigem.backend.model.MovilInsumo;
import com.sigem.backend.model.ResultadoControl;
import com.sigem.backend.model.Rol;
import com.sigem.backend.model.StockEstandarMovil;
import com.sigem.backend.model.TipoInsumo;
import com.sigem.backend.model.Usuario;
import com.sigem.backend.repository.ControlMovilItemRepository;
import com.sigem.backend.repository.ControlMovilRepository;
import com.sigem.backend.repository.AsignacionEquipoRepository;
import com.sigem.backend.repository.EquipoMedicoRepository;
import com.sigem.backend.repository.GuardiaRepository;
import com.sigem.backend.repository.InsumoRepository;
import com.sigem.backend.repository.MovilInsumoRepository;
import com.sigem.backend.repository.StockEstandarMovilRepository;
import com.sigem.backend.repository.TipoEquipoMedicoRepository;
import com.sigem.backend.repository.MovilRepository;
import com.sigem.backend.exception.ResourceConflictException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Service
public class ControlMovilService {

    private static final Set<String> NOMBRES_REQUIEREN_SERIE = Set.of(
        "desfibrilador", "electrocardiograma", "ciclador", "respirador");
    private static final Set<String> NOMBRES_REQUIEREN_TEST = Set.of(
        "desfibrilador", "electrocardiograma", "ciclador", "respirador",
        "laringoscopio", "oximetro", "glucometro");

    private final GuardiaRepository guardiaRepository;
    private final StockEstandarMovilRepository stockEstandarMovilRepository;
    private final MovilInsumoRepository movilInsumoRepository;
    private final InsumoRepository insumoRepository;
    private final ControlMovilRepository controlMovilRepository;
    private final ControlMovilItemRepository controlMovilItemRepository;
    private final TipoEquipoMedicoRepository tipoEquipoRepository;
    private final AsignacionEquipoRepository asignacionEquipoRepository;
    private final EquipoMedicoRepository equipoMedicoRepository;
    private final MovilRepository movilRepository;

    public ControlMovilService(GuardiaRepository guardiaRepository,
                              StockEstandarMovilRepository stockEstandarMovilRepository,
                              MovilInsumoRepository movilInsumoRepository,
                              InsumoRepository insumoRepository,
                              ControlMovilRepository controlMovilRepository,
                              ControlMovilItemRepository controlMovilItemRepository,
                              TipoEquipoMedicoRepository tipoEquipoRepository,
                              AsignacionEquipoRepository asignacionEquipoRepository,
                              EquipoMedicoRepository equipoMedicoRepository,
                              MovilRepository movilRepository) {
        this.guardiaRepository = guardiaRepository;
        this.stockEstandarMovilRepository = stockEstandarMovilRepository;
        this.movilInsumoRepository = movilInsumoRepository;
        this.insumoRepository = insumoRepository;
        this.controlMovilRepository = controlMovilRepository;
        this.controlMovilItemRepository = controlMovilItemRepository;
        this.tipoEquipoRepository = tipoEquipoRepository;
        this.asignacionEquipoRepository = asignacionEquipoRepository;
        this.equipoMedicoRepository = equipoMedicoRepository;
        this.movilRepository = movilRepository;
    }

    @Transactional(readOnly = true)
    public List<ControlPlantillaItemDTO> obtenerPlantilla(Usuario enfermero) {
        Guardia guardia = buscarGuardiaActiva(enfermero);
        Movil movil = guardia.getMovil();

        return stockEstandarMovilRepository.findByTipoMovil(movil.getTipoMovil()).stream()
            .filter(stock -> stock.getInsumo() != null && stock.getInsumo().isActivo())
                .sorted(Comparator
                        .comparing((StockEstandarMovil stock) -> stock.getInsumo().getCategoria().ordinal())
                        .thenComparing(stock -> stock.getInsumo().getNombre(), String.CASE_INSENSITIVE_ORDER))
                .map(stock -> mapearPlantillaItem(stock, movil.getId()))
                .toList();
    }

    @Transactional
    public ControlMovilDetalleDTO crearControl(Usuario enfermero, ControlCreateDTO dto) {
        if (dto == null) {
            throw new RuntimeException("El control no puede estar vacío");
        }
        if (dto.getItems() == null || dto.getItems().isEmpty()) {
            throw new RuntimeException("Debe completar al menos un insumo para guardar el control");
        }

        Guardia guardia = buscarGuardiaActiva(enfermero);
        Movil movil = movilRepository.findByIdForUpdate(guardia.getMovil().getId())
                .orElseThrow(() -> new RuntimeException("No existe el móvil de la guardia activa"));

        List<ControlPlantillaItemDTO> plantilla = obtenerPlantilla(enfermero);
        Map<Long, ControlPlantillaItemDTO> plantillaPorId = plantilla.stream()
                .collect(java.util.stream.Collectors.toMap(ControlPlantillaItemDTO::getInsumoId, item -> item, (a, b) -> a, LinkedHashMap::new));

        Set<Long> idsRecibidos = new LinkedHashSet<>();
        for (ControlItemInputDTO item : dto.getItems()) {
            if (item == null || item.getInsumoId() == null) {
                throw new RuntimeException("Cada ítem del control debe indicar un insumo");
            }
            if (!idsRecibidos.add(item.getInsumoId())) {
                String nombreDuplicado = plantillaPorId.get(item.getInsumoId()) != null
                        ? plantillaPorId.get(item.getInsumoId()).getNombre()
                        : "Insumo " + item.getInsumoId();
                throw new RuntimeException("Hay un insumo repetido en el control: " + nombreDuplicado);
            }
        }

        List<Long> faltantes = plantilla.stream()
                .map(ControlPlantillaItemDTO::getInsumoId)
                .filter(id -> !idsRecibidos.contains(id))
                .toList();

        List<Long> extras = idsRecibidos.stream()
                .filter(id -> !plantillaPorId.containsKey(id))
                .toList();

        if (!faltantes.isEmpty() || !extras.isEmpty()) {
            StringBuilder mensaje = new StringBuilder("El control no coincide con la plantilla");
            if (!faltantes.isEmpty()) {
                mensaje.append(": faltan insumos ")
                        .append(faltantes.stream()
                                .map(id -> plantillaPorId.getOrDefault(id, new ControlPlantillaItemDTO())
                                        .getNombre())
                                .filter(Objects::nonNull)
                                .toList());
            }
            if (!extras.isEmpty()) {
                mensaje.append("; sobran insumos ")
                        .append(extras.stream()
                                .map(id -> insumoRepository.findById(id)
                                        .map(Insumo::getNombre)
                                        .orElse("Insumo " + id))
                                .toList());
            }
            throw new RuntimeException(mensaje.toString());
        }

        // FASE 1: validación completa antes de cualquier modificación.
        for (ControlItemInputDTO item : dto.getItems()) {
            ControlPlantillaItemDTO plantillaItem = plantillaPorId.get(item.getInsumoId());
            if (plantillaItem == null) {
                throw new RuntimeException("El insumo indicado no está en la plantilla del móvil: " + item.getInsumoId());
            }
            validarAsignacionEquipoEnviada(plantillaItem, item, movil.getId());
            validarNovedadEquipo(plantillaItem, item);

            if (plantillaItem.getTipo() == TipoInsumo.CONSUMIBLE) {
                if (item.getCantidadContada() == null) {
                    throw new RuntimeException("El insumo " + plantillaItem.getNombre() + " debe tener cantidad contada");
                }
                if (item.getCantidadContada() < 0) {
                    throw new RuntimeException("La cantidad contada del insumo " + plantillaItem.getNombre() + " no puede ser negativa");
                }
            } else {
                if (item.getEstadoEquipo() == null) {
                    throw new RuntimeException("El insumo reutilizable " + plantillaItem.getNombre() + " debe indicar el estado del equipo");
                }

                if (item.getEstadoEquipo() == EstadoEquipo.FALTANTE) {
                    item.setNumeroSerie(null);
                    item.setTestOk(null);
                    continue;
                }

                if (plantillaItem.isRequiereSerie()) {
                    String numeroSerie = item.getNumeroSerie() == null ? "" : item.getNumeroSerie().trim();
                    if (numeroSerie.isEmpty()) {
                        throw new RuntimeException("El equipo " + plantillaItem.getNombre() + " requiere número de serie");
                    }
                    numeroSerie = numeroSerie.toUpperCase(Locale.ROOT);
                    if (numeroSerie.length() > 100) {
                        throw new RuntimeException("El número de serie de " + plantillaItem.getNombre() + " no puede superar 100 caracteres");
                    }
                    item.setNumeroSerie(numeroSerie);
                } else {
                    item.setNumeroSerie(null);
                }

                if (plantillaItem.isRequiereTest() && item.getTestOk() == null) {
                    throw new RuntimeException("El equipo " + plantillaItem.getNombre() + " requiere registrar el resultado del test");
                }
                if (plantillaItem.isRequiereTest() && Boolean.FALSE.equals(item.getTestOk())) {
                    item.setEstadoEquipo(EstadoEquipo.DEFECTUOSO);
                } else if (!plantillaItem.isRequiereTest()) {
                    item.setTestOk(null);
                }
            }

            if (plantillaItem.getTipo() == TipoInsumo.CONSUMIBLE) {
                item.setNumeroSerie(null);
                item.setTestOk(null);
            }
        }

        // FASE 2: guardar el control y reconciliar el stock real del móvil.
        ControlMovil control = new ControlMovil();
        control.setMovil(movil);
        control.setGuardia(guardia);
        control.setEnfermero(enfermero);
        control.setObservaciones(dto.getObservaciones());
        control.setTotalFaltantes(0);
        control.setTotalEquiposConNovedad(0);
        control.setTotalDiscrepanciasSistema(0);
        control.setResultado(ResultadoControl.CONFORME);

        ControlMovil controlGuardado = controlMovilRepository.save(control);

        int totalFaltantes = 0;
        int totalEquiposConNovedad = 0;
        int totalDiscrepanciasSistema = 0;
        List<ControlMovilItemDTO> itemsDetalle = new ArrayList<>();

        for (ControlItemInputDTO item : dto.getItems()) {
            ControlPlantillaItemDTO plantillaItem = plantillaPorId.get(item.getInsumoId());
            Insumo insumo = insumoRepository.findById(item.getInsumoId())
                    .orElseThrow(() -> new RuntimeException("No existe el insumo con id: " + item.getInsumoId()));

            Integer cantidadSistema = movilInsumoRepository.findByMovilIdAndInsumoId(movil.getId(), insumo.getId())
                    .map(MovilInsumo::getCantidadActual)
                    .orElse(0);

            Integer cantidadContada = calcularCantidadContada(plantillaItem, item);
            EstadoEquipo estadoEquipo = item.getEstadoEquipo();

            if (plantillaItem.getTipo() == TipoInsumo.REUTILIZABLE) {
                if (estadoEquipo == EstadoEquipo.FALTANTE) {
                    cantidadContada = 0;
                } else {
                    cantidadContada = plantillaItem.getCantidadRecomendada();
                }
            }

            if (plantillaItem.getTipo() == TipoInsumo.CONSUMIBLE) {
                MovilInsumo movilInsumo = movilInsumoRepository
                        .findByMovilIdAndInsumoId(movil.getId(), insumo.getId())
                        .orElseGet(() -> {
                            MovilInsumo nuevo = new MovilInsumo();
                            nuevo.setMovil(movil);
                            nuevo.setInsumo(insumo);
                            nuevo.setCantidadActual(0);
                            return nuevo;
                        });
                movilInsumo.setCantidadActual(cantidadContada);
                movilInsumoRepository.save(movilInsumo);
            }

            ControlMovilItem itemControl = new ControlMovilItem();
            itemControl.setControl(controlGuardado);
            itemControl.setInsumo(insumo);
            itemControl.setCantidadRecomendada(plantillaItem.getCantidadRecomendada());
            itemControl.setCantidadSistema(cantidadSistema);
            itemControl.setCantidadContada(cantidadContada);
            itemControl.setEstadoEquipo(estadoEquipo);
            itemControl.setObservacion(item.getObservacion());
            itemControl.setNumeroSerie(item.getNumeroSerie());
            itemControl.setEquipoMedico(plantillaItem.getEquipoMedicoId() == null
                    ? null
                    : equipoMedicoRepository.findById(plantillaItem.getEquipoMedicoId())
                            .orElseThrow(() -> new ResourceConflictException(
                                    "El equipo asignado cambió; actualice la plantilla del control")));
            itemControl.setTipoEquipoSnapshot(plantillaItem.getTipoEquipoSnapshot());
            itemControl.setNumeroSerieSnapshot(plantillaItem.getUltimoNumeroSerie());
            itemControl.setTestOk(item.getTestOk());
            itemControl.setEquipoNoCoincide(Boolean.TRUE.equals(item.getEquipoNoCoincide()));
            itemControl.setEquipoObservado(item.getEquipoObservado());
            controlMovilItemRepository.save(itemControl);

            if (cantidadContada < plantillaItem.getCantidadRecomendada()) {
                totalFaltantes++;
            }
            if (estadoEquipo == EstadoEquipo.DEFECTUOSO
                    || Boolean.TRUE.equals(item.getEquipoNoCoincide())) {
                totalEquiposConNovedad++;
            }
            if (plantillaItem.getTipo() == TipoInsumo.CONSUMIBLE
                    && !Objects.equals(cantidadContada, cantidadSistema)) {
                totalDiscrepanciasSistema++;
            }

            ControlMovilItemDTO itemDTO = new ControlMovilItemDTO();
            itemDTO.setInsumoNombre(plantillaItem.getNombre());
            itemDTO.setCategoria(insumo.getCategoria());
            itemDTO.setTipo(insumo.getTipo());
            itemDTO.setUnidadMedida(insumo.getUnidadMedida());
            itemDTO.setCantidadRecomendada(plantillaItem.getCantidadRecomendada());
            itemDTO.setCantidadSistema(cantidadSistema);
            itemDTO.setCantidadContada(cantidadContada);
            itemDTO.setEstadoEquipo(estadoEquipo);
            itemDTO.setObservacion(item.getObservacion());
            itemDTO.setNumeroSerie(plantillaItem.getUltimoNumeroSerie() != null
                    ? plantillaItem.getUltimoNumeroSerie() : item.getNumeroSerie());
            itemDTO.setEquipoMedicoId(plantillaItem.getEquipoMedicoId());
            itemDTO.setTipoEquipoSnapshot(plantillaItem.getTipoEquipoSnapshot());
            itemDTO.setNumeroSerieSnapshot(plantillaItem.getUltimoNumeroSerie());
            itemDTO.setTestOk(item.getTestOk());
            itemDTO.setEquipoNoCoincide(Boolean.TRUE.equals(item.getEquipoNoCoincide()));
            itemDTO.setEquipoObservado(item.getEquipoObservado());
            itemsDetalle.add(itemDTO);
        }

        controlGuardado.setTotalFaltantes(totalFaltantes);
        controlGuardado.setTotalEquiposConNovedad(totalEquiposConNovedad);
        controlGuardado.setTotalDiscrepanciasSistema(totalDiscrepanciasSistema);
        controlGuardado.setResultado((totalFaltantes > 0 || totalEquiposConNovedad > 0)
                ? ResultadoControl.CON_NOVEDADES
                : ResultadoControl.CONFORME);
        controlMovilRepository.save(controlGuardado);

        ControlMovilDetalleDTO detalle = new ControlMovilDetalleDTO();
        detalle.setId(controlGuardado.getId());
        detalle.setFecha(controlGuardado.getFecha());
        detalle.setMovilId(movil.getId());
        detalle.setMovilNumeroInterno(movil.getNumeroInterno());
        detalle.setMovilPatente(movil.getPatente());
        detalle.setEnfermeroNombre(enfermero.getNombre() + " " + enfermero.getApellido());
        detalle.setResultado(controlGuardado.getResultado());
        detalle.setTotalFaltantes(controlGuardado.getTotalFaltantes());
        detalle.setTotalEquiposConNovedad(controlGuardado.getTotalEquiposConNovedad());
        detalle.setTotalDiscrepanciasSistema(controlGuardado.getTotalDiscrepanciasSistema());
        detalle.setObservaciones(dto.getObservaciones());
        detalle.setItems(itemsDetalle);
        return detalle;
    }

    @Transactional(readOnly = true)
    public List<ControlMovilResumenDTO> listarMisControles(Usuario enfermero) {
        return controlMovilRepository.findByEnfermeroUsernameOrderByFechaDesc(enfermero.getUsername())
                .stream()
                .map(this::mapearResumen)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ControlMovilResumenDTO> listarTodos() {
        return controlMovilRepository.findAllByOrderByFechaDesc()
                .stream()
                .map(this::mapearResumen)
                .toList();
    }

    @Transactional(readOnly = true)
    public ControlMovilDetalleDTO obtenerDetalle(Long id, Usuario solicitante) {
        ControlMovil control = controlMovilRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("No se encontró el control con id: " + id));

        if (solicitante.getRol() == Rol.ENF && !control.getEnfermero().getId().equals(solicitante.getId())) {
            throw new RuntimeException("No podés ver un control que no es tuyo");
        }

        List<ControlMovilItem> items = controlMovilItemRepository.findByControlId(control.getId());
        ControlMovilDetalleDTO detalle = mapearDetalle(control);
        detalle.setItems(items.stream().map(this::mapearItemDetalle).toList());
        return detalle;
    }

    private Guardia buscarGuardiaActiva(Usuario enfermero) {
        return guardiaRepository.findByEnfermeroUsernameAndEstado(enfermero.getUsername(), GuardiaEstado.ACTIVA)
                .orElseThrow(() -> new RuntimeException(
                        "No tenés una guardia activa, no hay móvil para controlar"));
    }

    private ControlPlantillaItemDTO mapearPlantillaItem(StockEstandarMovil stock, Long movilId) {
        Insumo insumo = stock.getInsumo();
        ControlPlantillaItemDTO dto = new ControlPlantillaItemDTO();
        dto.setInsumoId(insumo.getId());
        dto.setNombre(insumo.getNombre());
        dto.setCategoria(insumo.getCategoria());
        dto.setTipo(insumo.getTipo());
        dto.setUnidadMedida(insumo.getUnidadMedida());
        dto.setCantidadRecomendada(stock.getCantidadRecomendada());

        if (insumo.getTipo() == TipoInsumo.REUTILIZABLE) {
            String nombreNormalizado = normalizarNombre(insumo.getNombre());
            dto.setRequiereSerie(NOMBRES_REQUIEREN_SERIE.stream().anyMatch(nombreNormalizado::contains));
            dto.setRequiereTest(NOMBRES_REQUIEREN_TEST.stream().anyMatch(nombreNormalizado::contains));
            var tipoEquipo = tipoEquipoRepository.findByInsumoId(insumo.getId()).orElse(null);
            if (tipoEquipo != null) {
                dto.setNombre(tipoEquipo.getNombre());
                dto.setTipoEquipoSnapshot(tipoEquipo.getCodigo());
                dto.setRequiereSerie(true);
                AsignacionEquipo asignacion = obtenerAsignacionActivaPorTipo(movilId, tipoEquipo.getCodigo());
                if (asignacion != null) {
                            dto.setEquipoMedicoId(asignacion.getEquipo().getId());
                            dto.setAsignacionEquipoId(asignacion.getId());
                            dto.setUltimoNumeroSerie(asignacion.getEquipo().getNumeroSerie());
                }
            }
            if (dto.getTipoEquipoSnapshot() != null && dto.getEquipoMedicoId() == null) {
                dto.setUltimoNumeroSerie(null);
            }
        }
        return dto;
    }

    private void validarNovedadEquipo(ControlPlantillaItemDTO plantillaItem, ControlItemInputDTO item) {
        boolean noCoincide = Boolean.TRUE.equals(item.getEquipoNoCoincide());
        String equipoObservado = item.getEquipoObservado() == null
                ? null : item.getEquipoObservado().trim();

        if (equipoObservado != null && equipoObservado.length() > 500) {
            throw new IllegalArgumentException("La descripción del equipo observado no puede superar 500 caracteres");
        }
        if (noCoincide && (plantillaItem.getTipoEquipoSnapshot() == null
                || plantillaItem.getEquipoMedicoId() == null
                || item.getEstadoEquipo() == EstadoEquipo.FALTANTE)) {
            throw new IllegalArgumentException(
                    "Solo se puede informar una discrepancia cuando hay un equipo médico asignado");
        }
        if (!noCoincide && equipoObservado != null && !equipoObservado.isBlank()) {
            throw new IllegalArgumentException(
                    "Indicá si el equipo físico no coincide antes de informar el equipo observado");
        }
        item.setEquipoObservado(noCoincide && equipoObservado != null && !equipoObservado.isBlank()
                ? equipoObservado : null);
    }

    private void validarAsignacionEquipoEnviada(
            ControlPlantillaItemDTO plantillaItem, ControlItemInputDTO item, Long movilId) {
        if (plantillaItem.getTipoEquipoSnapshot() == null) return;

        Long asignacionActualId = plantillaItem.getAsignacionEquipoId();
        if (!Boolean.TRUE.equals(item.getAsignacionEquipoEnviada())
                || !Objects.equals(item.getAsignacionEquipoId(), asignacionActualId)) {
            throw new ResourceConflictException(
                    "La identificación de la asignación vigente es obligatoria y debe coincidir; actualice la plantilla");
        }

        AsignacionEquipo asignacionPersistida =
                obtenerAsignacionActivaPorTipo(movilId, plantillaItem.getTipoEquipoSnapshot());
        Long asignacionPersistidaId = asignacionPersistida == null ? null : asignacionPersistida.getId();
        if (!Objects.equals(asignacionPersistidaId, asignacionActualId)
                || (asignacionPersistida != null
                    && !Objects.equals(asignacionPersistida.getEquipo().getId(), plantillaItem.getEquipoMedicoId()))) {
            throw new ResourceConflictException(
                    "La asignación del equipo cambió; actualice la plantilla antes de guardar el control");
        }

        if (item.getEstadoEquipo() == EstadoEquipo.FALTANTE) return;
        if (asignacionPersistida == null || plantillaItem.getUltimoNumeroSerie() == null) {
            throw new ResourceConflictException(
                    "No hay una asignación vigente para este equipo; actualice la plantilla del control");
        }
        String seriePersistida = asignacionPersistida.getEquipo().getNumeroSerie();
        String serieEnviada = item.getNumeroSerie() == null ? "" : item.getNumeroSerie().trim();
        if (seriePersistida == null
                || !Objects.equals(plantillaItem.getUltimoNumeroSerie(), seriePersistida)
                || !seriePersistida.equalsIgnoreCase(serieEnviada)) {
            throw new ResourceConflictException(
                    "La asignación o número de serie del equipo cambió; actualice la plantilla del control");
        }
    }

    private String normalizarNombre(String nombre) {
        return Normalizer.normalize(nombre == null ? "" : nombre, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT);
    }

    private AsignacionEquipo obtenerAsignacionActivaPorTipo(Long movilId, String tipoEquipo) {
        List<AsignacionEquipo> asignaciones = asignacionEquipoRepository
                .findActivaPorMovilYTipo(movilId, tipoEquipo);
        if (asignaciones.size() > 1) {
            throw new ResourceConflictException(
                    "El móvil tiene varias asignaciones activas del equipo " + tipoEquipo
                            + "; requiere revisión antes de guardar el control");
        }
        return asignaciones.isEmpty() ? null : asignaciones.get(0);
    }

    private Integer calcularCantidadContada(ControlPlantillaItemDTO plantillaItem, ControlItemInputDTO item) {
        if (plantillaItem.getTipo() == TipoInsumo.CONSUMIBLE) {
            return item.getCantidadContada();
        }
        if (item.getEstadoEquipo() == EstadoEquipo.FALTANTE) {
            return 0;
        }
        return plantillaItem.getCantidadRecomendada();
    }

    private ControlMovilResumenDTO mapearResumen(ControlMovil control) {
        ControlMovilResumenDTO dto = new ControlMovilResumenDTO();
        dto.setId(control.getId());
        dto.setFecha(control.getFecha());
        dto.setMovilId(control.getMovil().getId());
        dto.setMovilNumeroInterno(control.getMovil().getNumeroInterno());
        dto.setMovilPatente(control.getMovil().getPatente());
        dto.setEnfermeroNombre(control.getEnfermero().getNombre() + " " + control.getEnfermero().getApellido());
        dto.setResultado(control.getResultado());
        dto.setTotalFaltantes(control.getTotalFaltantes());
        dto.setTotalEquiposConNovedad(control.getTotalEquiposConNovedad());
        dto.setTotalDiscrepanciasSistema(control.getTotalDiscrepanciasSistema());
        return dto;
    }

    private ControlMovilDetalleDTO mapearDetalle(ControlMovil control) {
        ControlMovilDetalleDTO dto = new ControlMovilDetalleDTO();
        dto.setId(control.getId());
        dto.setFecha(control.getFecha());
        dto.setMovilId(control.getMovil().getId());
        dto.setMovilNumeroInterno(control.getMovil().getNumeroInterno());
        dto.setMovilPatente(control.getMovil().getPatente());
        dto.setEnfermeroNombre(control.getEnfermero().getNombre() + " " + control.getEnfermero().getApellido());
        dto.setResultado(control.getResultado());
        dto.setTotalFaltantes(control.getTotalFaltantes());
        dto.setTotalEquiposConNovedad(control.getTotalEquiposConNovedad());
        dto.setTotalDiscrepanciasSistema(control.getTotalDiscrepanciasSistema());
        dto.setObservaciones(control.getObservaciones());
        return dto;
    }

    private ControlMovilItemDTO mapearItemDetalle(ControlMovilItem item) {
        ControlMovilItemDTO dto = new ControlMovilItemDTO();
        String nombreTipoEquipo = item.getTipoEquipoSnapshot() == null
                ? null
                : tipoEquipoRepository.findById(item.getTipoEquipoSnapshot())
                        .map(com.sigem.backend.model.TipoEquipoMedico::getNombre)
                        .orElse(null);
        dto.setInsumoNombre(nombreTipoEquipo == null
                ? item.getInsumo().getNombre() : nombreTipoEquipo);
        dto.setCategoria(item.getInsumo().getCategoria());
        dto.setTipo(item.getInsumo().getTipo());
        dto.setUnidadMedida(item.getInsumo().getUnidadMedida());
        dto.setCantidadRecomendada(item.getCantidadRecomendada());
        dto.setCantidadSistema(item.getCantidadSistema());
        dto.setCantidadContada(item.getCantidadContada());
        dto.setEstadoEquipo(item.getEstadoEquipo());
        dto.setObservacion(item.getObservacion());
        dto.setNumeroSerie(item.getNumeroSerieSnapshot() == null
                ? item.getNumeroSerie() : item.getNumeroSerieSnapshot());
        dto.setEquipoMedicoId(item.getEquipoMedico() == null ? null : item.getEquipoMedico().getId());
        dto.setTipoEquipoSnapshot(item.getTipoEquipoSnapshot());
        dto.setNumeroSerieSnapshot(item.getNumeroSerieSnapshot() == null
                ? item.getNumeroSerie() : item.getNumeroSerieSnapshot());
        dto.setTestOk(item.getTestOk());
        dto.setEquipoNoCoincide(item.isEquipoNoCoincide());
        dto.setEquipoObservado(item.getEquipoObservado());
        return dto;
    }
}
