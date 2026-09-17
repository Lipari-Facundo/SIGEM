import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { incidenteService } from '../services/api';
import { useAuth } from '../context/AuthContext';

// ─── Constantes ───────────────────────────────────────────────────────────────

const ESTADO_LABELS = {
  PENDIENTE:  'Pendiente',
  PENDIENTE_REASIGNACION: 'Pendiente de reasignación',
  EN_PROCESO: 'En atención',
  RECHAZADO:  'Rechazado',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado',
};

const ESTADO_COLORS = {
  PENDIENTE:  { bg: '#FFF8E1', color: '#F57F17' },
  PENDIENTE_REASIGNACION: { bg: '#FFEBEE', color: '#B91F1F' },
  EN_PROCESO: { bg: '#E3F2FD', color: '#1565C0' },
  RECHAZADO:  { bg: '#FFEBEE', color: '#C62828' },
  FINALIZADO: { bg: '#E8F5E9', color: '#2E7D32' },
  CANCELADO: { bg: '#F3F4F6', color: '#4B5563' },
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
  const [pendientesReasignacion, setPendientesReasignacion] = useState([]);
  const [incidenteRechazo, setIncidenteRechazo] = useState(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [incidenteReasignar, setIncidenteReasignar] = useState(null);
  const [guardiaReasignacion, setGuardiaReasignacion] = useState('');
  const [incidenteCancelar, setIncidenteCancelar] = useState(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');

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
        const pendientesRes = await incidenteService.pendientesReasignacion();
        setPendientesReasignacion(pendientesRes.data);
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

  const marcarLlegada = async (id) => {
    setLoading(true);
    try {
      await incidenteService.marcarLlegada(id);
      mostrarMsg('Llegada al lugar registrada correctamente.');
      await cargarDatos();
    } catch (e) {
      mostrarError(e.response?.data?.message || 'No se pudo registrar la llegada al lugar.');
    } finally {
      setLoading(false);
    }
  };

  const abrirRechazo = (incidente) => {
    setIncidenteRechazo(incidente);
    setMotivoRechazo('');
  };

  const rechazarIncidente = async () => {
    const motivo = motivoRechazo.trim();
    if (motivo.length < 10) {
      mostrarError('El motivo de rechazo debe tener al menos 10 caracteres.');
      return;
    }
    setLoading(true);
    try {
      await incidenteService.rechazar(incidenteRechazo.id, motivo);
      mostrarMsg('Incidente rechazado y enviado a reasignación.');
      setIncidenteRechazo(null);
      await cargarDatos();
    } catch (e) {
      mostrarError(e.response?.data?.message || 'No se pudo rechazar el incidente.');
    } finally {
      setLoading(false);
    }
  };

  const abrirReasignacion = (incidente) => {
    setIncidenteReasignar(incidente);
    setGuardiaReasignacion('');
  };

  const reasignarIncidente = async () => {
    if (!guardiaReasignacion) {
      mostrarError('Debe seleccionar una guardia activa para reasignar el incidente.');
      return;
    }
    setLoading(true);
    try {
      await incidenteService.reasignar(incidenteReasignar.id, Number(guardiaReasignacion));
      mostrarMsg('Incidente reasignado correctamente.');
      setIncidenteReasignar(null);
      await cargarDatos();
    } catch (e) {
      mostrarError(e.response?.data?.message || 'No se pudo reasignar el incidente.');
    } finally {
      setLoading(false);
    }
  };

  const abrirCancelacion = (incidente) => {
    setIncidenteCancelar(incidente);
    setMotivoCancelacion('');
  };

  const cancelarIncidente = async () => {
    const motivo = motivoCancelacion.trim();
    if (!motivo) {
      mostrarError('El motivo de cancelación es obligatorio.');
      return;
    }
    setLoading(true);
    try {
      await incidenteService.cancelar(incidenteCancelar.id, motivo);
      mostrarMsg('Incidente cancelado correctamente.');
      setIncidenteCancelar(null);
      await cargarDatos();
    } catch (e) {
      mostrarError(e.response?.data?.message || 'No se pudo cancelar el incidente.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Helpers para la tabla ENF ───────────────────────────────

  // Dado el estado actual del incidente, qué acciones puede hacer el enfermero
  const accionesDisponibles = (estado) => {
    if (estado === 'PENDIENTE')  return ['EN_PROCESO', 'RECHAZAR'];
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
              {pendientesReasignacion.length > 0 && (
                <section style={S.urgentSection}>
                  <h3 style={S.urgentTitle}>🚨 Incidentes pendientes de reasignación</h3>
                  {pendientesReasignacion.map(incidente => (
                    <div key={incidente.id} style={S.urgentItem}>
                      <div>
                        <strong>Incidente #{incidente.id}: {incidente.motivo}</strong>
                        <div>📍 {incidente.ubicacion}</div>
                        <div><b>Motivo del rechazo:</b> {incidente.motivoUltimoRechazo || 'No informado'}</div>
                      </div>
                      <button style={S.btnUrgent} onClick={() => abrirReasignacion(incidente)}>
                        Reasignar ahora
                      </button>
                    </div>
                  ))}
                </section>
              )}
              <TableSeguimiento incidentes={incidentes} onReasignar={abrirReasignacion} onCancelar={abrirCancelacion} />
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
                        onLlegada={marcarLlegada}
                        onRechazar={abrirRechazo}
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
      {incidenteRechazo && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <h2 style={S.modalTitle}>🚨 Rechazar incidente #{incidenteRechazo.id}</h2>
            <p style={S.modalText}>El motivo es obligatorio y será enviado al despachador.</p>
            <textarea
              autoFocus
              value={motivoRechazo}
              onChange={e => setMotivoRechazo(e.target.value)}
              placeholder="Indicá por qué no podés atender este incidente..."
              style={{ ...S.input, minHeight: '120px', resize: 'vertical' }}
            />
            <div style={S.modalActions}>
              <button style={S.btnCancel} onClick={() => setIncidenteRechazo(null)}>Cancelar</button>
              <button style={S.btnDanger} disabled={loading || motivoRechazo.trim().length < 10} onClick={rechazarIncidente}>
                Confirmar rechazo
              </button>
            </div>
          </div>
        </div>
      )}

      {incidenteReasignar && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <h2 style={S.modalTitle}>🚑 Reasignar incidente #{incidenteReasignar.id}</h2>
            <p style={S.modalText}>Seleccioná la guardia activa que continuará la atención.</p>
            <select style={S.input} value={guardiaReasignacion} onChange={e => setGuardiaReasignacion(e.target.value)}>
              <option value="">Seleccioná una guardia activa</option>
              {guardias.map(guardia => (
                <option key={guardia.id} value={guardia.id}>
                  {guardia.movil?.baseOperativa} - {guardia.enfermero?.nombre} {guardia.enfermero?.apellido}
                </option>
              ))}
            </select>
            <div style={S.modalActions}>
              <button style={S.btnCancel} onClick={() => setIncidenteReasignar(null)}>Cancelar</button>
              <button style={S.btnPrimary} disabled={loading || !guardiaReasignacion} onClick={reasignarIncidente}>
                Confirmar reasignación
              </button>
            </div>
          </div>
        </div>
      )}

      {incidenteCancelar && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <h2 style={S.modalTitle}>Cancelar incidente #{incidenteCancelar.id}</h2>
            <p style={S.modalText}>El motivo de cancelación es obligatorio y será informado al enfermero asignado.</p>
            <textarea
              autoFocus
              value={motivoCancelacion}
              onChange={e => setMotivoCancelacion(e.target.value)}
              placeholder="Indicá el motivo de la cancelación..."
              style={{ ...S.input, minHeight: '120px', resize: 'vertical' }}
            />
            <div style={S.modalActions}>
              <button style={S.btnCancel} onClick={() => setIncidenteCancelar(null)}>Volver</button>
              <button style={S.btnDanger} disabled={loading || !motivoCancelacion.trim()} onClick={cancelarIncidente}>
                Confirmar cancelación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-componente: tarjeta de incidente activo (ENF) ────────────────────────

function IncidenteCard({ inc, acciones, onAccion, onLlegada, onRechazar, loading }) {
  const ec = ESTADO_COLORS[inc.estado]    || {};
  const pc = PRIORIDAD_COLORS[inc.prioridad] || {};

  return (
    <div style={SC.card}>
      {/* Header de la tarjeta */}
      <div style={SC.cardHeader}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ ...SC.badge, ...pc }}>{inc.prioridad}</span>
          <span style={{ ...SC.badge, ...ec }}>{ESTADO_LABELS[inc.estado]}</span>
          {inc.estado === 'EN_PROCESO' && !inc.fechaLlegadaLugar && (
            <span style={{ ...SC.badge, background: '#E3F2FD', color: '#1565C0' }}>
              🚗 En camino
            </span>
          )}
          {inc.estado === 'EN_PROCESO' && inc.fechaLlegadaLugar && (
            <span style={{ ...SC.badge, background: '#E8F5E9', color: '#2E7D32' }}>
              📍 En el lugar
            </span>
          )}
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
          {inc.estado === 'EN_PROCESO' && !inc.fechaLlegadaLugar && (
            <button
              style={{ ...SC.btn, background: '#E3F2FD', color: '#1565C0' }}
              disabled={loading}
              onClick={() => onLlegada(inc.id)}
            >
              📍 Marcar llegada al lugar
            </button>
          )}
          {acciones.includes('EN_PROCESO') && (
            <button
              style={{ ...SC.btn, background: '#1565C0', color: '#fff' }}
              disabled={loading}
              onClick={() => onAccion(inc.id, 'EN_PROCESO')}
            >
              ✅ Aceptar
            </button>
          )}
          {acciones.includes('RECHAZAR') && (
            <button
              style={{ ...SC.btn, background: '#FFEBEE', color: '#C62828' }}
              disabled={loading}
              onClick={() => onRechazar(inc)}
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

function TableSeguimiento({ incidentes, onReasignar, onCancelar }) {
  if (incidentes.length === 0) {
    return <p style={S.emptyText}>No hay incidentes registrados todavía.</p>;
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={S.table}>
        <thead>
          <tr>
            {['#','Ubicación','Motivo','Asignado a','Móvil','Prioridad','Estado','Paciente','Asignación','Acción'].map(h => (
              <th
                key={h}
                className={h === 'Ubicación' || h === 'Motivo' ? 'text-left px-4 py-3' : 'text-center px-4 py-3'}
                style={S.th}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {incidentes.map(inc => {
            const ec = ESTADO_COLORS[inc.estado]       || {};
            const pc = PRIORIDAD_COLORS[inc.prioridad] || {};
            return (
              <tr
                key={inc.id}
                className={inc.estado === 'CANCELADO' ? 'bg-red-50' : 'bg-white hover:bg-gray-50'}
              >
                <td className="text-center align-middle px-4 py-3" style={S.td}>{inc.id}</td>
                <td className="text-left align-middle px-4 py-3" style={S.td}>{inc.ubicacion || '-'}</td>
                <td className="text-left align-middle px-4 py-3" style={S.td}>{inc.motivo    || '-'}</td>
                <td className="text-center align-middle px-4 py-3" style={S.td}>
                  {inc.asignadoA
                    ? `${inc.asignadoA.nombre} ${inc.asignadoA.apellido}`
                    : '-'}
                </td>
                <td className="text-center align-middle px-4 py-3" style={S.td}>
                  {inc.movil
                    ? `${inc.movil.patente} (${inc.movil.numeroInterno})`
                    : '-'}
                </td>
                <td style={S.td}>
                  <span style={{ ...S.badge, ...pc }}>{inc.prioridad || '-'}</span>
                </td>
                <td className="text-center align-middle px-4 py-3" style={S.td}>
                  <span style={{ ...S.badge, ...ec }}>
                    {ESTADO_LABELS[inc.estado] || inc.estado}
                  </span>
                  {inc.estado === 'EN_PROCESO' && (
                    <span style={{
                      ...S.badge,
                      ...(inc.fechaLlegadaLugar
                        ? { background: '#E8F5E9', color: '#2E7D32' }
                        : { background: '#E3F2FD', color: '#1565C0' }),
                      marginTop: '5px',
                    }}>
                      {inc.fechaLlegadaLugar ? '📍 En el lugar' : '🚗 En camino'}
                    </span>
                  )}
                </td>
                <td className="text-center align-middle px-4 py-3" style={S.td}>{inc.pacienteNombre || '-'}</td>
                <td className="text-center align-middle px-4 py-3" style={S.td}>
                  {new Date(inc.fechaAsignacion).toLocaleString('es-AR')}
                </td>
                <td className="text-center align-middle px-4 py-3" style={{ ...S.td, textAlign: 'center' }}>
                  <div className="flex flex-col items-center justify-center gap-2">
                  {(inc.estado === 'PENDIENTE'
                    || inc.estado === 'PENDIENTE_REASIGNACION'
                    || inc.estado === 'EN_PROCESO') && (
                    <button
                      style={inc.estado === 'EN_PROCESO' && inc.fechaLlegadaLugar
                        ? S.btnSmallDisabled : S.btnSmall}
                      disabled={inc.estado === 'EN_PROCESO' && Boolean(inc.fechaLlegadaLugar)}
                      title={inc.estado === 'EN_PROCESO' && inc.fechaLlegadaLugar
                        ? 'El enfermero ya llegó al lugar' : 'Reasignar incidente'}
                      onClick={() => onReasignar(inc)}
                    >
                      Reasignar
                    </button>
                  )}
                  {(inc.estado === 'PENDIENTE'
                    || inc.estado === 'PENDIENTE_REASIGNACION'
                    || inc.estado === 'EN_PROCESO') && (
                    <button
                      style={{ ...S.btnSmall, ...S.btnSmallDanger }}
                      onClick={() => onCancelar(inc)}
                    >
                      Cancelar
                    </button>
                  )}
                  </div>
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
  btnSecondary: { borderRadius: '10px', padding: '12px 24px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' },
  table:      { width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' },
  th:         { textAlign: 'left', padding: '11px 12px', borderBottom: '2px solid #E8EDF1', color: '#334456', fontSize: '13px', fontWeight: '700', whiteSpace: 'normal' },
  td:         { padding: '11px 12px', borderBottom: '1px solid #F3F6F8', color: '#3C4B58', fontSize: '13px', verticalAlign: 'top', whiteSpace: 'normal', wordBreak: 'break-word' },
  badge:      { display: 'inline-flex', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  emptyText:  { color: '#777', fontSize: '14px', textAlign: 'center', padding: '24px 0' },
  msgBar:     { background: '#ECF9F0', border: '1px solid #A8D7A8', color: '#235A35', borderRadius: '12px', padding: '11px 14px', marginBottom: '14px' },
  errorBar:   { background: '#FFF2F2', border: '1px solid #F0B3B3', color: '#9B2A2A', borderRadius: '12px', padding: '11px 14px', marginBottom: '14px' },
  cardGrid:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' },
  urgentSection: { background: '#FFF5F5', border: '2px solid var(--color-danger)', borderRadius: '12px', padding: '14px', marginBottom: '18px' },
  urgentTitle: { color: 'var(--color-danger)', margin: '0 0 12px', fontSize: '16px' },
  urgentItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', padding: '12px', background: '#fff', borderRadius: '8px', marginTop: '8px', color: '#4a1c1c' },
  btnUrgent: { background: 'var(--color-danger)', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 14px', cursor: 'pointer', fontWeight: '700', whiteSpace: 'nowrap' },
  btnSmall: { background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '7px', padding: '8px 16px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' },
  btnSmallDanger: { background: '#B91C1C', color: '#fff' },
  btnSmallDisabled: { background: 'var(--color-surface-muted)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)', borderRadius: '7px', padding: '6px 9px', cursor: 'not-allowed', fontSize: '12px', fontWeight: '700' },
  overlay: { position: 'fixed', inset: 0, zIndex: 'var(--z-modal)', background: 'rgba(15, 42, 48, 0.5)', display: 'grid', placeItems: 'center', padding: '1rem' },
  modal: { width: 'min(32rem, 100%)', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: '1.4rem', boxShadow: 'var(--shadow-lg)' },
  modalTitle: { margin: 0, color: 'var(--color-text-primary)', fontSize: '1.15rem' },
  modalText: { color: 'var(--color-text-secondary)', fontSize: '0.9rem' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '1rem' },
  btnCancel: { background: 'var(--color-surface-muted)', color: 'var(--color-text-primary)', border: 'none', borderRadius: '8px', padding: '10px 15px', cursor: 'pointer', fontWeight: '700' },
  btnDanger: { background: 'var(--color-danger)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 15px', cursor: 'pointer', fontWeight: '700' },
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