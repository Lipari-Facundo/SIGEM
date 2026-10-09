package com.sigem.backend.config;

import com.sigem.backend.model.CategoriaInsumo;
import com.sigem.backend.model.Insumo;
import com.sigem.backend.model.Movil;
import com.sigem.backend.model.MovilInsumo;
import com.sigem.backend.model.StockEstandarMovil;
import com.sigem.backend.model.TipoInsumo;
import com.sigem.backend.model.TipoMovil;
import com.sigem.backend.repository.InsumoRepository;
import com.sigem.backend.repository.MovilInsumoRepository;
import com.sigem.backend.repository.MovilRepository;
import com.sigem.backend.repository.StockEstandarMovilRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Configuration
public class InventarioDataInitializer {

    @Bean
    public CommandLineRunner initInventario(InsumoRepository insumoRepository,
                                            StockEstandarMovilRepository stockEstandarMovilRepository,
                                            MovilRepository movilRepository,
                                            MovilInsumoRepository movilInsumoRepository) {
        return args -> {
            sincronizarInventarioEstandar(insumoRepository, stockEstandarMovilRepository);
            completarInventarioMoviles(movilRepository, movilInsumoRepository, stockEstandarMovilRepository);
        };
    }

    private void completarInventarioMoviles(MovilRepository movilRepository,
                                            MovilInsumoRepository movilInsumoRepository,
                                            StockEstandarMovilRepository stockEstandarMovilRepository) {
        for (Movil movil : movilRepository.findAll()) {
            Set<Long> insumosExistentes = new HashSet<>();
            movilInsumoRepository.findByMovilIdOrderByInsumoCategoriaAscInsumoNombreAsc(movil.getId())
                    .forEach(stock -> insumosExistentes.add(stock.getInsumo().getId()));

                stockEstandarMovilRepository.findByTipoMovilAndInsumo_ActivoTrue(movil.getTipoMovil()).stream()
                    .filter(stock -> insumosExistentes.add(stock.getInsumo().getId()))
                    .forEach(stockEstandar -> {
                        MovilInsumo nuevoStock = new MovilInsumo();
                        nuevoStock.setMovil(movil);
                        nuevoStock.setInsumo(stockEstandar.getInsumo());
                        nuevoStock.setCantidadActual(stockEstandar.getCantidadRecomendada());
                        movilInsumoRepository.save(nuevoStock);
                    });
        }
    }

    private void sincronizarInventarioEstandar(InsumoRepository insumoRepository,
                                              StockEstandarMovilRepository stockEstandarMovilRepository) throws IOException {
        List<RegistroInventario> registros = cargarRegistros();
        Set<String> nombresActuales = new HashSet<>();

        for (RegistroInventario registro : registros) {
            String nombre = registro.nombre.trim();
            nombresActuales.add(nombre);

            Insumo insumo = insumoRepository.findByNombreIgnoreCase(nombre)
                    .orElseGet(Insumo::new);

            insumo.setNombre(nombre);
            insumo.setCategoria(parseCategoria(registro.categoria));
            insumo.setTipo(parseTipo(registro.tipo));
            insumo.setUnidadMedida(registro.unidadMedida);
            insumo.setActivo(true);
            insumoRepository.save(insumo);

            sincronizarStock(stockEstandarMovilRepository, insumo, TipoMovil.AMBULANCIA_UTIM, registro.cantidadUtim);
            sincronizarStock(stockEstandarMovilRepository, insumo, TipoMovil.AMBULANCIA_TRASLADO, registro.cantidadTraslado);
            sincronizarStock(stockEstandarMovilRepository, insumo, TipoMovil.VEHICULO_APOYO, registro.cantidadVehiculoApoyo);
            sincronizarStock(stockEstandarMovilRepository, insumo, TipoMovil.OTRO, registro.cantidadOtro);
        }

        List<Insumo> activos = insumoRepository.findByActivoTrueOrderByCategoriaAscNombreAsc();
        for (Insumo insumo : activos) {
            if (!nombresActuales.contains(insumo.getNombre())) {
                insumo.setActivo(false);
                insumoRepository.save(insumo);
            }
        }
    }

