package com.sigem.backend.service;

import com.sigem.backend.dto.CantidadMinimaDepositoDTO;
import com.sigem.backend.dto.InsumoEstandarUpdateDTO;
import com.sigem.backend.dto.InsumoNombreUpdateDTO;
import com.sigem.backend.dto.InsumoStockDTO;
import com.sigem.backend.dto.IngresoStockDTO;
import com.sigem.backend.dto.MovimientoDepositoCreateDTO;
import com.sigem.backend.dto.MovimientoDepositoDTO;
import com.sigem.backend.dto.StockDepositoCreateDTO;
import com.sigem.backend.dto.StockDepositoDTO;
import com.sigem.backend.model.Insumo;
import com.sigem.backend.model.MovimientoDepositoCentral;
import com.sigem.backend.model.StockDepositoCentral;
import com.sigem.backend.model.StockEstandarMovil;
import com.sigem.backend.model.TipoMovil;
import com.sigem.backend.model.TipoMovimientoDeposito;
import com.sigem.backend.model.Usuario;
import com.sigem.backend.repository.InsumoRepository;
import com.sigem.backend.repository.MovimientoDepositoCentralRepository;
import com.sigem.backend.repository.StockDepositoCentralRepository;
import com.sigem.backend.repository.StockEstandarMovilRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.EnumMap;
import java.util.Map;

@Service
public class DepositoCentralService {

    private final StockDepositoCentralRepository stockRepository;
    private final MovimientoDepositoCentralRepository movimientoRepository;
    private final InsumoRepository insumoRepository;
    private final StockEstandarMovilRepository stockEstandarRepository;

    public DepositoCentralService(StockDepositoCentralRepository stockRepository,
                                  MovimientoDepositoCentralRepository movimientoRepository,
                                  InsumoRepository insumoRepository,
                                  StockEstandarMovilRepository stockEstandarRepository) {
        this.stockRepository = stockRepository;
        this.movimientoRepository = movimientoRepository;
        this.insumoRepository = insumoRepository;
        this.stockEstandarRepository = stockEstandarRepository;
    }

    @Transactional(readOnly = true)
    public List<StockDepositoDTO> listarStock(boolean activo) {
        List<StockDepositoCentral> stock = activo
                ? stockRepository.findByActivoTrueAndInsumoActivoTrueOrderByInsumoCategoriaAscInsumoNombreAsc()
                : stockRepository.findByActivoFalseOrInsumoActivoFalseOrderByInsumoCategoriaAscInsumoNombreAsc();
        return stock
                .stream().map(this::mapearStock).toList();
    }

    @Transactional(readOnly = true)
    public List<InsumoStockDTO> listarCatalogo() {
        return insumoRepository.findByActivoTrueOrderByCategoriaAscNombreAsc().stream().map(insumo -> {
            InsumoStockDTO dto = new InsumoStockDTO();
            dto.setInsumoId(insumo.getId());
            dto.setNombre(insumo.getNombre());
            dto.setCategoria(insumo.getCategoria());
            dto.setTipo(insumo.getTipo());
            dto.setUnidadMedida(insumo.getUnidadMedida());
            return dto;
        }).toList();
    }

    @Transactional(readOnly = true)
    public InsumoEstandarUpdateDTO obtenerEdicionInsumo(Long insumoId) {
        Insumo insumo = insumoRepository.findById(insumoId)
                .filter(Insumo::isActivo)
                .orElseThrow(() -> new RuntimeException("El insumo no existe o está archivado"));
        return mapearEdicionInsumo(insumo);
    }

