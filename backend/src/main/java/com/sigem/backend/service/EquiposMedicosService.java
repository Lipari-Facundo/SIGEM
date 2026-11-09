package com.sigem.backend.service;

import com.sigem.backend.dto.EquipoCorreccionDTO;
import com.sigem.backend.dto.EquipoClasificacionDTO;
import com.sigem.backend.dto.EquipoHistorialDTO;
import com.sigem.backend.dto.EquipoInsumoDTO;
import com.sigem.backend.dto.EquipoMantenimientoDTO;
import com.sigem.backend.dto.EquipoMovilOpcionDTO;
import com.sigem.backend.dto.EquipoMedicoCreateDTO;
import com.sigem.backend.dto.EquipoMedicoDTO;
import com.sigem.backend.dto.EquipoMovimientoDTO;
import com.sigem.backend.dto.EquipoOperativoMovilDTO;
import com.sigem.backend.dto.EquipoReemplazoDTO;
import com.sigem.backend.dto.EquipoResponsableDTO;
import com.sigem.backend.dto.TipoEquipoMedicoDTO;
import com.sigem.backend.model.CategoriaInsumo;
import com.sigem.backend.exception.ResourceConflictException;
import com.sigem.backend.exception.ResourceNotFoundException;
import com.sigem.backend.model.AsignacionEquipo;
import com.sigem.backend.model.EquipoMedico;
import com.sigem.backend.model.EstadoEquipoMedico;
import com.sigem.backend.model.EstadoMovil;
import com.sigem.backend.model.MantenimientoEquipo;
import com.sigem.backend.model.Movil;
import com.sigem.backend.model.Insumo;
import com.sigem.backend.model.MovimientoEquipo;
import com.sigem.backend.model.MovimientoEquipoDetalle;
import com.sigem.backend.model.Rol;
import com.sigem.backend.model.TipoEquipoMedico;
import com.sigem.backend.model.TipoMantenimientoEquipo;
import com.sigem.backend.model.TipoMovimientoEquipo;
import com.sigem.backend.model.TipoInsumo;
import com.sigem.backend.model.UbicacionEquipoMedico;
import com.sigem.backend.model.Usuario;
import com.sigem.backend.repository.AsignacionEquipoRepository;
import com.sigem.backend.repository.EquipoMedicoRepository;
import com.sigem.backend.repository.MantenimientoEquipoRepository;
import com.sigem.backend.repository.MovilRepository;
import com.sigem.backend.repository.MovimientoEquipoDetalleRepository;
import com.sigem.backend.repository.MovimientoEquipoRepository;
import com.sigem.backend.repository.InsumoRepository;
import com.sigem.backend.repository.TipoEquipoMedicoRepository;
import com.sigem.backend.repository.UsuarioRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class EquiposMedicosService {
    private static final Map<String, String> TIPOS = Map.of(
            "ELECTROCARDIOGRAFO", "Electrocardiógrafo",
            "CARDIODESFIBRILADOR", "Cardiodesfibrilador",
            "RESPIRADOR", "Respirador");
    private static final Set<Rol> ROLES_AUTORIZADOS = Set.of(Rol.ADM, Rol.JEF, Rol.COORD_ENF);

    private final EquipoMedicoRepository equipoRepository;
    private final TipoEquipoMedicoRepository tipoRepository;
    private final AsignacionEquipoRepository asignacionRepository;
    private final MovilRepository movilRepository;
    private final MovimientoEquipoRepository movimientoRepository;
    private final MovimientoEquipoDetalleRepository detalleRepository;
    private final MantenimientoEquipoRepository mantenimientoRepository;
    private final UsuarioRepository usuarioRepository;
    private final InsumoRepository insumoRepository;
    private final EquiposOperativosMovilService equiposOperativosMovilService;

    public EquiposMedicosService(
            EquipoMedicoRepository equipoRepository,
            TipoEquipoMedicoRepository tipoRepository,
            AsignacionEquipoRepository asignacionRepository,
            MovilRepository movilRepository,
            MovimientoEquipoRepository movimientoRepository,
            MovimientoEquipoDetalleRepository detalleRepository,
            MantenimientoEquipoRepository mantenimientoRepository,
            UsuarioRepository usuarioRepository,
            InsumoRepository insumoRepository,
            EquiposOperativosMovilService equiposOperativosMovilService) {
        this.equipoRepository = equipoRepository;
        this.tipoRepository = tipoRepository;
        this.asignacionRepository = asignacionRepository;
        this.movilRepository = movilRepository;
        this.movimientoRepository = movimientoRepository;
        this.detalleRepository = detalleRepository;
        this.mantenimientoRepository = mantenimientoRepository;
        this.usuarioRepository = usuarioRepository;
        this.insumoRepository = insumoRepository;
        this.equiposOperativosMovilService = equiposOperativosMovilService;
    }

    @Transactional(readOnly = true)
    public List<TipoEquipoMedicoDTO> listarTipos(Usuario actor) {
        validarAcceso(actor);
        return tipoRepository.findAllByOrderByNombreAsc().stream()
                .filter(tipo -> TIPOS.containsKey(tipo.getCodigo()))
                .map(tipo -> new TipoEquipoMedicoDTO(
                        tipo.getCodigo(), tipo.getNombre(),
                        tipo.getInsumo() == null ? null : tipo.getInsumo().getId(),
                        tipo.getInsumo() == null ? null : tipo.getInsumo().getNombre()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EquipoInsumoDTO> listarInsumosReutilizables(Usuario actor) {
        validarAcceso(actor);
        return insumoRepository.findByCategoriaAndTipoAndActivoTrueOrderByNombreAsc(
                        CategoriaInsumo.EQUIPO_MEDICO, TipoInsumo.REUTILIZABLE)
                .stream().map(insumo -> new EquipoInsumoDTO(insumo.getId(), insumo.getNombre())).toList();
    }

    @Transactional
    public TipoEquipoMedicoDTO asociarInsumo(Usuario actor, String tipoCodigo, Long insumoId) {
        validarAcceso(actor);
        String codigo = normalizarTipo(tipoCodigo);
        TipoEquipoMedico tipo = tipoRepository.findById(codigo)
                .orElseThrow(() -> new ResourceNotFoundException("El tipo de equipo no existe"));
        Insumo insumo = insumoRepository.findById(insumoId)
                .orElseThrow(() -> new ResourceNotFoundException("El insumo seleccionado no existe"));
        if (!insumo.isActivo() || insumo.getCategoria() != CategoriaInsumo.EQUIPO_MEDICO
                || insumo.getTipo() != TipoInsumo.REUTILIZABLE) {
            throw new IllegalArgumentException("La asociación requiere un insumo activo de tipo equipo reutilizable");
        }
        if (tipoRepository.existsByInsumoIdAndCodigoNot(insumoId, codigo)) {
            throw new ResourceConflictException("El insumo ya está asociado a otro tipo de equipo médico");
        }
        tipo.setInsumo(insumo);
        tipoRepository.saveAndFlush(tipo);
        return new TipoEquipoMedicoDTO(tipo.getCodigo(), tipo.getNombre(), insumo.getId(), insumo.getNombre());
    }

    @Transactional
    public TipoEquipoMedicoDTO desvincularInsumo(Usuario actor, String tipoCodigo) {
        validarAcceso(actor);
        String codigo = normalizarTipo(tipoCodigo);
        TipoEquipoMedico tipo = tipoRepository.findById(codigo)
                .orElseThrow(() -> new ResourceNotFoundException("El tipo de equipo no existe"));
        tipo.setInsumo(null);
        tipoRepository.saveAndFlush(tipo);
        return new TipoEquipoMedicoDTO(tipo.getCodigo(), tipo.getNombre(), null, null);
    }

    @Transactional(readOnly = true)
    public List<EquipoMovilOpcionDTO> listarMoviles(Usuario actor) {
        validarAcceso(actor);
        return movilRepository.findByEstadoMovil(EstadoMovil.OPERATIVO).stream()
                .sorted(Comparator.comparing(Movil::getNumeroInterno))
                .map(movil -> new EquipoMovilOpcionDTO(movil.getId(),
                        movil.getNumeroInterno() + " · " + movil.getPatente()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EquipoResponsableDTO> listarResponsables(Usuario actor) {
        validarAcceso(actor);
        return usuarioRepository.findByRolAndActivoTrueAndDisponibleTrueOrderByApellidoAscNombreAsc(Rol.ENF)
                .stream()
                .map(usuario -> new EquipoResponsableDTO(usuario.getId(),
                        usuario.getNombre() + " " + usuario.getApellido()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EquipoMedicoDTO> listarInventario(
            Usuario actor, String tipo, String estado, String ubicacion, String mantenimiento) {
        validarAcceso(actor);
        if (tipo != null && !tipo.isBlank()) normalizarTipo(tipo);
        EstadoEquipoMedico estadoFiltro = parseEnum(estado, EstadoEquipoMedico.class, "estado");
        UbicacionEquipoMedico ubicacionFiltro = parseEnum(ubicacion, UbicacionEquipoMedico.class, "ubicación");
        if (mantenimiento != null && !mantenimiento.isBlank()
                && !Set.of("SIN_REGISTRO", "VIGENTE", "PROXIMO_A_VENCER", "VENCIDO")
                        .contains(mantenimiento.trim().toUpperCase(Locale.ROOT))) {
            throw new IllegalArgumentException("Valor de mantenimiento no válido");
        }
        return equipoRepository.findAll().stream()
                .filter(equipo -> equipo.getTipoEquipo() != null
                        && TIPOS.containsKey(equipo.getTipoEquipo().getCodigo()))
                .filter(equipo -> tipo == null || tipo.isBlank()
                        || tipo.equals(equipo.getTipoEquipo().getCodigo()))
                .filter(equipo -> estadoFiltro == null || equipo.getEstado() == estadoFiltro)
                .map(this::mapearEquipo)
                .filter(dto -> ubicacionFiltro == null || dto.ubicacion().equals(ubicacionFiltro.name()))
                .filter(dto -> mantenimiento == null || mantenimiento.isBlank()
                        || dto.mantenimientoPreventivo().equalsIgnoreCase(mantenimiento))
                .sorted(Comparator.comparing(EquipoMedicoDTO::tipo, Comparator.nullsLast(String::compareTo))
                        .thenComparing(EquipoMedicoDTO::numeroSerie))
                .toList();
    }

    @Transactional(readOnly = true)
    public EquipoMedicoDTO obtenerEquipo(Usuario actor, Long id) {
        validarAcceso(actor);
        EquipoMedico equipo = obtenerEquipo(id);
        if (equipo.getTipoEquipo() == null || !TIPOS.containsKey(equipo.getTipoEquipo().getCodigo())) {
            throw new ResourceNotFoundException("El equipo no pertenece al módulo de Equipos Médicos");
        }
        return mapearEquipo(equipo);
    }

    @Transactional
    public EquipoMedicoDTO registrarEquipo(Usuario actor, EquipoMedicoCreateDTO dto) {
        validarAcceso(actor);
        String codigo = normalizarTipo(dto.tipo());
        TipoEquipoMedico tipo = tipoRepository.findById(codigo)
                .orElseThrow(() -> new ResourceNotFoundException("El tipo de equipo no existe en el catálogo"));
        if (dto.numeroSerie() == null || dto.numeroSerie().isBlank()) {
            throw new IllegalArgumentException("El número de serie es obligatorio");
        }
        String serie = dto.numeroSerie().trim();
        if (equipoRepository.existsByNumeroSerie(serie)) {
            throw new ResourceConflictException("El número de serie ya está registrado");
        }

        EquipoMedico equipo = new EquipoMedico();
        equipo.setNombre(tipo.getNombre());
        equipo.setTipoEquipo(tipo);
        equipo.setNumeroSerie(serie);
        equipo.setMarca(limpiar(dto.marca()));
        equipo.setModelo(limpiar(dto.modelo()));
        equipo.setEstado(EstadoEquipoMedico.OPERATIVO);
        EquipoMedico creado;
        try {
            creado = equipoRepository.saveAndFlush(equipo);
        } catch (DataIntegrityViolationException exception) {
            throw new ResourceConflictException("El número de serie ya está registrado");
        }
        MovimientoEquipo movimiento = crearMovimiento(
                TipoMovimientoEquipo.ALTA, actor, null, "ALTA", "Registro inicial", null);
        guardarDetalle(movimiento, creado, null, creado.getEstado(), null,
                UbicacionEquipoMedico.DEPOSITO_ENFERMERIA, null, null);
        return mapearEquipo(creado);
    }

    @Transactional
    public EquipoHistorialDTO clasificarEquipoExistente(
            Usuario actor, Long equipoId, EquipoClasificacionDTO dto) {
        validarAcceso(actor);
        String codigo = normalizarTipo(dto.tipo());
        TipoEquipoMedico tipo = tipoRepository.findById(codigo)
                .orElseThrow(() -> new ResourceNotFoundException("El tipo de equipo no existe en el catálogo"));
        AsignacionEquipo asignacionInicial = asignacionRepository.findByEquipoIdAndActivoTrue(equipoId).orElse(null);
        Movil movilBloqueado = asignacionInicial == null ? null : bloquearMovil(asignacionInicial.getMovil().getId());
        EquipoMedico equipo = bloquearEquipo(equipoId);
        AsignacionEquipo asignacion = asignacionRepository.findByEquipoIdAndActivoTrue(equipoId).orElse(null);
        if (equipo.getTipoEquipo() != null) {
            throw new ResourceConflictException("El equipo ya tiene un tipo clasificado");
        }
        if (asignacion != null && (movilBloqueado == null
                || !Objects.equals(asignacion.getMovil().getId(), movilBloqueado.getId()))) {
            throw new ResourceConflictException("La asignación del equipo cambió; intente nuevamente");
        }
        if (asignacion != null && asignacion.getTipoEquipo() != null
                && !asignacion.getTipoEquipo().getCodigo().equals(codigo)) {
            throw new ResourceConflictException("El tipo de la asignación vigente no coincide con la clasificación");
        }
        equipo.setTipoEquipo(tipo);
        equipoRepository.saveAndFlush(equipo);
        if (asignacion != null) {
            validarNoDuplicidadPorTipo(asignacion.getMovil().getId(), codigo, asignacion.getId());
            asignacion.setTipoEquipo(tipo);
            asignacionRepository.saveAndFlush(asignacion);
        }
        UbicacionEquipoMedico ubicacion = ubicacionDesdeEstado(equipo.getEstado(), asignacion);
        MovimientoEquipo movimiento = crearMovimiento(TipoMovimientoEquipo.CLASIFICACION, actor, null,
                "CLASIFICACION_TIPO", dto.observaciones(), null);
        guardarDetalle(movimiento, equipo, equipo.getEstado(), equipo.getEstado(),
                ubicacion, ubicacion,
                asignacion == null ? null : asignacion.getMovil(),
                asignacion == null ? null : asignacion.getMovil());
        return mapearDetalleMovimiento(movimiento, detalleRepository.findByMovimientoId(movimiento.getId()).get(0));
    }

    @Transactional
    public EquipoMedicoDTO darDeBaja(Usuario actor, Long equipoId, String motivo, String observaciones) {
        validarAcceso(actor);
        if (motivo == null || motivo.isBlank()) {
            throw new IllegalArgumentException("El motivo de baja es obligatorio");
        }
        AsignacionEquipo asignacionInicial = asignacionRepository.findByEquipoIdAndActivoTrue(equipoId).orElse(null);
        Movil movilBloqueado = asignacionInicial == null ? null : bloquearMovil(asignacionInicial.getMovil().getId());
        EquipoMedico equipo = bloquearEquipo(equipoId);
        AsignacionEquipo asignacion = asignacionRepository.findByEquipoIdAndActivoTrue(equipoId).orElse(null);
        if (equipo.getEstado() == EstadoEquipoMedico.BAJA) {
            throw new ResourceConflictException("El equipo ya está dado de baja");
        }
        if (asignacion != null) {
            if (movilBloqueado == null || !Objects.equals(asignacion.getMovil().getId(), movilBloqueado.getId())) {
                throw new ResourceConflictException("La asignación del equipo cambió; actualice la pantalla");
            }
            cerrarAsignacion(asignacion);
        }
        EstadoEquipoMedico anterior = equipo.getEstado();
        equipo.setEstado(EstadoEquipoMedico.BAJA);
        equipoRepository.save(equipo);
        MovimientoEquipo movimiento = crearMovimiento(TipoMovimientoEquipo.BAJA, actor, null,
                motivo.trim(), observaciones, null);
        guardarDetalle(movimiento, equipo, anterior, equipo.getEstado(),
                ubicacionDesdeEstado(anterior, asignacion),
                UbicacionEquipoMedico.RETIRADO_BAJA,
                asignacion == null ? null : asignacion.getMovil(), null);
        return mapearEquipo(equipo);
    }

    @Transactional
    public EquipoHistorialDTO asignarInicialmente(Usuario actor, EquipoMovimientoDTO dto) {
        validarAcceso(actor);
        if (dto.movilId() == null) {
            throw new IllegalArgumentException("El móvil es obligatorio para la asignación");
        }
        Movil movil = bloquearMovil(dto.movilId());
        validarMovilOperativo(movil);
        EquipoMedico equipo = bloquearEquipo(dto.equipoId());
        validarElegibleParaAsignar(equipo);
        if (asignacionRepository.findByEquipoIdAndActivoTrue(equipo.getId()).isPresent()) {
            throw new ResourceConflictException("El equipo ya está asignado a un móvil");
        }
        validarNoDuplicidadPorTipo(movil.getId(), codigoTipo(equipo), null);
        Usuario responsable = obtenerResponsable(dto.responsableId());
        EstadoEquipoMedico anterior = equipo.getEstado();
        equipo.setEstado(EstadoEquipoMedico.OPERATIVO);
        equipoRepository.save(equipo);
        crearAsignacion(equipo, movil, actor);
        MovimientoEquipo movimiento = crearMovimiento(TipoMovimientoEquipo.ASIGNACION, actor, responsable,
                dto.motivo(), dto.observaciones(), null);
        guardarDetalle(movimiento, equipo, anterior, equipo.getEstado(),
                ubicacionDesdeEstado(anterior, null), UbicacionEquipoMedico.MOVIL, null, movil);
        return mapearDetalleMovimiento(movimiento, detalleRepository.findByMovimientoId(movimiento.getId()).get(0));
    }

    @Transactional
    public List<EquipoHistorialDTO> reemplazar(Usuario actor, EquipoReemplazoDTO dto) {
        validarAcceso(actor);
        if (dto.equipoSalienteId().equals(dto.equipoEntranteId())) {
            throw new IllegalArgumentException("El equipo saliente y el entrante deben ser distintos");
        }
        if (dto.motivo() == null || !Set.of("EQUIPO_AVERIADO", "CAMBIO_EQUIPO").contains(dto.motivo())) {
            throw new IllegalArgumentException("El motivo debe ser EQUIPO_AVERIADO o CAMBIO_EQUIPO");
        }
        Movil movil = bloquearMovil(dto.movilId());
        validarMovilOperativo(movil);
        AsignacionEquipo actual = asignacionRepository.findByEquipoIdAndActivoTrue(dto.equipoSalienteId())
                .orElseThrow(() -> new ResourceConflictException("El equipo saliente no tiene asignación activa"));
        if (!actual.getMovil().getId().equals(movil.getId())) {
            throw new ResourceConflictException("El equipo saliente ya no está asignado al móvil seleccionado");
        }
        EquipoMedico saliente = bloquearEquipo(dto.equipoSalienteId());
        EquipoMedico entrante = bloquearEquipo(dto.equipoEntranteId());
        if (saliente.getTipoEquipo() == null || entrante.getTipoEquipo() == null
                || !saliente.getTipoEquipo().getCodigo().equals(entrante.getTipoEquipo().getCodigo())) {
            throw new IllegalArgumentException("Los equipos del reemplazo deben ser del mismo tipo");
        }
        if (!actual.isActivo()) {
            throw new ResourceConflictException("La asignación del equipo saliente ya no está activa");
        }
        validarElegibleParaAsignar(entrante);
        if (asignacionRepository.findByEquipoIdAndActivoTrue(entrante.getId()).isPresent()) {
            throw new ResourceConflictException("El equipo entrante ya está asignado");
        }
        validarNoDuplicidadPorTipo(movil.getId(), codigoTipo(entrante), actual.getId());

        Usuario responsable = obtenerResponsable(dto.responsableId());
        EstadoEquipoMedico estadoSalienteNuevo = dto.motivo().equals("EQUIPO_AVERIADO")
                ? EstadoEquipoMedico.AVERIADO : EstadoEquipoMedico.FUNCIONANDO;
        EstadoEquipoMedico estadoSalienteAnterior = saliente.getEstado();
        EstadoEquipoMedico estadoEntranteAnterior = entrante.getEstado();
        cerrarAsignacion(actual);
        saliente.setEstado(estadoSalienteNuevo);
        entrante.setEstado(EstadoEquipoMedico.OPERATIVO);
        equipoRepository.save(saliente);
        equipoRepository.save(entrante);
        crearAsignacion(entrante, movil, actor);

        MovimientoEquipo movimiento = crearMovimiento(TipoMovimientoEquipo.REEMPLAZO, actor, responsable,
                dto.motivo(), dto.observaciones(), null);
        guardarDetalle(movimiento, saliente, estadoSalienteAnterior, estadoSalienteNuevo,
                UbicacionEquipoMedico.MOVIL, UbicacionEquipoMedico.DEPOSITO_ENFERMERIA, movil, null);
        guardarDetalle(movimiento, entrante, estadoEntranteAnterior, entrante.getEstado(),
                ubicacionDesdeEstado(estadoEntranteAnterior, null), UbicacionEquipoMedico.MOVIL, null, movil);
        return detalleRepository.findByMovimientoId(movimiento.getId()).stream()
                .map(detalle -> mapearDetalleMovimiento(movimiento, detalle))
                .toList();
    }

    @Transactional
    public EquipoHistorialDTO retirar(Usuario actor, EquipoMovimientoDTO dto) {
        validarAcceso(actor);
        AsignacionEquipo asignacionInicial = asignacionRepository.findByEquipoIdAndActivoTrue(dto.equipoId()).orElse(null);
        Movil movilBloqueado = asignacionInicial == null ? null : bloquearMovil(asignacionInicial.getMovil().getId());
        EquipoMedico equipo = bloquearEquipo(dto.equipoId());
        AsignacionEquipo asignacion = asignacionRepository.findByEquipoIdAndActivoTrue(equipo.getId()).orElse(null);
        if (asignacion != null && (movilBloqueado == null
                || !Objects.equals(asignacion.getMovil().getId(), movilBloqueado.getId()))) {
            throw new ResourceConflictException("La asignación del equipo cambió; intente nuevamente");
        }
        if (equipo.getEstado() == EstadoEquipoMedico.BAJA
                || equipo.getEstado() == EstadoEquipoMedico.EN_MANTENIMIENTO) {
            throw new ResourceConflictException("El equipo no puede retirarse en su estado actual");
        }
        Usuario responsable = obtenerResponsable(dto.responsableId());
        EstadoEquipoMedico anterior = equipo.getEstado();
        if (asignacion != null) cerrarAsignacion(asignacion);
        if (equipo.getEstado() == EstadoEquipoMedico.OPERATIVO) {
            equipo.setEstado(EstadoEquipoMedico.FUNCIONANDO);
        }
        equipoRepository.save(equipo);
        MovimientoEquipo movimiento = crearMovimiento(TipoMovimientoEquipo.DESASIGNACION, actor, responsable,
                dto.motivo(), dto.observaciones(), null);
        guardarDetalle(movimiento, equipo, anterior, equipo.getEstado(),
                asignacion == null ? ubicacionDesdeEstado(anterior, null) : UbicacionEquipoMedico.MOVIL,
                UbicacionEquipoMedico.DEPOSITO_ENFERMERIA,
                asignacion == null ? null : asignacion.getMovil(), null);
        return mapearDetalleMovimiento(movimiento, detalleRepository.findByMovimientoId(movimiento.getId()).get(0));
    }

    @Transactional
    public EquipoHistorialDTO enviarAMantenimiento(Usuario actor, EquipoMovimientoDTO dto) {
        validarAcceso(actor);
        AsignacionEquipo asignacionInicial = asignacionRepository.findByEquipoIdAndActivoTrue(dto.equipoId()).orElse(null);
        Movil movilBloqueado = asignacionInicial == null ? null : bloquearMovil(asignacionInicial.getMovil().getId());
        EquipoMedico equipo = bloquearEquipo(dto.equipoId());
        AsignacionEquipo asignacion = asignacionRepository.findByEquipoIdAndActivoTrue(equipo.getId()).orElse(null);
        if (asignacion != null && (movilBloqueado == null
                || !Objects.equals(asignacion.getMovil().getId(), movilBloqueado.getId()))) {
            throw new ResourceConflictException("La asignación del equipo cambió; intente nuevamente");
        }
        if (equipo.getEstado() == EstadoEquipoMedico.BAJA
                || equipo.getEstado() == EstadoEquipoMedico.EN_MANTENIMIENTO) {
            throw new ResourceConflictException("El equipo no puede enviarse a mantenimiento en su estado actual");
        }
        Usuario responsable = obtenerResponsable(dto.responsableId());
        EstadoEquipoMedico anterior = equipo.getEstado();
        if (asignacion != null) cerrarAsignacion(asignacion);
        equipo.setEstado(EstadoEquipoMedico.EN_MANTENIMIENTO);
        equipoRepository.save(equipo);
        MovimientoEquipo movimiento = crearMovimiento(TipoMovimientoEquipo.ENVIO_MANTENIMIENTO, actor, responsable,
                dto.motivo(), dto.observaciones(), null);
        guardarDetalle(movimiento, equipo, anterior, equipo.getEstado(),
                asignacion == null ? ubicacionDesdeEstado(anterior, null) : UbicacionEquipoMedico.MOVIL,
                UbicacionEquipoMedico.CENTRO_REPARACION,
                asignacion == null ? null : asignacion.getMovil(), null);
        return mapearDetalleMovimiento(movimiento, detalleRepository.findByMovimientoId(movimiento.getId()).get(0));
    }

    @Transactional
    public EquipoHistorialDTO recibirDeMantenimiento(Usuario actor, EquipoMantenimientoDTO dto) {
        validarAcceso(actor);
        EquipoMedico equipo = bloquearEquipo(dto.equipoId());
        if (equipo.getEstado() != EstadoEquipoMedico.EN_MANTENIMIENTO) {
            throw new ResourceConflictException("El equipo no figura en mantenimiento");
        }
        validarFechaRealizacion(dto.fechaRealizacion());
        Usuario responsable = obtenerResponsable(dto.responsableId());
        equipo.setEstado(EstadoEquipoMedico.FUNCIONANDO);
        equipoRepository.save(equipo);
        EstadoEquipoMedico estadoNuevo = equipo.getEstado();
        MovimientoEquipo movimiento = crearMovimiento(TipoMovimientoEquipo.RECEPCION_MANTENIMIENTO, actor,
                responsable, "RECEPCION_REPARACION", dto.observaciones(), null);
        guardarDetalle(movimiento, equipo, EstadoEquipoMedico.EN_MANTENIMIENTO, equipo.getEstado(),
                UbicacionEquipoMedico.CENTRO_REPARACION, UbicacionEquipoMedico.DEPOSITO_ENFERMERIA, null, null);
        MantenimientoEquipo mantenimiento = mantenimientoRepository.save(new MantenimientoEquipo(
                equipo, TipoMantenimientoEquipo.CORRECTIVO, dto.fechaRealizacion(), actor, responsable,
                dto.observaciones(), movimiento, EstadoEquipoMedico.EN_MANTENIMIENTO, estadoNuevo,
                UbicacionEquipoMedico.CENTRO_REPARACION, UbicacionEquipoMedico.DEPOSITO_ENFERMERIA, null));
        return mapearMantenimiento(mantenimiento);
    }

    @Transactional
    public EquipoHistorialDTO registrarMantenimientoPreventivo(Usuario actor, EquipoMantenimientoDTO dto) {
        validarAcceso(actor);
        EquipoMedico equipo = bloquearEquipo(dto.equipoId());
        if (equipo.getEstado() == EstadoEquipoMedico.BAJA) {
            throw new ResourceConflictException("No se puede registrar mantenimiento a un equipo dado de baja");
        }
        validarFechaRealizacion(dto.fechaRealizacion());
        Usuario responsable = obtenerResponsable(dto.responsableId());
        AsignacionEquipo asignacion = asignacionRepository.findByEquipoIdAndActivoTrue(equipo.getId()).orElse(null);
        UbicacionEquipoMedico ubicacion = ubicacionDesdeEstado(equipo.getEstado(), asignacion);
        MantenimientoEquipo mantenimiento = mantenimientoRepository.save(new MantenimientoEquipo(
                equipo, TipoMantenimientoEquipo.PREVENTIVO, dto.fechaRealizacion(), actor, responsable,
                dto.observaciones(), null, equipo.getEstado(), equipo.getEstado(), ubicacion, ubicacion, asignacion));
        return mapearMantenimiento(mantenimiento);
    }

    @Transactional
    public EquipoHistorialDTO corregirMovimiento(Usuario actor, Long movimientoId, EquipoCorreccionDTO dto) {
        validarAcceso(actor);
        MovimientoEquipo original = movimientoRepository.findById(movimientoId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el movimiento indicado"));
        MovimientoEquipo correccion = crearMovimiento(TipoMovimientoEquipo.CORRECCION, actor, null,
                dto.motivo(), dto.observaciones(), original);
        List<MovimientoEquipoDetalle> detallesOriginales = detalleRepository.findByMovimientoId(original.getId());
        if (detallesOriginales.isEmpty()) {
            throw new ResourceConflictException("El movimiento no tiene equipos asociados para corregir");
        }
        List<MovimientoEquipoDetalle> detalles = detallesOriginales.stream()
                .map(item -> guardarDetalle(correccion, item.getEquipo(), item.getEstadoNuevo(),
                        item.getEstadoNuevo(), item.getUbicacionNueva(), item.getUbicacionNueva(),
                        item.getMovilNuevo(), item.getMovilNuevo()))
                .toList();
        return mapearDetalleMovimiento(correccion, detalles.get(0));
    }

    @Transactional(readOnly = true)
    public List<EquipoHistorialDTO> listarHistorial(Usuario actor, Long equipoId) {
        validarAcceso(actor);
        List<MovimientoEquipoDetalle> movimientos = equipoId == null
                ? cargarDetallesMovimiento()
                : detalleRepository.findByEquipoIdOrderByMovimientoFechaHoraDesc(equipoId);
        List<EquipoHistorialDTO> resultado = new ArrayList<>();
        for (MovimientoEquipoDetalle detalle : movimientos) {
            resultado.add(mapearDetalleMovimiento(detalle.getMovimiento(), detalle));
        }
        List<MantenimientoEquipo> mantenimientos = equipoId == null
                ? mantenimientoRepository.findAllByOrderByFechaRealizacionDescIdDesc()
                : mantenimientoRepository.findByEquipoIdOrderByFechaRealizacionDescIdDesc(equipoId);
        mantenimientos.stream().map(this::mapearMantenimiento).forEach(resultado::add);
        resultado.removeIf(item -> !TIPOS.containsKey(item.tipoEquipo()));
        resultado.sort(Comparator.comparing(EquipoHistorialDTO::fechaHora,
                Comparator.nullsLast(Comparator.reverseOrder())));
        return resultado;
    }

    @Transactional(readOnly = true)
    public List<EquipoHistorialDTO> listarMantenimientos(Usuario actor, Long equipoId) {
        validarAcceso(actor);
        List<MantenimientoEquipo> items = equipoId == null
                ? mantenimientoRepository.findAllByOrderByFechaRealizacionDescIdDesc()
                : mantenimientoRepository.findByEquipoIdOrderByFechaRealizacionDescIdDesc(equipoId);
        return items.stream()
                .map(this::mapearMantenimiento)
                .filter(item -> TIPOS.containsKey(item.tipoEquipo()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EquipoOperativoMovilDTO> listarOperativosPorMovil(Usuario actor) {
        validarAcceso(actor);
        return movilRepository.findByEstadoMovil(EstadoMovil.OPERATIVO).stream()
                .sorted(Comparator.comparing(Movil::getNumeroInterno))
                .map(equiposOperativosMovilService::obtenerParaMovil)
                .toList();
    }

    private List<MovimientoEquipoDetalle> cargarDetallesMovimiento() {
        return movimientoRepository.findAllByOrderByFechaHoraDescIdDesc().stream()
                .flatMap(movimiento -> detalleRepository.findByMovimientoId(movimiento.getId()).stream())
                .toList();
    }

    private EquipoMedicoDTO mapearEquipo(EquipoMedico equipo) {
        AsignacionEquipo asignacion = asignacionRepository.findByEquipoIdAndActivoTrue(equipo.getId()).orElse(null);
        MantenimientoEquipo ultimoPreventivo = mantenimientoRepository
                .findFirstByEquipoIdAndTipoOrderByFechaRealizacionDescIdDesc(
                        equipo.getId(), TipoMantenimientoEquipo.PREVENTIVO).orElse(null);
        LocalDate vencimiento = ultimoPreventivo == null ? null : ultimoPreventivo.getFechaRealizacion().plusYears(1);
        String estadoMantenimiento = estadoMantenimiento(vencimiento);
        return new EquipoMedicoDTO(equipo.getId(),
                equipo.getTipoEquipo() == null ? null : equipo.getTipoEquipo().getCodigo(),
                equipo.getTipoEquipo() == null ? equipo.getNombre() : equipo.getTipoEquipo().getNombre(),
                equipo.getNumeroSerie(), equipo.getMarca(), equipo.getModelo(),
                equipo.getEstado().name(), ubicacionDesdeEstado(equipo.getEstado(), asignacion).name(),
                asignacion == null ? null : asignacion.getMovil().getId(),
                asignacion == null ? null : asignacion.getMovil().getNumeroInterno(),
                estadoMantenimiento, vencimiento);
    }

    private String estadoMantenimiento(LocalDate vencimiento) {
        if (vencimiento == null) return "SIN_REGISTRO";
        long dias = ChronoUnit.DAYS.between(LocalDate.now(), vencimiento);
        if (dias < 0) return "VENCIDO";
        if (dias <= 30) return "PROXIMO_A_VENCER";
        return "VIGENTE";
    }

    private EquipoHistorialDTO mapearDetalleMovimiento(MovimientoEquipo movimiento, MovimientoEquipoDetalle detalle) {
        return new EquipoHistorialDTO(detalle.getId(), movimiento.getTipoMovimiento().name(),
                movimiento.getFechaHora(), null, detalle.getEquipo().getId(),
                detalle.getTipoEquipoSnapshot() == null ? codigoTipo(detalle.getEquipo()) : detalle.getTipoEquipoSnapshot(),
                detalle.getNumeroSerieSnapshot() == null ? detalle.getEquipo().getNumeroSerie() : detalle.getNumeroSerieSnapshot(),
                detalle.getMarcaSnapshot() == null ? detalle.getEquipo().getMarca() : detalle.getMarcaSnapshot(),
                detalle.getModeloSnapshot() == null ? detalle.getEquipo().getModelo() : detalle.getModeloSnapshot(),
                detalle.getMovilAnterior() == null ? null : detalle.getMovilAnterior().getId(),
                detalle.getMovilAnteriorNombreSnapshot() == null
                        ? nombreMovil(detalle.getMovilAnterior()) : detalle.getMovilAnteriorNombreSnapshot(),
                detalle.getMovilNuevo() == null ? null : detalle.getMovilNuevo().getId(),
                detalle.getMovilNuevoNombreSnapshot() == null
                        ? nombreMovil(detalle.getMovilNuevo()) : detalle.getMovilNuevoNombreSnapshot(),
                movimiento.getActorNombreSnapshot() == null
                        ? nombreUsuario(movimiento.getActor()) : movimiento.getActorNombreSnapshot(),
                movimiento.getResponsableNombreSnapshot() == null
                        ? nombreUsuario(movimiento.getResponsable()) : movimiento.getResponsableNombreSnapshot(),
                movimiento.getMotivo(),
                movimiento.getObservaciones(),
                detalle.getEstadoAnterior() == null ? null : detalle.getEstadoAnterior().name(),
                detalle.getEstadoNuevo().name(),
                detalle.getUbicacionAnterior() == null ? null : detalle.getUbicacionAnterior().name(),
                detalle.getUbicacionNueva().name(),
                movimiento.getMovimientoOriginal() == null ? null : movimiento.getMovimientoOriginal().getId());
    }

    private EquipoHistorialDTO mapearMantenimiento(MantenimientoEquipo item) {
        EquipoMedico equipo = item.getEquipo();
        return new EquipoHistorialDTO(item.getId(), "MANTENIMIENTO_" + item.getTipo().name(),
                item.getFechaRealizacion().atStartOfDay(), item.getFechaRealizacion(), equipo.getId(),
                item.getTipoEquipoSnapshot() == null ? codigoTipo(equipo) : item.getTipoEquipoSnapshot(),
                item.getNumeroSerieSnapshot() == null ? equipo.getNumeroSerie() : item.getNumeroSerieSnapshot(),
                item.getMarcaSnapshot() == null ? equipo.getMarca() : item.getMarcaSnapshot(),
                item.getModeloSnapshot() == null ? equipo.getModelo() : item.getModeloSnapshot(),
                null, null, item.getMovilIdSnapshot(), item.getMovilNombreSnapshot(),
                item.getActorNombreSnapshot() == null ? nombreUsuario(item.getActor()) : item.getActorNombreSnapshot(),
                item.getResponsableNombreSnapshot() == null
                        ? nombreUsuario(item.getResponsable()) : item.getResponsableNombreSnapshot(),
                item.getTipo().name(), item.getObservaciones(),
                item.getEstadoAnteriorSnapshot() == null ? null : item.getEstadoAnteriorSnapshot().name(),
                item.getEstadoNuevoSnapshot() == null ? null : item.getEstadoNuevoSnapshot().name(),
                item.getUbicacionAnteriorSnapshot() == null ? null : item.getUbicacionAnteriorSnapshot().name(),
                item.getUbicacionNuevaSnapshot() == null ? null : item.getUbicacionNuevaSnapshot().name(),
                item.getMovimiento() == null ? null : item.getMovimiento().getId());
    }

    private Usuario obtenerResponsable(Long responsableId) {
        if (responsableId == null) return null;
        Usuario responsable = usuarioRepository.findById(responsableId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el usuario responsable"));
        if (!responsable.isActivo() || !responsable.isDisponible() || responsable.getRol() != Rol.ENF) {
            throw new IllegalArgumentException("El responsable debe ser un enfermero habilitado");
        }
        return responsable;
    }

    private void validarAcceso(Usuario actor) {
        if (actor == null || actor.getRol() == null || !ROLES_AUTORIZADOS.contains(actor.getRol())) {
            throw new AccessDeniedException("No tiene permisos para operar el módulo de Equipos Médicos");
        }
    }

    private void validarElegibleParaAsignar(EquipoMedico equipo) {
        if (equipo.getTipoEquipo() == null) {
            throw new ResourceConflictException("El equipo no tiene un tipo médico registrado");
        }
        if (equipo.getEstado() != EstadoEquipoMedico.OPERATIVO
                && equipo.getEstado() != EstadoEquipoMedico.FUNCIONANDO
                && equipo.getEstado() != EstadoEquipoMedico.DISPONIBLE) {
            throw new ResourceConflictException("Solo se pueden asignar equipos operativos");
        }
    }

    private void validarNoDuplicidadPorTipo(Long movilId, String tipoCodigo, Long asignacionExcluidaId) {
        for (AsignacionEquipo vigente : asignacionRepository.findByMovilIdAndActivoTrue(movilId)) {
            if (asignacionExcluidaId != null && asignacionExcluidaId.equals(vigente.getId())) continue;
            String tipoVigente = vigente.getTipoEquipo() == null
                    ? codigoTipo(vigente.getEquipo())
                    : vigente.getTipoEquipo().getCodigo();
            if (tipoVigente == null) {
                throw new ResourceConflictException(
                        "El móvil tiene una asignación histórica sin tipo; requiere revisión antes de asignar");
            }
            if (tipoVigente.equals(tipoCodigo)) {
                throw new ResourceConflictException("El móvil ya tiene un equipo activo de ese tipo");
            }
        }
    }

    private void validarMovilOperativo(Movil movil) {
        if (movil.getEstadoMovil() != EstadoMovil.OPERATIVO) {
            throw new ResourceConflictException("El móvil seleccionado no está operativo");
        }
    }

    private void validarFechaRealizacion(LocalDate fecha) {
        if (fecha.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("La fecha de realización no puede ser futura");
        }
    }

    private Movil bloquearMovil(Long id) {
        return movilRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el móvil indicado"));
    }

    private EquipoMedico bloquearEquipo(Long id) {
        return equipoRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el equipo médico indicado"));
    }

    private EquipoMedico obtenerEquipo(Long id) {
        return equipoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el equipo médico indicado"));
    }

    private void crearAsignacion(EquipoMedico equipo, Movil movil, Usuario actor) {
        AsignacionEquipo asignacion = new AsignacionEquipo();
        asignacion.setEquipo(equipo);
        asignacion.setTipoEquipo(equipo.getTipoEquipo());
        asignacion.setMovil(movil);
        asignacion.setCoordinador(actor);
        asignacion.setFechaAsignacion(LocalDateTime.now());
        asignacion.setActivo(true);
        asignacionRepository.saveAndFlush(asignacion);
    }

    private void cerrarAsignacion(AsignacionEquipo asignacion) {
        asignacion.setActivo(false);
        asignacion.setFechaDesasignacion(LocalDateTime.now());
        asignacionRepository.saveAndFlush(asignacion);
    }

    private MovimientoEquipo crearMovimiento(
            TipoMovimientoEquipo tipo, Usuario actor, Usuario responsable,
            String motivo, String observaciones, MovimientoEquipo original) {
        return movimientoRepository.saveAndFlush(new MovimientoEquipo(
                LocalDateTime.now(), tipo, actor, responsable, nombreUsuario(actor), nombreUsuario(responsable),
                motivo.trim(), limpiar(observaciones), original));
    }

    private MovimientoEquipoDetalle guardarDetalle(
            MovimientoEquipo movimiento, EquipoMedico equipo,
            EstadoEquipoMedico estadoAnterior, EstadoEquipoMedico estadoNuevo,
            UbicacionEquipoMedico ubicacionAnterior, UbicacionEquipoMedico ubicacionNueva,
            Movil movilAnterior, Movil movilNuevo) {
        return detalleRepository.save(new MovimientoEquipoDetalle(
                movimiento, equipo, estadoAnterior, estadoNuevo, ubicacionAnterior, ubicacionNueva,
                movilAnterior, movilNuevo));
    }

    private UbicacionEquipoMedico ubicacionDesdeEstado(EstadoEquipoMedico estado, AsignacionEquipo asignacion) {
        if (estado == EstadoEquipoMedico.BAJA) return UbicacionEquipoMedico.RETIRADO_BAJA;
        if (estado == EstadoEquipoMedico.EN_MANTENIMIENTO) return UbicacionEquipoMedico.CENTRO_REPARACION;
        if (asignacion != null) return UbicacionEquipoMedico.MOVIL;
        return UbicacionEquipoMedico.DEPOSITO_ENFERMERIA;
    }

    private String normalizarTipo(String value) {
        String codigo = value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
        if (!TIPOS.containsKey(codigo)) {
            throw new IllegalArgumentException("El tipo debe ser ELECTROCARDIOGRAFO, CARDIODESFIBRILADOR o RESPIRADOR");
        }
        return codigo;
    }

    private String codigoTipo(EquipoMedico equipo) {
        return equipo.getTipoEquipo() == null ? null : equipo.getTipoEquipo().getCodigo();
    }

    private String nombreMovil(Movil movil) {
        return movil == null ? null : movil.getNumeroInterno() + " · " + movil.getPatente();
    }

    private String nombreUsuario(Usuario usuario) {
        return usuario == null ? null : usuario.getNombre() + " " + usuario.getApellido();
    }

    private String limpiar(String text) {
        return text == null || text.isBlank() ? null : text.trim();
    }

    private <E extends Enum<E>> E parseEnum(String value, Class<E> enumType, String label) {
        if (value == null || value.isBlank()) return null;
        try {
            return Enum.valueOf(enumType, value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Valor de " + label + " no válido");
        }
    }
}
