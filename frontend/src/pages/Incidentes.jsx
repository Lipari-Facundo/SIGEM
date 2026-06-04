import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { incidenteService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ESTADO_LABELS = {
  PENDIENTE: 'Pendiente',
  EN_PROCESO: 'En proceso',
  FINALIZADO: 'Finalizado',
};

const PRIORIDADES = [
  { value: 'BAJA', label: 'Baja' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'ALTA', label: 'Alta' },
];

const EMPTY_FORM = {
  guardiaId: '',
  titulo: '',
  descripcion: '',
  ubicacion: '',
  motivo: '',
  pacienteNombre: '',
  pacienteDni: '',
  prioridad: 'MEDIA',
};

export default function Incidentes() {
  const { user } = useAuth();
  const [incidentes, setIncidentes] = useState([]);
  const [guardias, setGuardias] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    cargarDatos();
  }, [user]);

  const cargarDatos = async () => {
    if (user?.rol === 'DES') {
      try {
        const guardiasRes = await incidenteService.listarGuardias();
        setGuardias(guardiasRes.data);
        const seguimientoRes = await incidenteService.listarSeguimiento();
        setIncidentes(seguimientoRes.data);
      } catch (e) {
        setError('No se pudieron cargar las guardias activas o el seguimiento. Volvé a intentarlo.');
      }
      return;
    }

    try {
      const resp = await incidenteService.listarAsignados();
      setIncidentes(resp.data);
    } catch (e) {
      setError('No se pudieron cargar los incidentes. Volvé a intentarlo.');
    }
  };

  const mostrarMsg = (texto) => {
    setMsg(texto);
    setTimeout(() => setMsg(''), 3500);
  };

  const mostrarError = (texto) => {
    setError(texto);
    setTimeout(() => setError(''), 4500);
  };

  const validarFormulario = () => {
    if (!form.guardiaId) return 'Debe seleccionar una guardia activa';
    if (!form.titulo?.trim()) return 'El título es obligatorio';
    if (!form.ubicacion?.trim()) return 'La ubicación es obligatoria';
    if (!form.motivo?.trim()) return 'El motivo es obligatorio';
    if (!form.pacienteNombre?.trim()) return 'El nombre del paciente es obligatorio';
    if (!form.pacienteDni?.trim()) return 'El DNI del paciente es obligatorio';
    if (!form.prioridad) return 'Debes seleccionar una prioridad';
    return null;
  };

  const crearIncidente = async () => {
    setError('');
    const validacion = validarFormulario();
    if (validacion) {
      mostrarError(validacion);
      return;
    }

    setLoading(true);

    try {
      await incidenteService.crear({
        ...form,
        guardiaId: form.guardiaId ? Number(form.guardiaId) : null,
      });
      mostrarMsg('Incidente creado y asignado correctamente');
      setForm(EMPTY_FORM);
      await cargarDatos();
    } catch (e) {
      mostrarError(
        e.response?.data?.message ||
        e.response?.statusText ||
        'Error al crear el incidente'
      );
    } finally {
      setLoading(false);
    }
  };

  const cambiarEstado = async (id, estado) => {
    setLoading(true);
    try {
      await incidenteService.cambiarEstado(id, estado);
      mostrarMsg('Estado del incidente actualizado');
      await cargarDatos();
    } catch (e) {
      mostrarError(e.response?.data?.message || 'Error al actualizar el incidente');
    } finally {
      setLoading(false);
    }
  };

  const accionSiguiente = (estado) => {
    if (estado === 'PENDIENTE') return 'EN_PROCESO';
    if (estado === 'EN_PROCESO') return 'FINALIZADO';
    return null;
  };

  return (
    <div style={S.page}>
      <Sidebar />
      <main style={S.main}>
        <header style={S.header}>
          <div>
            <h1 style={S.h1}>Incidentes asignados</h1>
            <p style={S.sub}>
              {user?.rol === 'DES'
                ? 'Cargá un nuevo incidente y asignalo a un enfermero que esté de guardia.'
                : 'Visualizá las atenciones asignadas desde UGL y cambiá su estado.'}
            </p>
          </div>
        </header>

        {msg && <div style={S.msgBar}>{msg}</div>}
        {error && <div style={S.errorBar}>{error}</div>}

        {user?.rol === 'DES' ? (
          <>
            <section style={S.card}>
              <h2 style={S.sectionTitle}>Nuevo incidente</h2>
            <div style={S.grid3}>
              <div style={S.field}>
                <label style={S.label}>Guardia activa</label>
                <select
                  style={S.input}
                  value={form.guardiaId}
                  onChange={(e) => setForm({ ...form, guardiaId: e.target.value })}
                >
                  <option value="">Seleccioná una guardia</option>
                  {guardias.map((guardia) => (
                    <option key={guardia.id} value={guardia.id}>
                      {guardia.enfermero?.nombre} {guardia.enfermero?.apellido} — {guardia.turno} — {guardia.movil?.patente}
                    </option>
                  ))}
                </select>
              </div>
              <div style={S.field}>
                <label style={S.label}>Prioridad</label>
                <select
                  style={S.input}
                  value={form.prioridad}
                  onChange={(e) => setForm({ ...form, prioridad: e.target.value })}
                >
                  {PRIORIDADES.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </div>
              <div style={S.field}>
                <label style={S.label}>Ubicación</label>
                <input
                  style={S.input}
                  value={form.ubicacion}
                  onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
                  placeholder="Ej: Av. Córdoba 123"
                />
              </div>
              <div style={S.field}>
                <label style={S.label}>Motivo</label>
                <input
                  style={S.input}
                  value={form.motivo}
                  onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                  placeholder="Ej: Dolor torácico"
                />
              </div>
              <div style={S.field}>
                <label style={S.label}>Nombre del paciente</label>
                <input
                  style={S.input}
                  value={form.pacienteNombre}
                  onChange={(e) => setForm({ ...form, pacienteNombre: e.target.value })}
                  placeholder="Ej: Juan Pérez"
                />
              </div>
              <div style={S.field}>
                <label style={S.label}>DNI del paciente</label>
                <input
                  style={S.input}
                  value={form.pacienteDni}
                  onChange={(e) => setForm({ ...form, pacienteDni: e.target.value })}
                  placeholder="Ej: 12345678"
                />
              </div>
              <div style={S.field}>
                <label style={S.label}>Título</label>
                <input
                  style={S.input}
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Breve descripción del incidente"
                />
              </div>
              <div style={S.field}>
                <label style={S.label}>Descripción</label>
                <textarea
                  style={{ ...S.input, minHeight: '100px', resize: 'vertical' }}
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Detalles adicionales..."
                />
              </div>
            </div>
            <button style={S.btnPrimary} onClick={crearIncidente} disabled={loading}>
              {loading ? 'Guardando...' : 'Crear incidente'}
            </button>
          </section>

          <section style={S.card}>
            <h2 style={S.sectionTitle}>Seguimiento de incidentes</h2>
            <div style={S.tableWrapper}>
              <table style={S.table}>
                <thead>
                  <tr>
                    {['#', 'Título', 'Guardia', 'Móvil', 'Prioridad', 'Estado', 'Asignación', 'Paciente'].map((head) => (
                      <th key={head} style={S.th}>{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {incidentes.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={S.empty}>No hay incidentes en seguimiento.</td>
                    </tr>
                  ) : (
                    incidentes.map((incidente) => (
                      <tr key={incidente.id}>
                        <td style={S.td}>{incidente.id}</td>
                        <td style={S.td}>{incidente.titulo}</td>
                        <td style={S.td}>{incidente.asignadoA ? `${incidente.asignadoA.nombre} ${incidente.asignadoA.apellido}` : '-'}</td>
                        <td style={S.td}>{incidente.movil ? `${incidente.movil.patente} (${incidente.movil.numeroInterno})` : '-'}</td>
                        <td style={S.td}>{incidente.prioridad || '-'}</td>
                        <td style={S.td}>{ESTADO_LABELS[incidente.estado] || incidente.estado}</td>
                        <td style={S.td}>{new Date(incidente.fechaAsignacion).toLocaleString()}</td>
                        <td style={S.td}>{incidente.pacienteNombre || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
          </>
        ) : (
          <section style={S.card}>
            <div style={S.tableWrapper}>
              <table style={S.table}>
                <thead>
                  <tr>
                    {['#', 'Título', 'Móvil', 'Estado', 'Asignación', 'Descripción', 'Acción'].map((head) => (
                      <th key={head} style={S.th}>{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {incidentes.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={S.empty}>No hay incidentes asignados en este momento.</td>
                    </tr>
                  ) : (
                    incidentes.map((incidente) => {
                      const siguiente = accionSiguiente(incidente.estado);
                      return (
                        <tr key={incidente.id}>
                          <td style={S.td}>{incidente.id}</td>
                          <td style={S.td}>{incidente.titulo}</td>
                          <td style={S.td}>{incidente.movil ? `${incidente.movil.patente} (${incidente.movil.numeroInterno})` : '-'}</td>
                          <td style={S.td}>{ESTADO_LABELS[incidente.estado] || incidente.estado}</td>
                          <td style={S.td}>{new Date(incidente.fechaAsignacion).toLocaleString()}</td>
                          <td style={S.td}>{incidente.descripcion || '-'}</td>
                          <td style={S.td}>
                            {siguiente ? (
                              <button style={S.btnPrimary} disabled={loading} onClick={() => cambiarEstado(incidente.id, siguiente)}>
                                {siguiente === 'EN_PROCESO' ? 'Tomar episodio' : 'Finalizar'}
                              </button>
                            ) : (
                              <span style={S.badge}>Sin cambios</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

const S = {
  page: { display: 'flex', minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif" },
  main: { flex: 1, background: '#F7F8FB', padding: '32px' },
  header: { marginBottom: '18px' },
  h1: { fontSize: '28px', margin: 0, color: '#1F3543' },
  sub: { color: '#5E6F7A', marginTop: '8px', fontSize: '14px' },
  card: { background: '#FFFFFF', borderRadius: '16px', padding: '24px', boxShadow: '0 10px 28px rgba(0, 0, 0, 0.06)', marginBottom: '20px' },
  sectionTitle: { fontSize: '16px', fontWeight: '700', marginBottom: '18px', color: '#0F3E3E' },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '18px' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#3A4A4C' },
  input: { width: '100%', border: '1.5px solid #D6E4E3', borderRadius: '10px', padding: '12px 14px', fontSize: '14px', color: '#1F3838', outline: 'none', background: '#fff' },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '860px' },
  th: { textAlign: 'left', padding: '12px 16px', borderBottom: '2px solid #E8EDF1', color: '#334456', fontSize: '13px', fontWeight: '700', letterSpacing: '0.01em' },
  td: { padding: '14px 16px', borderBottom: '1px solid #F3F6F8', color: '#3C4B58', fontSize: '14px', verticalAlign: 'top' },
  empty: { padding: '40px', color: '#77838D', textAlign: 'center' },
  msgBar: { background: '#ECF9F0', border: '1px solid #A8D7A8', color: '#235A35', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px' },
  errorBar: { background: '#FFF2F2', border: '1px solid #F0B3B3', color: '#9B2A2A', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px' },
  btnPrimary: { background: '#0F5C68', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '12px 18px', cursor: 'pointer', fontSize: '14px', fontWeight: '700' },
  badge: { display: 'inline-flex', padding: '6px 10px', borderRadius: '999px', background: '#F1F5F6', color: '#4A646F', fontSize: '12px', fontWeight: '700' },
};
