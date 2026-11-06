import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Button from '../components/ui/Button';
import { equipoMedicoService, movilService } from '../services/api';
import './RegistroAsignacionEquipos.css';

const ESTADO_STOCK_COLORS = {
  FUNCIONANDO: 'stock-status-functioning',
  ASIGNADO: 'stock-status-assigned',
  AVERIADO: 'stock-status-broken',
  'EN MANTENIMIENTO': 'stock-status-maintenance',
};

function normalizarEstadoEquipo(estado) {
  const estados = {
    DISPONIBLE: 'FUNCIONANDO',
    EN_USO: 'ASIGNADO',
    FUERA_DE_SERVICIO: 'AVERIADO',
    MANTENIMIENTO: 'EN MANTENIMIENTO',
  };

  return ESTADO_STOCK_COLORS[estado] ? estado : (estados[estado] || 'FUNCIONANDO');
}

function StockStatusBadge({ estado }) {
  const estadoNormalizado = normalizarEstadoEquipo(estado);

  return (
    <span className={`stock-status-badge ${ESTADO_STOCK_COLORS[estadoNormalizado]}`}>
      <span className="stock-status-dot" />
      {estadoNormalizado}
    </span>
  );
}

export function ModalEditarAsignacion({ open, asignacion, onClose, onUpdated }) {
  const [equipos, setEquipos] = useState([]);
  const [moviles, setMoviles] = useState([]);
  const [equipoId, setEquipoId] = useState('');
  const [movilId, setMovilId] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !asignacion) return;
    setEquipoId(String(asignacion.equipoId));
    setMovilId(String(asignacion.movilId));
    Promise.all([equipoMedicoService.disponibles(), movilService.listarOperativos()])
      .then(([equiposResponse, movilesResponse]) => {
        setEquipos(equiposResponse.data || []);
        setMoviles(movilesResponse.data || []);
        setError('');
      })
      .catch(exception => setError(exception.response?.data?.message || 'No se pudieron cargar los datos.'));
  }, [open, asignacion]);

  if (!open) return null;

  const guardar = async (event) => {
    event.preventDefault();
    if (!equipoId || !movilId) {
      setError('Seleccioná un equipo médico y un móvil.');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      await equipoMedicoService.modificarAsignacion(asignacion.asignacionId, {
        equipoId: Number(equipoId),
        movilId: Number(movilId),
      });
      onUpdated('Asignación modificada correctamente.');
      onClose();
    } catch (exception) {
      setError(exception.response?.data?.message || 'No se pudo modificar la asignación.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div style={S.modalOverlay} onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="editar-asignacion-titulo" style={S.modal}>
        <div style={S.modalHeader}>
          <h2 id="editar-asignacion-titulo" style={{ margin: 0 }}>Editar asignación</h2>
          <button type="button" onClick={onClose} style={S.closeButton} aria-label="Cerrar">×</button>
        </div>
        {error && <div className="assignment-error-bar" role="alert">{error}</div>}
        <form style={S.form} onSubmit={guardar}>
          <label style={S.field}>Equipo médico
            <select style={S.input} value={equipoId} onChange={event => setEquipoId(event.target.value)}>
              <option value={asignacion.equipoId}>
                {asignacion.equipoNombre} - Serie: {asignacion.equipoNumeroSerie}
              </option>
              {equipos
                .filter(equipo => equipo.id !== asignacion.equipoId && equipo.nombre !== asignacion.equipoNombre)
                .map(equipo => (
                  <option key={equipo.id} value={equipo.id}>
                    {equipo.nombre} - Serie: {equipo.numeroSerie || `INS-${equipo.id}`}
                  </option>
                ))}
            </select>
          </label>
          <label style={S.field}>Móvil destino
            <select style={S.input} value={movilId} onChange={event => setMovilId(event.target.value)}>
              {moviles.map(movil => (
                <option key={movil.id} value={movil.id}>{movil.numeroInterno} · {movil.marca} {movil.modelo}</option>
              ))}
            </select>
          </label>
          <div style={S.modalActions}>
            <Button type="button" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar cambios'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ModalEditarEstado({ open, item, onClose, onUpdated }) {
  const [estado, setEstado] = useState('FUNCIONANDO');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && item) setEstado(item.estado || 'FUNCIONANDO');
  }, [open, item]);

  if (!open || !item) return null;

  const guardar = async (event) => {
    event.preventDefault();
    const asignado = Boolean(item.asignado);

    if (asignado && (estado === 'FUNCIONANDO' || estado === 'EN MANTENIMIENTO')) {
      setError('Un equipo asignado no puede cambiarse a FUNCIONANDO ni EN MANTENIMIENTO.');
      return;
    }

    if ((estado === 'AVERIADO' || estado === 'ASIGNADO')
      && !window.confirm(`¿Está seguro de que desea cambiar el estado a ${estado === 'AVERIADO' ? 'Averiado' : 'Asignado'}?`)) {
      return;
    }

    const idCrudo = item.equipoId ?? item.insumoId;
    const idNumerico = typeof idCrudo === 'number'
      ? idCrudo
      : (typeof idCrudo === 'string' && /^\d+$/.test(idCrudo.trim())
        ? Number(idCrudo.trim())
        : NaN);

    if (!Number.isInteger(idNumerico) || idNumerico <= 0) {
      setError('No se pudo identificar el equipo seleccionado.');
      return;
    }

    setGuardando(true);
    setError('');
    try {
      await equipoMedicoService.modificarEstado(idNumerico, estado);
      onUpdated(item, estado);
      onClose();
    } catch (exception) {
      setError(exception.response?.data?.message || 'No se pudo modificar el estado.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div style={S.modalOverlay} onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="editar-estado-titulo" style={{ ...S.modal, width: 'min(420px, 100%)' }}>
        <div style={S.modalHeader}>
          <h2 id="editar-estado-titulo" style={{ margin: 0 }}>Editar estado</h2>
          <button type="button" onClick={onClose} style={S.closeButton} aria-label="Cerrar">×</button>
        </div>
        {error && <div className="assignment-error-bar" role="alert">{error}</div>}
        <form style={S.form} onSubmit={guardar}>
          <label style={S.field}>Estado
            <select style={S.input} value={estado} onChange={event => setEstado(event.target.value)}>
              <option value="FUNCIONANDO" disabled={Boolean(item.asignado)}>FUNCIONANDO</option>
              <option value="ASIGNADO">ASIGNADO</option>
              <option value="AVERIADO">AVERIADO</option>
              <option value="EN MANTENIMIENTO" disabled={Boolean(item.asignado)}>EN MANTENIMIENTO</option>
            </select>
          </label>
          <div style={S.modalActions}>
            <Button type="button" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar estado'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

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
              {equipos.map(equipo => (
                <option key={equipo.id} value={equipo.id}>
                  {equipo.nombre} - Serie: {equipo.numeroSerie || `INS-${equipo.id}`}
                </option>
              ))}
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
  const [equiposStock, setEquiposStock] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [asignacionEditando, setAsignacionEditando] = useState(null);
  const [itemEstadoEditando, setItemEstadoEditando] = useState(null);
  const [estadosStock, setEstadosStock] = useState({});
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
    equipoMedicoService.disponibles()
      .then(response => {
        const stockEquipos = response.data || [];
        setEquiposStock(stockEquipos);
      })
      .catch(exception => {
        setError(exception.response?.data?.message || 'No se pudo cargar el stock de equipos médicos.');
      });
  }, []);

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

  const asignacionActualizada = async texto => {
    setMensaje(texto);
    await Promise.all([cargarAsignados(), equipoMedicoService.disponibles()]);
  };

  const estadoActualizado = (item, estado) => {
    setEstadosStock(estadosPrevios => ({
      ...estadosPrevios,
      [item.insumoId || item.id.replace('stock-', '')]: estado,
    }));

    if (item.asignado || estado === 'ASIGNADO' || estado === 'AVERIADO') {
      const estadoEquipo = estado === 'AVERIADO'
        ? 'FUERA_DE_SERVICIO'
        : estado === 'EN MANTENIMIENTO'
          ? 'MANTENIMIENTO'
          : estado === 'FUNCIONANDO'
            ? 'DISPONIBLE'
            : 'EN_USO';

      setAsignados(asignacionesActuales =>
        asignacionesActuales.map(asignacion =>
          asignacion.equipoId === item.equipoId
            ? { ...asignacion, estadoEquipo }
            : asignacion
        )
      );
    }

    setMensaje(`Estado actualizado a ${estado}.`);
  };

  const equiposStockCombinados = (() => {
    const porNombre = new Map();

    equiposStock.forEach(item => {
      porNombre.set(item.nombre.trim().toLocaleLowerCase('es'), {
        id: `stock-${item.id}`,
        insumoId: item.id,
        nombre: item.nombre,
        numeroSerie: item.numeroSerie || `INS-${item.id}`,
        cantidad: 1,
        estado: estadosStock[item.id] || 'FUNCIONANDO',
      });
    });

    asignados.forEach(asignacion => {
      const clave = asignacion.equipoNombre.trim().toLocaleLowerCase('es');
      const estadoAsignado = asignacion.estadoEquipo === 'FUERA_DE_SERVICIO'
        ? 'AVERIADO'
        : asignacion.estadoEquipo === 'MANTENIMIENTO'
          ? 'EN MANTENIMIENTO'
          : asignacion.estadoEquipo === 'DISPONIBLE'
            ? 'FUNCIONANDO'
            : 'ASIGNADO';
      porNombre.set(clave, {
        id: `asignado-${asignacion.asignacionId}`,
        insumoId: asignacion.equipoId,
        equipoId: asignacion.equipoId,
        asignado: true,
        nombre: asignacion.equipoNombre,
        numeroSerie: asignacion.equipoNumeroSerie || `INS-${asignacion.equipoId}`,
        cantidad: 1,
        estado: estadoAsignado,
      });
    });

    return Array.from(porNombre.values());
  })();

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
                <td><StockStatusBadge estado={asignacion.estadoEquipo} /></td>
                <td>
                  <div className="assignment-actions">
                    <button type="button" className="assignment-edit-button" onClick={() => setAsignacionEditando(asignacion)}>Editar</button>
                    <button type="button" className="assignment-unassign-button" disabled={desasignando === asignacion.equipoId} onClick={() => desasignar(asignacion)}>
                      {desasignando === asignacion.equipoId ? 'Desasignando...' : 'Desasignar'}
                    </button>
                  </div>
                </td>
              </tr>)}</tbody>
            </table></div>
          )}
        </section>

        <h2 className="assignment-section-title" style={S.sectionTitle}>Equipos en stock</h2>
        <section className="assignment-card" style={S.card}>
          {equiposStockCombinados.length === 0 ? (
            <p style={S.empty}>No hay equipos médicos disponibles en stock.</p>
          ) : (
            <div style={S.tableWrap} className="assignment-table-wrap">
              <table className="assignment-table stock-equipment-table">
                <thead>
                  <tr>
                    <th>Equipo</th>
                    <th>Número de serie</th>
                    <th>Estado</th>
                    <th>Cantidad</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {equiposStockCombinados.map(item => (
                    <tr key={item.id}>
                      <td><strong>{item.nombre}</strong></td>
                      <td>{item.numeroSerie}</td>
                      <td>
                        <StockStatusBadge estado={item.estado} />
                      </td>
                      <td>{item.cantidad}</td>
                      <td>
                        <button
                          type="button"
                          className="assignment-edit-button"
                          onClick={() => setItemEstadoEditando(item)}
                        >
                          Editar estado
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
      <ModalNuevaAsignacion open={modalAbierto} onClose={() => setModalAbierto(false)} onAssigned={asignacionCreada} />
      <ModalEditarAsignacion
        open={Boolean(asignacionEditando)}
        asignacion={asignacionEditando}
        onClose={() => setAsignacionEditando(null)}
        onUpdated={asignacionActualizada}
      />
      <ModalEditarEstado
        open={Boolean(itemEstadoEditando)}
        item={itemEstadoEditando}
        onClose={() => setItemEstadoEditando(null)}
        onUpdated={estadoActualizado}
      />
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
