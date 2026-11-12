import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import { depositoCentralService, inventarioService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './SolicitudesReposicion.css';

const ESTADOS = {
  PENDIENTE: 'Pendiente',
  PARCIAL: 'Entrega parcial',
  COMPLETADA: 'Completada',
  RECHAZADA: 'Rechazada',
  CANCELADA: 'Cancelada',
};

const MOTIVOS_CAMBIO = {
  ROTURA: 'Ruptura',
  FALTANTE: 'Faltante',
  FALLA: 'No funciona',
  DESGASTE: 'Desgaste',
  OTRO: 'Otro',
};

const ABIERTOS = ['PENDIENTE', 'PARCIAL'];
const esEquipoReutilizable = item => item.tipo === 'REUTILIZABLE' || Boolean(item.motivoCambio);

export default function SolicitudesReposicion() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { solicitudId } = useParams();
  const [searchParams] = useSearchParams();
  const accionEntrega = searchParams.get('accion') === 'reponer';
  const [solicitudes, setSolicitudes] = useState([]);
  const [stockCentral, setStockCentral] = useState([]);
  const [cantidadesEntrega, setCantidadesEntrega] = useState({});
  const [observacionesEntrega, setObservacionesEntrega] = useState('');
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroEnfermero, setFiltroEnfermero] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [loading, setLoading] = useState(true);
  const [procesandoId, setProcesandoId] = useState(null);
  const [archivandoId, setArchivandoId] = useState(null);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [editando, setEditando] = useState(false);
  const [cargandoCatalogo, setCargandoCatalogo] = useState(false);
  const [catalogoEdicion, setCatalogoEdicion] = useState([]);
  const [nuevoInsumoId, setNuevoInsumoId] = useState('');
  const [formularioEdicion, setFormularioEdicion] = useState(null);
  const puedeDespachar = ['JEF', 'ADM'].includes(user?.rol);
  const puedeModificar = ['JEF', 'ADM'].includes(user?.rol);

  useEffect(() => {
    if (!solicitudId || loading) return;
    const solicitud = solicitudes.find(item => String(item.id) === String(solicitudId));
    if (solicitud) {
      setSolicitudSeleccionada(solicitud);
      setError('');
      setCantidadesEntrega(actual => {
        if (String(solicitudSeleccionada?.id) === String(solicitud.id)) return actual;
        return Object.fromEntries(solicitud.items.map(item => [item.id, 0]));
      });
    } else {
      setError(`No se encontró la solicitud #${solicitudId} en el historial disponible.`);
      setSolicitudSeleccionada(null);
    }
  }, [solicitudId, loading, solicitudes, solicitudSeleccionada?.id]);

  const solicitudesFiltradas = useMemo(() => solicitudes.filter(solicitud => {
    const fechaCoincide = !filtroFecha || String(solicitud.fecha || '').slice(0, 10) === filtroFecha;
    const nombre = (solicitud.enfermeroNombre || '').toLocaleLowerCase('es-AR');
    const enfermeroCoincide = !filtroEnfermero
      || nombre.includes(filtroEnfermero.trim().toLocaleLowerCase('es-AR'));
    const estadoCoincide = !filtroEstado || solicitud.estado === filtroEstado;
    return fechaCoincide && enfermeroCoincide && estadoCoincide;
  }), [solicitudes, filtroFecha, filtroEnfermero, filtroEstado]);

  useEffect(() => {
    if (!solicitudId || !solicitudSeleccionada || !accionEntrega) return;
    document.getElementById('reposiciones-actions-section')
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [accionEntrega, solicitudId, solicitudSeleccionada?.id]);

  const cargarSolicitudes = useCallback(async () => {
    setLoading(true);
    try {
      const solicitudesPromise = inventarioService.historialReposiciones();
      const [solicitudesResponse, stockResponse] = puedeDespachar
        ? await Promise.all([solicitudesPromise, depositoCentralService.stock()])
        : [await solicitudesPromise, { data: [] }];
      const nuevasSolicitudes = solicitudesResponse.data || [];
      setSolicitudes(nuevasSolicitudes);
      setStockCentral(stockResponse.data || []);
      setSolicitudSeleccionada(actual => actual
        ? nuevasSolicitudes.find(item => item.id === actual.id) || actual
        : actual);
      setError('');
    } catch (exception) {
      setError(exception.response?.data?.message || 'No se pudo cargar el historial de reposiciones.');
    } finally {
      setLoading(false);
    }
  }, [puedeDespachar]);

  useEffect(() => {
    cargarSolicitudes();
  }, [cargarSolicitudes]);

  function abrirDetalle(solicitud, enfocarEntrega = false) {
    setSolicitudSeleccionada(solicitud);
    setError('');
    setMensaje('');
    setEditando(false);
    setMotivoRechazo('');
    setObservacionesEntrega('');
    const iniciales = {};
    solicitud.items.forEach(item => { iniciales[item.id] = 0; });
    setCantidadesEntrega(iniciales);
    navigate(`/solicitudes-reposicion/${solicitud.id}${enfocarEntrega ? '?accion=reponer' : ''}`);
  }

  function volverAlListado() {
    setSolicitudSeleccionada(null);
    setEditando(false);
    setError('');
    navigate('/solicitudes-reposicion', { replace: true });
  }

  async function archivarSolicitud(solicitud) {
    const confirmado = window.confirm(
      `¿Archivar la solicitud #${solicitud.id}? Se ocultará del historial habitual, pero se conservarán la auditoría y los movimientos.`
    );
    if (!confirmado) return;

    setArchivandoId(solicitud.id);
    setError('');
    setMensaje('');
    try {
      await inventarioService.archivarReposicion(solicitud.id);
      setSolicitudes(actuales => actuales.filter(item => item.id !== solicitud.id));
      setMensaje(`La solicitud #${solicitud.id} se archivó. La auditoría y los movimientos se conservaron.`);
    } catch (exception) {
      setError(exception.response?.data?.message || 'No se pudo archivar la solicitud.');
    } finally {
      setArchivandoId(null);
    }
  }

  async function iniciarEdicion() {
    if (!solicitudSeleccionada) return;
    setError('');
    setCargandoCatalogo(true);
    try {
      const response = await inventarioService.catalogoEdicionSolicitud(solicitudSeleccionada.id);
      setCatalogoEdicion(response.data || []);
      setFormularioEdicion({
        observaciones: solicitudSeleccionada.observaciones || '',
        items: solicitudSeleccionada.items.map(item => ({
          insumoId: item.insumoId,
          insumoNombre: item.insumoNombre,
          tipo: item.tipo,
          cantidad: item.cantidadSolicitada,
          cantidadEntregada: item.cantidadEntregada || 0,
          cantidadRecomendada: response.data.find(catalogItem =>
            catalogItem.insumoId === item.insumoId)?.cantidadRecomendada || item.cantidadSolicitada,
          motivoCambio: item.motivoCambio || '',
          detalleCambio: item.detalleCambio || '',
        })),
      });
      setEditando(true);
    } catch (exception) {
      setError(exception.response?.data?.message || 'No se pudo cargar el catálogo de este móvil.');
    } finally {
      setCargandoCatalogo(false);
    }
  }

  function agregarInsumo() {
    const insumo = catalogoEdicion.find(item => String(item.insumoId) === String(nuevoInsumoId));
    if (!insumo || formularioEdicion.items.some(item => item.insumoId === insumo.insumoId)) return;
    setFormularioEdicion(actual => ({
      ...actual,
      items: [...actual.items, {
        insumoId: insumo.insumoId,
        insumoNombre: insumo.nombre,
        tipo: insumo.tipo,
        cantidad: insumo.tipo === 'REUTILIZABLE' ? 1 : 1,
        cantidadEntregada: 0,
        cantidadRecomendada: insumo.cantidadRecomendada,
        motivoCambio: '',
        detalleCambio: '',
      }],
    }));
    setNuevoInsumoId('');
  }

  function cambiarItemEdicion(insumoId, campo, valor) {
    setFormularioEdicion(actual => ({
      ...actual,
      items: actual.items.map(item => item.insumoId === insumoId
        ? { ...item, [campo]: valor }
        : item),
    }));
  }

  async function guardarEdicion() {
    if (!formularioEdicion?.items.length) {
      setError('La solicitud debe conservar al menos un elemento.');
      return;
    }
    setProcesandoId(solicitudSeleccionada.id);
    setError('');
    try {
      await inventarioService.modificarReposicion(solicitudSeleccionada.id, {
        observaciones: formularioEdicion.observaciones,
        items: formularioEdicion.items.map(item => ({
          insumoId: item.insumoId,
          cantidad: Number(item.cantidad),
          motivoCambio: item.motivoCambio || null,
          detalleCambio: item.detalleCambio.trim() || null,
        })),
      });
      setEditando(false);
      await cargarSolicitudes();
      setMensaje('Los cambios se guardaron y quedaron registrados en el historial.');
      volverAlListado();
    } catch (exception) {
      setError(exception.response?.data?.message || 'No se pudo modificar la solicitud.');
    } finally {
      setProcesandoId(null);
    }
  }

  async function entregar() {
    const solicitud = solicitudSeleccionada;
    if (!solicitud) return;
    const items = solicitud.items
      .filter(item => !esEquipoReutilizable(item))
      .map(item => ({ itemId: item.id, cantidad: Number(cantidadesEntrega[item.id]) || 0 }))
      .filter(item => item.cantidad > 0);
    if (!items.length) {
      setError('Indicá una cantidad a entregar para al menos un insumo.');
      return;
    }
    setProcesandoId(solicitud.id);
    setError('');
    try {
      await inventarioService.entregarReposicion(solicitud.id, {
        items,
        observaciones: observacionesEntrega.trim() || null,
      });
      await cargarSolicitudes();
      setMensaje('Entrega registrada. Se actualizaron los stocks y se notificó al enfermero.');
      volverAlListado();
      setObservacionesEntrega('');
    } catch (exception) {
      setError(exception.response?.data?.message || 'No se pudo registrar la entrega.');
    } finally {
      setProcesandoId(null);
    }
  }

  async function rechazar() {
    const motivo = motivoRechazo.trim();
    if (!motivo) {
      setError('El motivo del rechazo es obligatorio.');
      return;
    }
    setProcesandoId(solicitudSeleccionada.id);
    setError('');
    try {
      await inventarioService.rechazarReposicion(solicitudSeleccionada.id, motivo);
      setMotivoRechazo('');
      await cargarSolicitudes();
      setMensaje('Solicitud rechazada. La acción quedó registrada en el historial.');
      volverAlListado();
    } catch (exception) {
      setError(exception.response?.data?.message || 'No se pudo rechazar la solicitud.');
    } finally {
      setProcesandoId(null);
    }
  }

  const solicitudAbierta = solicitudSeleccionada && ABIERTOS.includes(solicitudSeleccionada.estado);
  const mostrandoDetalle = Boolean(solicitudId);

  return (
    <div className="reposiciones-page">
      <Sidebar />
      {!mostrandoDetalle ? (
        <main className="reposiciones-main">
          <header className="reposiciones-header">
            <div>
              <p className="reposiciones-overline">Abastecimiento · Coordinación</p>
              <h1>Reposiciones</h1>
              <p>Historial completo de solicitudes de todos los móviles, incluidas las pendientes.</p>
            </div>
            <div className="reposiciones-header-icon" aria-hidden="true">📋</div>
          </header>

          {mensaje && <div className="reposiciones-feedback success" role="status">{mensaje}</div>}
          {error && <div className="reposiciones-feedback error" role="alert">{error}</div>}

          <section className="reposiciones-history" aria-label="Historial de reposición">
            <div className="reposiciones-history-heading">
              <div>
                <h2>Historial de reposición</h2>
                <p>{solicitudesFiltradas.length} de {solicitudes.length} solicitudes · {
                  solicitudes.filter(solicitud => ABIERTOS.includes(solicitud.estado)).length
                } pendientes</p>
              </div>
              <button type="button" className="reposiciones-refresh" onClick={cargarSolicitudes}>Actualizar</button>
            </div>

            <div className="reposiciones-filters">
              <label>
                Fecha
                <input type="date" value={filtroFecha} onChange={event => setFiltroFecha(event.target.value)} />
              </label>
              <label>
                Enfermero
                <input
                  type="search"
                  value={filtroEnfermero}
                  onChange={event => setFiltroEnfermero(event.target.value)}
                  placeholder="Buscar por nombre"
                />
              </label>
              <label>
                Estado
                <select value={filtroEstado} onChange={event => setFiltroEstado(event.target.value)}>
                  <option value="">Todos los estados</option>
                  {Object.entries(ESTADOS).map(([valor, etiqueta]) => (
                    <option key={valor} value={valor}>{etiqueta}</option>
                  ))}
                </select>
              </label>
              <button type="button" className="reposiciones-clear" onClick={() => {
                setFiltroFecha('');
                setFiltroEnfermero('');
                setFiltroEstado('');
              }}>Limpiar filtros</button>
            </div>

            {loading ? <div className="reposiciones-loading">Cargando historial…</div>
              : solicitudesFiltradas.length === 0 ? (
                <EmptyState
                  icon="📦"
                  title={solicitudes.length ? 'Sin resultados' : 'Todavía no hay solicitudes'}
                  description={solicitudes.length
                    ? 'Probá modificar los filtros para ver otras solicitudes.'
                    : 'Las solicitudes de todos los móviles aparecerán en este historial.'}
                />
              ) : (
                <div className="reposiciones-table-scroll">
                  <table className="reposiciones-table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Móvil</th>
                        <th>Enfermero solicitante</th>
                        <th>Coordinador/es que prepararon</th>
                        <th>Estado</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {solicitudesFiltradas.map(solicitud => (
                        <tr key={solicitud.id}>
                          <td>{formatearFecha(solicitud.fecha)}</td>
                          <td>{solicitud.movilNumeroInterno || '—'}</td>
                          <td>{solicitud.enfermeroNombre || '—'}</td>
                          <td>{solicitud.coordinadoresPrepararon?.length
                            ? solicitud.coordinadoresPrepararon.join(', ') : '—'}</td>
                          <td><span className={`reposiciones-status status-${solicitud.estado?.toLowerCase()}`}>
                            {ESTADOS[solicitud.estado] || solicitud.estado}
                          </span></td>
                          <td>
                            <div className="reposiciones-row-actions">
                              <button type="button" className="reposiciones-view"
                                onClick={() => abrirDetalle(solicitud)}>
                                Ver detalle
                              </button>
                              {puedeDespachar && ABIERTOS.includes(solicitud.estado) && (
                                <button type="button" className="reposiciones-restock"
                                  aria-label={`Realizar reposición de la solicitud #${solicitud.id}`}
                                  onClick={() => abrirDetalle(solicitud, true)}>
                                  Reponer
                                </button>
                              )}
                              {puedeDespachar && (
                                <button type="button" className="reposiciones-archive"
                                  disabled={archivandoId === solicitud.id}
                                  onClick={() => archivarSolicitud(solicitud)}>
                                  {archivandoId === solicitud.id ? 'Archivando…' : 'Archivar'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </section>
        </main>
      ) : (
        <main className="reposiciones-main reposiciones-detail-page">
          {loading || !solicitudSeleccionada ? (
            <section className="reposiciones-section reposiciones-detail-loading">
              <p className="reposiciones-breadcrumb">Reposiciones / Solicitud #{solicitudId}</p>
              <h1>Solicitud #{solicitudId}</h1>
              <p role={error ? 'alert' : undefined}>{error || 'Cargando solicitud…'}</p>
              <Button variant="secondary" size="sm" onClick={volverAlListado}>Volver al listado de Reposiciones</Button>
            </section>
          ) : (
            <>
              <header className="reposiciones-detail-header">
                <button type="button" className="reposiciones-back" onClick={volverAlListado}>
                  <span aria-hidden="true">←</span> Volver a Reposiciones
                </button>
                <nav className="reposiciones-breadcrumb" aria-label="Migas de pan">
                  <button type="button" onClick={volverAlListado}>Reposiciones</button>
                  <span aria-hidden="true">/</span>
                  <span>Solicitud #{solicitudSeleccionada.id}</span>
                </nav>
                <div className="reposiciones-detail-title">
                  <div>
                    <p className="reposiciones-overline">Gestión de solicitud</p>
                    <h1 id="reposiciones-detail-title">Solicitud #{solicitudSeleccionada.id}</h1>
                    <p>Móvil {solicitudSeleccionada.movilNumeroInterno || '—'} · {solicitudSeleccionada.enfermeroNombre || 'Enfermero no identificado'}</p>
                  </div>
                  <span className={`reposiciones-status status-${solicitudSeleccionada.estado?.toLowerCase()}`}>
                    {ESTADOS[solicitudSeleccionada.estado] || solicitudSeleccionada.estado}
                  </span>
                </div>
              </header>

              {error && <div className="reposiciones-feedback error" role="alert">{error}</div>}

              <section className="reposiciones-section reposiciones-request-summary">
                <dl className="reposiciones-data-grid">
                  <div><dt>Móvil solicitante</dt><dd>{solicitudSeleccionada.movilNumeroInterno || '—'}</dd></div>
                  <div><dt>Enfermero solicitante</dt><dd>{solicitudSeleccionada.enfermeroNombre || '—'}</dd></div>
                  <div><dt>Fecha y hora</dt><dd>{formatearFecha(solicitudSeleccionada.fecha)}</dd></div>
                  <div><dt>Guardia</dt><dd>{solicitudSeleccionada.guardiaTurno
                    ? `${solicitudSeleccionada.guardiaTurno}${solicitudSeleccionada.guardiaFechaInicio
                      ? ` · desde ${formatearFecha(solicitudSeleccionada.guardiaFechaInicio)}` : ''}`
                    : 'No registrada en solicitudes históricas'}</dd></div>
                </dl>
              </section>

              {editando && formularioEdicion && (
                <section className="reposiciones-section edit-section">
                  <div className="reposiciones-section-heading">
                    <span className="section-index" aria-hidden="true">✎</span>
                    <h2>Modificar solicitud</h2>
                  </div>
                  <div className="reposiciones-add-item">
                    <select value={nuevoInsumoId} onChange={event => setNuevoInsumoId(event.target.value)}>
                      <option value="">Agregar insumo o equipo…</option>
                      {catalogoEdicion.filter(item => !formularioEdicion.items.some(linea =>
                        linea.insumoId === item.insumoId)).map(item => (
                        <option key={item.insumoId} value={item.insumoId}>
                          {item.nombre}{item.tipo === 'REUTILIZABLE' ? ' · reutilizable' : ''}
                        </option>
                      ))}
                    </select>
                    <Button size="sm" onClick={agregarInsumo} disabled={!nuevoInsumoId}>Agregar</Button>
                  </div>
                  <div className="reposiciones-edit-items">
                    {formularioEdicion.items.map(item => (
                      <div className="reposiciones-edit-row" key={item.insumoId}>
                        <strong>{item.insumoNombre}</strong>
                        <label>
                          Solicitado
                          <input
                            type="number"
                            min={item.cantidadEntregada || 1}
                            max={item.cantidadRecomendada}
                            step="1"
                            value={item.cantidad}
                            onChange={event => cambiarItemEdicion(
                              item.insumoId, 'cantidad', event.target.value === '' ? '' : Number(event.target.value))}
                          />
                        </label>
                        <span className="reposiciones-delivered-hint">
                          Entregado: {item.cantidadEntregada} · mínimo: {item.cantidadEntregada}
                        </span>
                        {item.tipo === 'REUTILIZABLE' && (
                          <div className="reposiciones-reason-fields">
                            <label>
                              Motivo
                              <select value={item.motivoCambio} onChange={event => cambiarItemEdicion(
                                item.insumoId, 'motivoCambio', event.target.value)}>
                                <option value="">Seleccionar motivo</option>
                                {Object.entries(MOTIVOS_CAMBIO).map(([valor, etiqueta]) => (
                                  <option key={valor} value={valor}>{etiqueta}</option>
                                ))}
                              </select>
                            </label>
                            {item.motivoCambio === 'OTRO' && (
                              <label>
                                Detalle
                                <input maxLength={500} value={item.detalleCambio}
                                  onChange={event => cambiarItemEdicion(
                                    item.insumoId, 'detalleCambio', event.target.value)} />
                              </label>
                            )}
                          </div>
                        )}
                        <button type="button" className="reposiciones-remove" title="Quitar elemento"
                          disabled={item.cantidadEntregada > 0}
                          onClick={() => setFormularioEdicion(actual => ({
                            ...actual,
                            items: actual.items.filter(linea => linea.insumoId !== item.insumoId),
                          }))}>Quitar</button>
                      </div>
                    ))}
                  </div>
                  <label className="reposiciones-general-note">
                    Observaciones generales
                    <textarea maxLength={4000} rows={2} value={formularioEdicion.observaciones}
                      onChange={event => setFormularioEdicion(actual => ({
                        ...actual, observaciones: event.target.value,
                      }))} />
                  </label>
                  <div className="reposiciones-edit-actions">
                    <Button size="sm" onClick={guardarEdicion} disabled={procesandoId === solicitudSeleccionada.id}>
                      {procesandoId === solicitudSeleccionada.id ? 'Guardando…' : 'Guardar cambios'}
                    </Button>
                    <button type="button" className="reposiciones-clear" onClick={() => setEditando(false)}>Cancelar</button>
                  </div>
                </section>
              )}

              <section className="reposiciones-section reposiciones-items-section">
                <div className="reposiciones-section-heading">
                  <span className="section-index" aria-hidden="true">1</span>
                  <h2>Insumos solicitados</h2>
                </div>
                <div className="reposiciones-table-scroll">
                  <table className="reposiciones-table detail-table reposiciones-items-table">
                    <thead><tr>
                      <th>Insumo</th><th>Solicitada</th><th>Entregada</th>
                      <th>Cantidad a entregar</th><th>Pendiente luego de entrega</th>
                    </tr></thead>
                    <tbody>
                      {solicitudSeleccionada.items.map(item => {
                        const reutilizable = esEquipoReutilizable(item);
                        const stock = reutilizable ? null : stockCentral.find(
                          row => Number(row.insumoId) === Number(item.insumoId));
                        const pendiente = reutilizable ? 0
                          : Math.max(0, item.cantidadSolicitada - (item.cantidadEntregada || 0));
                        const disponible = Number(stock?.cantidadActual || 0);
                        const maximo = Math.min(pendiente, disponible);
                        const cantidad = Math.max(0, Math.min(
                          Number(cantidadesEntrega[item.id]) || 0, maximo));
                        return (
                          <tr key={item.id}>
                            <td>
                              <strong>{item.insumoNombre}</strong>
                              {reutilizable && <span className="cell-subtext">Equipo reutilizable · se gestiona desde Equipos Médicos</span>}
                            </td>
                            <td>{item.cantidadSolicitada}</td>
                            <td>{reutilizable ? '—' : item.cantidadEntregada || 0}</td>
                            <td>
                              {puedeDespachar && solicitudAbierta && !reutilizable ? (
                                <label className="reposiciones-quantity-field">
                                  <span className="visually-hidden">Cantidad a entregar de {item.insumoNombre}</span>
                                  <input
                                    type="number"
                                    min="0"
                                    max={maximo}
                                    step="1"
                                    disabled={!stock || maximo === 0}
                                    value={cantidadesEntrega[item.id] ?? 0}
                                    aria-label={`Cantidad a entregar de ${item.insumoNombre}`}
                                    onChange={event => {
                                      const ingresada = event.target.value === '' ? 0 : Number(event.target.value);
                                      setCantidadesEntrega(actual => ({
                                        ...actual,
                                        [item.id]: Number.isFinite(ingresada)
                                          ? Math.min(maximo, Math.max(0, Math.trunc(ingresada)))
                                          : 0,
                                      }));
                                    }}
                                  />
                                  <small>{stock ? `Disponible: ${disponible}` : 'Sin stock central'}</small>
                                </label>
                              ) : '—'}
                            </td>
                            <td>{reutilizable ? '—' : puedeDespachar && solicitudAbierta
                              ? Math.max(0, pendiente - cantidad) : pendiente}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              {puedeDespachar && solicitudAbierta && (
                <section id="reposiciones-actions-section"
                  className="reposiciones-section reposiciones-actions-section">
                  <div className="reposiciones-section-heading">
                    <span className="section-index" aria-hidden="true">2</span>
                    <h2>Acciones de gestión</h2>
                  </div>
                  <div className="reposiciones-action-grid">
                    <div className="reposiciones-action-block">
                      <h3>Modificar solicitud</h3>
                      <p className="section-help">Ajustá los elementos o cantidades; los cambios quedan auditados.</p>
                      <Button variant="secondary" size="sm" onClick={iniciarEdicion} disabled={cargandoCatalogo}>
                        {cargandoCatalogo ? 'Cargando catálogo…' : 'Modificar solicitud'}
                      </Button>
                    </div>
                    <div className="reposiciones-action-block">
                      <h3>Registrar entrega</h3>
                      <p className="section-help">Podés registrar una entrega total o parcial de los insumos disponibles.</p>
                      {solicitudSeleccionada.items.every(esEquipoReutilizable) && (
                        <p className="reposiciones-equipment-callout">
                          Esta solicitud contiene solo equipos reutilizables. Gestioná el cambio desde Equipos Médicos.
                        </p>
                      )}
                      <label className="reposiciones-general-note">
                        Observaciones de entrega
                        <textarea rows={2} maxLength={500} value={observacionesEntrega}
                          onChange={event => setObservacionesEntrega(event.target.value)}
                          placeholder="Opcional · hasta 500 caracteres" />
                      </label>
                      <Button size="sm" onClick={entregar}
                        disabled={procesandoId === solicitudSeleccionada.id
                          || !solicitudSeleccionada.items.some(item =>
                            !esEquipoReutilizable(item) && Number(cantidadesEntrega[item.id]) > 0)}>
                        {procesandoId === solicitudSeleccionada.id ? 'Procesando…' : 'Registrar entrega'}
                      </Button>
                    </div>
                    <div className="reposiciones-action-block reposiciones-reject-block">
                      <h3>Rechazar solicitud</h3>
                      <label className="reposiciones-reject-label">
                        Motivo obligatorio
                        <textarea rows={2} maxLength={500} required value={motivoRechazo}
                          onChange={event => setMotivoRechazo(event.target.value)}
                          placeholder="Indicá el motivo que verá el móvil" />
                      </label>
                      <Button size="sm" variant="danger" onClick={rechazar}
                        disabled={procesandoId === solicitudSeleccionada.id || !motivoRechazo.trim()}>
                        {procesandoId === solicitudSeleccionada.id ? 'Procesando…' : 'Rechazar solicitud'}
                      </Button>
                    </div>
                  </div>
                </section>
              )}

              <div className="reposiciones-detail-grid">
                <section className="reposiciones-section reposiciones-equipment-section">
                  <div className="reposiciones-section-heading">
                    <span className="section-index" aria-hidden="true">3</span><h2>Equipos reutilizables</h2>
                  </div>
                  {solicitudSeleccionada.items.filter(esEquipoReutilizable).length === 0
                    ? <p className="section-help">No se solicitaron cambios de equipos.</p>
                    : (
                      <div className="reposiciones-table-scroll">
                        <table className="reposiciones-table detail-table">
                          <thead><tr><th>Elemento</th><th>Motivo</th><th>Control de móvil relacionado</th></tr></thead>
                          <tbody>{solicitudSeleccionada.items.filter(esEquipoReutilizable).map(item => (
                            <tr key={item.id}>
                              <td><strong>{item.insumoNombre}</strong><span className="reposiciones-info-tag">
                                Gestión exclusiva desde Equipos Médicos · sin movimiento de stock
                              </span></td>
                              <td>{MOTIVOS_CAMBIO[item.motivoCambio] || item.motivoCambio || '—'}
                                {item.detalleCambio && <span className="cell-subtext">{item.detalleCambio}</span>}</td>
                              <td>{item.controlFecha ? (
                                <div className="control-reference">
                                  <span>{formatearFecha(item.controlFecha)} · {item.controlResultado}</span>
                                  <span>Serie asignada: {item.controlNumeroSerie || 'FALTANTE'}</span>
                                  {item.controlFaltante && <span className="reposiciones-alert-text">Informado FALTANTE</span>}
                                  {item.controlNoCoincide && <span className="reposiciones-alert-text">
                                    No coincide{item.controlEquipoObservado ? ` · observado: ${item.controlEquipoObservado}` : ''}
                                  </span>}
                                  {item.controlObservacion && <span>{item.controlObservacion}</span>}
                                </div>
                              ) : 'Sin control asociado registrado'}</td>
                            </tr>
                          ))}</tbody>
                        </table>
                      </div>
                    )}
                </section>

                <section className="reposiciones-section">
                  <div className="reposiciones-section-heading">
                    <span className="section-index" aria-hidden="true">4</span><h2>Excepciones de control</h2>
                  </div>
                  {solicitudSeleccionada.motivoExcepcionControl ? (
                    <div className="reposiciones-exception">
                      <strong>{solicitudSeleccionada.motivoExcepcionControl}</strong>
                      <span>Usuario: {solicitudSeleccionada.usuarioExcepcionControl || '—'}</span>
                      <span>Fecha: {formatearFecha(solicitudSeleccionada.fechaExcepcionControl)}</span>
                    </div>
                  ) : <p className="section-help">La solicitud se realizó con el control de móvil completado.</p>}
                </section>

                <section className="reposiciones-section">
                  <div className="reposiciones-section-heading">
                    <span className="section-index" aria-hidden="true">5</span><h2>Observaciones del enfermero</h2>
                  </div>
                  <p className="reposiciones-general-observations">
                    {solicitudSeleccionada.observaciones || 'Sin observaciones generales.'}
                  </p>
                </section>

                {solicitudSeleccionada.entregas?.length > 0 && (
                  <section className="reposiciones-section reposiciones-delivery-history">
                    <div className="reposiciones-section-heading">
                      <span className="section-index" aria-hidden="true">6</span><h2>Observaciones de entrega</h2>
                    </div>
                    <div className="reposiciones-table-scroll">
                      <table className="reposiciones-table detail-table">
                        <thead><tr><th>Fecha y hora</th><th>Coordinador</th><th>Insumo y cantidad</th><th>Observación</th></tr></thead>
                        <tbody>{solicitudSeleccionada.entregas.map((entrega, index) => (
                          <tr key={`${entrega.fecha}-${index}`}>
                            <td>{formatearFecha(entrega.fecha)}</td>
                            <td>{entrega.usuario || '—'}{entrega.usuarioUsername
                              ? <span className="cell-subtext">{entrega.usuarioUsername}</span> : null}</td>
                            <td>{entrega.insumoNombre} · {entrega.cantidad}</td>
                            <td>{entrega.detalle || '—'}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  </section>
                )}

                <section className="reposiciones-section reposiciones-management-history">
                  <div className="reposiciones-section-heading">
                    <span className="section-index" aria-hidden="true">7</span><h2>Historial de gestión</h2>
                  </div>
                  {solicitudSeleccionada.gestiones?.length ? (
                    <div className="reposiciones-table-scroll">
                      <table className="reposiciones-table detail-table">
                        <thead><tr><th>Fecha y hora</th><th>Coordinador</th><th>Acción y cantidades</th><th>Observaciones</th></tr></thead>
                        <tbody>{solicitudSeleccionada.gestiones.map((gestion, index) => (
                          <tr key={`${gestion.fecha}-${index}`}>
                            <td>{formatearFecha(gestion.fecha)}</td>
                            <td>{gestion.coordinador}{gestion.coordinadorUsername
                              ? <span className="cell-subtext">{gestion.coordinadorUsername}</span> : null}</td>
                            <td><strong>{etiquetaAccion(gestion.accion)}</strong>
                              {gestion.detalle && <span className="cell-subtext">{gestion.detalle}</span>}</td>
                            <td>{gestion.observaciones || '—'}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  ) : <p className="section-help">No hay gestiones auditadas previas a esta etapa.</p>}
                  {solicitudSeleccionada.entregas?.length > 0 && (
                    <details className="reposiciones-movement-details">
                      <summary>Movimientos de stock registrados ({solicitudSeleccionada.entregas.length})</summary>
                      <div className="reposiciones-table-scroll">
                        <table className="reposiciones-table detail-table">
                          <thead><tr><th>Fecha y hora</th><th>Coordinador</th><th>Insumo y cantidad</th><th>Detalle</th></tr></thead>
                          <tbody>{solicitudSeleccionada.entregas.map((entrega, index) => (
                            <tr key={`${entrega.fecha}-${index}`}>
                              <td>{formatearFecha(entrega.fecha)}</td>
                              <td>{entrega.usuario || '—'}{entrega.usuarioUsername
                                ? <span className="cell-subtext">{entrega.usuarioUsername}</span> : null}</td>
                              <td>{entrega.insumoNombre} · {entrega.cantidad}</td>
                              <td>{entrega.detalle || '—'}</td>
                            </tr>
                          ))}</tbody>
                        </table>
                      </div>
                    </details>
                  )}
                </section>
              </div>
            </>
          )}
        </main>
      )}
    </div>
  );
}

function formatearFecha(fecha) {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' });
}

function etiquetaAccion(accion) {
  return ({ ENTREGA: 'Reposición realizada', MODIFICACION: 'Solicitud modificada', RECHAZO: 'Solicitud rechazada' })[accion]
    || accion;
}
