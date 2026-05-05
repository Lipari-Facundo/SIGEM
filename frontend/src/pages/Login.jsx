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
      const res = await authService.login(form);
      login({
        username: res.data.username,
        nombre: res.data.nombre,
        apellido: res.data.apellido,
        rol: res.data.rol,
      }, res.data.token);
      navigate('/dashboard');
    } catch {
      setError('Usuario o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoContainer}>
          <div style={styles.logoText}>
            <span style={{ color: '#1B6B6B' }}>SIGE</span><span style={{ color: '#4CAF50' }}>M</span>
          </div>
          <p style={styles.logoSub}>Health Development System</p>
        </div>

        <h2 style={styles.title}>Iniciar Sesión</h2>
        <p style={styles.subtitle}>Sistema de Emergencias Médicas 107</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Usuario</label>
            <input
              style={styles.input}
              type="text"
              placeholder="Ingresá tu usuario"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Contraseña</label>
            <input
              style={styles.input}
              type="password"
              placeholder="Ingresá tu contraseña"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}

const C = {
  primary: '#1B6B6B',
  primaryLight: '#2A9090',
  green: '#4CAF50',
  dark: '#0F2A2A',
  surface: '#F0F7F7',
  white: '#FFFFFF',
  error: '#D32F2F',
  border: '#B2DFDB',
};

const styles = {
  container: {
    minHeight: '100vh',
    background: `linear-gradient(135deg, ${C.dark} 0%, ${C.primary} 60%, ${C.primaryLight} 100%)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Segoe UI', sans-serif",
  },
  card: {
    background: C.white,
    borderRadius: '16px',
    padding: '48px 40px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  logoContainer: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  logoText: {
    fontSize: '42px',
    fontWeight: '800',
    letterSpacing: '2px',
  },
  logoSI: { color: C.primary },
  logoGEM: { color: C.green },
  logoSub: {
    color: '#666',
    fontSize: '11px',
    letterSpacing: '3px',
    textTransform: 'uppercase',
    marginTop: '4px',
  },
  title: {
    textAlign: 'center',
    color: C.dark,
    fontSize: '22px',
    fontWeight: '700',
    marginBottom: '4px',
  },
  subtitle: {
    textAlign: 'center',
    color: '#888',
    fontSize: '13px',
    marginBottom: '28px',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: C.dark },
  input: {
    padding: '12px 14px',
    borderRadius: '8px',
    border: `1.5px solid ${C.border}`,
    fontSize: '14px',
    outline: 'none',
    transition: 'border 0.2s',
  },
  error: {
    color: C.error,
    fontSize: '13px',
    textAlign: 'center',
    background: '#FFEBEE',
    padding: '8px',
    borderRadius: '6px',
  },
  button: {
    background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`,
    color: C.white,
    border: 'none',
    borderRadius: '8px',
    padding: '14px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '8px',
    letterSpacing: '0.5px',
  },
};