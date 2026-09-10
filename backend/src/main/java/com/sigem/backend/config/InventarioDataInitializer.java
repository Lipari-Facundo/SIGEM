package com.sigem.backend.config;

import com.sigem.backend.model.CategoriaInsumo;
import com.sigem.backend.model.Insumo;
import com.sigem.backend.model.StockEstandarMovil;
import com.sigem.backend.model.TipoInsumo;
import com.sigem.backend.model.TipoMovil;
import com.sigem.backend.repository.InsumoRepository;
import com.sigem.backend.repository.StockEstandarMovilRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Configuration
public class InventarioDataInitializer {

    @Bean
    public CommandLineRunner initInventario(InsumoRepository insumoRepository,
                                            StockEstandarMovilRepository stockEstandarMovilRepository) {
        return args -> {
            if (insumoRepository.count() > 0) {
                return;
            }

            List<Insumo> insumos = List.of(
                    insumo("Guantes M", CategoriaInsumo.DESCARTABLE, TipoInsumo.CONSUMIBLE, "caja"),
                    insumo("Cateter 20", CategoriaInsumo.DESCARTABLE, TipoInsumo.CONSUMIBLE, "unidad"),
                    insumo("Cateter 18", CategoriaInsumo.DESCARTABLE, TipoInsumo.CONSUMIBLE, "unidad"),
                    insumo("Solucion fisiologica", CategoriaInsumo.MEDICACION, TipoInsumo.CONSUMIBLE, "ml"),
                    insumo("Perfus macrogotero", CategoriaInsumo.DESCARTABLE, TipoInsumo.CONSUMIBLE, "unidad"),
                    insumo("Collar cervical", CategoriaInsumo.TRAUMA, TipoInsumo.CONSUMIBLE, "unidad"),
                    insumo("Tubo endotraqueal 7.5", CategoriaInsumo.VIA_AEREA, TipoInsumo.CONSUMIBLE, "unidad"),
                    insumo("Gasas", CategoriaInsumo.DESCARTABLE, TipoInsumo.CONSUMIBLE, "unidad"),
                    insumo("Dexametasona", CategoriaInsumo.MEDICACION, TipoInsumo.CONSUMIBLE, "unidad"),
                    insumo("Aguja", CategoriaInsumo.DESCARTABLE, TipoInsumo.CONSUMIBLE, "unidad"),
                    insumo("Jeringa", CategoriaInsumo.DESCARTABLE, TipoInsumo.CONSUMIBLE, "unidad"),
                    insumo("Tensiometro", CategoriaInsumo.EQUIPO_MEDICO, TipoInsumo.REUTILIZABLE, "unidad"),
                    insumo("Linterna", CategoriaInsumo.EQUIPO_MEDICO, TipoInsumo.REUTILIZABLE, "unidad"),
                    insumo("Glucometro", CategoriaInsumo.EQUIPO_MEDICO, TipoInsumo.REUTILIZABLE, "unidad"),
                    insumo("Estetoscopio", CategoriaInsumo.EQUIPO_MEDICO, TipoInsumo.REUTILIZABLE, "unidad"),
                    insumo("ECG", CategoriaInsumo.EQUIPO_MEDICO, TipoInsumo.REUTILIZABLE, "unidad"),
                    insumo("Desfibrilador", CategoriaInsumo.EQUIPO_MEDICO, TipoInsumo.REUTILIZABLE, "unidad"),
                    insumo("Ciclador", CategoriaInsumo.EQUIPO_MEDICO, TipoInsumo.REUTILIZABLE, "unidad"),
                    insumo("Tubo de oxigeno", CategoriaInsumo.OXIGENO, TipoInsumo.REUTILIZABLE, "unidad")
            );
            insumoRepository.saveAll(insumos);

            Map<String, Insumo> porNombre = new HashMap<>();
            insumos.forEach(item -> porNombre.put(item.getNombre(), item));

            // Cantidades de ejemplo: deben ajustarse con el equipo medico real del proyecto.
            agregarStockUTIM(stockEstandarMovilRepository, porNombre);
            agregarStockTraslado(stockEstandarMovilRepository, porNombre);
            agregarStockMinimo(stockEstandarMovilRepository, porNombre, TipoMovil.VEHICULO_APOYO);
            agregarStockMinimo(stockEstandarMovilRepository, porNombre, TipoMovil.OTRO);
        };
    }

