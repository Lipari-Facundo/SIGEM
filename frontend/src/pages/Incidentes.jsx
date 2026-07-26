import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { incidenteService } from '../services/api';
import { useAuth } from '../context/AuthContext';

// ─── Constantes ───────────────────────────────────────────────────────────────

const ESTADO_LABELS = {
  PENDIENTE:  'Pendiente',
  EN_PROCESO: 'En atención',
  RECHAZADO:  'Rechazado',
  FINALIZADO: 'Finalizado',
};

const ESTADO_COLORS = {
  PENDIENTE:  { bg: '#FFF8E1', color: '#F57F17' },
  EN_PROCESO: { bg: '#E3F2FD', color: '#1565C0' },
  RECHAZADO:  { bg: '#FFEBEE', color: '#C62828' },
  FINALIZADO: { bg: '#E8F5E9', color: '#2E7D32' },
};

const PRIORIDAD_COLORS = {
  ALTA:  { bg: '#FFEBEE', color: '#C62828' },
  MEDIA: { bg: '#FFF8E1', color: '#F57F17' },
  BAJA:  { bg: '#E8F5E9', color: '#2E7D32' },
};

const PRIORIDADES = [
  { value: 'ALTA',  label: '🔴 Alta' },
  { value: 'MEDIA', label: '🟡 Media' },
  { value: 'BAJA',  label: '🟢 Baja' },
];

