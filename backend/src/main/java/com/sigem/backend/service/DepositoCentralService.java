package com.sigem.backend.service;

import com.sigem.backend.dto.CantidadMinimaDepositoDTO;
import com.sigem.backend.dto.InsumoStockDTO;
import com.sigem.backend.dto.MovimientoDepositoCreateDTO;
import com.sigem.backend.dto.MovimientoDepositoDTO;
import com.sigem.backend.dto.StockDepositoCreateDTO;
import com.sigem.backend.dto.StockDepositoDTO;
import com.sigem.backend.model.Insumo;
import com.sigem.backend.model.MovimientoDepositoCentral;
import com.sigem.backend.model.StockDepositoCentral;
import com.sigem.backend.model.TipoInsumo;
import com.sigem.backend.model.TipoMovimientoDeposito;
import com.sigem.backend.model.Usuario;
import com.sigem.backend.repository.InsumoRepository;
import com.sigem.backend.repository.MovimientoDepositoCentralRepository;
import com.sigem.backend.repository.StockDepositoCentralRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DepositoCentralService {

    private final StockDepositoCentralRepository stockRepository;
    private final MovimientoDepositoCentralRepository movimientoRepository;
    private final InsumoRepository insumoRepository;

    public DepositoCentralService(StockDepositoCentralRepository stockRepository,
                                  MovimientoDepositoCentralRepository movimientoRepository,
                                  InsumoRepository insumoRepository) {
        this.stockRepository = stockRepository;
        this.movimientoRepository = movimientoRepository;
        this.insumoRepository = insumoRepository;
    }

    @Transactional(readOnly = true)
    public List<StockDepositoDTO> listarStock(boolean activo) {
        List<StockDepositoCentral> stock = activo
                ? stockRepository.findByActivoTrueAndInsumoActivoTrueOrderByInsumoCategoriaAscInsumoNombreAsc()
                : stockRepository.findByActivoFalseOrInsumoActivoFalseOrderByInsumoCategoriaAscInsumoNombreAsc();
        return stock.stream().map(this::mapearStock).toList();
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

    @Transactional
    public StockDepositoDTO agregarInsumo(StockDepositoCreateDTO dto, Usuario usuario) {
        if (dto == null || dto.getNombre() == null || dto.getNombre().isBlank()) {
            throw new RuntimeException("El nombre del insumo es obligatorio");
        }
        if (dto.getCategoria() == null) {
            throw new RuntimeException("La categoría del insumo es obligatoria");
        }

        int cantidadInicial = dto.getCantidadInicial() == null ? 0 : dto.getCantidadInicial();
        int cantidadMinima = dto.getCantidadMinima() == null ? 0 : dto.getCantidadMinima();
        if (cantidadInicial < 0 || cantidadMinima < 0) {
            throw new RuntimeException("Las cantidades del depósito no pueden ser negativas");
        }

        String nombreNormalizado = dto.getNombre().trim();

        // 1. Obtener insumo existente en el catálogo global o crear uno nuevo con enum TipoInsumo
        Insumo insumo = insumoRepository.findByNombreIgnoreCase(nombreNormalizado)
                .orElseGet(() -> {
                    Insumo nuevo = new Insumo();
                    nuevo.setNombre(nombreNormalizado);
                    nuevo.setCategoria(dto.getCategoria());
                    
                    nuevo.setTipo(dto.getTipo() != null ? dto.getTipo() : TipoInsumo.CONSUMIBLE);
                    
                    nuevo.setUnidadMedida(dto.getUnidadMedida());
                    nuevo.setActivo(true);
                    return insumoRepository.save(nuevo);
                });

        if (!insumo.isActivo()) {
            insumo.setActivo(true);
            insumoRepository.save(insumo);
        }

        // 2. Asociar al Depósito Central o recuperar el existente
        StockDepositoCentral stock = stockRepository.findByInsumoId(insumo.getId())
                .orElseGet(StockDepositoCentral::new);

        if (stock.getId() != null && stock.isActivo()) {
            throw new RuntimeException("El insumo '" + insumo.getNombre() + "' ya forma parte del depósito central");
        }

        stock.setInsumo(insumo);
        stock.setActivo(true);
        stock.setCantidadActual(cantidadInicial);
        stock.setCantidadMinima(cantidadMinima);
        stockRepository.save(stock);

        // 3. Guardar movimiento auditable de Alta
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
        dto.setTipo(stock.getInsumo().getTipo() != null ? stock.getInsumo().getTipo() : TipoInsumo.CONSUMIBLE);
        dto.setUnidadMedida(stock.getInsumo().getUnidadMedida());
        dto.setCantidadActual(stock.getCantidadActual());
        dto.setCantidadMinima(stock.getCantidadMinima());
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