    @Transactional
    public InsumoEstandarUpdateDTO actualizarInsumoEstandar(
            Long insumoId, InsumoEstandarUpdateDTO dto) {
        if (dto == null || dto.getNombre() == null || dto.getNombre().isBlank()
                || dto.getNombre().trim().length() > 255) {
            throw new IllegalArgumentException("El nombre es obligatorio y no puede superar 255 caracteres");
        }
        Map<TipoMovil, Integer> cantidades = dto.getCantidadesEstandar();
        if (cantidades == null || cantidades.size() != TipoMovil.values().length) {
            throw new IllegalArgumentException("Indicá una cantidad estándar para cada tipo de móvil");
        }
        for (TipoMovil tipoMovil : TipoMovil.values()) {
            Integer cantidad = cantidades.get(tipoMovil);
            if (cantidad == null || cantidad < 0) {
                throw new IllegalArgumentException(
                        "La cantidad estándar debe ser un entero mayor o igual a cero para " + tipoMovil);
            }
        }

        Insumo insumo = insumoRepository.findByIdForUpdate(insumoId)
                .filter(Insumo::isActivo)
                .orElseThrow(() -> new RuntimeException("El insumo no existe o está archivado"));
        String nombre = dto.getNombre().trim();
        insumoRepository.findByNombreIgnoreCase(nombre)
                .filter(otro -> !otro.getId().equals(insumoId))
                .ifPresent(otro -> {
                    throw new IllegalArgumentException("Ya existe otro insumo con ese nombre");
                });
        insumo.setNombre(nombre);
        insumoRepository.save(insumo);

        Map<TipoMovil, StockEstandarMovil> existentes = new EnumMap<>(TipoMovil.class);
        stockEstandarRepository.findByInsumo_Id(insumoId)
                .forEach(stock -> existentes.put(stock.getTipoMovil(), stock));

        List<StockEstandarMovil> actualizados = java.util.Arrays.stream(TipoMovil.values())
                .map(tipoMovil -> {
                    StockEstandarMovil stock = existentes.getOrDefault(tipoMovil, new StockEstandarMovil());
                    stock.setTipoMovil(tipoMovil);
                    stock.setInsumo(insumo);
                    stock.setCantidadRecomendada(cantidades.get(tipoMovil));
                    return stock;
                })
                .toList();
        stockEstandarRepository.saveAll(actualizados);
        return mapearEdicionInsumo(insumo, actualizados);
    }

    @Transactional
    public void actualizarNombreInsumo(Long insumoId, InsumoNombreUpdateDTO dto) {
        if (dto == null || dto.getNombre() == null || dto.getNombre().isBlank()
                || dto.getNombre().trim().length() > 255) {
            throw new IllegalArgumentException("El nombre es obligatorio y no puede superar 255 caracteres");
        }

        Insumo insumo = insumoRepository.findByIdForUpdate(insumoId)
                .filter(Insumo::isActivo)
                .orElseThrow(() -> new RuntimeException("El insumo no existe o está archivado"));
        String nombre = dto.getNombre().trim();
        insumoRepository.findByNombreIgnoreCase(nombre)
                .filter(otro -> !otro.getId().equals(insumoId))
                .ifPresent(otro -> {
                    throw new IllegalArgumentException("Ya existe otro insumo con ese nombre");
                });
        insumo.setNombre(nombre);
        insumoRepository.save(insumo);
    }

    @Transactional
    public StockDepositoDTO registrarIngresoStock(Long insumoId, IngresoStockDTO dto, Usuario usuario) {
        if (insumoId == null) {
            throw new IllegalArgumentException("Seleccioná un insumo del depósito");
        }
        if (dto == null || dto.getCantidad() == null || dto.getCantidad() <= 0) {
            throw new IllegalArgumentException("La cantidad a ingresar debe ser mayor a cero");
        }

        StockDepositoCentral stock = stockRepository.findActiveByInsumoIdForUpdate(insumoId)
                .orElseThrow(() -> new RuntimeException("El insumo no está activo en el depósito central"));
        int anterior = stock.getCantidadActual();
        final int nuevo;
        try {
            nuevo = Math.addExact(anterior, dto.getCantidad());
        } catch (ArithmeticException exception) {
            throw new IllegalArgumentException("La cantidad ingresada supera el límite permitido");
        }

        stock.setCantidadActual(nuevo);
        StockDepositoCentral actualizado = stockRepository.save(stock);
        guardarMovimiento(actualizado, usuario, TipoMovimientoDeposito.INGRESO,
                dto.getCantidad(), "Ingreso de stock desde Depósito central", null, anterior);
        return mapearStock(actualizado);
    }

