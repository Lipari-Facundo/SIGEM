import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import { guardiaService } from '../services/api';
import { useEffect, useState } from 'react';

const items = [
  { path: '/dashboard',          label: 'Panel de control',   icon: '🏠', roles: ['ADM','ENF','JEF','DES','DIR'] },
  { path: '/director-dashboard', label: 'Panel de dirección', icon: '📊', roles: ['DIR','ADM'] },
  { path: '/metricas-ugl',       label: 'Métricas UGL',        icon: '📈', roles: ['DIR','ADM'] },
  { path: '/guardias',           label: 'Guardia',           icon: '🩺', roles: ['ENF','JEF'] },
  { path: '/inventario',          label: 'Inventario Móvil',  icon: '🎒', roles: ['ENF'] },
  { path: '/control-movil',       label: 'Control de Móvil', icon: '✅', roles: ['ENF'] },
  { path: '/informes-control',    label: 'Informes de Control', icon: '📑', roles: ['JEF','ADM','DIR'], requiresCentralShift: true },
  { path: '/solicitudes-reposicion', label: 'Reposiciones',    icon: '📋', roles: ['ADM','DES','JEF'], requiresCentralShift: true },
  { path: '/deposito-central',    label: 'Depósito central', icon: '🏥', roles: ['JEF','ADM'], requiresCentralShift: true },
  { path: '/incidentes',         label: 'Incidentes',        icon: '📋', roles: ['ENF','DES'] },
  { path: '/usuarios',           label: 'Usuarios',          icon: '👥', roles: ['ADM'] },
  { path: '/moviles',            label: 'Gestión de Móviles', icon: '🚑', roles: ['ADM'] },
];

const rolLabels = {
  ADM: 'Administrador',
  ENF: 'Enfermero',
  JEF: 'Coordinador de Enfermería',
  DES: 'Despachador',
  DIR: 'Directivo',
};

export default function Sidebar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout } = useAuth();
  const [guardiaCentralActiva, setGuardiaCentralActiva] = useState(false);

  useEffect(() => {
    if (user?.rol !== 'JEF') {
      setGuardiaCentralActiva(false);
      return;
    }
    let vigente = true;
    const actualizarGuardiaCentral = () => {
      guardiaService.listar().then(response => {
        const centralActiva = (response.data || []).some(
          guardia => guardia.estado === 'ACTIVA' && guardia.tipoGuardia === 'CENTRAL'
        );
        if (vigente) setGuardiaCentralActiva(centralActiva);
      }).catch(() => { if (vigente) setGuardiaCentralActiva(false); });
    };
    actualizarGuardiaCentral();
    window.addEventListener('sigem:guardia-actualizada', actualizarGuardiaCentral);
    return () => {
      vigente = false;
      window.removeEventListener('sigem:guardia-actualizada', actualizarGuardiaCentral);
    };
  }, [user?.rol]);

  return (
    <aside style={S.sidebar}>
      <div style={S.logo}>
        <div style={S.logoIcon}>🛡</div>
        <div>
          <div style={S.logoText}>SIGEM</div>
          <div style={S.logoSub}>Desarrollo de la salud</div>
        </div>
      </div>

      <NotificationBell />

      <nav style={S.nav}>
        {items
          .filter(i => i.roles.includes(user?.rol)
            && (!i.requiresCentralShift || user?.rol !== 'JEF' || guardiaCentralActiva))
          .map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                ...S.navItem,
                ...(location.pathname === item.path ? S.navActive : {})
              }}
            >
              <span style={S.navIcon}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        {user?.rol === 'JEF' && !guardiaCentralActiva && (
          <div style={S.centralShiftHint}>Iniciá tu guardia central para habilitar informes, depósito y reposiciones.</div>
        )}
      </nav>

      <div style={S.userBox}>
        <div style={S.avatar}>
          {user?.nombre?.charAt(0)}{user?.apellido?.charAt(0)}
        </div>
        <div style={S.userInfo}>
          <div style={S.userName}>{user?.nombre} {user?.apellido}</div>
          <div style={S.userRol}>{rolLabels[user?.rol]}</div>
        </div>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          style={S.logoutBtn}
          title="Cerrar sesión"
        >
          Salir
        </button>
      </div>
    </aside>
  );
}

const S = {
  sidebar: {
    width: '220px',
    minHeight: '100vh',
    background: 'var(--color-surface)',
    borderRight: '1px solid var(--color-border)',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    padding: '1.2rem 0.9rem',
    gap: '0.9rem',
    color: 'var(--color-text-primary)',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-3)',
    paddingBottom: 'var(--spacing-3)',
    borderBottom: '1px solid var(--color-border)',
  },
  logoIcon: {
    width: '2.3rem',
    height: '2.3rem',
    borderRadius: 'var(--radius-md)',
    display: 'grid',
    placeItems: 'center',
    background: 'var(--color-primary-soft)',
    color: 'var(--color-primary)',
    fontSize: '1rem',
  },
  logoText: {
    color: 'var(--color-text-primary)',
    fontSize: '0.98rem',
    fontWeight: 800,
    letterSpacing: '0.08em',
  },
  logoSub: {
    color: 'var(--color-text-secondary)',
    fontSize: '0.72rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  nav: {
    flex: 1,
    overflowY: 'auto',
    padding: 'var(--spacing-3) 0 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-3)',
    background: 'transparent',
    border: 'none',
    color: 'var(--color-text-secondary)',
    padding: '0.8rem 0.95rem',
    borderRadius: 'var(--radius-md)',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '0.92rem',
    width: '100%',
    fontWeight: 600,
    transition: 'background var(--transition-base), color var(--transition-base)',
  },
  centralShiftHint: {
    margin: 'var(--spacing-2) 0',
    padding: 'var(--spacing-3)',
    color: 'var(--color-text-secondary)',
    background: 'var(--color-surface-muted)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--font-size-xs)',
    lineHeight: 1.35,
  },
  navActive: {
    background: 'var(--color-primary-soft)',
    color: 'var(--color-primary-strong)',
  },
  navIcon: {
    fontSize: '0.95rem',
    width: '1.4rem',
    textAlign: 'center',
  },
  userBox: {
    marginTop: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-3)',
    padding: 'var(--spacing-3) 0',
    borderTop: '1px solid var(--color-border)',
    position: 'sticky',
    bottom: '0',
    background: 'var(--color-surface)',
  },
  avatar: {
    width: '2.6rem',
    height: '2.6rem',
    borderRadius: '50%',
    flexShrink: 0,
    background: 'linear-gradient(135deg, var(--color-primary), var(--color-success))',
    color: 'var(--color-on-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '0.95rem',
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    color: 'var(--color-text-primary)',
    fontSize: '0.92rem',
    fontWeight: 700,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  userRol: {
    color: 'var(--color-text-secondary)',
    fontSize: '0.72rem',
  },
  logoutBtn: {
    background: 'var(--color-primary-soft)',
    border: 'none',
    color: 'var(--color-primary-strong)',
    cursor: 'pointer',
    fontSize: '0.82rem',
    fontWeight: 700,
    padding: '0.4rem 0.65rem',
    borderRadius: 'var(--radius-pill)',
    flexShrink: 0,
    transition: 'background var(--transition-base), color var(--transition-base)',
  },
};