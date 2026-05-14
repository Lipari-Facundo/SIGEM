import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usuarioService } from '../services/api';
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
  const navigate = useNavigate();
  const info = ROL_INFO[user?.rol] || {};
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarPerfil();
  }, []);

  const cargarPerfil = async () => {
    try {
      const res = await usuarioService.miPerfil();
      setPerfil(res.data);
    } catch (error) {
      console.error('Error cargando perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div style={S.page}>
      <Sidebar />
      <main style={S.main}>
        {/* Hero Card */}
        <div style={S.heroCard}>
          <div style={S.heroContent}>
            <h1 style={S.h1}>Bienvenido, {user?.nombre} {user?.apellido}</h1>
            <p style={S.sub}>{info.label || 'usuario'} — {info.desc}</p>
          </div>
          <div style={{...S.roleBadge, background: info.color + '20'}}>{info.icon}</div>
        </div>

        {/* Tarjeta de Sección */}
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

        {/* Grid de Información Principal */}
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
           <p style={{ ...S.infoValue, color: (user?.activo || user?.isActivo) ? '#2E7D32' : '#C62828' }}>
            {(user?.activo || user?.isActivo) ? '✅ Activo' : '❌ Inactivo'}
          </p>
          </div>
        </div>

        {/* Tarjeta de Perfil Completo */}
        <div style={S.profileCard}>
          <div style={S.profileHeader}>
            <h2 style={S.profileTitle}>📋 Datos de Perfil</h2>
            <button onClick={() => navigate('/perfil')} style={S.btnEdit}>
            ✏️ Editar Perfil
          </button>
          </div>

          <div style={S.profileGrid}>
            {/* Columna 1 */}
            <div>
              <div style={S.profileField}>
                <label style={S.fieldLabel}>Nombre Completo</label>
                <p style={S.fieldValue}>
                  {loading ? 'Cargando...' : `${perfil?.nombre || user?.nombre} ${perfil?.apellido || user?.apellido}`}
                </p>
              </div>
              <div style={S.profileField}>
                <label style={S.fieldLabel}>DNI</label>
                <p style={S.fieldValue}>{loading ? 'Cargando...' : (perfil?.dni || '-')}</p>
              </div>
              <div style={S.profileField}>
                <label style={S.fieldLabel}>Email</label>
                <p style={S.fieldValue}>{loading ? 'Cargando...' : (perfil?.email || '-')}</p>
              </div>
            </div>

            {/* Columna 2 */}
            <div>
              <div style={S.profileField}>
                <label style={S.fieldLabel}>Teléfono</label>
                <p style={S.fieldValue}>{loading ? 'Cargando...' : (perfil?.telefono || '-')}</p>
              </div>
              <div style={S.profileField}>
                <label style={S.fieldLabel}>Fecha de Nacimiento</label>
                <p style={S.fieldValue}>
                  {loading ? 'Cargando...' : (perfil?.fechaNacimiento ? new Date(perfil.fechaNacimiento).toLocaleDateString('es-AR') : '-')}
                </p>
              </div>
              <div style={S.profileField}>
                <label style={S.fieldLabel}>Domicilio</label>
                <p style={S.fieldValue}>{loading ? 'Cargando...' : (perfil?.domicilio || '-')}</p>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}

const S = {
  page: { display: 'flex', minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif" },
  main: { flex: 1, background: '#F0F7F7', padding: '36px 40px' },
  
  // Hero
  heroCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px', marginBottom: '28px', padding: '32px', background: 'linear-gradient(135deg, #1B6B6B 0%, #2A9090 100%)', borderRadius: '18px', boxShadow: '0 16px 40px rgba(0,0,0,0.1)' },
  heroContent: { color: '#fff' },
  h1: { fontSize: '32px', fontWeight: '700', color: '#fff', margin: 0 },
  sub: { margin: '10px 0 0', color: 'rgba(255,255,255,0.85)', fontSize: '15px' },
  roleBadge: { width: '100px', height: '100px', borderRadius: '24px', display: 'grid', placeItems: 'center', fontSize: '48px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' },
  
  // Section
  sectionCard: { background: '#fff', borderRadius: '18px', padding: '26px', display: 'flex', gap: '18px', alignItems: 'center', boxShadow: '0 14px 36px rgba(0,0,0,0.05)', marginBottom: '28px' },
  sectionIcon: { fontSize: '40px', flexShrink: 0 },
  sectionLabel: { color: '#888', fontSize: '12px', textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px' },
  sectionText: { fontSize: '16px', color: '#47525d', margin: '8px 0 0', lineHeight: '1.5' },
  
  // Info Grid
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '18px', marginBottom: '28px' },
  infoCard: { background: '#fff', borderRadius: '18px', padding: '24px', boxShadow: '0 14px 36px rgba(0,0,0,0.05)', border: '1px solid #E8F5F5' },
  infoLabel: { color: '#8a9ba8', fontSize: '11px', textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px' },
  infoValue: { fontSize: '18px', fontWeight: '700', color: '#12222d', margin: '12px 0 0' },
  
  // Profile Card
  profileCard: { background: '#fff', borderRadius: '18px', padding: '32px', boxShadow: '0 14px 36px rgba(0,0,0,0.05)', marginBottom: '24px' },
  profileHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px solid #F0F7F7' },
  profileTitle: { fontSize: '20px', fontWeight: '700', color: '#0F2A2A', margin: 0 },
  btnEdit: { background: 'linear-gradient(135deg, #1B6B6B, #2A9090)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 16px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
  
  profileGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px', marginBottom: '24px' },
  profileField: { display: 'flex', flexDirection: 'column', gap: '8px' },
  fieldLabel: { fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' },
  fieldValue: { fontSize: '16px', color: '#0F2A2A', margin: 0, fontWeight: '500' },
  
  alertMessage: { background: '#FFF3E0', border: '1px solid #FFE0B2', color: '#E65100', padding: '16px 20px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', marginTop: '20px' },
  btnClose: { background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#E65100', padding: 0, lineHeight: 1 },
};