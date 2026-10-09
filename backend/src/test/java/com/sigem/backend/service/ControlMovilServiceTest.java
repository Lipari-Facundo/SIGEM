package com.sigem.backend.service;

import com.sigem.backend.model.ResultadoControl;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ControlMovilServiceTest {

    @Test
    void resultadoConNovedadesDebeSerValido() {
        assertEquals(ResultadoControl.CON_NOVEDADES, ResultadoControl.CON_NOVEDADES);
    }
}
