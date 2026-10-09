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
    public List<StockDepositoDTO> listarStock() {
        return stockRepository.findByActivoTrueOrderByInsumoCategoriaAscInsumoNombreAsc()
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

    @Transactional
    public StockDepositoDTO agregarInsumo(StockDepositoCreateDTO dto, Usuario usuario) {
        if (dto == null || dto.getInsumoId() == null) {
            throw new RuntimeException("Seleccioná un insumo del catálogo");
        }
        int cantidadInicial = dto.getCantidadInicial() == null ? 0 : dto.getCantidadInicial();
        int cantidadMinima = dto.getCantidadMinima() == null ? 0 : dto.getCantidadMinima();
        if (cantidadInicial < 0 || cantidadMinima < 0) {
            throw new RuntimeException("Las cantidades del depósito no pueden ser negativas");
        }

        Insumo insumo = insumoRepository.findById(dto.getInsumoId())
                .filter(Insumo::isActivo)
                .orElseThrow(() -> new RuntimeException("El insumo no existe o está inactivo"));
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
        public void archivarInsumo(Long stockId, Usuario usuario) {
        StockDepositoCentral stock = stockRepository.findByIdForUpdate(stockId)
                .filter(StockDepositoCentral::isActivo)
                .orElseThrow(() -> new RuntimeException("El insumo no está activo en el depósito"));
        if (stock.getCantidadActual() != 0) {
            throw new RuntimeException("No se puede archivar un insumo con existencia. Registrá primero el egreso o ajuste correspondiente");
        }
        stock.setActivo(false);
        stockRepository.save(stock);
        guardarMovimiento(stock, usuario, TipoMovimientoDeposito.ARCHIVO, 0,
            "Insumo archivado del depósito central", null, stock.getCantidadActual());
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