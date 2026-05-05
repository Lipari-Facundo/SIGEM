import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const rolLabels = {
  ADM: 'Administrador',
  ENF: 'Enfermero',
  JEF: 'Jefe de Enfermería',
  DES: 'Despachador',
  DIR: 'Directivo',
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.logoBox}>
          <span style={{ color: '#fff', fontSize: '28px', fontWeight: '800' }}>
            SIGE<span style={{ color: '#4CAF50' }}>M</span>
          </span>
          <p style={{ color: '#B2DFDB', fontSize: '10px', letterSpacing: '2px' }}>
            HEALTH DEV SYSTEM
          </p>
        </div>

        <nav style={styles.nav}>
          <button style={{ ...styles.navItem, ...styles.navActive }}>
            🏠 Dashboard
          </button>
          {user?.rol === 'ADM' && (
            <button
              style={styles.navItem}
              onClick={() => navigate('/usuarios')}
            >
              👥 Usuarios
            </button>
          )}
        </nav>

        <button onClick={handleLogout} style={styles.logoutBtn}>
          🚪 Cerrar sesión
        </button>
      </aside>

      {/* Main */}
      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.headerTitle}>Dashboard</h1>
            <p style={styles.headerSub}>Bienvenido al sistema SIGEM</p>
          </div>
          <div style={styles.userBadge}>
            <div style={styles.avatar}>
              {user?.nombre?.charAt(0)}{user?.apellido?.charAt(0)}
            </div>
            <div>
              <p style={{ fontWeight: '600', fontSize: '14px', margin: 0 }}>
                {user?.nombre} {user?.apellido}
              </p>
              <p style={{ color: '#888', fontSize: '12px', margin: 0 }}>
                {rolLabels[user?.rol] || user?.rol}
              </p>
            </div>
          </div>
        </header>

        {/* Cards */}
        <div style={styles.cards}>
          <div style={{ ...styles.card, borderTop: '4px solid #1B6B6B' }}>
            <p style={styles.cardLabel}>Sistema</p>
            <p style={styles.cardValue}>Operativo</p>
            <p style={styles.cardSub}>✅ Todos los servicios activos</p>
          </div>
          <div style={{ ...styles.card, borderTop: '4px solid #4CAF50' }}>
            <p style={styles.cardLabel}>Módulo</p>
            <p style={styles.cardValue}>Activo</p>
            <p style={styles.cardSub}>📋 Sprint 1 en progreso</p>
          </div>
          <div style={{ ...styles.card, borderTop: '4px solid #FF9800' }}>
            <p style={styles.cardLabel}>Tu Rol</p>
            <p style={styles.cardValue}>{rolLabels[user?.rol]}</p>
            <p style={styles.cardSub}>🔐 Permisos asignados</p>
          </div>
        </div>

        <div style={styles.welcome}>
          <h2 style={{ color: '#1B6B6B', marginBottom: '8px' }}>
            Bienvenido, {user?.nombre}! 👋
          </h2>
          <p style={{ color: '#555' }}>
            Estás conectado como <strong>{rolLabels[user?.rol]}</strong> al
            Sistema Integral de Gestión de Emergencias Médicas del 107.
          </p>
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: { display: 'flex', minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif" },
  sidebar: {
    width: '240px', background: '#0F2A2A', display: 'flex',
    flexDirection: 'column', padding: '0', flexShrink: 0,
  },
  logoBox: {
    padding: '28px 20px', borderBottom: '1px solid #1B4A4A',
    textAlign: 'center',
  },
  nav: { flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' },
  navItem: {
    background: 'transparent', border: 'none', color: '#B2DFDB',
    padding: '12px 16px', borderRadius: '8px', textAlign: 'left',
    cursor: 'pointer', fontSize: '14px', fontWeight: '500',
  },
  navActive: { background: '#1B6B6B', color: '#fff' },
  logoutBtn: {
    margin: '16px 12px', background: 'transparent', border: '1px solid #1B4A4A',
    color: '#B2DFDB', padding: '12px', borderRadius: '8px',
    cursor: 'pointer', fontSize: '13px',
  },
  main: { flex: 1, background: '#F0F7F7', padding: '32px' },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '32px',
  },
  headerTitle: { fontSize: '28px', fontWeight: '700', color: '#0F2A2A', margin: 0 },
  headerSub: { color: '#888', margin: '4px 0 0', fontSize: '14px' },
  userBadge: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: {
    width: '44px', height: '44px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #1B6B6B, #4CAF50)',
    color: '#fff', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontWeight: '700', fontSize: '16px',
  },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '28px' },
  card: {
    background: '#fff', borderRadius: '12px', padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  cardLabel: { color: '#888', fontSize: '12px', textTransform: 'uppercase', margin: '0 0 8px' },
  cardValue: { color: '#0F2A2A', fontSize: '24px', fontWeight: '700', margin: '0 0 6px' },
  cardSub: { color: '#666', fontSize: '12px', margin: 0 },
  welcome: {
    background: '#fff', borderRadius: '12px', padding: '28px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
};