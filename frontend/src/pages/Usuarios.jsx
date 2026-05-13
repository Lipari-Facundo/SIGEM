import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usuarioService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';

const ROLES = ['ENF', 'JEF', 'DES', 'ADM', 'DIR'];
const rolLabels = { ADM: 'Administrador', ENF: 'Enfermero', JEF: 'Jefe Enfermería', DES: 'Despachador', DIR: 'Directivo' };
const EMPTY_FORM = { 
  username: '', 
  password: '', 
  nombre: '', 
  apellido: '', 
  dni: '',
  email: '', 
  telefono: '',
  fechaNacimiento: '',
  domicilio: '',
  rol: 'ENF' 
};

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [modal, setModal] = useState(null); // null | 'crear' | 'editar'
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { cargarUsuarios(); }, []);

  const normalizeText = (value) => value.toUpperCase();
  const normalizeUsername = (value) => value
    .trim()
    .replace(/\s+/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const generateRandomPassword = () => {
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
    const all = `${lower}${upper}${digits}`;
    const randomChar = (set) => set[Math.floor(Math.random() * set.length)];
    const password = [randomChar(lower), randomChar(upper), randomChar(digits)];
    for (let i = 3; i < 10; i += 1) {
      password.push(randomChar(all));
    }
    return password.sort(() => Math.random() - 0.5).join('');
  };

  const cargarUsuarios = async () => {
    try {
      const res = await usuarioService.listar();
      setUsuarios(res.data);
    } catch {
      showMsg('Error al cargar usuarios');
    }
  };

  const showMsg = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 3000);
  };

  const abrirCrear = () => {
    setError('');
    setShowPassword(false);
    const randomPass = generateRandomPassword();
    setForm({ ...EMPTY_FORM, password: randomPass });
    setModal('crear');
  };

  const abrirEditar = (u) => {
    setError('');
    setShowPassword(false);
    setForm({ 
      username: u.username, 
      password: '', 
      nombre: u.nombre, 
      apellido: u.apellido, 
      dni: u.dni || '',
      email: u.email, 
      telefono: u.telefono || '',
      fechaNacimiento: u.fechaNacimiento || '',
      domicilio: u.domicilio || '',
      rol: u.rol 
    });
    setEditId(u.id);
    setModal('editar');
  };

  const handleFormChange = (key, value) => {
    if (key === 'nombre' || key === 'apellido') {
      value = normalizeText(value);
    }
    if (key === 'username') {
      value = normalizeUsername(value);
    }
    setForm({ ...form, [key]: value });
  };

  const passwordValid = (password) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);

  const validateForm = () => {
    if (!form.nombre) return 'El nombre es obligatorio.';
    if (!form.apellido) return 'El apellido es obligatorio.';
    if (!form.dni) return 'El DNI es obligatorio.';
    if (!form.email) return 'El correo electrónico es obligatorio.';
    if (!form.username) return 'El usuario es obligatorio.';
    if (modal === 'crear' && !form.password) return 'La contraseña es obligatoria.';
    if (form.password && !passwordValid(form.password)) {
      return 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.';
    }
    return '';
  };

  const guardar = async () => {
    setLoading(true);
    setError('');
    const validation = validateForm();
    if (validation) {
      setError(validation);
      setLoading(false);
      return;
    }

    try {
      const datosEnvio = { ...form };
      if (modal === 'editar' && !datosEnvio.password) {
        delete datosEnvio.password;
      }

      if (modal === 'crear') {
        await usuarioService.crear(datosEnvio);
        showMsg('✅ Usuario creado correctamente');
      } else {
        await usuarioService.modificar(editId, datosEnvio);
        showMsg('✅ Usuario modificado correctamente');
      }
      setModal(null);
      setForm(EMPTY_FORM);
      await cargarUsuarios();
    } catch (e) {
      setError(e.response?.data?.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const cambiarEstado = async (id, activo) => {
    try {
      await usuarioService.cambiarEstado(id, activo);
      showMsg(activo ? '✅ Usuario activado' : '✅ Usuario desactivado');
      await cargarUsuarios();
    } catch (e) {
      showMsg(e.response?.data?.message || '❌ Error al cambiar estado');
    }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar este usuario definitivamente?')) return;
    try {
      await usuarioService.eliminar(id);
      showMsg('✅ Usuario eliminado');
      await cargarUsuarios(); // Recarga la lista completa desde el backend
    } catch (e) {
      showMsg(e.response?.data?.message || '❌ Error al eliminar');
    }
  };

  const handleLogout = () => { navigate('/login'); };

  return (
    <div style={S.page}>
      <Sidebar />
      <main style={S.main}>
        <header style={S.header}>
          <div>
            <h1 style={S.headerTitle}>Gestión de Usuarios</h1>
            <p style={S.headerSub}>{usuarios.length} usuarios registrados</p>
          </div>
          <button onClick={abrirCrear} style={S.btnPrimary}>+ Nuevo Usuario</button>
        </header>

        {msg && <div style={S.msgBar}>{msg}</div>}
        {error && <div style={S.errorBar}>{error}</div>}

        <div style={S.tableCard}>
          <table style={S.table}>
            <thead>
              <tr style={S.tableHead}>
                <th style={S.th}>Usuario</th>
                <th style={S.th}>Nombre</th>
                <th style={S.th}>DNI</th>
                <th style={S.th}>Correo electrónico</th>
                <th style={S.th}>Rol</th>
                <th style={S.th}>Estado</th>
                <th style={S.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} style={S.tr}>
                  <td style={S.td}><strong>{u.username}</strong></td>
                  <td style={S.td}>{u.nombre} {u.apellido}</td>
                  <td style={S.td}>{u.dni}</td>
                  <td style={S.td}>{u.email}</td>
                  <td style={S.td}>
                    <span style={{ ...S.badge, background: rolColor(u.rol) }}>
                      {rolLabels[u.rol] || u.rol}
                    </span>
                  </td>
                  <td style={S.td}>
                    <div style={S.switchRow}>
                      <div
                        role="button"
                        tabIndex={0}
                        aria-pressed={u.activo}
                        onClick={() => u.rol !== 'ADM' && cambiarEstado(u.id, !u.activo)}
                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && u.rol !== 'ADM' && cambiarEstado(u.id, !u.activo)}
                        style={{
                          ...S.switch,
                          background: u.activo ? '#2E7D32' : '#9E9E9E',
                          cursor: u.rol === 'ADM' ? 'not-allowed' : 'pointer',
                          opacity: u.rol === 'ADM' ? 0.7 : 1,
                        }}
                      >
                        <div style={{ ...S.switchCircle, transform: u.activo ? 'translateX(22px)' : 'translateX(0)' }} />
                      </div>
                      <span style={{ ...S.badge, background: u.activo ? '#E8F5E9' : '#FFEBEE', color: u.activo ? '#2E7D32' : '#C62828', marginLeft: '10px' }}>
                        {u.activo ? 'Activo' : 'Inactivo'}{u.rol === 'ADM' ? ' (Administrador)' : ''}
                      </span>
                    </div>
                  </td>
                  <td style={S.td}>
                    <div style={S.actionButtons}>
                      <button onClick={() => abrirEditar(u)} style={S.btnEdit}>Editar</button>
                      {u.rol !== 'ADM' && u.username !== user?.username && (
                        <button onClick={() => eliminar(u.id)} style={S.btnDanger}>Eliminar</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {modal && (
          <div style={S.overlay}>
            <div style={S.modal}>
              <h3 style={S.modalTitle}>{modal === 'crear' ? '➕ Nuevo Usuario' : '✏️ Editar Usuario'}</h3>

              {/* Nombre y Apellido */}
              <div style={S.grid2}>
                <div style={S.field}>
                  <label style={S.label}>Nombre *</label>
                  <input
                    style={S.input}
                    type="text"
                    placeholder="Ej: Juan"
                    value={form.nombre}
                    onChange={(e) => handleFormChange('nombre', e.target.value)}
                  />
                </div>
                <div style={S.field}>
                  <label style={S.label}>Apellido *</label>
                  <input
                    style={S.input}
                    type="text"
                    placeholder="Ej: Pérez"
                    value={form.apellido}
                    onChange={(e) => handleFormChange('apellido', e.target.value)}
                  />
                </div>
              </div>

              {/* DNI y Usuario */}
              <div style={S.grid2}>
                <div style={S.field}>
                  <label style={S.label}>DNI *</label>
                  <input
                    style={S.input}
                    type="text"
                    placeholder="Ej: 12345678"
                    value={form.dni}
                    onChange={(e) => handleFormChange('dni', e.target.value)}
                  />
                </div>
                <div style={S.field}>
                  <label style={S.label}>Usuario *</label>
                  <input
                    style={S.input}
                    type="text"
                    placeholder="Ej: jperez"
                    value={form.username}
                    onChange={(e) => handleFormChange('username', e.target.value)}
                    readOnly={modal === 'editar'}
                  />
                </div>
              </div>

              {/* Email y Teléfono */}
              <div style={S.grid2}>
                <div style={S.field}>
                  <label style={S.label}>Correo electrónico *</label>
                  <input
                    style={S.input}
                    type="email"
                    placeholder="Ej: juan@example.com"
                    value={form.email}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                  />
                </div>
                <div style={S.field}>
                  <label style={S.label}>Teléfono</label>
                  <input
                    style={S.input}
                    type="text"
                    placeholder="Ej: +5491234567890"
                    value={form.telefono}
                    onChange={(e) => handleFormChange('telefono', e.target.value)}
                  />
                </div>
              </div>

              {/* Fecha de Nacimiento y Domicilio */}
              <div style={S.grid2}>
                <div style={S.field}>
                  <label style={S.label}>Fecha de Nacimiento</label>
                  <input
                    style={S.input}
                    type="date"
                    value={form.fechaNacimiento}
                    onChange={(e) => handleFormChange('fechaNacimiento', e.target.value)}
                  />
                </div>
                <div style={S.field}>
                  <label style={S.label}>Domicilio</label>
                  <input
                    style={S.input}
                    type="text"
                    placeholder="Ej: Calle 123, Apto 4B"
                    value={form.domicilio}
                    onChange={(e) => handleFormChange('domicilio', e.target.value)}
                  />
                </div>
              </div>

              {/* Contraseña y Rol */}
              <div style={S.grid2}>
                <div style={S.field}>
                  <label style={S.label}>Contraseña {modal === 'editar' && '(dejar vacío para no cambiar)'} *</label>
                  <div style={S.passwordWrapper}>
                    <input
                      style={{ ...S.input, paddingRight: '48px' }}
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => handleFormChange('password', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      style={S.eyeButton}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      👁
                    </button>
                  </div>
                  <p style={S.helpText}>8+ caracteres, 1 mayúscula, 1 minúscula y 1 número.</p>
                </div>
                <div style={S.field}>
                  <label style={S.label}>Rol *</label>
                  <select
                    style={S.input}
                    value={form.rol}
                    onChange={(e) => handleFormChange('rol', e.target.value)}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{rolLabels[r]}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={S.modalActions}>
                <button onClick={() => setModal(null)} style={S.btnSecondary}>Cancelar</button>
                <button onClick={guardar} style={S.btnPrimary} disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const rolColor = (r) => ({ ADM: '#E3F2FD', ENF: '#E8F5E9', JEF: '#FFF3E0', DES: '#F3E5F5', DIR: '#FCE4EC' }[r] || '#F5F5F5');

const S = {
  page: { display: 'flex', minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif" },
  main: { flex: 1, background: '#F0F7F7', padding: '32px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  headerTitle: { fontSize: '26px', fontWeight: '700', color: '#0F2A2A', margin: 0 },
  headerSub: { color: '#888', margin: '4px 0 0', fontSize: '13px' },
  msgBar: { background: '#E8F5E9', border: '1px solid #A5D6A7', color: '#2E7D32', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  errorBar: { background: '#FFEBEE', border: '1px solid #EF9A9A', color: '#C62828', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  tableCard: { background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHead: { background: '#1B6B6B' },
  th: { color: '#fff', padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600' },
  tr: { borderBottom: '1px solid #F0F7F7' },
  td: { padding: '14px 16px', fontSize: '14px', color: '#333' },
  badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  btnPrimary: { background: 'linear-gradient(135deg, #1B6B6B, #2A9090)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  btnSecondary: { background: '#F0F7F7', color: '#1B6B6B', border: '1.5px solid #1B6B6B', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontSize: '14px' },
  btnEdit: { background: '#E3F2FD', color: '#1565C0', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '13px', marginBottom: '4px' },
  btnDanger: { background: '#FFEBEE', color: '#C62828', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '13px' },
  switchRow: { display: 'flex', alignItems: 'center' },
  switch: { width: '46px', height: '24px', borderRadius: '999px', display: 'flex', alignItems: 'center', padding: '2px', cursor: 'pointer', transition: 'background 0.2s ease' },
  switchCircle: { width: '20px', height: '20px', borderRadius: '50%', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.18)', transition: 'transform 0.2s ease' },
  actionButtons: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#fff', borderRadius: '16px', padding: '32px', width: '650px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  modalTitle: { color: '#0F2A2A', fontSize: '20px', fontWeight: '700', marginBottom: '24px' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#333' },
  passwordWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #B2DFDB', fontSize: '14px', outline: 'none', background: '#fff', color: '#333' },
  eyeButton: { position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', width: '32px', height: '32px', border: 'none', background: 'transparent', display: 'grid', placeItems: 'center', cursor: 'pointer', fontSize: '16px', color: '#1B6B6B', outline: 'none', padding: 0 },
  helpText: { fontSize: '12px', color: '#666', margin: '4px 0 0' },
  modalActions: { display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' },
};