    private void agregarStockUTIM(StockEstandarMovilRepository repository, Map<String, Insumo> insumos) {
        agregar(repository, insumos, TipoMovil.AMBULANCIA_UTIM, "Guantes M", 3);
        agregar(repository, insumos, TipoMovil.AMBULANCIA_UTIM, "Cateter 20", 10);
        agregar(repository, insumos, TipoMovil.AMBULANCIA_UTIM, "Cateter 18", 10);
        agregar(repository, insumos, TipoMovil.AMBULANCIA_UTIM, "Solucion fisiologica", 10);
        agregar(repository, insumos, TipoMovil.AMBULANCIA_UTIM, "Perfus macrogotero", 10);
        agregar(repository, insumos, TipoMovil.AMBULANCIA_UTIM, "Collar cervical", 5);
        agregar(repository, insumos, TipoMovil.AMBULANCIA_UTIM, "Tubo endotraqueal 7.5", 5);
        agregar(repository, insumos, TipoMovil.AMBULANCIA_UTIM, "Gasas", 20);
        agregar(repository, insumos, TipoMovil.AMBULANCIA_UTIM, "Dexametasona", 10);
        agregar(repository, insumos, TipoMovil.AMBULANCIA_UTIM, "Aguja", 20);
        agregar(repository, insumos, TipoMovil.AMBULANCIA_UTIM, "Jeringa", 20);
        agregarReutilizables(repository, insumos, TipoMovil.AMBULANCIA_UTIM, true);
    }

    private void agregarStockTraslado(StockEstandarMovilRepository repository, Map<String, Insumo> insumos) {
        agregar(repository, insumos, TipoMovil.AMBULANCIA_TRASLADO, "Guantes M", 2);
        agregar(repository, insumos, TipoMovil.AMBULANCIA_TRASLADO, "Cateter 20", 6);
        agregar(repository, insumos, TipoMovil.AMBULANCIA_TRASLADO, "Cateter 18", 6);
        agregar(repository, insumos, TipoMovil.AMBULANCIA_TRASLADO, "Solucion fisiologica", 6);
        agregar(repository, insumos, TipoMovil.AMBULANCIA_TRASLADO, "Perfus macrogotero", 6);
        agregar(repository, insumos, TipoMovil.AMBULANCIA_TRASLADO, "Collar cervical", 3);
        agregar(repository, insumos, TipoMovil.AMBULANCIA_TRASLADO, "Tubo endotraqueal 7.5", 3);
        agregar(repository, insumos, TipoMovil.AMBULANCIA_TRASLADO, "Gasas", 12);
        agregar(repository, insumos, TipoMovil.AMBULANCIA_TRASLADO, "Dexametasona", 6);
        agregar(repository, insumos, TipoMovil.AMBULANCIA_TRASLADO, "Aguja", 12);
        agregar(repository, insumos, TipoMovil.AMBULANCIA_TRASLADO, "Jeringa", 12);
        agregarReutilizables(repository, insumos, TipoMovil.AMBULANCIA_TRASLADO, false);
    }

    private void agregarStockMinimo(StockEstandarMovilRepository repository,
                                    Map<String, Insumo> insumos,
                                    TipoMovil tipoMovil) {
        agregar(repository, insumos, tipoMovil, "Guantes M", 1);
        agregar(repository, insumos, tipoMovil, "Cateter 20", 2);
        agregar(repository, insumos, tipoMovil, "Solucion fisiologica", 2);
        agregar(repository, insumos, tipoMovil, "Gasas", 4);
        agregar(repository, insumos, tipoMovil, "Jeringa", 4);
        agregar(repository, insumos, tipoMovil, "Estetoscopio", 1);
        agregar(repository, insumos, tipoMovil, "Tensiometro", 1);
        agregar(repository, insumos, tipoMovil, "Linterna", 1);
    }

    private void agregarReutilizables(StockEstandarMovilRepository repository,
                                      Map<String, Insumo> insumos,
                                      TipoMovil tipoMovil,
                                      boolean incluirEquipamientoAvanzado) {
        agregar(repository, insumos, tipoMovil, "Tensiometro", 1);
        agregar(repository, insumos, tipoMovil, "Linterna", 1);
        agregar(repository, insumos, tipoMovil, "Glucometro", 1);
        agregar(repository, insumos, tipoMovil, "Estetoscopio", 1);
        agregar(repository, insumos, tipoMovil, "ECG", 1);
        if (incluirEquipamientoAvanzado) {
            agregar(repository, insumos, tipoMovil, "Desfibrilador", 1);
            agregar(repository, insumos, tipoMovil, "Ciclador", 1);
        }
        agregar(repository, insumos, tipoMovil, "Tubo de oxigeno", 1);
    }

    private void agregar(StockEstandarMovilRepository repository,
                         Map<String, Insumo> insumos,
                         TipoMovil tipoMovil,
                         String nombre,
                         int cantidad) {
        StockEstandarMovil stock = new StockEstandarMovil();
        stock.setTipoMovil(tipoMovil);
        stock.setInsumo(insumos.get(nombre));
        stock.setCantidadRecomendada(cantidad);
        repository.save(stock);
    }

    private Insumo insumo(String nombre, CategoriaInsumo categoria, TipoInsumo tipo, String unidadMedida) {
        Insumo insumo = new Insumo();
        insumo.setNombre(nombre);
        insumo.setCategoria(categoria);
        insumo.setTipo(tipo);
        insumo.setUnidadMedida(unidadMedida);
        insumo.setActivo(true);
        return insumo;
    }
}