    @Transactional
    public StockDepositoDTO agregarInsumo(StockDepositoCreateDTO dto, Usuario usuario) {
        if (dto == null) {
            throw new IllegalArgumentException("Completá los datos del insumo");
        }
        int cantidadInicial = dto.getCantidadInicial() == null ? 0 : dto.getCantidadInicial();
        int cantidadMinima = dto.getCantidadMinima() == null ? 0 : dto.getCantidadMinima();
        if (cantidadInicial < 0 || cantidadMinima < 0) {
            throw new RuntimeException("Las cantidades del depósito no pueden ser negativas");
        }

        Insumo insumo;
        if (dto.getInsumoId() != null) {
            insumo = insumoRepository.findById(dto.getInsumoId())
                    .filter(Insumo::isActivo)
                    .orElseThrow(() -> new RuntimeException("El insumo no existe o está inactivo"));
        } else {
            if (dto.getNombre() == null || dto.getNombre().isBlank()) {
                throw new IllegalArgumentException("El nombre del insumo es obligatorio");
            }
            if (dto.getNombre().trim().length() > 255) {
                throw new IllegalArgumentException("El nombre no puede superar 255 caracteres");
            }
            if (dto.getCategoria() == null) {
                throw new IllegalArgumentException("La categoría del insumo es obligatoria");
            }
            if (dto.getUnidadMedida() != null && dto.getUnidadMedida().trim().length() > 100) {
                throw new IllegalArgumentException("La presentación no puede superar 100 caracteres");
            }
            String nombre = dto.getNombre().trim();
            if (insumoRepository.findByNombreIgnoreCase(nombre).isPresent()) {
                throw new IllegalArgumentException("Ya existe un insumo con ese nombre; seleccioná el existente");
            }
            insumo = new Insumo();
            insumo.setNombre(nombre);
            insumo.setCategoria(dto.getCategoria());
            insumo.setTipo(dto.getTipo() == null
                    ? com.sigem.backend.model.TipoInsumo.CONSUMIBLE
                    : dto.getTipo());
            insumo.setUnidadMedida(dto.getUnidadMedida() == null || dto.getUnidadMedida().isBlank()
                    ? null : dto.getUnidadMedida().trim());
            insumo.setActivo(true);
            insumo = insumoRepository.save(insumo);
        }
        StockDepositoCentral stock = stockRepository.findByInsumoId(insumo.getId())
                .orElseGet(StockDepositoCentral::new);
        if (stock.getId() != null && stock.isActivo()) {
            throw new RuntimeException("El insumo ya forma parte del depósito central");
        }

        stock.setInsumo(insumo);
        stock.setActivo(true);
        stock.setCantidadActual(cantidadInicial);
        stock.setCantidadMinima(cantidadMinima);
        stockRepository.save(stock);
        guardarMovimiento(stock, usuario, TipoMovimientoDeposito.ALTA, cantidadInicial,
                "Alta en depósito; mínimo inicial " + cantidadMinima, null, 0);
        return mapearStock(stock);
    }

    @Transactional
    public StockDepositoDTO actualizarMinimo(Long stockId, CantidadMinimaDepositoDTO dto, Usuario usuario) {
        if (dto == null || dto.getCantidadMinima() == null || dto.getCantidadMinima() < 0) {
            throw new RuntimeException("La cantidad mínima debe ser cero o mayor");
        }
        StockDepositoCentral stock = stockRepository.findByIdForUpdate(stockId)
                .filter(StockDepositoCentral::isActivo)
                .orElseThrow(() -> new RuntimeException("El insumo no está activo en el depósito"));
        int minimoAnterior = stock.getCantidadMinima();
        stock.setCantidadMinima(dto.getCantidadMinima());
        StockDepositoCentral actualizado = stockRepository.save(stock);
        guardarMovimiento(actualizado, usuario, TipoMovimientoDeposito.CAMBIO_MINIMO, 0,
            "Mínimo cambiado de " + minimoAnterior + " a " + dto.getCantidadMinima(),
            null, actualizado.getCantidadActual());
        return mapearStock(actualizado);
    }

