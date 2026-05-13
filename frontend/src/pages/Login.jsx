import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authService.login({ username: form.username, password: form.password });
      const data = res.data;
      login({ username: data.username, nombre: data.nombre, apellido: data.apellido, rol: data.rol, activo: data.activo, fotoPerfil: data.fotoPerfil }, data.token);
      navigate('/dashboard');
    } catch {
      setError('Usuario o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.header}>
          <div style={S.logoText}>
            <span style={{ color: '#1B6B6B' }}>SIGE</span>
            <span style={{ color: '#4CAF50' }}>M</span>
          </div>
          <p style={S.logoSub}>Sistema Integral de Gestión de Emergencias Médicas</p>
        </div>

        <h2 style={S.title}>Iniciar Sesión</h2>

        <form onSubmit={handleSubmit} style={S.form}>
          <div style={S.field}>
            <label style={S.label}>Usuario</label>
            <input style={S.input} type="text" placeholder="Ingresá tu usuario"
              value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
          </div>

          <div style={S.field}>
            <label style={S.label}>Contraseña</label>
            <input style={S.input} type="password" placeholder="••••••••"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
          </div>

          {error && <div style={S.error}>{error}</div>}

          <button type="submit" style={S.btn} disabled={loading}>
            {loading ? 'Verificando...' : 'Ingresar al Sistema'}
          </button>
        </form>

        <p style={S.footer}>🔒 Acceso seguro — SIGEM Córdoba</p>
      </div>
    </div>
  );
}

const S = {
  page: { minHeight: '100vh', background: 'linear-gradient(135deg, #0F2A2A 0%, #1B6B6B 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Segoe UI', sans-serif" },
  card: { background: '#fff', borderRadius: '16px', padding: '40px 36px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  header: { textAlign: 'center', marginBottom: '28px' },
  logoText: { fontSize: '40px', fontWeight: '800', letterSpacing: '2px' },
  logoSub: { color: '#888', fontSize: '12px', margin: '4px 0 0' },
  title: { textAlign: 'center', fontSize: '20px', fontWeight: '700', color: '#0F2A2A', marginBottom: '24px' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#333' },
  input: { padding: '12px 14px', borderRadius: '8px', border: '1.5px solid #ddd', fontSize: '14px', outline: 'none', background: '#fff', color: '#333' },
  error: { background: '#FFF3F3', color: '#D32F2F', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', textAlign: 'center' },
  btn: { background: 'linear-gradient(135deg, #1B6B6B, #2A9090)', color: '#fff', border: 'none', borderRadius: '8px', padding: '13px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', marginTop: '4px' },
  footer: { textAlign: 'center', color: '#aaa', fontSize: '12px', marginTop: '20px', marginBottom: 0 },
};