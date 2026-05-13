import { useState, useEffect, useRef } from 'react';
import { usuarioService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';

const ROL_LABEL = {
  ADM: 'Administrador', ENF: 'Enfermero', JEF: 'Jefe Enfermería',
  DES: 'Despachador', DIR: 'Directivo',
};

const ROL_COLOR = {
  ADM: '#1B6B6B', ENF: '#2E7D32', JEF: '#1565C0',
  DES: '#E65100', DIR: '#6A1B9A',
};

export default function Perfil() {
  const { user, login } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [form, setForm] = useState({});
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [previewFoto, setPreviewFoto] = useState(null);
  const fileRef = useRef();

  // Hook simple para detectar ancho de pantalla (Responsividad en JS)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    cargarPerfil();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const cargarPerfil = async () => {
    try {
      const res = await usuarioService.miPerfil();
      const data = res.data;
      setPerfil(data);
      setForm({
        nombre: data.nombre || '',
        apellido: data.apellido || '',
        email: data.email || '',
        dni: data.dni || '',
        telefono: data.telefono || '',
        fechaNacimiento: data.fechaNacimiento || '',
        domicilio: data.domicilio || '',
        fotoPerfil: data.fotoPerfil || '',
      });
      setPreviewFoto(data.fotoPerfil || null);
    } catch (e) {
      setError(`Error ${e.response?.status}: ${e.response?.data?.message || e.message}`);
    }
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('La imagen no puede superar los 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      setPreviewFoto(base64);
      setForm((f) => ({ ...f, fotoPerfil: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const guardar = async () => {
    setError('');
    setMsg('');
    if (password && password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (password && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
      setError('La contraseña debe tener 8+ caracteres, una mayúscula, una minúscula y un número.');
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form };
      if (password) payload.password = password;
      const res = await usuarioService.actualizarMiPerfil(payload);
      const updated = res.data;
      login(
        { ...user, nombre: updated.nombre, apellido: updated.apellido, fotoPerfil: updated.fotoPerfil },
        localStorage.getItem('token')
      );
      setPassword('');
      setConfirmPassword('');
      showMsg('✅ Perfil actualizado correctamente');
      await cargarPerfil();
    } catch (e) {
      setError(e.response?.data?.message || 'Error al guardar los cambios.');
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 3500);
  };

  const initials = perfil
    ? `${perfil.nombre?.charAt(0) || ''}${perfil.apellido?.charAt(0) || ''}`
    : '??';

  const rolColor = ROL_COLOR[perfil?.rol] || '#1B6B6B';

  return (
    <div style={S.page}>
      <Sidebar />

      <main style={S.main}>
        {/* ── Hero ── */}
        <div style={{ 
          ...S.hero, 
          background: `linear-gradient(135deg, ${rolColor}22 0%, #F0F7F7 100%)`,
          flexDirection: isMobile ? 'column' : 'row',
          textAlign: isMobile ? 'center' : 'left'
        }}>
          <div style={S.avatarWrap}>
            {previewFoto ? (
              <img src={previewFoto} alt="Foto de perfil" style={S.avatarImg} />
            ) : (
              <div style={{ ...S.avatarPlaceholder, background: `linear-gradient(135deg, ${rolColor}, ${rolColor}99)` }}>
                <span style={S.initials}>{initials}</span>
              </div>
            )}
            <button style={S.cameraBtn} onClick={() => fileRef.current.click()} title="Cambiar foto">
              📷
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFotoChange}
            />
          </div>
          
          <div style={S.heroInfo}>
            <h1 style={S.heroName}>{perfil?.nombre} {perfil?.apellido}</h1>
            <div style={{ ...S.heroBadges, justifyContent: isMobile ? 'center' : 'flex-start' }}>
              <span style={{ ...S.badge, background: `${rolColor}22`, color: rolColor, border: `1px solid ${rolColor}44` }}>
                {ROL_LABEL[perfil?.rol] || perfil?.rol}
              </span>
              <span style={S.badgeUser}>@{perfil?.username}</span>
            </div>
          </div>
        </div>

        {/* ── Mensajes ── */}
        <div style={S.container}>
          {msg && <div style={S.msgOk}>{msg}</div>}
          {error && <div style={S.msgErr}>{error}</div>}

          <div style={S.grid}>
            {/* ── Información Personal ── */}
            <section style={S.card}>
              <h2 style={S.cardTitle}>
                <span style={S.cardIcon}>👤</span> Información personal
              </h2>
              <div style={S.formGrid}>
                <Field label="Nombre *" value={form.nombre} onChange={(v) => setForm({ ...form, nombre: v })} />
                <Field label="Apellido *" value={form.apellido} onChange={(v) => setForm({ ...form, apellido: v })} />
                <Field label="DNI" value={form.dni} onChange={(v) => setForm({ ...form, dni: v })} placeholder="Sin puntos" />
                <Field label="Fecha Nac." type="date" value={form.fechaNacimiento} onChange={(v) => setForm({ ...form, fechaNacimiento: v })} />
                <Field label="Domicilio" value={form.domicilio} onChange={(v) => setForm({ ...form, domicilio: v })} span={2} placeholder="Calle, número, ciudad" />
              </div>
            </section>

            {/* ── Contacto ── */}
            <section style={S.card}>
              <h2 style={S.cardTitle}>
                <span style={S.cardIcon}>📬</span> Contacto y Sistema
              </h2>
              <div style={{...S.formGrid, marginBottom: '20px'}}>
                <Field label="Email *" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
                <Field label="Teléfono" value={form.telefono} onChange={(v) => setForm({ ...form, telefono: v })} />
              </div>
              <div style={S.readOnly}>
                <span style={S.readLabel}>Usuario</span>
                <span style={S.readValue}>{perfil?.username}</span>
              </div>
              <div style={S.readOnly}>
                <span style={S.readLabel}>Rol</span>
                <span style={{ ...S.readValue, color: rolColor }}>{ROL_LABEL[perfil?.rol]}</span>
              </div>
            </section>

            {/* ── Seguridad ── */}
            <section style={{ ...S.card, gridColumn: isMobile ? 'span 1' : '1 / -1' }}>
              <h2 style={S.cardTitle}>
                <span style={S.cardIcon}>🔐</span> Seguridad
              </h2>
              <p style={S.cardHint}>Completar solo si desea cambiar la clave actual.</p>
              <div style={S.formGrid}>
                <Field label="Nueva contraseña" type="password" value={password} onChange={setPassword} />
                <Field label="Confirmar contraseña" type="password" value={confirmPassword} onChange={setConfirmPassword} />
              </div>
            </section>
          </div>

          <div style={S.actions}>
            <button onClick={guardar} style={{...S.btnSave, width: isMobile ? '100%' : 'auto'}} disabled={loading}>
              {loading ? '⏳ Guardando...' : '💾 Guardar cambios'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder = '', span = 1 }) {
  return (
    <div style={{ gridColumn: span === 2 ? '1 / -1' : 'span 1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={S.label}>{label}</label>
      <input
        type={type}
        value={value || ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={S.input}
      />
    </div>
  );
}

const S = {
  page: { display: 'flex', minHeight: '100vh', background: '#F0F7F7', fontFamily: "'Inter', system-ui, sans-serif" },
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  container: { padding: '0 5% 40px', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' },

  // Hero Dinámico
  hero: { display: 'flex', alignItems: 'center', gap: '30px', padding: '40px 5%', marginBottom: '24px', borderBottom: '1px solid #dde8e8', transition: 'all 0.3s' },
  avatarWrap: { position: 'relative', display: 'inline-block' },
  avatarImg: { width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #fff', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' },
  avatarPlaceholder: { width: '120px', height: '120px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid #fff', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' },
  initials: { color: '#ffffff', fontSize: '40px', fontWeight: '800' }, // Este se mantiene blanco porque va sobre fondos de colores fuertes
  cameraBtn: { position: 'absolute', bottom: '5px', right: '5px', width: '36px', height: '36px', borderRadius: '50%', border: '3px solid #fff', background: '#1B6B6B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' },
  
  heroInfo: { flex: 1 },
  heroName: { fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: '800', color: '#0F2A2A', margin: '0 0 10px' },
  heroBadges: { display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' },
  badge: { padding: '6px 16px', borderRadius: '30px', fontSize: '13px', fontWeight: '700' },
  // CAMBIO: Color más oscuro para el badge del usuario (@username)
  badgeUser: { color: '#1A1A1A', fontSize: '14px', fontWeight: '600' }, 

  // Grid Simétrico
  grid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
    gap: '24px',
    width: '100%'
  },
  card: { 
    background: '#fff', 
    borderRadius: '20px', 
    padding: '28px', 
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 10px 15px -3px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column'
  },
  cardTitle: { fontSize: '16px', fontWeight: '700', color: '#1B6B6B', margin: '0 0 24px', display: 'flex', alignItems: 'center', gap: '10px' },
  // CAMBIO: Gris más oscuro para el texto de ayuda
  cardHint: { color: '#4A4A4A', fontSize: '13px', marginBottom: '20px', marginTop: '-10px' },

  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  // CAMBIO: Etiquetas de los inputs más oscuras
  label: { fontSize: '12px', fontWeight: '700', color: '#333333', textTransform: 'uppercase', letterSpacing: '0.8px' },
  // CAMBIO: Texto ingresado en los inputs más oscuro (#111) y fondo blanco puro
  input: { padding: '12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '14px', background: '#FFFFFF', color: '#111111', width: '100%', boxSizing: 'border-box' },

  readOnly: { display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderTop: '1px solid #E2E8F0' },
  // CAMBIO: Etiqueta de solo lectura más oscura
  readLabel: { fontSize: '12px', color: '#333333', fontWeight: '700' },
  // CAMBIO: Valor de solo lectura casi negro
  readValue: { fontSize: '14px', fontWeight: '700', color: '#1A1A1A' },

  actions: { marginTop: '32px', display: 'flex', justifyContent: 'flex-end' },
  btnSave: { 
    background: '#1B6B6B', color: '#fff', border: 'none', borderRadius: '12px', 
    padding: '16px 40px', fontSize: '16px', fontWeight: '700', cursor: 'pointer',
    boxShadow: '0 10px 15px -3px rgba(27, 107, 107, 0.3)', transition: 'transform 0.2s'
  },
  msgOk: { background: '#DEF7EC', color: '#03543F', padding: '16px', borderRadius: '12px', marginBottom: '20px', fontWeight: '600', textAlign: 'center' },
  msgErr: { background: '#FDE8E8', color: '#9B1C1C', padding: '16px', borderRadius: '12px', marginBottom: '20px', fontWeight: '600', textAlign: 'center' },
};