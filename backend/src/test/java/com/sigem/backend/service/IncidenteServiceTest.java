package com.sigem.backend.service;

import com.sigem.backend.model.EstadoIncidente;
import com.sigem.backend.model.Incidente;
import com.sigem.backend.model.Usuario;
import com.sigem.backend.repository.GuardiaRepository;
import com.sigem.backend.repository.IncidenteHistorialAsignacionRepository;
import com.sigem.backend.repository.IncidenteRepository;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class IncidenteServiceTest {

    @Test
    void aceptarIncidenteAsignadoNoRequiereControlDeMovil() {
        IncidenteRepository incidenteRepository = mock(IncidenteRepository.class);
        GuardiaRepository guardiaRepository = mock(GuardiaRepository.class);
        NotificacionService notificacionService = mock(NotificacionService.class);
        IncidenteHistorialAsignacionRepository historialRepository =
                mock(IncidenteHistorialAsignacionRepository.class);
        IncidenteService service = new IncidenteService(
                incidenteRepository, guardiaRepository, notificacionService, historialRepository);
        Usuario enfermero = new Usuario();
        enfermero.setUsername("enfermero-1");
        Incidente incidente = new Incidente();
        incidente.setEstado(EstadoIncidente.PENDIENTE);

        when(incidenteRepository.findByIdAndAsignadoAUsername(31L, "enfermero-1"))
                .thenReturn(Optional.of(incidente));
        when(incidenteRepository.save(incidente)).thenReturn(incidente);

        Incidente actualizado = service.actualizarEstado(31L, enfermero, "EN_PROCESO");

        assertSame(incidente, actualizado);
        assertEquals(EstadoIncidente.EN_PROCESO, actualizado.getEstado());
        verify(incidenteRepository).findByIdAndAsignadoAUsername(31L, "enfermero-1");
        verify(incidenteRepository).save(incidente);
        verifyNoInteractions(guardiaRepository, notificacionService, historialRepository);
    }
}
