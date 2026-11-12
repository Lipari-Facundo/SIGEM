package com.sigem.backend.service;

import com.sigem.backend.model.Guardia;
import com.sigem.backend.model.GuardiaEstado;
import com.sigem.backend.model.Movil;
import com.sigem.backend.model.Notificacion;
import com.sigem.backend.model.Rol;
import com.sigem.backend.model.SolicitudReposicion;
import com.sigem.backend.model.TipoGuardia;
import com.sigem.backend.model.TipoNotificacion;
import com.sigem.backend.model.Usuario;
import com.sigem.backend.repository.GuardiaRepository;
import com.sigem.backend.repository.NotificacionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificacionServiceTest {

    @Mock private NotificacionRepository notificacionRepository;
    @Mock private GuardiaRepository guardiaRepository;

    private NotificacionService service;

    @BeforeEach
    void setUp() {
        service = new NotificacionService(notificacionRepository, guardiaRepository);
    }

    @Test
    void nuevaSolicitudCreaUnaUnicaNotificacionCompartidaParaGuardiaCentralActiva() {
        Usuario guardiaActiva = usuario(21L, "coord-a");
        Usuario otraGuardia = usuario(22L, "coord-b");
        Guardia primera = guardia(guardiaActiva);
        Guardia segunda = guardia(otraGuardia);
        when(guardiaRepository.findByEstadoAndTipoGuardiaOrderByFechaInicioDesc(
                GuardiaEstado.ACTIVA, TipoGuardia.CENTRAL)).thenReturn(List.of(primera, segunda));
        when(notificacionRepository.saveAndFlush(any(Notificacion.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        SolicitudReposicion solicitud = new SolicitudReposicion();
        solicitud.setId(82L);
        Movil movil = new Movil();
        movil.setNumeroInterno("M-12");
        solicitud.setMovil(movil);

        service.notificarNuevaSolicitud(solicitud);

        ArgumentCaptor<Notificacion> notificacionCaptor = ArgumentCaptor.forClass(Notificacion.class);
        verify(notificacionRepository).saveAndFlush(notificacionCaptor.capture());
        Notificacion guardada = notificacionCaptor.getValue();
        assertTrue(guardada.isCompartida());
        assertEquals(guardiaActiva, guardada.getUsuario());
        assertEquals(solicitud, guardada.getSolicitud());
        assertEquals(TipoNotificacion.SOLICITUD_REPOSICION_NUEVA, guardada.getTipo());
    }

    @Test
    void otroCoordinadorDeGuardiaActivaPuedeCerrarLaAlertaGlobal() {
        Usuario propietaria = usuario(21L, "coord-a");
        Usuario coordinador = usuario(22L, "coord-b");
        Notificacion compartida = new Notificacion();
        compartida.setId(44L);
        compartida.setUsuario(propietaria);
        compartida.setTipo(TipoNotificacion.SOLICITUD_REPOSICION_NUEVA);
        compartida.setCompartida(true);
        when(notificacionRepository.findByUsuarioIdOrCompartidaTrueOrderByFechaCreacionDesc(22L))
                .thenReturn(List.of(compartida));
        when(guardiaRepository.findByEnfermeroUsernameAndEstadoAndTipoGuardia(
                "coord-b", GuardiaEstado.ACTIVA, TipoGuardia.CENTRAL))
                .thenReturn(Optional.of(guardia(coordinador)));
        when(notificacionRepository.findById(44L)).thenReturn(Optional.of(compartida));
        when(notificacionRepository.save(any(Notificacion.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        var lista = service.listarMias(coordinador);
        var leida = service.marcarComoLeida(44L, coordinador);

        assertEquals(1, lista.size());
        assertTrue(lista.get(0).isCompartida());
        assertTrue(leida.isLeida());
        assertTrue(compartida.isLeida());
        verify(notificacionRepository).save(compartida);
    }

    @Test
    void noCreaAlertaSiNoHayCoordinadoresEnGuardiaCentralActiva() {
        Usuario enfermero = usuario(10L, "enfermero");
        enfermero.setRol(Rol.ENF);
        when(guardiaRepository.findByEstadoAndTipoGuardiaOrderByFechaInicioDesc(
                GuardiaEstado.ACTIVA, TipoGuardia.CENTRAL))
                .thenReturn(List.of(guardia(enfermero)));
        SolicitudReposicion solicitud = new SolicitudReposicion();
        solicitud.setId(83L);
        solicitud.setMovil(new Movil());

        service.notificarNuevaSolicitud(solicitud);

        org.mockito.Mockito.verifyNoInteractions(notificacionRepository);
    }

    private Usuario usuario(Long id, String username) {
        Usuario usuario = new Usuario();
        usuario.setId(id);
        usuario.setUsername(username);
        usuario.setNombre("Coordinador");
        usuario.setApellido(username);
        usuario.setRol(Rol.JEF);
        return usuario;
    }

    private Guardia guardia(Usuario usuario) {
        Guardia guardia = new Guardia();
        guardia.setEnfermero(usuario);
        guardia.setEstado(GuardiaEstado.ACTIVA);
        guardia.setTipoGuardia(TipoGuardia.CENTRAL);
        return guardia;
    }
}
