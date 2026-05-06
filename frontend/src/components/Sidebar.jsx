import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const items = [
  { path: '/dashboard', label: 'Panel de control', icon: '🏠', roles: ['ADM','ENF','JEF','DES','DIR'] },
  { path: '/usuarios', label: 'Usuarios', icon: '👥', roles: ['ADM'] },
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
          ⏻
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
    background: 'transparent', border: 'none', color: '#8b949e',
    cursor: 'pointer', fontSize: '18px', padding: '4px', flexShrink: 0,
  },
};