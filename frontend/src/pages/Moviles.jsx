import { useState, useEffect } from 'react';
import { movilService } from '../services/api';
import Sidebar from '../components/Sidebar';

// ─── Constantes de dominio ────────────────────────────────────────────────────

const TIPOS_MOVIL = [
  { value: 'AMBULANCIA_UTIM',     label: 'Ambulancia UTIM' },
  { value: 'AMBULANCIA_TRASLADO', label: 'Ambulancia Traslado' },
  { value: 'VEHICULO_APOYO',      label: 'Vehículo de Apoyo' },
  { value: 'OTRO',                label: 'Otro' },
];

const ESTADOS_MOVIL = [
  { value: 'OPERATIVO',          label: 'Operativo' },
  { value: 'EN_SERVICIO',        label: 'En servicio' },
  { value: 'EN_TRASLADO',        label: 'En traslado' },
  { value: 'EN_MANTENIMIENTO',   label: 'En mantenimiento' },
  { value: 'FUERA_DE_SERVICIO',  label: 'Fuera de servicio' },
];

const estadoColor = (estado) => ({
  OPERATIVO:         { bg: '#E8F5E9', color: '#2E7D32' },
  EN_SERVICIO:       { bg: '#E3F2FD', color: '#1565C0' },
  EN_TRASLADO:       { bg: '#FFF8E1', color: '#F57F17' },
  EN_MANTENIMIENTO:  { bg: '#FFF3E0', color: '#E65100' },
  FUERA_DE_SERVICIO: { bg: '#FFEBEE', color: '#C62828' },
}[estado] || { bg: '#F5F5F5', color: '#333' });

const tipoLabel = (tipo) =>
  TIPOS_MOVIL.find(t => t.value === tipo)?.label || tipo;

const estadoLabel = (estado) =>
  ESTADOS_MOVIL.find(e => e.value === estado)?.label || estado;

// ─── Formulario vacío ─────────────────────────────────────────────────────────

