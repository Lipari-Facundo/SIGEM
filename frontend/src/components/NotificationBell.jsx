import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useNotificaciones from '../hooks/useNotificaciones';
import { useAuth } from '../context/AuthContext';

function tiempoRelativo(fecha) {
  const segundos = Math.max(0, Math.floor((Date.now() - new Date(fecha).getTime()) / 1000));
  if (segundos < 60) return 'Hace unos segundos';
  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `Hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `Hace ${horas} h`;
  return `Hace ${Math.floor(horas / 24)} d`;
}

function contenidoNotificacion(notificacion, rol) {
  if (notificacion.tipo === 'SOLICITUD_REPOSICION_NUEVA') {
    return { icono: '📋', mensaje: notificacion.mensaje };
  }
  if (notificacion.tipo === 'REPOSICION_ENTREGADA') {
    return { icono: '📦', mensaje: notificacion.mensaje };
  }
  if (notificacion.tipo === 'INCIDENTE_REASIGNADO') {
    return { icono: '🔄', mensaje: 'Tu incidente fue reasignado a otro móvil' };
  }
  if (notificacion.tipo === 'INCIDENTE_RECHAZADO' && rol === 'DES') {
    return { icono: '🚨', mensaje: notificacion.mensaje || 'Un enfermero rechazó tu incidente' };
  }
  return { icono: '🚑', mensaje: notificacion.mensaje };
}

function tituloAlerta(notificacion, rol) {
  if (notificacion.tipo === 'SOLICITUD_REPOSICION_NUEVA') {
    return '📋 NUEVA SOLICITUD DE REPOSICIÓN';
  }
  if (notificacion.tipo === 'REPOSICION_ENTREGADA') {
    return '📦 REPOSICIÓN REALIZADA';
  }
  if (rol === 'DES' && notificacion.tipo === 'INCIDENTE_RECHAZADO') {
    return '🚨 RECHAZO URGENTE';
  }
  if (notificacion.tipo === 'INCIDENTE_REASIGNADO') {
    return '⚠️ INCIDENTE REASIGNADO';
  }
  return '🚑 NUEVO INCIDENTE URGENTE';
}

export default function NotificationBell({ controlPendiente }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { notificaciones, noLeidas, marcarLeida } = useNotificaciones();
  const [abierto, setAbierto] = useState(false);
  const primeraNoLeida = notificaciones.find(notificacion => !notificacion.leida);
  const totalAlertas = noLeidas + (controlPendiente ? 1 : 0);

  if (!['ENF', 'JEF', 'DES'].includes(user?.rol)) return null;

  const abrirNotificacion = async (notificacion) => {
    if (notificacion.tipo === 'CONTROL_MOVIL_PENDIENTE') {
      setAbierto(false);
      navigate('/control-movil');
      return;
    }
    try {
      if (!notificacion.leida) await marcarLeida(notificacion.id);
    } finally {
      setAbierto(false);
      if (notificacion.tipo === 'REPOSICION_ENTREGADA' && notificacion.solicitudId) {
        navigate('/inventario', { state: { solicitudId: notificacion.solicitudId } });
      } else if (notificacion.tipo === 'SOLICITUD_REPOSICION_NUEVA' && notificacion.solicitudId) {
        navigate('/solicitudes-reposicion', { state: { solicitudId: notificacion.solicitudId } });
      } else {
        navigate('/incidentes');
      }
    }
  };

  return (
    <>
      {controlPendiente && (
        <button
          type="button"
          style={{ ...S.alert, ...S.controlAlert, ...(primeraNoLeida ? S.alertBelow : {}) }}
          onClick={() => abrirNotificacion({ tipo: 'CONTROL_MOVIL_PENDIENTE' })}
        >
          <span style={S.alertIcon} aria-hidden="true">✅</span>
          <span style={S.alertContent}>
            <strong>CONTROL DE MÓVIL PENDIENTE</strong>
            <span>Completá el control de la guardia activa.</span>
            <small>Tocá para ir al control</small>
          </span>
        </button>
      )}
      {primeraNoLeida && (
        <button
          type="button"
          style={{ ...S.alert, ...(controlPendiente ? S.alertBelow : {}) }}
          onClick={() => abrirNotificacion(primeraNoLeida)}
        >
          <span style={S.alertIcon} aria-hidden="true">{contenidoNotificacion(primeraNoLeida, user.rol).icono}</span>
          <span style={S.alertContent}>
            <strong>{tituloAlerta(primeraNoLeida, user.rol)}</strong>
            <span>{contenidoNotificacion(primeraNoLeida, user.rol).mensaje}</span>
            <small>Ingresá para ver los detalles</small>
          </span>
        </button>
      )}

      <div style={S.wrapper}>
        <button
          type="button"
          onClick={() => setAbierto(actual => !actual)}
          style={{ ...S.bellButton, ...(totalAlertas > 0 ? S.bellActive : {}) }}
          title="Notificaciones"
          aria-label={`Notificaciones${totalAlertas ? `, ${totalAlertas} alertas` : ''}`}
        >
          <span aria-hidden="true">🔔</span>
          {totalAlertas > 0 && <span style={S.badge}>{totalAlertas > 99 ? '99+' : totalAlertas}</span>}
        </button>

        {abierto && (
          <div style={S.dropdown}>
            <div style={S.dropdownHeader}>Notificaciones</div>
            {notificaciones.length === 0 && !controlPendiente ? (
              <div style={S.empty}>No tenés notificaciones nuevas.</div>
            ) : (
              <>
                {controlPendiente && (
                  <button
                    type="button"
                    onClick={() => abrirNotificacion({ tipo: 'CONTROL_MOVIL_PENDIENTE' })}
                    style={{ ...S.item, ...S.itemUnread }}
                  >
                    <span style={S.message}>✅ Control de móvil pendiente · Ir al control</span>
                    <span style={S.time}>Guardia activa</span>
                  </button>
                )}
                {notificaciones.map(notificacion => (
                  <button
                    type="button"
                    key={notificacion.id}
                    onClick={() => abrirNotificacion(notificacion)}
                    style={{ ...S.item, ...(notificacion.leida ? {} : S.itemUnread) }}
                  >
                    <span style={S.message}>
                      {contenidoNotificacion(notificacion, user.rol).icono} {contenidoNotificacion(notificacion, user.rol).mensaje}
                    </span>
                    <span style={S.time}>{tiempoRelativo(notificacion.fechaCreacion)}</span>
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

const S = {
  alert: {
    position: 'fixed',
    top: '4.5rem',
    right: '1rem',
    zIndex: 'var(--z-modal)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    width: 'min(28rem, calc(100vw - 2rem))',
    padding: '1rem 1.1rem',
    border: '3px solid var(--color-danger)',
    borderRadius: 'var(--radius-md)',
    background: '#fff5f5',
    color: 'var(--color-text-primary)',
    boxShadow: '0 12px 36px rgba(185, 31, 31, 0.42)',
    textAlign: 'left',
    cursor: 'pointer',
    animation: 'notificationPulse 1.8s ease-in-out infinite',
  },
  alertBelow: { top: '10.5rem' },
  controlAlert: {
    borderColor: 'var(--color-warning)',
    background: '#fff8e8',
    boxShadow: '0 12px 36px rgba(245, 158, 11, 0.25)',
    animation: 'sigemControlPulse 1.8s ease-in-out infinite',
  },
  alertIcon: { fontSize: '1.65rem', flexShrink: 0 },
  alertContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.15rem',
    minWidth: 0,
  },
  wrapper: {
    position: 'fixed',
    top: '1rem',
    right: '1rem',
    zIndex: 'var(--z-popover)',
  },
  bellButton: {
    position: 'relative',
    display: 'grid',
    placeItems: 'center',
    width: '2.35rem',
    height: '2.35rem',
    margin: 0,
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    background: 'var(--color-surface-alt)',
    color: 'var(--color-text-primary)',
    cursor: 'pointer',
    fontSize: '1.05rem',
  },
  bellActive: {
    borderColor: 'var(--color-danger)',
    background: '#fff5f5',
    animation: 'notificationPulse 1.8s ease-in-out infinite',
  },
  badge: {
    position: 'absolute',
    top: '-0.35rem',
    right: '-0.45rem',
    minWidth: '1.2rem',
    height: '1.2rem',
    padding: '0 0.2rem',
    borderRadius: '50%',
    background: 'var(--color-danger)',
    color: 'var(--color-on-primary)',
    display: 'grid',
    placeItems: 'center',
    fontSize: '0.65rem',
    fontWeight: 800,
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 0.6rem)',
    right: 0,
    width: 'min(18rem, 75vw)',
    maxHeight: '22rem',
    overflowY: 'auto',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-lg)',
  },
  dropdownHeader: {
    padding: '0.8rem 0.9rem',
    borderBottom: '1px solid var(--color-border)',
    color: 'var(--color-text-primary)',
    fontWeight: 800,
    fontSize: '0.85rem',
  },
  item: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '0.25rem',
    width: '100%',
    padding: '0.75rem 0.9rem',
    border: 'none',
    borderBottom: '1px solid var(--color-border)',
    background: 'var(--color-surface)',
    color: 'var(--color-text-primary)',
    textAlign: 'left',
    cursor: 'pointer',
  },
  itemUnread: { background: 'var(--color-primary-soft)' },
  message: { fontSize: '0.8rem', lineHeight: 1.4 },
  time: { color: 'var(--color-text-muted)', fontSize: '0.7rem' },
  empty: { padding: '1rem 0.9rem', color: 'var(--color-text-secondary)', fontSize: '0.8rem' },
};