import { useCallback, useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { equipoMedicoService } from '../services/api';
import './EquiposMedicos.css';

const TABS = [
  { id: 'inventario', label: 'Inventario' },
  { id: 'historial', label: 'Historial' },
  { id: 'operativos', label: 'Equipos operativos' },
];

const SUPPORTED_EQUIPMENT_TYPES = new Set([
  'CARDIODESFIBRILADOR',
  'ELECTROCARDIOGRAFO',
  'RESPIRADOR',
]);

const MOVEMENT_ACTIONS = [
  { id: 'ASIGNACION', label: 'Asignación inicial' },
  { id: 'REEMPLAZO', label: 'Reemplazo' },
  { id: 'RETIRO', label: 'Retiro del móvil' },
  { id: 'ENVIO', label: 'Envío a mantenimiento correctivo' },
  { id: 'RECEPCION', label: 'Recepción de reparación' },
  { id: 'PREVENTIVO', label: 'Mantenimiento preventivo' },
];

const initialForm = {
  action: 'ASIGNACION',
  tipo: '',
  numeroSerie: '',
  marca: '',
  modelo: '',
  equipoId: '',
  equipoSalienteId: '',
  equipoEntranteId: '',
  movilId: '',
  responsableId: '',
  fechaRealizacion: new Date().toISOString().slice(0, 10),
  motivo: '',
  observaciones: '',
};

const getError = (error) => error.response?.data?.message || error.message || 'No se pudo completar la operación.';

function StatusBadge({ value }) {
  const slug = String(value || 'SIN_ESTADO').toLowerCase().replaceAll('_', '-');
  return <span className={`medical-status medical-status--${slug}`}>{String(value || '—').replaceAll('_', ' ')}</span>;
}

export default function EquiposMedicos() {
  const [tab, setTab] = useState('inventario');
  const [equipos, setEquipos] = useState([]);
  const [todosEquipos, setTodosEquipos] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [insumosReutilizables, setInsumosReutilizables] = useState([]);
  const [moviles, setMoviles] = useState([]);
  const [responsables, setResponsables] = useState([]);
  const [operativos, setOperativos] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [filtros, setFiltros] = useState({ tipo: '', estado: '', ubicacion: '', mantenimiento: '' });
  const [modal, setModal] = useState('');
  const [form, setForm] = useState(initialForm);
  const [equipoBaja, setEquipoBaja] = useState(null);
  const [baja, setBaja] = useState({ motivo: '', observaciones: '' });
  const [mapping, setMapping] = useState({ tipo: '', insumoId: '' });
  const [clasificacion, setClasificacion] = useState({ equipoId: null, tipo: '', observaciones: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadReferences = useCallback(async () => {
    const [typesResponse, mobilesResponse, responsibleResponse, insumosResponse] = await Promise.all([
      equipoMedicoService.tipos(),
      equipoMedicoService.moviles(),
      equipoMedicoService.responsables(),
      equipoMedicoService.insumosReutilizables(),
    ]);
    setTipos(typesResponse.data.filter((item) => SUPPORTED_EQUIPMENT_TYPES.has(item.codigo)));
    setMoviles(mobilesResponse.data);
    setResponsables(responsibleResponse.data);
    setInsumosReutilizables(insumosResponse.data);
  }, []);

  const loadInventory = useCallback(async () => {
    const params = Object.fromEntries(Object.entries(filtros).filter(([, value]) => value));
    const [filteredResponse, allResponse] = await Promise.all([
      equipoMedicoService.inventario(params),
      equipoMedicoService.inventario(),
    ]);
    setEquipos(filteredResponse.data.filter((item) => SUPPORTED_EQUIPMENT_TYPES.has(item.tipo)));
    setTodosEquipos(allResponse.data.filter((item) => SUPPORTED_EQUIPMENT_TYPES.has(item.tipo)));
  }, [filtros]);

  const loadSecondary = useCallback(async () => {
    const [historyResponse, operatingResponse] = await Promise.all([
      equipoMedicoService.historial(),
      equipoMedicoService.operativos(),
    ]);
    setHistorial(historyResponse.data.filter((item) => SUPPORTED_EQUIPMENT_TYPES.has(item.tipoEquipo)));
    setOperativos(operatingResponse.data.map((movil) => ({
      ...movil,
      equipos: movil.equipos.filter((item) => SUPPORTED_EQUIPMENT_TYPES.has(item.tipo)),
    })));
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([loadReferences(), loadInventory(), loadSecondary()]);
    } catch (exception) {
      setError(getError(exception));
    } finally {
      setLoading(false);
    }
  }, [loadInventory, loadReferences, loadSecondary]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const availableEquipment = useMemo(() => todosEquipos.filter((item) => (
    ['OPERATIVO', 'FUNCIONANDO', 'DISPONIBLE'].includes(item.estado)
    && item.ubicacion === 'DEPOSITO_ENFERMERIA'
  )), [todosEquipos]);

  const assignedEquipment = useMemo(
    () => todosEquipos.filter((item) => item.ubicacion === 'MOVIL' && item.estado !== 'BAJA'),
    [todosEquipos],
  );

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (modal === 'alta') {
        await equipoMedicoService.registrar({
          tipo: form.tipo,
          numeroSerie: form.numeroSerie.trim(),
          marca: form.marca.trim() || null,
          modelo: form.modelo.trim() || null,
        });
        setNotice('Equipo registrado correctamente.');
      } else if (modal === 'baja') {
        if (!window.confirm(`¿Dar de baja el equipo ${equipoBaja.numeroSerie}? Esta acción no se puede deshacer.`)) return;
        await equipoMedicoService.darDeBaja(equipoBaja.id, baja);
        setNotice('Equipo dado de baja lógicamente.');
      } else if (modal === 'mapping') {
        await equipoMedicoService.asociarInsumo(mapping.tipo, Number(mapping.insumoId));
        setNotice('Asociación guardada. Los nuevos controles usarán la asignación física vigente.');
      } else if (modal === 'clasificacion') {
        await equipoMedicoService.clasificarTipo(clasificacion.equipoId, {
          tipo: clasificacion.tipo,
          observaciones: clasificacion.observaciones.trim() || null,
        });
        setNotice('Tipo clasificado y registrado en el historial.');
      } else {
        if (!window.confirm('¿Confirmar el movimiento? Se registrará en el historial inmutable.')) return;
        const common = {
          responsableId: form.responsableId ? Number(form.responsableId) : null,
          motivo: form.motivo.trim(),
          observaciones: form.observaciones.trim() || null,
        };
        switch (form.action) {
          case 'ASIGNACION':
            await equipoMedicoService.asignar({
              ...common, equipoId: Number(form.equipoId), movilId: Number(form.movilId),
            });
            break;
          case 'REEMPLAZO':
            await equipoMedicoService.reemplazar({
              ...common,
              equipoSalienteId: Number(form.equipoSalienteId),
              equipoEntranteId: Number(form.equipoEntranteId),
              movilId: Number(form.movilId),
            });
            break;
          case 'RETIRO':
            await equipoMedicoService.retirar({ ...common, equipoId: Number(form.equipoId) });
            break;
          case 'ENVIO':
            await equipoMedicoService.enviarMantenimiento({ ...common, equipoId: Number(form.equipoId) });
            break;
          case 'PREVENTIVO':
            await equipoMedicoService.registrarPreventivo({
              equipoId: Number(form.equipoId),
              fechaRealizacion: form.fechaRealizacion,
              responsableId: Number(form.responsableId),
              observaciones: form.observaciones.trim() || null,
            });
            break;
          case 'RECEPCION':
            await equipoMedicoService.recibirCorrectivo({
              equipoId: Number(form.equipoId),
              fechaRealizacion: form.fechaRealizacion,
              responsableId: Number(form.responsableId),
              observaciones: form.observaciones.trim() || null,
            });
            break;
          default:
            throw new Error('Seleccione una operación válida.');
        }
        setNotice('Operación registrada correctamente.');
      }
      setModal('');
      setEquipoBaja(null);
      setForm(initialForm);
      await refresh();
    } catch (exception) {
      setError(getError(exception));
    } finally {
      setSaving(false);
    }
  };

  const openAction = (action) => {
    setForm({ ...initialForm, action });
    setError('');
    setModal('movimiento');
  };

  const activeOutgoing = form.movilId
    ? assignedEquipment.filter((item) => String(item.movilId) === form.movilId)
    : assignedEquipment;

  const selectedOutgoing = todosEquipos.find((item) => String(item.id) === form.equipoSalienteId);
  const incomingOptions = availableEquipment.filter((item) => (
    !selectedOutgoing || item.tipo === selectedOutgoing.tipo
  ));
  const needsEquipment = ['RETIRO', 'ENVIO', 'PREVENTIVO', 'RECEPCION'].includes(form.action);
  const equipmentOptions = form.action === 'RECEPCION'
    ? todosEquipos.filter((item) => item.estado === 'EN_MANTENIMIENTO')
    : form.action === 'PREVENTIVO'
    ? todosEquipos.filter((item) => item.estado !== 'BAJA')
    : form.action === 'ENVIO'
      ? todosEquipos.filter((item) => !['BAJA', 'EN_MANTENIMIENTO'].includes(item.estado))
      : assignedEquipment;

  return (
    <div className="medical-layout">
      <Sidebar />
      <main className="medical-page">
        <header className="medical-header">
          <div>
            <p className="medical-eyebrow">Gestión de activos clínicos</p>
            <h1>Equipos médicos</h1>
            <p>Inventario, asignaciones y mantenimiento de ECG, cardiodesfibriladores y respiradores.</p>
          </div>
          <div className="medical-header-actions">
            <button type="button" className="medical-button medical-button--secondary" onClick={() => openAction('ASIGNACION')}>
              Registrar movimiento
            </button>
            <button type="button" className="medical-button" onClick={() => { setError(''); setForm(initialForm); setModal('alta'); }}>
              + Alta de equipo
            </button>
          </div>
        </header>

        {error && <div className="medical-alert" role="alert">{error}</div>}
        {notice && <div className="medical-notice" role="status">{notice}<button type="button" onClick={() => setNotice('')}>×</button></div>}

        <nav className="medical-tabs" aria-label="Secciones de equipos médicos">
          {TABS.map((item) => (
            <button
              type="button"
              key={item.id}
              className={tab === item.id ? 'is-active' : ''}
              onClick={() => setTab(item.id)}
            >
              {item.label}
              {item.id === 'inventario' && <span>{equipos.length}</span>}
            </button>
          ))}
        </nav>

        {tab === 'inventario' && (
          <section className="medical-panel">
            <div className="medical-panel-heading">
              <div><h2>Inventario</h2><p>{equipos.length} equipos registrados</p></div>
              <button type="button" className="medical-button medical-button--secondary" onClick={() => openAction('PREVENTIVO')}>
                Registrar mantenimiento
              </button>
              <button type="button" className="medical-button medical-button--secondary" onClick={() => {
                const tipo = tipos[0];
                setMapping({ tipo: tipo?.codigo || '', insumoId: tipo?.insumoId ? String(tipo.insumoId) : '' });
                setModal('mapping');
                setError('');
              }}>
                Vincular elemento de control
              </button>
            </div>
            <div className="medical-filters">
              <label>Tipo
                <select value={filtros.tipo} onChange={(event) => setFiltros({ ...filtros, tipo: event.target.value })}>
                  <option value="">Todos</option>
                  {tipos.map((item) => <option key={item.codigo} value={item.codigo}>{item.nombre}</option>)}
                </select>
              </label>
              <label>Estado
                <select value={filtros.estado} onChange={(event) => setFiltros({ ...filtros, estado: event.target.value })}>
                  <option value="">Todos</option>
                  {['OPERATIVO', 'FUNCIONANDO', 'DISPONIBLE', 'EN_USO', 'AVERIADO', 'EN_MANTENIMIENTO', 'MANTENIMIENTO', 'FUERA_DE_SERVICIO', 'BAJA'].map((value) => (
                    <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>
                  ))}
                </select>
              </label>
              <label>Ubicación
                <select value={filtros.ubicacion} onChange={(event) => setFiltros({ ...filtros, ubicacion: event.target.value })}>
                  <option value="">Todas</option>
                  {['MOVIL', 'DEPOSITO_ENFERMERIA', 'CENTRO_REPARACION', 'RETIRADO_BAJA'].map((value) => (
                    <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>
                  ))}
                </select>
              </label>
              <label>Mantenimiento preventivo
                <select value={filtros.mantenimiento} onChange={(event) => setFiltros({ ...filtros, mantenimiento: event.target.value })}>
                  <option value="">Todos</option>
                  {['SIN_REGISTRO', 'VIGENTE', 'PROXIMO_A_VENCER', 'VENCIDO'].map((value) => (
                    <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="medical-table-wrap">
              <table className="medical-table">
                <thead><tr>
                  <th>Tipo / equipo</th><th>Número de serie</th><th>Estado</th><th>Ubicación</th><th>Preventivo</th><th>Próximo vencimiento</th><th>Acciones</th>
                </tr></thead>
                <tbody>
                  {equipos.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.tipoNombre || item.tipo || 'Sin tipo'}</strong><small>{[item.marca, item.modelo].filter(Boolean).join(' · ') || '—'}</small></td>
                      <td className="medical-serial">{item.numeroSerie}</td>
                      <td><StatusBadge value={item.estado} /></td>
                      <td>{item.ubicacion?.replaceAll('_', ' ')}{item.movilNombre && <small>{item.movilNombre}</small>}</td>
                      <td><StatusBadge value={item.mantenimientoPreventivo} /></td>
                      <td>{item.proximoVencimiento || '—'}</td>
                      <td>
                        <div className="medical-row-actions">
                          {!item.tipo && <button type="button" onClick={() => {
                            setClasificacion({ equipoId: item.id, tipo: tipos[0]?.codigo || '', observaciones: '' });
                            setModal('clasificacion');
                            setError('');
                          }}>Clasificar</button>}
                          {item.estado !== 'BAJA' && (
                            <>
                              <button type="button" onClick={() => openAction('PREVENTIVO')}>Mant.</button>
                              <button
                                type="button"
                                className="medical-danger-link"
                                onClick={() => { setEquipoBaja(item); setBaja({ motivo: '', observaciones: '' }); setModal('baja'); setError(''); }}
                              >Baja</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!loading && equipos.length === 0 && <tr><td colSpan="7" className="medical-empty">No hay equipos que coincidan con los filtros.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'historial' && (
          <section className="medical-panel">
            <div className="medical-panel-heading"><div><h2>Historial inmutable</h2><p>Movimientos y mantenimientos ordenados cronológicamente</p></div></div>
            <div className="medical-table-wrap">
              <table className="medical-table">
                <thead><tr><th>Fecha</th><th>Evento</th><th>Equipo</th><th>Móvil</th><th>Actor / responsable</th><th>Motivo</th><th>Estado / ubicación</th></tr></thead>
                <tbody>
                  {historial.map((item) => (
                    <tr key={`${item.tipoEvento}-${item.id}`}>
                      <td>{item.fechaHora ? new Date(item.fechaHora).toLocaleString() : item.fechaRealizacion}</td>
                      <td><StatusBadge value={item.tipoEvento} /></td>
                      <td>
                        <strong>{item.tipoEquipo || 'Equipo'}</strong>
                        <small>{item.numeroSerie || 'Serie no registrada'}</small>
                        {(item.marca || item.modelo) && <small>{[item.marca, item.modelo].filter(Boolean).join(' · ')}</small>}
                      </td>
                      <td>{item.movilNuevo || item.movilAnterior || '—'}</td>
                      <td>{item.actor || '—'}{item.responsable && <small>Responsable: {item.responsable}</small>}</td>
                      <td>{item.motivo || '—'}{item.observaciones && <small>{item.observaciones}</small>}</td>
                      <td>
                        <small>{[item.estadoAnterior, item.estadoNuevo].filter(Boolean).join(' → ') || '—'}</small>
                        <small>{[item.ubicacionAnterior, item.ubicacionNueva].filter(Boolean).join(' → ') || '—'}</small>
                      </td>
                    </tr>
                  ))}
                  {!loading && historial.length === 0 && <tr><td colSpan="7" className="medical-empty">Todavía no hay eventos registrados.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'operativos' && (
          <section className="medical-operating-grid">
            {operativos.map((movil) => (
              <article className="medical-mobile-card" key={movil.movilId}>
                <header><span>Móvil</span><h2>{movil.movil}</h2></header>
                <div className="medical-mobile-equipment">
                  {movil.equipos.map((item) => (
                    <div className={`medical-mobile-equipment-row ${item.faltante ? 'is-missing' : ''}`} key={item.tipo}>
                      <div><strong>{item.tipoNombre}</strong><small>{item.numeroSerie || 'Sin asignación vigente'}</small></div>
                      {item.faltante ? <StatusBadge value="FALTANTE" /> : <StatusBadge value={item.estado} />}
                    </div>
                  ))}
                </div>
              </article>
            ))}
            {!loading && operativos.length === 0 && <div className="medical-panel medical-empty">No hay móviles operativos.</div>}
          </section>
        )}

        {loading && <div className="medical-loading">Cargando datos del módulo…</div>}
      </main>

      {modal && (
        <div className="medical-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setModal('')}>
          <section className="medical-modal" role="dialog" aria-modal="true" aria-labelledby="medical-modal-title">
            <header><div><p className="medical-eyebrow">Gestión de activos</p><h2 id="medical-modal-title">
              {modal === 'alta' ? 'Alta de equipo' : modal === 'baja' ? 'Baja lógica de equipo' : modal === 'mapping' ? 'Vincular al control de móvil' : modal === 'clasificacion' ? 'Clasificar equipo existente' : 'Registrar operación'}
            </h2></div><button type="button" className="medical-close" onClick={() => setModal('')} aria-label="Cerrar">×</button></header>
            {error && <div className="medical-alert" role="alert">{error}</div>}
            <form onSubmit={submit}>
              {modal === 'alta' && (
                <div className="medical-form-grid">
                  <label>Tipo de equipo
                    <select required value={form.tipo} onChange={(event) => setForm({ ...form, tipo: event.target.value })}>
                      <option value="">Seleccionar</option>{tipos.map((item) => <option key={item.codigo} value={item.codigo}>{item.nombre}</option>)}
                    </select>
                  </label>
                  <label>Número de serie<input required maxLength="100" value={form.numeroSerie} onChange={(event) => setForm({ ...form, numeroSerie: event.target.value })} /></label>
                  <label>Marca (opcional)<input maxLength="255" value={form.marca} onChange={(event) => setForm({ ...form, marca: event.target.value })} /></label>
                  <label>Modelo (opcional)<input maxLength="255" value={form.modelo} onChange={(event) => setForm({ ...form, modelo: event.target.value })} /></label>
                </div>
              )}
              {modal === 'baja' && (
                <div className="medical-form-grid">
                  <p className="medical-form-note">Equipo: <strong>{equipoBaja?.tipoNombre} · {equipoBaja?.numeroSerie}</strong>. Se conserva su historial y no podrá volver a asignarse.</p>
                  <label>Motivo<input required maxLength="500" value={baja.motivo} onChange={(event) => setBaja({ ...baja, motivo: event.target.value })} /></label>
                  <label className="medical-span-two">Observaciones<textarea maxLength="4000" rows="3" value={baja.observaciones} onChange={(event) => setBaja({ ...baja, observaciones: event.target.value })} /></label>
                </div>
              )}
              {modal === 'mapping' && (
                <div className="medical-form-grid">
                  <p className="medical-form-note">
                    No se infieren correspondencias por nombre. Vincule el tipo únicamente después de verificar qué elemento de la plantilla representa ese equipo físico.
                  </p>
                  <label>Tipo físico
                    <select required value={mapping.tipo} onChange={(event) => {
                      const tipo = tipos.find((item) => item.codigo === event.target.value);
                      setMapping({ tipo: event.target.value, insumoId: tipo?.insumoId ? String(tipo.insumoId) : '' });
                    }}>
                      {tipos.map((item) => <option key={item.codigo} value={item.codigo}>{item.nombre}</option>)}
                    </select>
                  </label>
                  <label>Elemento en la plantilla
                    <select required value={mapping.insumoId} onChange={(event) => setMapping({ ...mapping, insumoId: event.target.value })}>
                      <option value="">Seleccionar insumo reutilizable</option>
                      {insumosReutilizables.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                    </select>
                  </label>
                </div>
              )}
              {modal === 'clasificacion' && (
                <div className="medical-form-grid">
                  <p className="medical-form-note">
                    Asigne el tipo físico solo si está verificado en el equipo y su documentación. Se conservarán su ID, serie y asignaciones; la clasificación quedará auditada.
                  </p>
                  <label className="medical-span-two">Tipo de equipo
                    <select required value={clasificacion.tipo} onChange={(event) => setClasificacion({ ...clasificacion, tipo: event.target.value })}>
                      {tipos.map((item) => <option key={item.codigo} value={item.codigo}>{item.nombre}</option>)}
                    </select>
                  </label>
                  <label className="medical-span-two">Observaciones<textarea maxLength="4000" rows="3" value={clasificacion.observaciones} onChange={(event) => setClasificacion({ ...clasificacion, observaciones: event.target.value })} /></label>
                </div>
              )}
              {modal === 'movimiento' && (
                <div className="medical-form-grid">
                  <label className="medical-span-two">Operación
                    <select value={form.action} onChange={(event) => setForm({ ...initialForm, action: event.target.value })}>
                      {MOVEMENT_ACTIONS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                    </select>
                  </label>
                  {['ASIGNACION', 'REEMPLAZO'].includes(form.action) && (
                    <label>Móvil
                      <select required value={form.movilId} onChange={(event) => setForm({ ...form, movilId: event.target.value, equipoSalienteId: '', equipoEntranteId: '' })}>
                        <option value="">Seleccionar móvil operativo</option>{moviles.map((item) => <option key={item.id} value={item.id}>{item.etiqueta}</option>)}
                      </select>
                    </label>
                  )}
                  {form.action === 'ASIGNACION' && (
                    <label>Equipo entrante
                      <select required value={form.equipoId} onChange={(event) => setForm({ ...form, equipoId: event.target.value })}>
                        <option value="">Seleccionar equipo disponible</option>{availableEquipment.map((item) => <option key={item.id} value={item.id}>{item.tipoNombre} · {item.numeroSerie}</option>)}
                      </select>
                    </label>
                  )}
                  {form.action === 'REEMPLAZO' && (
                    <>
                      <label>Equipo saliente
                        <select required value={form.equipoSalienteId} onChange={(event) => setForm({ ...form, equipoSalienteId: event.target.value, equipoEntranteId: '' })}>
                          <option value="">Seleccionar asignado al móvil</option>{activeOutgoing.map((item) => <option key={item.id} value={item.id}>{item.tipoNombre} · {item.numeroSerie}</option>)}
                        </select>
                      </label>
                      <label>Equipo entrante
                        <select required value={form.equipoEntranteId} onChange={(event) => setForm({ ...form, equipoEntranteId: event.target.value })}>
                          <option value="">Seleccionar equipo disponible</option>{incomingOptions.map((item) => <option key={item.id} value={item.id}>{item.tipoNombre} · {item.numeroSerie}</option>)}
                        </select>
                      </label>
                      <label>Motivo
                        <select required value={form.motivo} onChange={(event) => setForm({ ...form, motivo: event.target.value })}>
                          <option value="">Seleccionar motivo</option><option value="EQUIPO_AVERIADO">Equipo averiado</option><option value="CAMBIO_EQUIPO">Cambio programado</option>
                        </select>
                      </label>
                    </>
                  )}
                  {needsEquipment && (
                    <label>{form.action === 'RECEPCION' ? 'Equipo en reparación' : 'Equipo'}
                      <select required value={form.equipoId} onChange={(event) => setForm({ ...form, equipoId: event.target.value })}>
                        <option value="">Seleccionar equipo</option>{equipmentOptions.map((item) => <option key={item.id} value={item.id}>{item.tipoNombre} · {item.numeroSerie}</option>)}
                      </select>
                    </label>
                  )}
                  {['RETIRO', 'ENVIO'].includes(form.action) && (
                    <label className="medical-span-two">Motivo<input required maxLength="500" value={form.motivo} onChange={(event) => setForm({ ...form, motivo: event.target.value })} /></label>
                  )}
                  {['PREVENTIVO', 'RECEPCION'].includes(form.action) && (
                    <label>Fecha de realización<input required type="date" max={new Date().toISOString().slice(0, 10)} value={form.fechaRealizacion} onChange={(event) => setForm({ ...form, fechaRealizacion: event.target.value })} /></label>
                  )}
                  {['ASIGNACION', 'RETIRO', 'ENVIO'].includes(form.action) && (
                    <label className="medical-span-two">Motivo<input required maxLength="500" value={form.motivo} onChange={(event) => setForm({ ...form, motivo: event.target.value })} /></label>
                  )}
                  <label>Responsable enfermero{['PREVENTIVO', 'RECEPCION'].includes(form.action) ? '' : ' (opcional)'}
                    <select required={['PREVENTIVO', 'RECEPCION'].includes(form.action)} value={form.responsableId} onChange={(event) => setForm({ ...form, responsableId: event.target.value })}>
                        <option value="">Seleccionar responsable</option>{responsables.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                    </select>
                  </label>
                  <label className="medical-span-two">Observaciones<textarea maxLength="4000" rows="3" value={form.observaciones} onChange={(event) => setForm({ ...form, observaciones: event.target.value })} /></label>
                </div>
              )}
              <footer>
                <button type="button" className="medical-button medical-button--secondary" onClick={() => setModal('')}>Cancelar</button>
                <button type="submit" className="medical-button" disabled={saving}>{saving ? 'Guardando…' : 'Confirmar'}</button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
