import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { empleadoService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ROLES = ['ENF', 'JEF', 'DES', 'DIR'];
const ROL_LABEL = { ENF: 'Enfermero', JEF: 'Jefe Enfermería', DES: 'Despachador', DIR: 'Directivo', ADM: 'Administrador' };
const EMPTY = { nombre: '', apellido: '', dni: '', email: '', telefono: '', rol: 'ENF', disponible: true };

export default function Empleados() {
  const [lista, setLista] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    try { const r = await empleadoService.listar(); setLista(r.data); }
    catch { mostrar('Error al cargar la lista'); }
  };

  const mostrar = (t) => { setMsg(t); setTimeout(() => setMsg(''), 3000); };

  const guardar = async () => {
    setLoading(true);
    try {
      if (modal === 'crear') { await empleadoService.crear(form); mostrar('✅ Empleado registrado'); }
      else { await empleadoService.modificar(editId, form); mostrar('✅ Empleado modificado'); }
      setModal(null); cargar();
    } catch (e) {
      mostrar('❌ ' + (e.response?.data?.message || 'Error al guardar'));
    } finally { setLoading(false); }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar este empleado?')) return;
    try { await empleadoService.eliminar(id); mostrar('✅ Empleado eliminado'); cargar(); }
    catch { mostrar('❌ Error al eliminar'); }
  };

  const abrirCrear = () => { setForm(EMPTY); setModal('crear'); };
  const abrirEditar = (e) => {
    setForm({ nombre: e.nombre, apellido: e.apellido, dni: e.dni, email: e.email, telefono: e.telefono || '', rol: e.rol, disponible: e.disponible });
    setEditId(e.id); setModal('editar');
  };

  return (
    <div style={S.page}>
      {/* Sidebar */}
      <aside style={S.sidebar}>
        <div style={S.logoBox}>
          <span style={{ fontSize: '24px', fontWeight: '800', color: '#fff' }}>
            SIGE<span style={{ color: '#4CAF50' }}>M</span>
          </span>
          <p style={{ color: '#B2DFDB', fontSize: '11px', margin: '4px 0 0' }}>Sistema 107</p>
        </div>
        <nav style={S.nav}>
          <button style={S.navItem} onClick={() => navigate('/dashboard')}>🏠 Inicio</button>
          <button style={{ ...S.navItem, ...S.navActive }}>👥 Empleados</button>
          {user?.rol === 'ADM' && (
            <button style={S.navItem} onClick={() => navigate('/usuarios')}>🔐 Usuarios</button>
          )}
        </nav>
        <button onClick={() => { logout(); navigate('/login'); }} style={S.logoutBtn}>🚪 Cerrar sesión</button>
      </aside>

      {/* Main */}
      <main style={S.main}>
        <div style={S.header}>
          <div>
            <h1 style={S.h1}>Gestión de Empleados</h1>
            <p style={S.sub}>{lista.filter(e => e.activo).length} empleados activos en el sistema</p>
          </div>
          <button onClick={abrirCrear} style={S.btnAdd}>+ Registrar Empleado</button>
        </div>

        {msg && <div style={S.msg}>{msg}</div>}

        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr style={S.thead}>
                {['Nombre y Apellido', 'DNI', 'Email', 'Teléfono', 'Rol', 'Disponible', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  No hay empleados registrados. Hacé click en "+ Registrar Empleado".
                </td></tr>
              )}
              {lista.map(e => (
                <tr key={e.id} style={S.tr}>
                  <td style={{ ...S.td, fontWeight: '600' }}>{e.nombre} {e.apellido}</td>
                  <td style={S.td}>{e.dni}</td>
                  <td style={S.td}>{e.email}</td>
                  <td style={S.td}>{e.telefono || '—'}</td>
                  <td style={S.td}><span style={{ ...S.badge, background: '#E3F2FD', color: '#1565C0' }}>{ROL_LABEL[e.rol]}</span></td>
                  <td style={S.td}><span style={{ ...S.badge, background: e.disponible ? '#E8F5E9' : '#FFF9C4', color: e.disponible ? '#2E7D32' : '#F57F17' }}>{e.disponible ? 'Sí' : 'No'}</span></td>
                  <td style={S.td}><span style={{ ...S.badge, background: e.activo ? '#E8F5E9' : '#FFEBEE', color: e.activo ? '#2E7D32' : '#C62828' }}>{e.activo ? 'Activo' : 'Inactivo'}</span></td>
                  <td style={S.td}>
                    <button onClick={() => abrirEditar(e)} style={S.btnEdit}>Modificar</button>
                    {e.activo && <button onClick={() => eliminar(e.id)} style={S.btnDel}>Eliminar</button>}
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
            <h3 style={S.modalTitle}>{modal === 'crear' ? '➕ Registrar Empleado' : '✏️ Modificar Empleado'}</h3>
            <div style={S.grid}>
              {[['nombre','Nombre'],['apellido','Apellido'],['dni','DNI'],['email','Email'],['telefono','Teléfono']].map(([k,l]) => (
                <div key={k} style={S.field}>
                  <label style={S.label}>{l}</label>
                  <input style={S.input} value={form[k]} onChange={e => setForm({...form,[k]:e.target.value})} />
                </div>
              ))}
              <div style={S.field}>
                <label style={S.label}>Rol</label>
                <select style={S.input} value={form.rol} onChange={e => setForm({...form,rol:e.target.value})}>
                  {ROLES.map(r => <option key={r} value={r}>{ROL_LABEL[r]}</option>)}
                </select>
              </div>
            </div>
            <label style={{ display:'flex', gap:'8px', alignItems:'center', fontSize:'14px', cursor:'pointer', marginBottom:'20px' }}>
              <input type="checkbox" checked={form.disponible} onChange={e => setForm({...form,disponible:e.target.checked})} />
              Disponible para guardia
            </label>
            <div style={S.actions}>
              <button onClick={() => setModal(null)} style={S.btnCancel}>Cancelar</button>
              <button onClick={guardar} style={S.btnSave} disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  page: { display: 'flex', minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif" },
  sidebar: { width: '220px', background: '#0F2A2A', display: 'flex', flexDirection: 'column', flexShrink: 0 },
  logoBox: { padding: '24px 20px', borderBottom: '1px solid #1B4A4A', textAlign: 'center' },
  nav: { flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' },
  navItem: { background: 'transparent', border: 'none', color: '#B2DFDB', padding: '11px 14px', borderRadius: '8px', textAlign: 'left', cursor: 'pointer', fontSize: '14px', width: '100%' },
  navActive: { background: '#1B6B6B', color: '#fff' },
  logoutBtn: { margin: '16px 12px', background: 'transparent', border: '1px solid #1B4A4A', color: '#B2DFDB', padding: '11px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' },
  main: { flex: 1, background: '#F0F7F7', padding: '32px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  h1: { fontSize: '26px', fontWeight: '700', color: '#0F2A2A', margin: '0 0 4px' },
  sub: { color: '#666', fontSize: '13px', margin: 0 },
  btnAdd: { background: 'linear-gradient(135deg, #1B6B6B, #2A9090)', color: '#fff', border: 'none', borderRadius: '8px', padding: '11px 20px', cursor: 'pointer', fontSize: '14px', fontWeight: '700' },
  msg: { background: '#F1F8E9', border: '1px solid #AED581', color: '#33691E', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  tableWrap: { background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#1B6B6B' },
  th: { color: '#fff', padding: '13px 14px', textAlign: 'left', fontSize: '13px', fontWeight: '600' },
  tr: { borderBottom: '1px solid #F0F7F7' },
  td: { padding: '13px 14px', fontSize: '13px', color: '#333' },
  badge: { padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' },
  btnEdit: { background: '#E3F2FD', color: '#1565C0', border: 'none', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', fontSize: '12px', marginRight: '6px' },
  btnDel: { background: '#FFEBEE', color: '#C62828', border: 'none', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', fontSize: '12px' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#fff', borderRadius: '16px', padding: '32px', width: '560px', maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  modalTitle: { color: '#0F2A2A', fontSize: '20px', fontWeight: '700', marginBottom: '24px', marginTop: 0 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '5px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#333' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #ddd', fontSize: '14px', outline: 'none' },
  actions: { display: 'flex', gap: '12px', justifyContent: 'flex-end' },
  btnCancel: { background: '#F5F5F5', color: '#333', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontSize: '14px' },
  btnSave: { background: 'linear-gradient(135deg, #1B6B6B, #2A9090)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontSize: '14px', fontWeight: '700' },
};