import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';

const ROL_INFO = {
  ADM: { label: 'Administrador', color: '#1B6B6B', desc: 'Acceso completo al sistema', icon: '🔐' },
  ENF: { label: 'Enfermero', color: '#2E7D32', desc: 'Atención al paciente y registro clínico', icon: '🏥' },
  JEF: { label: 'Jefe de Enfermería', color: '#1565C0', desc: 'Supervisión de personal', icon: '👔' },
  DES: { label: 'Despachador', color: '#E65100', desc: 'Coordinación de emergencias', icon: '🚑' },
  DIR: { label: 'Directivo', color: '#6A1B9A', desc: 'Reportes estratégicos', icon: '📊' },
};

export default function Dashboard() {
  const { user } = useAuth();
  const info = ROL_INFO[user?.rol] || {};

  return (
    <div style={S.page}>
      <Sidebar />
      <main style={S.main}>
        <div style={S.heroCard}>
          <div>
            <h1 style={S.h1}>Bienvenido, {user?.nombre} {user?.apellido}</h1>
            <p style={S.sub}>Sección {info.label || 'de usuario'} — {info.desc}</p>
          </div>
          <div style={S.roleBadge}>{info.icon}</div>
        </div>

        <div style={{ ...S.sectionCard, borderLeft: `6px solid ${info.color}` }}>
          <div style={S.sectionIcon}>{info.icon}</div>
          <div>
            <p style={S.sectionLabel}>Sección {info.label || user?.rol}</p>
            <p style={S.sectionText}>
              {info.label
                ? `Bienvenido a la sección de ${info.label}. Aquí verás la información y el acceso asignado a tu rol.`
                : 'Tu rol fue autenticado correctamente.'}
            </p>
          </div>
        </div>

        <div style={S.infoGrid}>
          <div style={S.infoCard}>
            <p style={S.infoLabel}>Usuario</p>
            <p style={S.infoValue}>{user?.username}</p>
          </div>
          <div style={S.infoCard}>
            <p style={S.infoLabel}>Rol</p>
            <p style={S.infoValue}>{info.label || user?.rol}</p>
          </div>
          <div style={S.infoCard}>
            <p style={S.infoLabel}>Estado</p>
            <p style={{ ...S.infoValue, color: '#2E7D32' }}>✅ Activo</p>
          </div>
        </div>
      </main>
    </div>
  );
}

const S = {
  page: { display: 'flex', minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif" },
  main: { flex: 1, background: '#F0F7F7', padding: '36px 40px' },
  heroCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px', marginBottom: '28px', padding: '28px', background: '#fff', borderRadius: '18px', boxShadow: '0 16px 40px rgba(0,0,0,0.06)' },
  h1: { fontSize: '32px', fontWeight: '700', color: '#0F2A2A', margin: 0 },
  sub: { margin: '10px 0 0', color: '#606f78', fontSize: '15px' },
  roleBadge: { width: '80px', height: '80px', borderRadius: '24px', background: '#E8F5E9', display: 'grid', placeItems: 'center', fontSize: '34px' },
  sectionCard: { background: '#fff', borderRadius: '18px', padding: '26px', display: 'flex', gap: '18px', alignItems: 'center', boxShadow: '0 14px 36px rgba(0,0,0,0.05)', marginBottom: '24px' },
  sectionIcon: { fontSize: '40px' },
  sectionLabel: { color: '#888', fontSize: '12px', textTransform: 'uppercase', margin: 0 },
  sectionText: { fontSize: '16px', color: '#47525d', margin: '8px 0 0' },
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '18px' },
  infoCard: { background: '#fff', borderRadius: '18px', padding: '24px', boxShadow: '0 14px 36px rgba(0,0,0,0.05)' },
  infoLabel: { color: '#8a9ba8', fontSize: '11px', textTransform: 'uppercase', margin: 0 },
  infoValue: { fontSize: '18px', fontWeight: '700', color: '#12222d', margin: '10px 0 0' },
};