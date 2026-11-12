package com.sigem.backend.config;

import org.junit.jupiter.api.Test;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class InventarioCatalogoTest {

    @Test
    void respiradorEstaEnElEstandarDeLosCuatroTiposDeMovilYCardioConservaNombreCanonico()
            throws IOException {
        List<String[]> filas = new ArrayList<>();
        try (var stream = getClass().getClassLoader()
                .getResourceAsStream("data/inventario_estandar.tsv")) {
            if (stream == null) {
                throw new IllegalStateException("No se encontró el catálogo del inventario estándar");
            }
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(stream, StandardCharsets.UTF_8))) {
                reader.readLine();
                String linea;
                while ((linea = reader.readLine()) != null) {
                    if (!linea.isBlank()) {
                        filas.add(linea.split("\t"));
                    }
                }
            }
        }

        List<String[]> cardiodesfibriladores = filas.stream()
                .filter(fila -> fila[0].equals("Cardiodesfibrilador"))
                .toList();
        assertEquals(1, cardiodesfibriladores.size());
        assertEquals(0, filas.stream().filter(fila -> fila[0].equals("Desfibrilador")).count());

        List<String[]> respiradores = filas.stream()
                .filter(fila -> fila[0].equals("Respirador"))
                .toList();
        assertEquals(1, respiradores.size());
        assertEquals("EQM", respiradores.get(0)[1]);
        assertEquals("REUTILIZABLE", respiradores.get(0)[2]);
        assertEquals(List.of("1", "1", "1", "1"),
                List.of(respiradores.get(0)[4], respiradores.get(0)[5],
                        respiradores.get(0)[6], respiradores.get(0)[7]));
    }
}
