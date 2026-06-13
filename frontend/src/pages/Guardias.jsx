import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { movilService, guardiaService } from '../services/api';

const TURNOS = [
  { value: '7-19', label: 'Turno 7:00 - 19:00' },
  { value: '8-20', label: 'Turno 8:00 - 20:00' },
  { value: '7-7',  label: 'Turno 7:00 - 7:00 (guardia completa)' },
  { value: '8-8',  label: 'Turno 8:00 - 8:00 (guardia completa)' },
];

const estadoLabel = { ACTIVA: 'Activa', FINALIZADA: 'Finalizada' };

export default function Guardias() {
  const [moviles, setMoviles]   = useState([]);
  const [guardias, setGuardias] = useState([]);
  const [movilId, setMovilId]   = useState('');
  const [turno, setTurno]       = useState(TURNOS[0].value);
  const [loading, setLoading]   = useState(false);
  const [msg, setMsg]           = useState('');
  const [error, setError]       = useState('');

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    try {
      const [movilesRes, guardiasRes] = await Promise.all([
        movilService.listarOperativos(),
        guardiaService.listar(),
      ]);
      setMoviles(movilesRes.data);
      setGuardias(guardiasRes.data);
    } catch {
      setError('No se pudieron cargar los datos. Volvé a intentarlo.');
    }
  };

  const mostrarMsg   = (t) => { setMsg(t);   setTimeout(() => setMsg(''),   3500); };
  const mostrarError = (t) => { setError(t); setTimeout(() => setError(''), 4500); };

  const iniciarGuardia = async () => {
    if (!movilId) { mostrarError('Seleccioná una base operativa para iniciar la guardia.'); return; }
    setLoading(true);
    try {
      await guardiaService.iniciar({ movilId: Number(movilId), turno });
      mostrarMsg('✅ Guardia iniciada correctamente');
      setMovilId('');
      setTurno(TURNOS[0].value);
      await cargarDatos();
    } catch (e) {
      mostrarError(e.response?.data?.message || 'Error al iniciar la guardia');
    } finally { setLoading(false); }
  };

  const finalizarGuardia = async (id) => {
    setLoading(true);
    try {
      await guardiaService.finalizar(id);
      mostrarMsg('✅ Guardia finalizada correctamente');
      await cargarDatos();
    } catch (e) {
      mostrarError(e.response?.data?.message || 'Error al finalizar la guardia');
    } finally { setLoading(false); }
  };

  return (
    <div style={S.page}>
      <Sidebar />
      <main style={S.main}>

        <header style={S.header}>
          <h1 style={S.h1}>Guardia</h1>
          <p style={S.sub}>Iniciá y finalizá tu turno desde aquí.</p>
        </header>

        {msg   && <div style={S.msgBar}>{msg}</div>}
        {error && <div style={S.errorBar}>{error}</div>}

        {/* ── Iniciar guardia ── */}
        <section style={S.card}>
          <h2 style={S.sectionTitle}>Iniciar guardia</h2>
          <div style={S.grid2}>

            <div style={S.field}>
              <label style={S.label}>Base operativa</label>
              <select
                style={S.input}
                value={movilId}
                onChange={e => setMovilId(e.target.value)}
              >
                <option value="">Seleccioná una base operativa</option>
                {moviles.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.baseOperativa} — {m.marca} {m.modelo}
                  </option>
                ))}
              </select>
              {moviles.length === 0 && (
                <p style={S.hint}>No hay móviles operativos disponibles en este momento.</p>
              )}
            </div>

            <div style={S.field}>
              <label style={S.label}>Turno</label>
              <select
                style={S.input}
                value={turno}
                onChange={e => setTurno(e.target.value)}
              >
                {TURNOS.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

          </div>
          <button
            style={S.btnPrimary}
            onClick={iniciarGuardia}
            disabled={loading || moviles.length === 0}
          >
            {loading ? 'Procesando...' : '🩺 Iniciar guardia'}
          </button>
        </section>

        {/* ── Guardias recientes ── */}
        <section style={S.card}>
          <h2 style={S.sectionTitle}>Guardias recientes</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={S.table}>
              <thead>
                <tr>
                  {['#','Base operativa','Móvil','Turno','Inicio','Fin','Estado','Acción'].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {guardias.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={S.empty}>
                      No hay guardias registradas. Iniciá una guardia para comenzar.
                    </td>
                  </tr>
                ) : (
                  guardias.map(g => (
                    <tr key={g.id}>
                      <td style={S.td}>{g.id}</td>
                      <td style={{ ...S.td, fontWeight: '600' }}>
                        {g.movil?.baseOperativa || '—'}
                      </td>
                      <td style={S.td}>
                        {g.movil ? `${g.movil.patente} / ${g.movil.marca} ${g.movil.modelo}` : '—'}
                      </td>
                      <td style={S.td}>{g.turno}</td>
                      <td style={S.td}>
                        {new Date(g.fechaInicio).toLocaleString('es-AR')}
                      </td>
                      <td style={S.td}>
                        {g.fechaFin ? new Date(g.fechaFin).toLocaleString('es-AR') : '—'}
                      </td>
                      <td style={S.td}>
                        <span style={{
                          ...S.badge,
                          background: g.estado === 'ACTIVA' ? '#E8F5E9' : '#F5F5F5',
                          color:      g.estado === 'ACTIVA' ? '#2E7D32' : '#666',
                        }}>
                          {estadoLabel[g.estado] || g.estado}
                        </span>
                      </td>
                      <td style={S.td}>
                        {g.estado === 'ACTIVA' ? (
                          <button
                            style={S.btnSecondary}
                            onClick={() => finalizarGuardia(g.id)}
                            disabled={loading}
                          >
                            Finalizar
                          </button>
                        ) : (
                          <span style={{ color: '#aaa', fontSize: '12px' }}>Sin acción</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

      </main>
    </div>
  );
}

const S = {
  page:        { display: 'flex', minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif" },
  main:        { flex: 1, background: '#F3F8F9', padding: '32px' },
  header:      { marginBottom: '20px' },
  h1:          { fontSize: '28px', margin: 0, color: '#0E3F3F', fontWeight: '700' },
  sub:         { color: '#5C6F72', marginTop: '6px', fontSize: '14px' },
  card:        { background: '#fff', borderRadius: '16px', padding: '24px', marginBottom: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' },
  sectionTitle:{ fontSize: '16px', fontWeight: '700', marginBottom: '18px', color: '#0F3E3E' },
  grid2:       { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' },
  field:       { display: 'flex', flexDirection: 'column', gap: '6px' },
  label:       { fontSize: '13px', fontWeight: '600', color: '#3A4A4C' },
  hint:        { fontSize: '12px', color: '#C62828', margin: '4px 0 0' },
  input:       { width: '100%', border: '1.5px solid #D6E4E3', borderRadius: '10px', padding: '11px 14px', fontSize: '14px', color: '#1F3838', outline: 'none', background: '#fff', boxSizing: 'border-box' },
  btnPrimary:  { background: '#0F5C68', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px 24px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' },
  btnSecondary:{ background: '#F0F7F6', color: '#0F5C68', border: '1px solid #D6E4E3', borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', fontSize: '13px' },
  table:       { width: '100%', borderCollapse: 'collapse', minWidth: '780px' },
  th:          { textAlign: 'left', padding: '12px 14px', borderBottom: '2px solid #EDEDED', color: '#354B4C', fontSize: '13px', fontWeight: '700' },
  td:          { padding: '13px 14px', borderBottom: '1px solid #F0F3F3', color: '#334449', fontSize: '13px', verticalAlign: 'middle' },
  empty:       { padding: '40px', color: '#7F8C8D', textAlign: 'center' },
  badge:       { display: 'inline-flex', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  msgBar:      { background: '#E0F7ED', border: '1px solid #A4D7B4', color: '#1E5C3A', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px' },
  errorBar:    { background: '#FFE9E8', border: '1px solid #F2B2AE', color: '#A6362D', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px' },
};