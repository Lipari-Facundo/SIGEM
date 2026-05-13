import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const items = [
  { path: '/dashboard', label: 'Panel de control', icon: '🏠', roles: ['ADM','ENF','JEF','DES','DIR'] },
  { path: '/perfil',    label: 'Mi Perfil',         icon: '👤', roles: ['ADM','ENF','JEF','DES','DIR'] },
  { path: '/usuarios',  label: 'Usuarios',           icon: '👥', roles: ['ADM'] },
];

const rolLabels = { ADM:'Administrador', ENF:'Enfermero', JEF:'Jefe Enfermería', DES:'Despachador', DIR:'Directivo' };

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside style={S.sidebar}>
      {/* Logo */}
      <div style={S.logo}>
        <div style={S.logoIcon}>🛡</div>
        <div>
          <div style={S.logoText}>SIGEM</div>
          <div style={S.logoSub}>Health Development</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={S.nav}>
        {items
          .filter(i => i.roles.includes(user?.rol))
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
      </nav>

      {/* User info */}
      <div style={S.userBox}>
        <div style={S.avatar}>
          {user?.nombre?.charAt(0)}{user?.apellido?.charAt(0)}
        </div>
        <div style={S.userInfo}>
          <div style={S.userName}>{user?.nombre} {user?.apellido}</div>
          <div style={S.userRol}>{rolLabels[user?.rol]}</div>
        </div>
        <button onClick={() => { logout(); navigate('/login'); }} style={S.logoutBtn} title="Cerrar sesión">
          <svg viewBox="0 0 24 24" style={S.logoutIcon} aria-hidden="true">
            <path d="M13 7H7a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M17 8l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </aside>
  );
}

const S = {
  sidebar: {
    width: '220px', minHeight: '100vh', background: '#0d1117',
    display: 'flex', flexDirection: 'column', flexShrink: 0,
    fontFamily: "'Segoe UI', sans-serif",
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '24px 20px', borderBottom: '1px solid #21262d',
  },
  logoIcon: { fontSize: '28px' },
  logoText: { color: '#fff', fontSize: '20px', fontWeight: '800', letterSpacing: '1px' },
  logoSub: { color: '#8b949e', fontSize: '10px', letterSpacing: '1px' },
  nav: { flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '2px' },
  navItem: {
    display: 'flex', alignItems: 'center', gap: '10px',
    background: 'transparent', border: 'none', color: '#8b949e',
    padding: '10px 14px', borderRadius: '8px', textAlign: 'left',
    cursor: 'pointer', fontSize: '14px', width: '100%', fontWeight: '500',
    transition: 'all 0.15s',
  },
  navActive: { background: '#161b22', color: '#fff' },
  navIcon: { fontSize: '16px', width: '20px', textAlign: 'center' },
  userBox: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '16px 16px', borderTop: '1px solid #21262d', margin: '0',
  },
  avatar: {
    width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
    background: 'linear-gradient(135deg, #1B6B6B, #4CAF50)',
    color: '#fff', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontWeight: '700', fontSize: '13px',
  },
  userInfo: { flex: 1, minWidth: 0 },
  userName: { color: '#fff', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userRol: { color: '#8b949e', fontSize: '11px' },
  logoutBtn: {
    width: '42px', height: '42px', borderRadius: '50%',
    background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.25)',
    color: '#fff', cursor: 'pointer', fontSize: '18px',
    display: 'grid', placeItems: 'center', padding: 0,
    boxShadow: '0 0 0 1px rgba(255,255,255,0.03)',
    transition: 'background 0.2s ease, transform 0.15s ease',
  },
  logoutIcon: { width: '18px', height: '18px' },
};