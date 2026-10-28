import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Button from '../components/ui/Button';
import { equipoMedicoService, movilService } from '../services/api';
import './RegistroAsignacionEquipos.css';

export function ModalNuevaAsignacion({ open, onClose, onAssigned }) {
  const [equipos, setEquipos] = useState([]);
  const [moviles, setMoviles] = useState([]);
  const [equipoId, setEquipoId] = useState('');
  const [movilId, setMovilId] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    Promise.all([equipoMedicoService.disponibles(), movilService.listarOperativos()])
      .then(([equiposResponse, movilesResponse]) => {
        setEquipos(equiposResponse.data || []);
        setMoviles(movilesResponse.data || []);
        setError('');
      })
      .catch(exception => setError(exception.response?.data?.message || 'No se pudieron cargar los datos.'));
  }, [open]);

  if (!open) return null;

  const asignar = async (event) => {
    event.preventDefault();
    if (!equipoId || !movilId) {
      setError('Seleccioná un equipo disponible y un móvil.');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      await equipoMedicoService.asignar({ equipoId: Number(equipoId), movilId: Number(movilId) });
      setEquipoId('');
      setMovilId('');
      onAssigned('Equipo asignado correctamente.');
      onClose();
    } catch (exception) {
      setError(exception.response?.data?.message || 'No se pudo registrar la asignación.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div style={S.modalOverlay} onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="nueva-asignacion-titulo" style={S.modal}>
        <div style={S.modalHeader}>
          <h2 id="nueva-asignacion-titulo" style={{ margin: 0 }}>Registrar asignación</h2>
          <button type="button" onClick={onClose} style={S.closeButton} aria-label="Cerrar">×</button>
        </div>
        {error && <div className="assignment-error-bar" role="alert">{error}</div>}
        <form style={S.form} onSubmit={asignar}>
          <label style={S.field}>Equipo médico disponible
            <select style={S.input} value={equipoId} onChange={event => setEquipoId(event.target.value)}>
              <option value="">Seleccionar equipo</option>
              {equipos.map(equipo => <option key={equipo.id} value={equipo.id}>{equipo.nombre} · Serie: {equipo.numeroSerie}</option>)}
            </select>
          </label>
          <label style={S.field}>Móvil destino
            <select style={S.input} value={movilId} onChange={event => setMovilId(event.target.value)}>
              <option value="">Seleccionar móvil</option>
              {moviles.map(movil => <option key={movil.id} value={movil.id}>{movil.numeroInterno} · {movil.marca} {movil.modelo}</option>)}
            </select>
          </label>
          <div style={S.modalActions}>
            <Button type="button" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={guardando || equipos.length === 0 || moviles.length === 0}>{guardando ? 'Asignando...' : 'Registrar asignación'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RegistroAsignacionEquipos() {
  const [asignados, setAsignados] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [desasignando, setDesasignando] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const cargarAsignados = async () => {
    try {
      const response = await equipoMedicoService.asignados();
      setAsignados(response.data || []);
      setError('');
    } catch (exception) {
      setError(exception.response?.data?.message || 'No se pudieron cargar los equipos asignados.');
    }
  };

  useEffect(() => { cargarAsignados(); }, []);

  useEffect(() => {
    if (!mensaje) return undefined;
    const timeoutId = window.setTimeout(() => setMensaje(''), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [mensaje]);

  const desasignar = async (asignacion) => {
    if (!window.confirm(`¿Desasignar el equipo ${asignacion.equipoNombre}?`)) return;
    setDesasignando(asignacion.equipoId);
    setError('');
    try {
      await equipoMedicoService.desasignar(asignacion.equipoId);
      setAsignados(items => items.filter(item => item.equipoId !== asignacion.equipoId));
      setMensaje(`Equipo ${asignacion.equipoNombre} desasignado correctamente.`);
    } catch (exception) {
      setError(exception.response?.data?.message || 'No se pudo desasignar el equipo.');
    } finally {
      setDesasignando(null);
    }
  };

  const asignacionCreada = async (texto) => {
    setMensaje(texto);
    await cargarAsignados();
  };

  return (
    <div style={S.page}>
      <Sidebar />
      <main style={S.main}>
        <header style={S.header}>
          <div><p style={S.overline}>Gestión operativa</p><h1 style={S.title}>Asignación de equipos médicos</h1></div>
          <Button className="assignment-primary-action" type="button" onClick={() => { setMensaje(''); setModalAbierto(true); }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            Nueva asignación
          </Button>
        </header>
        {mensaje && (
          <div className="assignment-msg-bar" role="status" aria-live="polite">
            <span aria-hidden="true">✅</span>
            <span>{mensaje}</span>
          </div>
        )}
        {error && <div className="assignment-error-bar" role="alert">{error}</div>}
        <h2 className="assignment-section-title" style={S.sectionTitle}>Equipos asignados</h2>
        <section className="assignment-card" style={S.card}>
          {asignados.length === 0 ? <p style={S.empty}>No hay equipos médicos asignados actualmente.</p> : (
            <div style={S.tableWrap} className="assignment-table-wrap"><table className="assignment-table">
              <thead><tr><th>Equipo</th><th>Número de serie</th><th>Móvil</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>{asignados.map(asignacion => <tr key={asignacion.asignacionId}>
                <td><strong>{asignacion.equipoNombre}</strong></td>
                <td>{asignacion.equipoNumeroSerie}</td>
                <td><span className="assignment-movil">{asignacion.movilNumeroInterno}</span></td>
                <td><span className="assignment-status-badge"><span className="assignment-status-dot" />{asignacion.estadoEquipo?.replace('_', ' ')}</span></td>
                <td><button type="button" className="assignment-unassign-button" disabled={desasignando === asignacion.equipoId} onClick={() => desasignar(asignacion)}>
                  {desasignando === asignacion.equipoId ? 'Desasignando...' : 'Desasignar'}
                </button></td>
              </tr>)}</tbody>
            </table></div>
          )}
        </section>
      </main>
      <ModalNuevaAsignacion open={modalAbierto} onClose={() => setModalAbierto(false)} onAssigned={asignacionCreada} />
    </div>
  );
}

const S = {
  page: { display: 'flex', minHeight: '100vh', background: 'var(--color-page-bg)', color: 'var(--color-text-primary)' },
  main: { display: 'flex', flex: 1, flexDirection: 'column', gap: 'var(--spacing-5)', padding: 'var(--spacing-5)', minWidth: 0 },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--spacing-4)', padding: 'var(--spacing-5)', color: 'var(--color-on-primary)', background: 'var(--color-primary)', borderRadius: 'var(--radius-lg)' },
  overline: { margin: '0 0 var(--spacing-1)', fontSize: 'var(--font-size-xs)', fontWeight: 700, textTransform: 'uppercase' },
  title: { margin: 0 },
  card: { padding: 'var(--spacing-5)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' },
  sectionTitle: { marginTop: 0 },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  status: { display: 'inline-block', padding: '0.25rem 0.55rem', borderRadius: '999px', fontWeight: 700, color: 'var(--color-warning-strong)', background: 'var(--color-warning-soft)' },
  dangerButton: { padding: '0.5rem 0.75rem', cursor: 'pointer', color: 'var(--color-danger-strong)', background: 'var(--color-danger-soft)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-sm)' },
  empty: { marginBottom: 0, color: 'var(--color-text-secondary)' },
  modalOverlay: { position: 'fixed', inset: 0, zIndex: 1000, display: 'grid', placeItems: 'center', padding: 'var(--spacing-5)', background: 'rgba(0, 0, 0, 0.48)' },
  modal: { width: 'min(520px, 100%)', padding: 'var(--spacing-5)', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' },
  modalHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-4)' },
  closeButton: { width: '36px', height: '36px', cursor: 'pointer', border: 'none', borderRadius: '50%', fontSize: '1.5rem', color: 'var(--color-text-primary)', background: 'transparent' },
  form: { display: 'grid', gap: 'var(--spacing-4)' },
  field: { display: 'grid', gap: 'var(--spacing-2)', fontWeight: 700 },
  input: { minHeight: '44px', width: '100%', boxSizing: 'border-box', padding: '0.65rem 0.75rem', color: 'var(--color-text-primary)', background: 'var(--color-surface)', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-sm)' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-2)' },
  success: { padding: 'var(--spacing-3)', color: 'var(--color-success-strong)', background: 'var(--color-success-soft)', borderRadius: 'var(--radius-sm)' },
  error: { padding: 'var(--spacing-3)', color: 'var(--color-danger-strong)', background: 'var(--color-danger-soft)', borderRadius: 'var(--radius-sm)' },
};
