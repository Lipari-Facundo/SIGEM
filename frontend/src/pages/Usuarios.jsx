import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usuarioService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ROLES = ['ENF', 'JEF', 'DES', 'ADM', 'DIR'];
const rolLabels = { ADM: 'Administrador', ENF: 'Enfermero', JEF: 'Jefe Enfermería', DES: 'Despachador', DIR: 'Directivo' };
const EMPTY_FORM = { username: '', password: '', nombre: '', apellido: '', email: '', rol: 'ENF' };

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [modal, setModal] = useState(null); // null | 'crear' | 'editar'
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { cargarUsuarios(); }, []);

  const cargarUsuarios = async () => {
    try {
      const res = await usuarioService.listar();
      setUsuarios(res.data);
    } catch { showMsg('Error al cargar usuarios', true); }
  };

  const showMsg = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 3000);
  };

  const abrirCrear = () => { setForm(EMPTY_FORM); setModal('crear'); };

  const abrirEditar = (u) => {
    setForm({ username: u.username, password: '', nombre: u.nombre, apellido: u.apellido, email: u.email, rol: u.rol });
    setEditId(u.id);
    setModal('editar');
  };

  const guardar = async () => {
    setLoading(true);
    try {
      if (modal === 'crear') {
        await usuarioService.crear(form);
        showMsg('✅ Usuario creado correctamente');
      } else {
        await usuarioService.modificar(editId, form);
        showMsg('✅ Usuario modificado correctamente');
      }
      setModal(null);
      cargarUsuarios();
    } catch (e) {
      showMsg('❌ ' + (e.response?.data?.message || 'Error al guardar'));
    } finally { setLoading(false); }
  };

  const desactivar = async (id) => {
    if (!window.confirm('¿Desactivar este usuario?')) return;
    try {
      await usuarioService.desactivar(id);
      showMsg('✅ Usuario desactivado');
      cargarUsuarios();
    } catch { showMsg('❌ Error al desactivar'); }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={S.container}>
      {/* Sidebar */}
      <aside style={S.sidebar}>
        <div style={S.logoBox}>
          <span style={{ color: '#fff', fontSize: '28px', fontWeight: '800' }}>
            SIGE<span style={{ color: '#4CAF50' }}>M</span>
          </span>
          <p style={{ color: '#B2DFDB', fontSize: '10px', letterSpacing: '2px' }}>HEALTH DEV SYSTEM</p>
        </div>
        <nav style={S.nav}>
          <button style={S.navItem} onClick={() => navigate('/dashboard')}>🏠 Dashboard</button>
          <button style={{ ...S.navItem, ...S.navActive }}>👥 Usuarios</button>
        </nav>
        <button onClick={handleLogout} style={S.logoutBtn}>🚪 Cerrar sesión</button>
      </aside>

      {/* Main */}
      <main style={S.main}>
        <header style={S.header}>
          <div>
            <h1 style={S.headerTitle}>Gestión de Usuarios</h1>
            <p style={S.headerSub}>{usuarios.length} usuarios registrados</p>
          </div>
          <button onClick={abrirCrear} style={S.btnPrimary}>+ Nuevo Usuario</button>
        </header>

        {msg && <div style={S.msgBar}>{msg}</div>}

        {/* Tabla */}
        <div style={S.tableCard}>
          <table style={S.table}>
            <thead>
              <tr style={S.tableHead}>
                <th style={S.th}>Usuario</th>
                <th style={S.th}>Nombre</th>
                <th style={S.th}>Email</th>
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
                  <td style={S.td}>{u.email}</td>
                  <td style={S.td}>
                    <span style={{ ...S.badge, background: rolColor(u.rol) }}>
                      {rolLabels[u.rol] || u.rol}
                    </span>
                  </td>
                  <td style={S.td}>
                    <span style={{ ...S.badge, background: u.activo ? '#E8F5E9' : '#FFEBEE', color: u.activo ? '#2E7D32' : '#C62828' }}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={S.td}>
                    <button onClick={() => abrirEditar(u)} style={S.btnEdit}>Editar</button>
                    {u.activo && u.username !== user?.username && (
                      <button onClick={() => desactivar(u.id)} style={S.btnDanger}>Desactivar</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modal */}
      {modal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <h3 style={S.modalTitle}>
              {modal === 'crear' ? '➕ Nuevo Usuario' : '✏️ Editar Usuario'}
            </h3>
            <div style={S.grid2}>
              {[
                { key: 'nombre', label: 'Nombre', type: 'text' },
                { key: 'apellido', label: 'Apellido', type: 'text' },
                { key: 'username', label: 'Usuario', type: 'text' },
                { key: 'email', label: 'Email', type: 'email' },
              ].map(({ key, label, type }) => (
                <div key={key} style={S.field}>
                  <label style={S.label}>{label}</label>
                  <input
                    style={S.input}
                    type={type}
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <div style={S.grid2}>
              <div style={S.field}>
                <label style={S.label}>Contraseña {modal === 'editar' && '(dejar vacío para no cambiar)'}</label>
                <input style={S.input} type="password" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              <div style={S.field}>
                <label style={S.label}>Rol</label>
                <select style={S.input} value={form.rol}
                  onChange={(e) => setForm({ ...form, rol: e.target.value })}>
                  {ROLES.map((r) => <option key={r} value={r}>{rolLabels[r]}</option>)}
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
    </div>
  );
}

const rolColor = (r) => ({ ADM: '#E3F2FD', ENF: '#E8F5E9', JEF: '#FFF3E0', DES: '#F3E5F5', DIR: '#FCE4EC' }[r] || '#F5F5F5');

const S = {
  container: { display: 'flex', minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif" },
  sidebar: { width: '240px', background: '#0F2A2A', display: 'flex', flexDirection: 'column', flexShrink: 0 },
  logoBox: { padding: '28px 20px', borderBottom: '1px solid #1B4A4A', textAlign: 'center' },
  nav: { flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' },
  navItem: { background: 'transparent', border: 'none', color: '#B2DFDB', padding: '12px 16px', borderRadius: '8px', textAlign: 'left', cursor: 'pointer', fontSize: '14px' },
  navActive: { background: '#1B6B6B', color: '#fff' },
  logoutBtn: { margin: '16px 12px', background: 'transparent', border: '1px solid #1B4A4A', color: '#B2DFDB', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' },
  main: { flex: 1, background: '#F0F7F7', padding: '32px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  headerTitle: { fontSize: '26px', fontWeight: '700', color: '#0F2A2A', margin: 0 },
  headerSub: { color: '#888', margin: '4px 0 0', fontSize: '13px' },
  msgBar: { background: '#E8F5E9', border: '1px solid #A5D6A7', color: '#2E7D32', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  tableCard: { background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHead: { background: '#1B6B6B' },
  th: { color: '#fff', padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600' },
  tr: { borderBottom: '1px solid #F0F7F7' },
  td: { padding: '14px 16px', fontSize: '14px', color: '#333' },
  badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  btnPrimary: { background: 'linear-gradient(135deg, #1B6B6B, #2A9090)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  btnSecondary: { background: '#F0F7F7', color: '#1B6B6B', border: '1.5px solid #1B6B6B', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontSize: '14px' },
  btnEdit: { background: '#E3F2FD', color: '#1565C0', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '13px', marginRight: '6px' },
  btnDanger: { background: '#FFEBEE', color: '#C62828', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '13px' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#fff', borderRadius: '16px', padding: '32px', width: '560px', maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  modalTitle: { color: '#0F2A2A', fontSize: '20px', fontWeight: '700', marginBottom: '24px' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#333' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #B2DFDB', fontSize: '14px', outline: 'none' },
  modalActions: { display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' },
};