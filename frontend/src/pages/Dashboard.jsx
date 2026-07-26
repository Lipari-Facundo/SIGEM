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
        <div style={S.heroCard}>
          <div style={S.heroContent}>
            <p style={S.overline}>Panel principal</p>
            <h1 style={S.h1}>Bienvenido, {user?.nombre} {user?.apellido}</h1>
            <p style={S.sub}>{info.label || 'usuario'} — {info.desc}</p>
          </div>
          <div style={{ ...S.roleBadge, background: info.color + '20' }}>{info.icon}</div>
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
            <p style={{ ...S.infoValue, color: (user?.activo || user?.isActivo) ? '#2E7D32' : '#C62828' }}>
              {(user?.activo || user?.isActivo) ? '✅ Activo' : '❌ Inactivo'}
            </p>
          </div>
        </div>

        <div style={S.profileCard}>
          <div style={S.profileHeader}>
            <div>
              <p style={S.sectionLabel}>Datos de perfil</p>
              <h2 style={S.profileTitle}>Información personal y contacto</h2>
            </div>
            <button onClick={() => navigate('/perfil')} style={S.btnEdit}>✏️ Editar Perfil</button>
          </div>

          <div style={S.profileGrid}>
            <div style={S.profileField}>
              <label style={S.fieldLabel}>Nombre Completo</label>
              <p style={S.fieldValue}>{loading ? 'Cargando...' : `${perfil?.nombre || user?.nombre} ${perfil?.apellido || user?.apellido}`}</p>
            </div>
            <div style={S.profileField}>
              <label style={S.fieldLabel}>DNI</label>
              <p style={S.fieldValue}>{loading ? 'Cargando...' : (perfil?.dni || '-')}</p>
            </div>
            <div style={S.profileField}>
              <label style={S.fieldLabel}>Email</label>
              <p style={S.fieldValue}>{loading ? 'Cargando...' : (perfil?.email || '-')}</p>
            </div>
            <div style={S.profileField}>
              <label style={S.fieldLabel}>Teléfono</label>
              <p style={S.fieldValue}>{loading ? 'Cargando...' : (perfil?.telefono || '-')}</p>
            </div>
            <div style={S.profileField}>
              <label style={S.fieldLabel}>Fecha de Nacimiento</label>
              <p style={S.fieldValue}>{loading ? 'Cargando...' : (perfil?.fechaNacimiento ? new Date(perfil.fechaNacimiento).toLocaleDateString('es-AR') : '-')}</p>
            </div>
            <div style={S.profileField}>
              <label style={S.fieldLabel}>Domicilio</label>
              <p style={S.fieldValue}>{loading ? 'Cargando...' : (perfil?.domicilio || '-')}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const S = {
  page: { display: 'flex', minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif", background: '#F0F7F7', overflowX: 'hidden' },
  main: { flex: 1, background: '#F0F7F7', padding: '16px 20px 20px', minWidth: 0, overflowX: 'hidden', boxSizing: 'border-box' },
  overline: { margin: '0 0 5px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)' },
  heroCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '18px', marginBottom: '18px', padding: '18px 20px', background: 'linear-gradient(135deg, #1B6B6B 0%, #2A9090 100%)', borderRadius: '16px', boxShadow: '0 10px 24px rgba(0,0,0,0.08)' },
  heroContent: { color: '#fff' },
  h1: { fontSize: '26px', fontWeight: '700', color: '#fff', margin: 0 },
  sub: { margin: '6px 0 0', color: 'rgba(255,255,255,0.92)', fontSize: '13px' },
  roleBadge: { width: '74px', height: '74px', borderRadius: '18px', display: 'grid', placeItems: 'center', fontSize: '32px', boxShadow: '0 8px 18px rgba(0,0,0,0.12)' },
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '16px' },
  infoCard: { background: '#fff', borderRadius: '14px', padding: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.04)', border: '1px solid #E8F5F5' },
  infoLabel: { color: '#8a9ba8', fontSize: '10px', textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px' },
  infoValue: { fontSize: '15px', fontWeight: '700', color: '#12222d', margin: '6px 0 0' },
  profileCard: { background: '#fff', borderRadius: '16px', padding: '16px', boxShadow: '0 6px 16px rgba(0,0,0,0.04)', marginBottom: '16px' },
  profileHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '14px', paddingBottom: '8px', borderBottom: '1px solid #F0F7F7' },
  profileTitle: { fontSize: '16px', fontWeight: '700', color: '#0F2A2A', margin: '4px 0 0' },
  btnEdit: { background: 'linear-gradient(135deg, #1B6B6B, #2A9090)', color: '#fff', border: 'none', borderRadius: '10px', padding: '8px 10px', cursor: 'pointer', fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap' },
  sectionLabel: { color: '#888', fontSize: '11px', textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px' },
  profileGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px' },
  profileField: { display: 'flex', flexDirection: 'column', gap: '6px' },
  fieldLabel: { fontSize: '11px', fontWeight: '600', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' },
  fieldValue: { fontSize: '14px', color: '#0F2A2A', margin: 0, fontWeight: '500' },
};