    private List<RegistroInventario> cargarRegistros() throws IOException {
        List<RegistroInventario> registros = new ArrayList<>();
        ClassPathResource resource = new ClassPathResource("data/inventario_estandar.tsv");

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
            String linea = reader.readLine();
            if (linea == null) {
                throw new IllegalStateException("El archivo inventario_estandar.tsv está vacío");
            }

            while ((linea = reader.readLine()) != null) {
                if (linea.isBlank()) {
                    continue;
                }

                String[] partes = linea.split("\t");
                if (partes.length < 8) {
                    throw new IllegalStateException("Formato inválido en inventario_estandar.tsv: " + linea);
                }

                registros.add(new RegistroInventario(
                        partes[0].trim(),
                        partes[1].trim(),
                        partes[2].trim(),
                        partes[3].trim(),
                        Integer.parseInt(partes[4].trim()),
                        Integer.parseInt(partes[5].trim()),
                        Integer.parseInt(partes[6].trim()),
                        Integer.parseInt(partes[7].trim())
                ));
            }
        }

        return registros;
    }

    private void sincronizarStock(StockEstandarMovilRepository repository,
                                Insumo insumo,
                                TipoMovil tipoMovil,
                                Integer cantidad) {
        if (cantidad == null || cantidad < 0) {
            return;
        }

        StockEstandarMovil stock = repository.findByTipoMovil(tipoMovil).stream()
                .filter(item -> item.getInsumo() != null && item.getInsumo().getId() != null
                        && item.getInsumo().getId().equals(insumo.getId()))
                .findFirst()
                .orElseGet(StockEstandarMovil::new);

        stock.setTipoMovil(tipoMovil);
        stock.setInsumo(insumo);
        stock.setCantidadRecomendada(cantidad);
        repository.save(stock);
    }

    private CategoriaInsumo parseCategoria(String categoria) {
        if (categoria == null) {
            throw new RuntimeException("La categoría del insumo no puede ser nula");
        }

        String normalizada = categoria.trim().toUpperCase();
        return switch (normalizada) {
            case "MEDICACION", "MED" -> CategoriaInsumo.MEDICACION;
            case "DESCARTABLE", "DES" -> CategoriaInsumo.DESCARTABLE;
            case "TRAUMA", "TRA" -> CategoriaInsumo.TRAUMA;
            case "VIA_AEREA", "VIAAEREA" -> CategoriaInsumo.VIA_AEREA;
            case "EQUIPO_MEDICO", "EQUIPO", "EQUIPOMEDICO", "EQM" -> CategoriaInsumo.EQUIPO_MEDICO;
            case "OXIGENO", "OXI" -> CategoriaInsumo.OXIGENO;
            case "ANTISEPTICO", "ANTI", "ANT" -> CategoriaInsumo.ANTISEPTICO;
            case "KIT", "K" -> CategoriaInsumo.KIT;
            case "MONITOREO", "MON" -> CategoriaInsumo.MONITOREO;
            case "CURACION", "CUR", "POR" -> CategoriaInsumo.CURACION;
            case "SOLUCION", "SOL" -> CategoriaInsumo.SOLUCION;
            case "VIA" -> CategoriaInsumo.VIA_AEREA;
            default -> throw new RuntimeException("Categoría no soportada: " + categoria);
        };
    }

    private TipoInsumo parseTipo(String tipo) {
        if (tipo == null) {
            throw new RuntimeException("El tipo del insumo no puede ser nulo");
        }

        return switch (tipo.trim().toUpperCase()) {
            case "CONSUMIBLE" -> TipoInsumo.CONSUMIBLE;
            case "REUTILIZABLE" -> TipoInsumo.REUTILIZABLE;
            default -> throw new RuntimeException("Tipo de insumo no soportado: " + tipo);
        };
    }

    private record RegistroInventario(String nombre,
                                     String categoria,
                                     String tipo,
                                     String unidadMedida,
                                     int cantidadUtim,
                                     int cantidadTraslado,
                                     int cantidadVehiculoApoyo,
                                     int cantidadOtro) {
    }
}