    @Transactional
    public void archivarInsumo(Long insumoId, Usuario usuario) {
        Insumo insumo = insumoRepository.findByIdForUpdate(insumoId)
                .filter(Insumo::isActivo)
                .orElseThrow(() -> new RuntimeException("El insumo no está activo"));
        StockDepositoCentral stock = stockRepository.findByInsumoIdForUpdate(insumoId)
                .filter(StockDepositoCentral::isActivo)
                .orElseThrow(() -> new RuntimeException("El insumo no está activo en el depósito"));
        if (stock.getCantidadActual() != 0) {
            throw new RuntimeException("No se puede archivar un insumo con existencia. Registrá primero el egreso o ajuste correspondiente");
        }
        insumo.setActivo(false);
        stock.setActivo(false);
        insumoRepository.save(insumo);
        stockRepository.save(stock);
        guardarMovimiento(stock, usuario, TipoMovimientoDeposito.ARCHIVO, 0,
                "Insumo archivado del depósito central", null, stock.getCantidadActual());
    }

    @Transactional
    public void desarchivarInsumo(Long insumoId, Usuario usuario) {
        Insumo insumo = insumoRepository.findByIdForUpdate(insumoId)
                .orElseThrow(() -> new RuntimeException("El insumo no existe"));
        StockDepositoCentral stock = stockRepository.findByInsumoIdForUpdate(insumoId)
                .orElseThrow(() -> new RuntimeException("El insumo no tiene una existencia en el depósito"));
        if (insumo.isActivo() && stock.isActivo()) {
            throw new RuntimeException("El insumo ya está activo en el depósito");
        }
        insumo.setActivo(true);
        stock.setActivo(true);
        insumoRepository.save(insumo);
        stockRepository.save(stock);
        guardarMovimiento(stock, usuario, TipoMovimientoDeposito.DESARCHIVO, 0,
                "Insumo desarchivado del depósito central", null, stock.getCantidadActual());
    }

    @Transactional
    public StockDepositoDTO registrarMovimiento(MovimientoDepositoCreateDTO dto, Usuario usuario) {
        if (dto == null || dto.getInsumoId() == null) {
            throw new RuntimeException("Seleccioná un insumo del depósito");
        }
        if (dto.getCantidad() == null || dto.getCantidad() <= 0) {
            throw new RuntimeException("La cantidad del movimiento debe ser mayor a cero");
        }
        if (dto.getMotivo() == null || dto.getMotivo().isBlank()) {
            throw new RuntimeException("El motivo del movimiento es obligatorio");
        }
        if (dto.getMotivo().trim().length() > 500) {
            throw new RuntimeException("El motivo no puede superar 500 caracteres");
        }
        if (dto.getTipo() != TipoMovimientoDeposito.INGRESO
                && dto.getTipo() != TipoMovimientoDeposito.AJUSTE_POSITIVO
                && dto.getTipo() != TipoMovimientoDeposito.AJUSTE_NEGATIVO) {
            throw new RuntimeException("El tipo de movimiento manual no es válido");
        }

        StockDepositoCentral stock = stockRepository.findActiveByInsumoIdForUpdate(dto.getInsumoId())
                .orElseThrow(() -> new RuntimeException("El insumo no está activo en el depósito central"));
        int anterior = stock.getCantidadActual();
        int nuevo = dto.getTipo() == TipoMovimientoDeposito.AJUSTE_NEGATIVO
                ? anterior - dto.getCantidad()
                : anterior + dto.getCantidad();
        if (nuevo < 0) {
            throw new RuntimeException("El ajuste dejaría el stock por debajo de cero");
        }

        stock.setCantidadActual(nuevo);
        stockRepository.save(stock);
        guardarMovimiento(stock, usuario, dto.getTipo(), dto.getCantidad(), dto.getMotivo().trim(), null, anterior);
        return mapearStock(stock);
    }