const EMPTY_FORM = {
  tipoMovil: 'AMBULANCIA_UTIM',
  marca: '',
  modelo: '',
  patente: '',
  anio: '',
  numeroInterno: '',
  fechaRegistro: new Date().toISOString().split('T')[0],
  baseOperativa: '',
  kilometrajeActual: '',
  capacidadPacientes: '',
  observaciones: '',
  estadoMovil: 'OPERATIVO',
};

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Moviles() {
  const [lista, setLista]         = useState([]);
  const [filtro, setFiltro]       = useState('');
  const [modal, setModal]         = useState(null); // null | 'crear' | 'editar'
  const [form, setForm]           = useState(EMPTY_FORM);
  const [editId, setEditId]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [msg, setMsg]             = useState('');
  const [error, setError]         = useState('');
  const [confirmId, setConfirmId] = useState(null); // ID para confirmar eliminación

  useEffect(() => { cargar(); }, []);

  // ─── Carga de datos ─────────────────────────────────────────

  const cargar = async () => {
    try {
      const res = await movilService.listar();
      setLista(res.data);
    } catch {
      mostrarError('Error al cargar la lista de móviles');
    }
  };

  // ─── Helpers de mensajes ────────────────────────────────────

  const mostrarMsg = (t) => { setMsg(t); setTimeout(() => setMsg(''), 3500); };
  const mostrarError = (t) => { setError(t); setTimeout(() => setError(''), 4000); };

  // ─── Filtro local ───────────────────────────────────────────

  const listaFiltrada = lista.filter(m =>
    [m.numeroInterno, m.patente, m.marca, m.modelo, m.baseOperativa]
      .some(v => v?.toLowerCase().includes(filtro.toLowerCase()))
  );

  // ─── Abrir modales ──────────────────────────────────────────

  const abrirCrear = () => {
    setError('');
    setForm(EMPTY_FORM);
    setModal('crear');
  };

  const abrirEditar = (m) => {
    setError('');
    setForm({
      tipoMovil:          m.tipoMovil,
      marca:              m.marca,
      modelo:             m.modelo,
      patente:            m.patente,
      anio:               m.anio,
      numeroInterno:      m.numeroInterno,
      fechaRegistro:      m.fechaRegistro,
      baseOperativa:      m.baseOperativa,
      kilometrajeActual:  m.kilometrajeActual ?? '',
      capacidadPacientes: m.capacidadPacientes ?? '',
      observaciones:      m.observaciones ?? '',
      estadoMovil:        m.estadoMovil,
    });
    setEditId(m.id);
    setModal('editar');
  };

  // ─── Guardar (crear o editar) ───────────────────────────────

  const guardar = async () => {
    setError('');

    // Validación frontend básica
    const reqs = ['tipoMovil','marca','modelo','patente','anio','numeroInterno','fechaRegistro','baseOperativa'];
    for (const k of reqs) {
      if (!form[k] || String(form[k]).trim() === '') {
        setError(`El campo "${k}" es obligatorio`);
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        patente:            form.patente.toUpperCase().trim(),
        numeroInterno:      form.numeroInterno.toUpperCase().trim(),
        anio:               Number(form.anio),
        kilometrajeActual:  form.kilometrajeActual !== '' ? Number(form.kilometrajeActual) : null,
        capacidadPacientes: form.capacidadPacientes !== '' ? Number(form.capacidadPacientes) : null,
      };

      if (modal === 'crear') {
        await movilService.registrar(payload);
        mostrarMsg('✅ Móvil registrado correctamente');
      } else {
        await movilService.modificar(editId, payload);
        mostrarMsg('✅ Móvil modificado correctamente');
      }
      setModal(null);
      setEditId(null);
      setForm(EMPTY_FORM);
      await cargar();
    } catch (e) {
      if (e.response?.status === 403) {
        setError('No tienes permisos para guardar este móvil.');
      } else {
        setError(e.response?.data?.message || 'Error al guardar el móvil');
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Eliminar ───────────────────────────────────────────────

  const eliminar = async (id) => {
    try {
      await movilService.eliminar(id);
      mostrarMsg('✅ Móvil eliminado correctamente');
      setConfirmId(null);
      cargar();
    } catch (e) {
      mostrarError(e.response?.data?.message || '❌ Error al eliminar el móvil');
      setConfirmId(null);
    }
  };

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div style={S.page}>
      <Sidebar />

      <main style={S.main}>
        {/* Header */}
        <header style={S.header}>
          <div>
            <h1 style={S.h1}>Gestión de Móviles</h1>
            <p style={S.sub}>{lista.length} móvil{lista.length !== 1 ? 'es' : ''} registrado{lista.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={abrirCrear} style={S.btnPrimary}>+ Nuevo Móvil</button>
        </header>

        {/* Búsqueda */}
        <div style={S.searchBar}>
          <input
            style={S.searchInput}
            placeholder="🔍 Buscar por número interno, patente, marca, modelo o base..."
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
          />
        </div>

        {/* Mensajes */}
        {msg   && <div style={S.msgBar}>{msg}</div>}
        {error && <div style={S.errorBar}>{error}</div>}

        {/* Tabla */}
        <div style={S.tableCard}>
          <table style={S.table}>
            <thead>
              <tr style={S.tableHead}>
                {['ID','Tipo','Marca / Modelo','Patente','Año','N° Interno','Base Operativa','Estado','Fecha Registro','Acciones'].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {listaFiltrada.length === 0 && (
                <tr>
                  <td colSpan={10} style={S.empty}>
                    {filtro ? 'No se encontraron resultados para la búsqueda.' : 'No hay móviles registrados. Hacé clic en "+ Nuevo Móvil".'}
                  </td>
                </tr>
              )}
              {listaFiltrada.map(m => {
                const ec = estadoColor(m.estadoMovil);
                return (
                  <tr key={m.id} style={S.tr}>
                    <td style={S.td}><span style={S.idBadge}>#{m.id}</span></td>
                    <td style={S.td}>{tipoLabel(m.tipoMovil)}</td>
                    <td style={{ ...S.td, fontWeight: '600' }}>{m.marca} {m.modelo}</td>
                    <td style={S.td}><code style={S.code}>{m.patente}</code></td>
                    <td style={S.td}>{m.anio}</td>
                    <td style={S.td}><code style={S.code}>{m.numeroInterno}</code></td>
                    <td style={S.td}>{m.baseOperativa}</td>
                    <td style={S.td}>
                      <span style={{ ...S.badge, background: ec.bg, color: ec.color }}>
                        {estadoLabel(m.estadoMovil)}
                      </span>
                    </td>
                    <td style={S.td}>{m.fechaRegistro}</td>
                    <td style={S.td}>
                      <div style={S.actions}>
                        <button onClick={() => abrirEditar(m)} style={S.btnEdit}>Editar</button>
                        <button onClick={() => setConfirmId(m.id)} style={S.btnDanger}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>

      {/* ── Modal Crear / Editar ───────────────────────────── */}
      {modal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <h3 style={S.modalTitle}>
              {modal === 'crear' ? '🚑 Registrar Nuevo Móvil' : '✏️ Modificar Móvil'}
            </h3>

            {error && <div style={{ ...S.errorBar, marginBottom: '16px' }}>{error}</div>}

            {/* Sección: Datos generales */}
            <p style={S.sectionLabel}>Datos generales</p>
            <div style={S.grid2}>
              <Field label="Tipo de móvil *">
                <select style={S.input} value={form.tipoMovil} onChange={e => setForm({ ...form, tipoMovil: e.target.value })}>
                  {TIPOS_MOVIL.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="Marca *">
                <input style={S.input} value={form.marca} onChange={e => setForm({ ...form, marca: e.target.value })} placeholder="Ej: Ford" />
              </Field>
              <Field label="Modelo *">
                <input style={S.input} value={form.modelo} onChange={e => setForm({ ...form, modelo: e.target.value })} placeholder="Ej: Transit" />
              </Field>
              <Field label="Patente *">
                <input style={S.input} value={form.patente} onChange={e => setForm({ ...form, patente: e.target.value.toUpperCase() })} placeholder="Ej: AB123CD" maxLength={8} />
              </Field>
              <Field label="Año *">
                <input style={S.input} type="number" value={form.anio} onChange={e => setForm({ ...form, anio: e.target.value })} placeholder="Ej: 2022" min={1990} max={2030} />
              </Field>
              <Field label="Número interno *">
                <input style={S.input} value={form.numeroInterno} onChange={e => setForm({ ...form, numeroInterno: e.target.value.toUpperCase() })} placeholder="Ej: AMB-001" />
              </Field>
              <Field label="Fecha de registro *">
                <input style={S.input} type="date" value={form.fechaRegistro} onChange={e => setForm({ ...form, fechaRegistro: e.target.value })} />
              </Field>
              <Field label="Base operativa *">
                <input style={S.input} value={form.baseOperativa} onChange={e => setForm({ ...form, baseOperativa: e.target.value })} placeholder="Ej: Base Central Norte" />
              </Field>
            </div>

            {/* Sección: Datos operativos */}
            <p style={S.sectionLabel}>Datos operativos</p>
            <div style={S.grid2}>
              <Field label="Kilometraje actual">
                <input style={S.input} type="number" value={form.kilometrajeActual} onChange={e => setForm({ ...form, kilometrajeActual: e.target.value })} placeholder="Ej: 45000" min={0} />
              </Field>
              <Field label="Capacidad de pacientes">
                <input style={S.input} type="number" value={form.capacidadPacientes} onChange={e => setForm({ ...form, capacidadPacientes: e.target.value })} placeholder="Ej: 2" min={1} />
              </Field>
              <Field label="Estado *">
                <select style={S.input} value={form.estadoMovil} onChange={e => setForm({ ...form, estadoMovil: e.target.value })}>
                  {ESTADOS_MOVIL.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Observaciones">
              <textarea
                style={{ ...S.input, resize: 'vertical', minHeight: '72px' }}
                value={form.observaciones}
                onChange={e => setForm({ ...form, observaciones: e.target.value })}
                placeholder="Observaciones adicionales sobre el vehículo..."
                maxLength={500}
              />
            </Field>

            {/* Acciones */}
            <div style={S.modalActions}>
              <button onClick={() => { setModal(null); setError(''); }} style={S.btnSecondary}>Cancelar</button>
              <button onClick={guardar} style={S.btnPrimary} disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Confirmar Eliminación ────────────────────── */}
      {confirmId && (
        <div style={S.overlay}>
          <div style={{ ...S.modal, maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚠️</div>
            <h3 style={{ ...S.modalTitle, justifyContent: 'center' }}>¿Eliminar móvil?</h3>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>
              Esta acción no se puede deshacer. El móvil será eliminado permanentemente del sistema.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => setConfirmId(null)} style={S.btnSecondary}>Cancelar</button>
              <button onClick={() => eliminar(confirmId)} style={{ ...S.btnPrimary, background: '#C62828' }}>
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-componente Field ─────────────────────────────────────────────────────

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={{ fontSize: '13px', fontWeight: '600', color: '#333' }}>{label}</label>
      {children}
    </div>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const S = {
  page:        { display: 'flex', minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif" },
  main:        { flex: 1, background: '#F0F7F7', padding: '32px' },
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  h1:          { fontSize: '26px', fontWeight: '700', color: '#0F2A2A', margin: 0 },
  sub:         { color: '#888', margin: '4px 0 0', fontSize: '13px' },
  searchBar:   { marginBottom: '16px' },
  searchInput: { width: '100%', padding: '11px 16px', borderRadius: '8px', border: '1.5px solid #B2DFDB', fontSize: '14px', outline: 'none', background: '#fff', boxSizing: 'border-box' },
  msgBar:      { background: '#E8F5E9', border: '1px solid #A5D6A7', color: '#2E7D32', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  errorBar:    { background: '#FFEBEE', border: '1px solid #EF9A9A', color: '#C62828', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  tableCard:   { background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'auto' },
  table:       { width: '100%', borderCollapse: 'collapse', minWidth: '900px' },
  tableHead:   { background: '#1B6B6B' },
  th:          { color: '#fff', padding: '13px 14px', textAlign: 'left', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap' },
  tr:          { borderBottom: '1px solid #F0F7F7' },
  td:          { padding: '12px 14px', fontSize: '13px', color: '#333' },
  empty:       { textAlign: 'center', padding: '48px', color: '#999', fontSize: '14px' },
  badge:       { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap' },
  idBadge:     { background: '#F0F7F7', color: '#1B6B6B', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' },
  code:        { background: '#F5F5F5', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '13px' },
  actions:     { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  btnPrimary:  { background: 'linear-gradient(135deg, #1B6B6B, #2A9090)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  btnSecondary:{ background: '#F0F7F7', color: '#1B6B6B', border: '1.5px solid #1B6B6B', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontSize: '14px' },
  btnEdit:     { background: '#E3F2FD', color: '#1565C0', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px' },
  btnDanger:   { background: '#FFEBEE', color: '#C62828', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px' },
  overlay:     { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modal:       { background: '#fff', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  modalTitle:  { color: '#0F2A2A', fontSize: '20px', fontWeight: '700', marginBottom: '24px', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' },
  sectionLabel:{ fontSize: '11px', fontWeight: '700', color: '#1B6B6B', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 12px', borderBottom: '1px solid #E0F2F1', paddingBottom: '6px' },
  grid2:       { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' },
  input:       { padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #B2DFDB', fontSize: '14px', outline: 'none', background: '#fff', color: '#333', width: '100%', boxSizing: 'border-box' },
  modalActions:{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' },
};