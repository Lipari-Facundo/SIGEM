package com.sigem.backend.service;

import com.sigem.backend.dto.NotificacionDTO;
import com.sigem.backend.model.Incidente;
import com.sigem.backend.model.Guardia;
import com.sigem.backend.model.GuardiaEstado;
import com.sigem.backend.model.Notificacion;
import com.sigem.backend.model.Rol;
import com.sigem.backend.model.SolicitudReposicion;
import com.sigem.backend.model.TipoGuardia;
import com.sigem.backend.model.TipoNotificacion;
import com.sigem.backend.model.Usuario;
import com.sigem.backend.repository.GuardiaRepository;
import com.sigem.backend.repository.NotificacionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificacionService {

    private final NotificacionRepository notificacionRepository;
    private final GuardiaRepository guardiaRepository;

    public NotificacionService(NotificacionRepository notificacionRepository,
                               GuardiaRepository guardiaRepository) {
        this.notificacionRepository = notificacionRepository;
        this.guardiaRepository = guardiaRepository;
    }

    @Transactional
    public NotificacionDTO crearNotificacionAsignacion(Usuario destinatario, Incidente incidente) {
        return crearNotificacion(destinatario, incidente, TipoNotificacion.INCIDENTE_ASIGNADO,
                "Nuevo incidente asignado: " + incidente.getMotivo()
                        + " en " + incidente.getUbicacion());
    }

    @Transactional
    public NotificacionDTO crearNotificacion(Usuario destinatario, Incidente incidente,
                                             TipoNotificacion tipo, String mensaje) {
        Notificacion notificacion = new Notificacion();
        notificacion.setUsuario(destinatario);
        notificacion.setIncidente(incidente);
        notificacion.setTipo(tipo);
        notificacion.setMensaje(mensaje);
        return convertir(notificacionRepository.saveAndFlush(notificacion));
    }

    @Transactional
    public NotificacionDTO crearNotificacionReposicion(SolicitudReposicion solicitud, boolean parcial) {
        Notificacion notificacion = new Notificacion();
        notificacion.setUsuario(solicitud.getEnfermero());
        notificacion.setSolicitud(solicitud);
        notificacion.setTipo(TipoNotificacion.REPOSICION_ENTREGADA);
        notificacion.setMensaje(parcial
                ? "Tu solicitud de reposición recibió una entrega parcial. El stock del móvil fue actualizado."
                : "Tu solicitud de reposición fue entregada. El stock del móvil fue actualizado.");
        return convertir(notificacionRepository.saveAndFlush(notificacion));
    }

    @Transactional
    public void notificarNuevaSolicitud(SolicitudReposicion solicitud) {
        Usuario destinatario = guardiaRepository
                .findByEstadoAndTipoGuardiaOrderByFechaInicioDesc(GuardiaEstado.ACTIVA, TipoGuardia.CENTRAL)
                .stream()
                .map(Guardia::getEnfermero)
                .filter(usuario -> usuario.isActivo() && usuario.getRol() == Rol.JEF)
                .findFirst()
                .orElse(null);
        if (destinatario == null) return;

        Notificacion notificacion = new Notificacion();
        notificacion.setUsuario(destinatario);
        notificacion.setSolicitud(solicitud);
        notificacion.setCompartida(true);
        notificacion.setTipo(TipoNotificacion.SOLICITUD_REPOSICION_NUEVA);
        notificacion.setMensaje("Nueva solicitud de reposición #" + solicitud.getId()
                + " para el móvil " + solicitud.getMovil().getNumeroInterno() + ".");
        notificacionRepository.saveAndFlush(notificacion);
    }

    @Transactional(readOnly = true)
    public List<NotificacionDTO> listarMias(Usuario usuario) {
        boolean puedeVerCompartidas = usuario.getRol() == Rol.JEF && tieneGuardiaCentralActiva(usuario);
        return notificacionRepository.findByUsuarioIdOrCompartidaTrueOrderByFechaCreacionDesc(usuario.getId())
                .stream()
                .filter(notificacion -> !notificacion.isCompartida()
                        || (puedeVerCompartidas
                        && notificacion.getTipo() == TipoNotificacion.SOLICITUD_REPOSICION_NUEVA))
                .map(this::convertir)
                .toList();
    }

    @Transactional(readOnly = true)
    public long contarNoLeidas(Usuario usuario) {
        return listarMias(usuario).stream().filter(notificacion -> !notificacion.isLeida()).count();
    }

    @Transactional
    public NotificacionDTO marcarComoLeida(Long id, Usuario usuario) {
        Notificacion notificacion = notificacionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notificación no encontrada"));

        boolean esPropia = notificacion.getUsuario().getId().equals(usuario.getId());
        boolean puedeLeerCompartida = notificacion.isCompartida()
                && notificacion.getTipo() == TipoNotificacion.SOLICITUD_REPOSICION_NUEVA
                && usuario.getRol() == Rol.JEF
                && tieneGuardiaCentralActiva(usuario);
        if (!esPropia && !puedeLeerCompartida) {
            throw new RuntimeException("No tiene permiso para modificar esta notificación");
        }
        if (notificacion.isCompartida() && !puedeLeerCompartida) {
            throw new RuntimeException("Solo una guardia central activa puede cerrar esta alerta compartida");
        }

        notificacion.setLeida(true);
        return convertir(notificacionRepository.save(notificacion));
    }

    private NotificacionDTO convertir(Notificacion notificacion) {
        NotificacionDTO dto = new NotificacionDTO();
        dto.setId(notificacion.getId());
        dto.setMensaje(notificacion.getMensaje());
        dto.setLeida(notificacion.isLeida());
        dto.setCompartida(notificacion.isCompartida());
        dto.setFechaCreacion(notificacion.getFechaCreacion());
        if (notificacion.getIncidente() != null) {
            dto.setIncidenteId(notificacion.getIncidente().getId());
            dto.setUbicacionIncidente(notificacion.getIncidente().getUbicacion());
        }
        if (notificacion.getSolicitud() != null) {
            dto.setSolicitudId(notificacion.getSolicitud().getId());
        }
        dto.setTipo(notificacion.getTipo() != null ? notificacion.getTipo().name() : null);
        return dto;
    }

    private boolean tieneGuardiaCentralActiva(Usuario usuario) {
        return guardiaRepository.findByEnfermeroUsernameAndEstadoAndTipoGuardia(
                usuario.getUsername(), GuardiaEstado.ACTIVA, TipoGuardia.CENTRAL).isPresent();
    }
}