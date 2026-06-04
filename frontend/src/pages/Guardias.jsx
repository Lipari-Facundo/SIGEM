import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { movilService, guardiaService } from '../services/api';

const TURNOS = [
  { value: '7-19', label: 'Turno 7:00 - 19:00' },
  { value: '8-20', label: 'Turno 8:00 - 20:00' },
  { value: '7-7', label: 'Turno 7:00 - 7:00' },
  { value: '8-8', label: 'Turno 8:00 - 8:00' },
];

const estadoLabel = {
  ACTIVA: 'Activa',
  FINALIZADA: 'Finalizada',
};

export default function Guardias() {
  const [moviles, setMoviles] = useState([]);
  const [guardias, setGuardias] = useState([]);
  const [movilId, setMovilId] = useState('');
  const [turno, setTurno] = useState(TURNOS[0].value);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [movilesRes, guardiasRes] = await Promise.all([
        movilService.listarOperativos(),
        guardiaService.listar(),
      ]);
      setMoviles(movilesRes.data);
      setGuardias(guardiasRes.data);
    } catch (e) {
      setError('No se pudieron cargar los datos. Volvé a intentarlo.');
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

  const iniciarGuardia = async () => {
    if (!movilId) {
      mostrarError('Seleccioná un móvil para iniciar la guardia.');
      return;
    }
    setLoading(true);
    try {
      await guardiaService.iniciar({ movilId: Number(movilId), turno });
      mostrarMsg('Guardia iniciada correctamente');
      setMovilId('');
      setTurno(TURNOS[0].value);
      await cargarDatos();
    } catch (e) {
      mostrarError(e.response?.data?.message || 'Error al iniciar la guardia');
    } finally {
      setLoading(false);
    }
  };

  const finalizarGuardia = async (id) => {
    setLoading(true);
    try {
      await guardiaService.finalizar(id);
      mostrarMsg('Guardia finalizada correctamente');
      await cargarDatos();
    } catch (e) {
      mostrarError(e.response?.data?.message || 'Error al finalizar la guardia');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <Sidebar />
      <main style={S.main}>
        <header style={S.header}>
          <div>
            <h1 style={S.h1}>Guardia</h1>
            <p style={S.sub}>Inicia y finaliza tu turno desde aquí.</p>
          </div>
        </header>

        {msg && <div style={S.msgBar}>{msg}</div>}
        {error && <div style={S.errorBar}>{error}</div>}

        <section style={S.card}>
          <h2 style={S.sectionTitle}>Iniciar guardia</h2>
          <div style={S.grid2}>
            <div style={S.field}>
              <label style={S.label}>Móvil operativo</label>
              <select style={S.input} value={movilId} onChange={(e) => setMovilId(e.target.value)}>
                <option value="">Seleccioná un móvil</option>
                {moviles.map((movil) => (
                  <option key={movil.id} value={movil.id}>
                    {movil.patente} - {movil.marca} {movil.modelo}
                  </option>
                ))}
              </select>
            </div>
            <div style={S.field}>
              <label style={S.label}>Turno</label>
              <select style={S.input} value={turno} onChange={(e) => setTurno(e.target.value)}>
                {TURNOS.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>
          </div>
          <button style={S.btnPrimary} onClick={iniciarGuardia} disabled={loading || moviles.length === 0}>
            {loading ? 'Procesando...' : 'Iniciar guardia'}
          </button>
        </section>

        <section style={S.card}>
          <h2 style={S.sectionTitle}>Guardias recientes</h2>
          <div style={S.tableWrapper}>
            <table style={S.table}>
              <thead>
                <tr>
                  {['#', 'Móvil', 'Turno', 'Inicio', 'Fin', 'Estado', 'Acción'].map((head) => (
                    <th key={head} style={S.th}>{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {guardias.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={S.empty}>No hay guardias registradas. Iniciá una guardia para comenzar.</td>
                  </tr>
                ) : (
                  guardias.map((guardia) => (
                    <tr key={guardia.id}>
                      <td style={S.td}>{guardia.id}</td>
                      <td style={S.td}>{guardia.movil?.patente} / {guardia.movil?.marca} {guardia.movil?.modelo}</td>
                      <td style={S.td}>{guardia.turno}</td>
                      <td style={S.td}>{new Date(guardia.fechaInicio).toLocaleString()}</td>
                      <td style={S.td}>{guardia.fechaFin ? new Date(guardia.fechaFin).toLocaleString() : '-'}</td>
                      <td style={S.td}>{estadoLabel[guardia.estado] || guardia.estado}</td>
                      <td style={S.td}>
                        {guardia.estado === 'ACTIVA' ? (
                          <button style={S.btnSecondary} onClick={() => finalizarGuardia(guardia.id)} disabled={loading}>
                            Finalizar
                          </button>
                        ) : (
                          <span style={S.badge}>Sin acción</span>
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
  page: { display: 'flex', minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif" },
  main: { flex: 1, background: '#F3F8F9', padding: '32px' },
  header: { marginBottom: '18px' },
  h1: { fontSize: '28px', margin: 0, color: '#0E3F3F' },
  sub: { color: '#5C6F72', marginTop: '8px', fontSize: '14px' },
  card: { background: '#FFFFFF', borderRadius: '16px', padding: '24px', marginBottom: '20px', boxShadow: '0 10px 32px rgba(0, 0, 0, 0.05)' },
  sectionTitle: { fontSize: '16px', fontWeight: '700', marginBottom: '18px', color: '#0F3E3E' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#3A4A4C' },
  input: { width: '100%', border: '1.5px solid #D6E4E3', borderRadius: '10px', padding: '12px 14px', fontSize: '14px', color: '#1F3838', outline: 'none' },
  btnPrimary: { background: '#0F5C68', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px 18px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' },
  btnSecondary: { background: '#F0F7F6', color: '#0F5C68', border: '1px solid #D6E4E3', borderRadius: '10px', padding: '10px 16px', cursor: 'pointer', fontSize: '13px' },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '780px' },
  th: { textAlign: 'left', padding: '12px 16px', borderBottom: '2px solid #EDEDED', color: '#354B4C', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.02em' },
  td: { padding: '14px 16px', borderBottom: '1px solid #F0F3F3', color: '#334449', fontSize: '14px', verticalAlign: 'top' },
  empty: { padding: '40px', color: '#7F8C8D', textAlign: 'center' },
  msgBar: { background: '#E0F7ED', border: '1px solid #A4D7B4', color: '#1E5C3A', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px' },
  errorBar: { background: '#FFE9E8', border: '1px solid #F2B2AE', color: '#A6362D', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px' },
  badge: { display: 'inline-flex', padding: '6px 10px', borderRadius: '999px', background: '#F0F7F6', color: '#0F5C68', fontSize: '12px', fontWeight: '700' },
};