const EMPTY_FORM = {
  guardiaId:      '',
  ubicacion:      '',
  motivo:         '',
  prioridad:      'MEDIA',
  pacienteNombre: '',
  pacienteDni:    '',
  descripcion:    '',
};

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Incidentes() {
  const { user } = useAuth();
  const [incidentes, setIncidentes]     = useState([]);
  const [guardias, setGuardias]         = useState([]);
  const [atencionesDia, setAtencionesDia] = useState([]);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [loading, setLoading]           = useState(false);
  const [msg, setMsg]                   = useState('');
  const [error, setError]               = useState('');

  useEffect(() => { cargarDatos(); }, [user]);

  // ─── Carga de datos ─────────────────────────────────────────

  const cargarDatos = async () => {
    if (user?.rol === 'DES') {
      try {
        const [gRes, sRes] = await Promise.all([
          incidenteService.listarGuardias(),
          incidenteService.listarSeguimiento(),
        ]);
        setGuardias(gRes.data);
        setIncidentes(sRes.data);
      } catch {
        mostrarError('No se pudieron cargar los datos. Intentá de nuevo.');
      }
      return;
    }

    // ENF / JEF
    try {
      const [asigRes, diaRes] = await Promise.all([
        incidenteService.listarAsignados(),
        incidenteService.atencionesDel(),
      ]);
      setIncidentes(asigRes.data);
      setAtencionesDia(diaRes.data);
    } catch {
      mostrarError('No se pudieron cargar los incidentes.');
    }
  };

  const mostrarMsg   = (t) => { setMsg(t);   setTimeout(() => setMsg(''),   3500); };
  const mostrarError = (t) => { setError(t); setTimeout(() => setError(''), 4500); };

  // ─── Crear incidente (DES) ───────────────────────────────────

  const validarFormulario = () => {
    if (!form.guardiaId)         return 'Debe seleccionar a quién asignar el incidente';
    if (!form.ubicacion?.trim()) return 'La ubicación es obligatoria';
    if (!form.motivo?.trim())    return 'El motivo es obligatorio';
    if (!form.prioridad)         return 'La prioridad es obligatoria';
    return null;
  };

  const crearIncidente = async () => {
    setError('');
    const err = validarFormulario();
    if (err) { mostrarError(err); return; }

    setLoading(true);
    try {
      await incidenteService.crear({
        ...form,
        guardiaId: Number(form.guardiaId),
      });
      mostrarMsg('✅ Incidente creado y asignado correctamente');
      setForm(EMPTY_FORM);
      await cargarDatos();
    } catch (e) {
      mostrarError(e.response?.data?.message || 'Error al crear el incidente');
    } finally {
      setLoading(false);
    }
  };

  // ─── Cambiar estado (ENF) ────────────────────────────────────

  const cambiarEstado = async (id, estado) => {
    setLoading(true);
    try {
      await incidenteService.cambiarEstado(id, estado);
      mostrarMsg(`✅ Incidente ${ESTADO_LABELS[estado].toLowerCase()}`);
      await cargarDatos();
    } catch (e) {
      mostrarError(e.response?.data?.message || 'Error al actualizar el incidente');
    } finally {
      setLoading(false);
    }
  };

  // ─── Helpers para la tabla ENF ───────────────────────────────

  // Dado el estado actual del incidente, qué acciones puede hacer el enfermero
  const accionesDisponibles = (estado) => {
    if (estado === 'PENDIENTE')  return ['EN_PROCESO', 'RECHAZADO'];
    if (estado === 'EN_PROCESO') return ['FINALIZADO'];
    return [];
  };

  // ─── Render ──────────────────────────────────────────────────

  return (
    <div style={S.page}>
      <Sidebar />
      <main style={S.main}>

        <header style={S.header}>
          <div>
            <h1 style={S.h1}>
              {user?.rol === 'DES' ? 'Gestión de Incidentes' : 'Mis Incidentes'}
            </h1>
            <p style={S.sub}>
              {user?.rol === 'DES'
                ? 'Registrá y asigná incidentes a enfermeros que estén de guardia.'
                : 'Atenciones asignadas desde UGL. Aceptá, rechazá o finalizá cada una.'}
            </p>
          </div>
        </header>

        {msg   && <div style={S.msgBar}>{msg}</div>}
        {error && <div style={S.errorBar}>{error}</div>}

        {/* ══════════════════════════════════════════════════════
            VISTA DESPACHADOR (DES)
        ══════════════════════════════════════════════════════ */}
        {user?.rol === 'DES' && (
          <>
            {/* ── Formulario nuevo incidente ── */}
            <section style={S.card}>
              <h2 style={S.sectionTitle}>Nuevo incidente</h2>

              <div style={S.grid2}>

                {/* Asignar a (guardia activa) */}
                <Field label="Asignar a: *">
                  <select
                    style={S.input}
                    value={form.guardiaId}
                    onChange={e => setForm({ ...form, guardiaId: e.target.value })}
                  >
                    <option value="">Seleccioná una base operativa</option>
                    {guardias.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.movil?.baseOperativa} — {g.enfermero?.nombre} {g.enfermero?.apellido}
                      </option>
                    ))}
                  </select>
                </Field>

                {/* Prioridad */}
                <Field label="Prioridad *">
                  <select
                    style={S.input}
                    value={form.prioridad}
                    onChange={e => setForm({ ...form, prioridad: e.target.value })}
                  >
                    {PRIORIDADES.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </Field>

                {/* Ubicación */}
                <Field label="Ubicación *">
                  <input
                    style={S.input}
                    value={form.ubicacion}
                    onChange={e => setForm({ ...form, ubicacion: e.target.value })}
                    placeholder="Ej: Av. Córdoba 1234"
                  />
                </Field>

                {/* Motivo */}
                <Field label="Motivo *">
                  <input
                    style={S.input}
                    value={form.motivo}
                    onChange={e => setForm({ ...form, motivo: e.target.value })}
                    placeholder="Ej: Dolor torácico"
                  />
                </Field>

                {/* Nombre del paciente */}
                <Field label="Nombre del paciente">
                  <input
                    style={S.input}
                    value={form.pacienteNombre}
                    onChange={e => setForm({ ...form, pacienteNombre: e.target.value })}
                    placeholder="Ej: Juan Pérez"
                  />
                </Field>

                {/* DNI del paciente */}
                <Field label="DNI del paciente">
                  <input
                    style={S.input}
                    value={form.pacienteDni}
                    onChange={e => setForm({ ...form, pacienteDni: e.target.value })}
                    placeholder="Ej: 12345678"
                  />
                </Field>

              </div>

              {/* Detalles ubicación (no obligatorio) */}
              <Field label="Detalles ubicación">
                <textarea
                  style={{ ...S.input, minHeight: '80px', resize: 'vertical' }}
                  value={form.descripcion}
                  onChange={e => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Referencias, piso, detalles del lugar..."
                />
              </Field>

              <div style={{ marginTop: '20px' }}>
                <button style={S.btnPrimary} onClick={crearIncidente} disabled={loading}>
                  {loading ? 'Guardando...' : '🚨 Crear incidente'}
                </button>
              </div>
            </section>

            {/* ── Tabla de seguimiento ── */}
            <section style={S.card}>
              <h2 style={S.sectionTitle}>Seguimiento de incidentes</h2>
              <TableSeguimiento incidentes={incidentes} />
            </section>
          </>
        )}

        {/* ══════════════════════════════════════════════════════
            VISTA ENFERMERO (ENF / JEF)
        ══════════════════════════════════════════════════════ */}
        {(user?.rol === 'ENF' || user?.rol === 'JEF') && (
          <>
            {/* ── Incidentes activos (pendientes / en proceso) ── */}
            <section style={S.card}>
              <h2 style={S.sectionTitle}>Atenciones activas</h2>

              {incidentes.filter(i =>
                i.estado === 'PENDIENTE' || i.estado === 'EN_PROCESO'
              ).length === 0 ? (
                <p style={S.emptyText}>No tenés atenciones pendientes en este momento.</p>
              ) : (
                <div style={S.cardGrid}>
                  {incidentes
                    .filter(i => i.estado === 'PENDIENTE' || i.estado === 'EN_PROCESO')
                    .map(inc => (
                      <IncidenteCard
                        key={inc.id}
                        inc={inc}
                        acciones={accionesDisponibles(inc.estado)}
                        onAccion={cambiarEstado}
                        loading={loading}
                      />
                    ))}
                </div>
              )}
            </section>

            {/* ── Atenciones del día ── */}
            <section style={S.card}>
              <h2 style={S.sectionTitle}>
                Atenciones de hoy
                <span style={S.countBadge}>{atencionesDia.length}</span>
              </h2>

              {atencionesDia.length === 0 ? (
                <p style={S.emptyText}>No hay atenciones registradas hoy.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        {['#','Ubicación','Motivo','Paciente','Prioridad','Estado','Hora'].map(h => (
                          <th key={h} style={S.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {atencionesDia.map(inc => {
                        const ec  = ESTADO_COLORS[inc.estado]   || {};
                        const pc  = PRIORIDAD_COLORS[inc.prioridad] || {};
                        return (
                          <tr key={inc.id}>
                            <td style={S.td}>{inc.id}</td>
                            <td style={S.td}>{inc.ubicacion || '-'}</td>
                            <td style={S.td}>{inc.motivo    || '-'}</td>
                            <td style={S.td}>{inc.pacienteNombre || '-'}</td>
                            <td style={S.td}>
                              <span style={{ ...S.badge, ...pc }}>
                                {inc.prioridad || '-'}
                              </span>
                            </td>
                            <td style={S.td}>
                              <span style={{ ...S.badge, ...ec }}>
                                {ESTADO_LABELS[inc.estado] || inc.estado}
                              </span>
                            </td>
                            <td style={S.td}>
                              {new Date(inc.fechaAsignacion).toLocaleTimeString('es-AR', {
                                hour: '2-digit', minute: '2-digit'
                              })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

      </main>
    </div>
  );
}

// ─── Sub-componente: tarjeta de incidente activo (ENF) ────────────────────────

function IncidenteCard({ inc, acciones, onAccion, loading }) {
  const ec = ESTADO_COLORS[inc.estado]    || {};
  const pc = PRIORIDAD_COLORS[inc.prioridad] || {};

  return (
    <div style={SC.card}>
      {/* Header de la tarjeta */}
      <div style={SC.cardHeader}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ ...SC.badge, ...pc }}>{inc.prioridad}</span>
          <span style={{ ...SC.badge, ...ec }}>{ESTADO_LABELS[inc.estado]}</span>
        </div>
        <span style={SC.idTag}>#{inc.id}</span>
      </div>

      {/* Datos del incidente */}
      <div style={SC.cardBody}>
        <DataRow icon="📍" label="Ubicación"  value={inc.ubicacion      || '—'} />
        <DataRow icon="🔖" label="Motivo"     value={inc.motivo         || '—'} />
        <DataRow icon="👤" label="Paciente"   value={inc.pacienteNombre || '—'} />
        <DataRow icon="🚑" label="Móvil"
          value={inc.movil
            ? `${inc.movil.patente} (${inc.movil.numeroInterno})`
            : '—'} />
        {inc.descripcion && (
          <DataRow icon="📝" label="Detalles" value={inc.descripcion} />
        )}
      </div>

      {/* Acciones */}
      {acciones.length > 0 && (
        <div style={SC.cardActions}>
          {acciones.includes('EN_PROCESO') && (
            <button
              style={{ ...SC.btn, background: '#1565C0', color: '#fff' }}
              disabled={loading}
              onClick={() => onAccion(inc.id, 'EN_PROCESO')}
            >
              ✅ Aceptar
            </button>
          )}
          {acciones.includes('RECHAZADO') && (
            <button
              style={{ ...SC.btn, background: '#FFEBEE', color: '#C62828' }}
              disabled={loading}
              onClick={() => onAccion(inc.id, 'RECHAZADO')}
            >
              ❌ Rechazar
            </button>
          )}
          {acciones.includes('FINALIZADO') && (
            <button
              style={{ ...SC.btn, background: '#2E7D32', color: '#fff' }}
              disabled={loading}
              onClick={() => onAccion(inc.id, 'FINALIZADO')}
            >
              🏁 Finalizar
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function DataRow({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', gap: '8px', padding: '5px 0', fontSize: '13px' }}>
      <span>{icon}</span>
      <span style={{ color: '#666', minWidth: '70px' }}>{label}:</span>
      <span style={{ color: '#111', fontWeight: '500', flex: 1 }}>{value}</span>
    </div>
  );
}

// ─── Sub-componente: tabla de seguimiento (DES) ───────────────────────────────

function TableSeguimiento({ incidentes }) {
  if (incidentes.length === 0) {
    return <p style={S.emptyText}>No hay incidentes registrados todavía.</p>;
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={S.table}>
        <thead>
          <tr>
            {['#','Ubicación','Motivo','Asignado a','Móvil','Prioridad','Estado','Paciente','Asignación'].map(h => (
              <th key={h} style={S.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {incidentes.map(inc => {
            const ec = ESTADO_COLORS[inc.estado]       || {};
            const pc = PRIORIDAD_COLORS[inc.prioridad] || {};
            return (
              <tr key={inc.id}>
                <td style={S.td}>{inc.id}</td>
                <td style={S.td}>{inc.ubicacion || '-'}</td>
                <td style={S.td}>{inc.motivo    || '-'}</td>
                <td style={S.td}>
                  {inc.asignadoA
                    ? `${inc.asignadoA.nombre} ${inc.asignadoA.apellido}`
                    : '-'}
                </td>
                <td style={S.td}>
                  {inc.movil
                    ? `${inc.movil.patente} (${inc.movil.numeroInterno})`
                    : '-'}
                </td>
                <td style={S.td}>
                  <span style={{ ...S.badge, ...pc }}>{inc.prioridad || '-'}</span>
                </td>
                <td style={S.td}>
                  <span style={{ ...S.badge, ...ec }}>
                    {ESTADO_LABELS[inc.estado] || inc.estado}
                  </span>
                </td>
                <td style={S.td}>{inc.pacienteNombre || '-'}</td>
                <td style={S.td}>
                  {new Date(inc.fechaAsignacion).toLocaleString('es-AR')}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Sub-componente Field ─────────────────────────────────────────────────────

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '13px', fontWeight: '600', color: '#333' }}>{label}</label>
      {children}
    </div>
  );
}

// ─── Estilos principales ──────────────────────────────────────────────────────

const S = {
  page:       { display: 'flex', minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif" },
  main:       { flex: 1, background: '#F3F8F9', padding: '20px' },
  header:     { marginBottom: '16px' },
  h1:         { fontSize: '28px', margin: 0, color: '#0E3F3F', fontWeight: '700' },
  sub:        { color: '#5C6F72', marginTop: '6px', fontSize: '14px' },
  card:       { background: '#fff', borderRadius: '16px', padding: '20px', marginBottom: '18px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' },
  sectionTitle:{ fontSize: '16px', fontWeight: '700', marginBottom: '18px', color: '#0F3E3E', display: 'flex', alignItems: 'center', gap: '10px' },
  countBadge: { background: '#1B6B6B', color: '#fff', borderRadius: '20px', padding: '2px 10px', fontSize: '13px', fontWeight: '700' },
  grid2:      { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' },
  input:      { width: '100%', border: '1.5px solid #D6E4E3', borderRadius: '10px', padding: '11px 14px', fontSize: '14px', color: '#1F3838', outline: 'none', background: '#fff', boxSizing: 'border-box' },
  btnPrimary: { background: '#0F5C68', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px 24px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' },
  table:      { width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' },
  th:         { textAlign: 'left', padding: '11px 12px', borderBottom: '2px solid #E8EDF1', color: '#334456', fontSize: '13px', fontWeight: '700', whiteSpace: 'normal' },
  td:         { padding: '11px 12px', borderBottom: '1px solid #F3F6F8', color: '#3C4B58', fontSize: '13px', verticalAlign: 'top', whiteSpace: 'normal', wordBreak: 'break-word' },
  badge:      { display: 'inline-flex', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  emptyText:  { color: '#777', fontSize: '14px', textAlign: 'center', padding: '24px 0' },
  msgBar:     { background: '#ECF9F0', border: '1px solid #A8D7A8', color: '#235A35', borderRadius: '12px', padding: '11px 14px', marginBottom: '14px' },
  errorBar:   { background: '#FFF2F2', border: '1px solid #F0B3B3', color: '#9B2A2A', borderRadius: '12px', padding: '11px 14px', marginBottom: '14px' },
  cardGrid:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' },
};

// ─── Estilos tarjeta de incidente ─────────────────────────────────────────────

const SC = {
  card:       { background: '#F8FFFE', border: '1.5px solid #D6E4E3', borderRadius: '14px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardBody:   { display: 'flex', flexDirection: 'column', gap: '2px' },
  cardActions:{ display: 'flex', gap: '8px', flexWrap: 'wrap', paddingTop: '10px', borderTop: '1px solid #E0F2F1' },
  badge:      { display: 'inline-flex', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  idTag:      { background: '#E0F2F1', color: '#1B6B6B', padding: '3px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '700' },
  btn:        { border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
};