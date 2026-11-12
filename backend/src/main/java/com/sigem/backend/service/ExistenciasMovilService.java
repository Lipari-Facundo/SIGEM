package com.sigem.backend.service;

import com.sigem.backend.dto.ExistenciaMovilDTO;
import com.sigem.backend.model.CategoriaInsumo;
import com.sigem.backend.model.Insumo;
import com.sigem.backend.model.StockEstandarMovil;
import com.sigem.backend.model.TipoInsumo;
import com.sigem.backend.model.TipoMovil;
import com.sigem.backend.repository.InsumoRepository;
import com.sigem.backend.repository.StockEstandarMovilRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ExistenciasMovilService {

    private final InsumoRepository insumoRepository;
    private final StockEstandarMovilRepository stockRepository;

    public ExistenciasMovilService(InsumoRepository insumoRepository,
                                   StockEstandarMovilRepository stockRepository) {
        this.insumoRepository = insumoRepository;
        this.stockRepository = stockRepository;
    }

    @Transactional(readOnly = true)
    public List<ExistenciaMovilDTO> listar(boolean archivado) {
        List<StockEstandarMovil> registros = archivado
                ? stockRepository.findByArchivadoTrueAndInsumo_ActivoTrueOrderByInsumo_CategoriaAscInsumo_NombreAscTipoMovilAsc()
                : stockRepository.findByArchivadoFalseAndInsumo_ActivoTrueOrderByInsumo_CategoriaAscInsumo_NombreAscTipoMovilAsc();
        Map<Long, ExistenciaMovilDTO> porInsumo = new LinkedHashMap<>();
        for (StockEstandarMovil registro : registros) {
            Long insumoId = registro.getInsumo().getId();
            ExistenciaMovilDTO dto = porInsumo.computeIfAbsent(insumoId, ignored -> mapear(registro.getInsumo(), registro.getCantidadRecomendada()));
            dto.setCantidadMinima(Math.max(dto.getCantidadMinima(), registro.getCantidadRecomendada()));
        }
        return new ArrayList<>(porInsumo.values());
    }

    @Transactional
    public ExistenciaMovilDTO crear(ExistenciaMovilDTO dto) {
        validar(dto);
        String nombre = dto.getNombre().trim();
        if (insumoRepository.findByNombreIgnoreCase(nombre).isPresent()) {
            throw new IllegalArgumentException("Ya existe un insumo con ese nombre");
        }

        Insumo insumo = new Insumo();
        insumo.setNombre(nombre);
        insumo.setCategoria(dto.getCategoria());
        insumo.setTipo(TipoInsumo.CONSUMIBLE);
        insumo.setUnidadMedida(null);
        insumo.setActivo(true);
        Insumo guardado = insumoRepository.save(insumo);
        stockRepository.saveAll(crearEstandares(guardado, dto.getCantidadMinima(), Map.of()));
        return mapear(guardado, dto.getCantidadMinima());
    }

    @Transactional
    public ExistenciaMovilDTO actualizar(Long insumoId, ExistenciaMovilDTO dto) {
        validar(dto);
        Insumo insumo = insumoRepository.findByIdForUpdate(insumoId)
                .filter(Insumo::isActivo)
                .orElseThrow(() -> new IllegalArgumentException("El insumo no existe o está archivado"));
        String nombre = dto.getNombre().trim();
        insumoRepository.findByNombreIgnoreCase(nombre)
                .filter(otro -> !otro.getId().equals(insumoId))
                .ifPresent(otro -> {
                    throw new IllegalArgumentException("Ya existe otro insumo con ese nombre");
                });
        insumo.setNombre(nombre);
        insumo.setCategoria(dto.getCategoria());
        insumoRepository.save(insumo);

        Map<TipoMovil, StockEstandarMovil> existentes = new EnumMap<>(TipoMovil.class);
        stockRepository.findByInsumo_Id(insumoId)
                .forEach(stock -> existentes.put(stock.getTipoMovil(), stock));
        List<StockEstandarMovil> actualizados = crearEstandares(insumo, dto.getCantidadMinima(), existentes);
        stockRepository.saveAll(actualizados);
        return mapear(insumo, dto.getCantidadMinima());
    }

    @Transactional
    public boolean alternarArchivo(Long insumoId) {
        Insumo insumo = insumoRepository.findByIdForUpdate(insumoId)
                .filter(Insumo::isActivo)
                .orElseThrow(() -> new IllegalArgumentException("El insumo no existe o está inactivo"));
        List<StockEstandarMovil> registros = stockRepository.findByInsumo_Id(insumoId);
        if (registros.isEmpty()) {
            throw new IllegalArgumentException("El insumo no tiene una existencia mínima configurada");
        }
        boolean archivar = registros.stream().anyMatch(registro -> !registro.isArchivado());
        registros.forEach(registro -> registro.setArchivado(archivar));
        stockRepository.saveAll(registros);
        return archivar;
    }

    private List<StockEstandarMovil> crearEstandares(
            Insumo insumo, int cantidad, Map<TipoMovil, StockEstandarMovil> existentes) {
        return java.util.Arrays.stream(TipoMovil.values())
                .map(tipoMovil -> {
                    StockEstandarMovil stock = existentes.getOrDefault(tipoMovil, new StockEstandarMovil());
                    stock.setTipoMovil(tipoMovil);
                    stock.setInsumo(insumo);
                    stock.setCantidadRecomendada(cantidad);
                    stock.setArchivado(false);
                    return stock;
                })
                .toList();
    }

    private void validar(ExistenciaMovilDTO dto) {
        if (dto == null || dto.getNombre() == null || dto.getNombre().isBlank()
                || dto.getNombre().trim().length() > 255) {
            throw new IllegalArgumentException("El nombre es obligatorio y no puede superar 255 caracteres");
        }
        if (dto.getCategoria() == null) {
            throw new IllegalArgumentException("La categoría es obligatoria");
        }
        if (dto.getCantidadMinima() == null || dto.getCantidadMinima() < 0) {
            throw new IllegalArgumentException("La cantidad mínima debe ser cero o mayor");
        }
    }

    private ExistenciaMovilDTO mapear(Insumo insumo, int cantidadMinima) {
        ExistenciaMovilDTO dto = new ExistenciaMovilDTO();
        dto.setInsumoId(insumo.getId());
        dto.setNombre(insumo.getNombre());
        dto.setCategoria(insumo.getCategoria());
        dto.setUnidadMedida(insumo.getUnidadMedida());
        dto.setCantidadMinima(cantidadMinima);
        return dto;
    }
}
