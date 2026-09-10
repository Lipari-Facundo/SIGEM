package com.sigem.backend.service;

import com.sigem.backend.dto.NotificacionDTO;
import com.sigem.backend.model.Incidente;
import com.sigem.backend.model.Notificacion;
import com.sigem.backend.model.TipoNotificacion;
import com.sigem.backend.model.Usuario;
import com.sigem.backend.repository.NotificacionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificacionService {

    private final NotificacionRepository notificacionRepository;

    public NotificacionService(NotificacionRepository notificacionRepository) {
        this.notificacionRepository = notificacionRepository;
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

    @Transactional(readOnly = true)
    public List<NotificacionDTO> listarMias(Usuario usuario) {
        return notificacionRepository.findByUsuarioIdOrderByFechaCreacionDesc(usuario.getId())
                .stream()
                .map(this::convertir)
                .toList();
    }

    @Transactional(readOnly = true)
    public long contarNoLeidas(Usuario usuario) {
        return notificacionRepository.countByUsuarioIdAndLeidaFalse(usuario.getId());
    }

    @Transactional
    public NotificacionDTO marcarComoLeida(Long id, Usuario usuario) {
        Notificacion notificacion = notificacionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notificación no encontrada"));

        if (!notificacion.getUsuario().getId().equals(usuario.getId())) {
            throw new RuntimeException("No tiene permiso para modificar esta notificación");
        }

        notificacion.setLeida(true);
        return convertir(notificacionRepository.save(notificacion));
    }

    private NotificacionDTO convertir(Notificacion notificacion) {
        NotificacionDTO dto = new NotificacionDTO();
        dto.setId(notificacion.getId());
        dto.setMensaje(notificacion.getMensaje());
        dto.setLeida(notificacion.isLeida());
        dto.setFechaCreacion(notificacion.getFechaCreacion());
        dto.setIncidenteId(notificacion.getIncidente().getId());
        dto.setUbicacionIncidente(notificacion.getIncidente().getUbicacion());
        dto.setTipo(notificacion.getTipo() != null ? notificacion.getTipo().name() : null);
        return dto;
    }
}