    @Transactional(readOnly = true)
    public List<MovimientoDepositoDTO> listarMovimientos() {
        return movimientoRepository.findTop200ByOrderByFechaDesc().stream()
                .map(this::mapearMovimiento).toList();
    }

    private void guardarMovimiento(StockDepositoCentral stock, Usuario usuario,
                                   TipoMovimientoDeposito tipo, int cantidad,
                                   String motivo, com.sigem.backend.model.SolicitudReposicion solicitud) {
        int anterior = tipo == TipoMovimientoDeposito.INGRESO ? 0 : stock.getCantidadActual();
        guardarMovimiento(stock, usuario, tipo, cantidad, motivo, solicitud, anterior);
    }

    private void guardarMovimiento(StockDepositoCentral stock, Usuario usuario,
                                   TipoMovimientoDeposito tipo, int cantidad, String motivo,
                                   com.sigem.backend.model.SolicitudReposicion solicitud, int anterior) {
        MovimientoDepositoCentral movimiento = new MovimientoDepositoCentral();
        movimiento.setStock(stock);
        movimiento.setUsuario(usuario);
        movimiento.setSolicitud(solicitud);
        movimiento.setTipo(tipo);
        movimiento.setCantidad(cantidad);
        movimiento.setCantidadAnterior(anterior);
        movimiento.setCantidadNueva(stock.getCantidadActual());
        movimiento.setMotivo(motivo);
        movimientoRepository.save(movimiento);
    }

    private StockDepositoDTO mapearStock(StockDepositoCentral stock) {
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
    }

    private InsumoEstandarUpdateDTO mapearEdicionInsumo(Insumo insumo) {
        return mapearEdicionInsumo(insumo, stockEstandarRepository.findByInsumo_Id(insumo.getId()));
    }

    private InsumoEstandarUpdateDTO mapearEdicionInsumo(
            Insumo insumo, List<StockEstandarMovil> stocks) {
        Map<TipoMovil, Integer> cantidades = new EnumMap<>(TipoMovil.class);
        for (TipoMovil tipoMovil : TipoMovil.values()) {
            cantidades.put(tipoMovil, 0);
        }
        stocks.forEach(stock -> cantidades.put(stock.getTipoMovil(), stock.getCantidadRecomendada()));

        InsumoEstandarUpdateDTO dto = new InsumoEstandarUpdateDTO();
        dto.setNombre(insumo.getNombre());
        dto.setCantidadesEstandar(cantidades);
        return dto;
    }

    private MovimientoDepositoDTO mapearMovimiento(MovimientoDepositoCentral movimiento) {
        MovimientoDepositoDTO dto = new MovimientoDepositoDTO();
        dto.setId(movimiento.getId());
        dto.setInsumoId(movimiento.getStock().getInsumo().getId());
        dto.setInsumoNombre(movimiento.getStock().getInsumo().getNombre());
        dto.setTipo(movimiento.getTipo());
        dto.setCantidad(movimiento.getCantidad());
        dto.setCantidadAnterior(movimiento.getCantidadAnterior());
        dto.setCantidadNueva(movimiento.getCantidadNueva());
        dto.setMotivo(movimiento.getMotivo());
        dto.setUsuarioNombre(movimiento.getUsuario().getNombre() + " " + movimiento.getUsuario().getApellido());
        dto.setSolicitudId(movimiento.getSolicitud() == null ? null : movimiento.getSolicitud().getId());
        dto.setFecha(movimiento.getFecha());
        return dto;
    }
}