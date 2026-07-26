import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { empleadoService } from '../services/api';

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
      <Sidebar />

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
                <tr>
                  <td colSpan={8} style={S.emptyState}>
                    No hay empleados registrados. Hacé click en "+ Registrar Empleado".
                  </td>
                </tr>
              )}
              {lista.map(e => (
                <tr key={e.id} style={S.tr}>
                  <td style={{ ...S.td, fontWeight: 700 }}>{e.nombre} {e.apellido}</td>
                  <td style={S.td}>{e.dni}</td>
                  <td style={S.td}>{e.email}</td>
                  <td style={S.td}>{e.telefono || '—'}</td>
                  <td style={S.td}><span style={{ ...S.badge, background: 'var(--color-primary-soft)', color: 'var(--color-primary-strong)' }}>{ROL_LABEL[e.rol]}</span></td>
                  <td style={S.td}><span style={{ ...S.badge, background: e.disponible ? 'var(--color-primary-soft)' : '#FFF8E1', color: e.disponible ? 'var(--color-success)' : 'var(--color-warning)' }}>{e.disponible ? 'Sí' : 'No'}</span></td>
                  <td style={S.td}><span style={{ ...S.badge, background: e.activo ? 'var(--color-primary-soft)' : '#FFEBEE', color: e.activo ? 'var(--color-success)' : 'var(--color-danger)' }}>{e.activo ? 'Activo' : 'Inactivo'}</span></td>
                  <td style={S.td}>
                    <div style={S.actions}>
                      <button onClick={() => abrirEditar(e)} style={S.btnEdit}>Modificar</button>
                      {e.activo && <button onClick={() => eliminar(e.id)} style={S.btnDel}>Eliminar</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {modal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <h3 style={S.modalTitle}>{modal === 'crear' ? '➕ Registrar Empleado' : '✏️ Modificar Empleado'}</h3>
            <div style={S.grid}>
              {[['nombre', 'Nombre'], ['apellido', 'Apellido'], ['dni', 'DNI'], ['email', 'Email'], ['telefono', 'Teléfono']].map(([k, l]) => (
                <div key={k} style={S.field}>
                  <label style={S.label}>{l}</label>
                  <input style={S.input} value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} />
                </div>
              ))}
              <div style={S.field}>
                <label style={S.label}>Rol</label>
                <select style={S.input} value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })}>
                  {ROLES.map(r => <option key={r} value={r}>{ROL_LABEL[r]}</option>)}
                </select>
              </div>
            </div>
            <label style={S.checkboxRow}>
              <input type="checkbox" checked={form.disponible} onChange={e => setForm({ ...form, disponible: e.target.checked })} />
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
  page: { display: 'flex', minHeight: '100vh', fontFamily: 'var(--font-family-sans)', background: 'var(--color-page-bg)', color: 'var(--color-text-primary)' },
  main: { flex: 1, background: 'var(--color-page-bg)', padding: 'var(--spacing-6)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-5)', flexWrap: 'wrap', gap: 'var(--spacing-4)' },
  h1: { fontSize: 'var(--font-size-3xl)', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 var(--spacing-2)' },
  sub: { color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', margin: 0 },
  btnAdd: { background: 'linear-gradient(135deg, var(--color-primary), var(--color-success))', color: 'var(--color-on-primary)', border: 'none', borderRadius: 'var(--radius-md)', padding: '0.7rem 1rem', cursor: 'pointer', fontSize: 'var(--font-size-sm)', fontWeight: 700 },
  msg: { background: 'var(--color-primary-soft)', border: '1px solid var(--color-border)', color: 'var(--color-primary-strong)', padding: '0.8rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-4)', fontSize: 'var(--font-size-sm)' },
  tableWrap: { background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)', overflow: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '900px' },
  thead: { background: 'var(--color-primary)' },
  th: { color: 'var(--color-on-primary)', padding: '0.8rem 0.9rem', textAlign: 'left', fontSize: 'var(--font-size-xs)', fontWeight: 700 },
  tr: { borderBottom: '1px solid var(--color-border)' },
  td: { padding: '0.8rem 0.9rem', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' },
  emptyState: { textAlign: 'center', padding: '2.6rem', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' },
  badge: { padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-pill)', fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center' },
  actions: { display: 'flex', gap: 'var(--spacing-2)', flexWrap: 'wrap' },
  btnEdit: { background: 'var(--color-primary-soft)', color: 'var(--color-primary-strong)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '0.4rem 0.7rem', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 700 },
  btnDel: { background: '#FFEBEE', color: 'var(--color-danger)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '0.4rem 0.7rem', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 700 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15, 42, 48, 0.48)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 'var(--z-modal)', padding: 'var(--spacing-5)' },
  modal: { background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', padding: '1.3rem', width: '100%', maxWidth: '620px', boxShadow: 'var(--shadow-lg)' },
  modalTitle: { color: 'var(--color-text-primary)', fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: 'var(--spacing-5)', marginTop: 0 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-4)' },
  field: { display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' },
  label: { fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-text-secondary)' },
  input: { padding: '0.7rem 0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--font-size-sm)', outline: 'none', background: 'var(--color-surface)', color: 'var(--color-text-primary)', boxSizing: 'border-box' },
  checkboxRow: { display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: 'var(--font-size-sm)', cursor: 'pointer', marginBottom: 'var(--spacing-5)' },
  actions: { display: 'flex', gap: 'var(--spacing-3)', justifyContent: 'flex-end' },
  btnCancel: { background: 'var(--color-surface-muted)', color: 'var(--color-text-primary)', border: 'none', borderRadius: 'var(--radius-md)', padding: '0.7rem 1rem', cursor: 'pointer', fontSize: 'var(--font-size-sm)', fontWeight: 700 },
  btnSave: { background: 'linear-gradient(135deg, var(--color-primary), var(--color-success))', color: 'var(--color-on-primary)', border: 'none', borderRadius: 'var(--radius-md)', padding: '0.7rem 1rem', cursor: 'pointer', fontSize: 'var(--font-size-sm)', fontWeight: 700 },
};