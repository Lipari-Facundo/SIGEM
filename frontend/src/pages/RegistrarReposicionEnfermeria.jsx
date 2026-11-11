import { useCallback, useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Button from '../components/ui/Button';
import { reposicionInternaService } from '../services/api';
import './RegistrarReposicionEnfermeria.css';

const PRIORIDADES = [
  { value: 'URGENTE', label: 'Urgente' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'PROGRAMADA', label: 'Programada' },
];

const ESTADO_BADGE_CLASSES = {
  PENDIENTE: 'is-pending',
  EN_PROCESO: 'is-processing',
  PARCIAL: 'is-pending',
  APROBADA: 'is-completed',
  COMPLETADA: 'is-completed',
  ENTREGADA: 'is-completed',
  RECHAZADA: 'is-rejected',
  CANCELADA: 'is-neutral',
};

const PRIORIDAD_BADGE_CLASSES = {
  URGENTE: 'is-urgent',
  NORMAL: 'is-normal',
  PROGRAMADA: 'is-scheduled',
};

const parseRequestDate = (value) => {
  if (!value) return null;
  const isoDate = typeof value === 'string'
    && !/(Z|[+-]\d{2}:\d{2})$/i.test(value)
    ? `${value}Z`
    : value;
  const date = new Date(isoDate);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getRequestTimestamp = (request) => {
  if (Number.isFinite(request.fechaEmisionEpochMillis)) {
    return request.fechaEmisionEpochMillis;
  }
  return parseRequestDate(request.fechaEmision || request.fecha)?.getTime() ?? null;
};

export default function RegistrarReposicionEnfermeria() {
  const [catalogo, setCatalogo] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [insumoSeleccionado, setInsumoSeleccionado] = useState('');
  const [items, setItems] = useState([]);
  const [prioridad, setPrioridad] = useState('NORMAL');
  const [observaciones, setObservaciones] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [error, setError] = useState('');
  const [solicitud, setSolicitud] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(true);
  const [reloj, setReloj] = useState(Date.now());
  const [solicitudEditando, setSolicitudEditando] = useState(null);
  const [prioridadEdicion, setPrioridadEdicion] = useState('NORMAL');
  const [itemsEdicion, setItemsEdicion] = useState([]);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [descargandoId, setDescargandoId] = useState(null);
  const [errorEdicion, setErrorEdicion] = useState('');
  const [mostrarArchivadas, setMostrarArchivadas] = useState(false);
  const [solicitudesArchivadas, setSolicitudesArchivadas] = useState([]);
  const [cargandoArchivadas, setCargandoArchivadas] = useState(false);
  const [errorArchivadas, setErrorArchivadas] = useState('');
  const [actualizandoArchivoId, setActualizandoArchivoId] = useState(null);

  useEffect(() => {
    let vigente = true;
    reposicionInternaService.catalogo()
      .then(({ data }) => {
        if (vigente) setCatalogo(Array.isArray(data) ? data : []);
      })
      .catch((exception) => {
        if (vigente) setError(exception.response?.data?.message || 'No se pudo cargar el catálogo autorizado.');
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => { vigente = false; };
  }, []);

  const cargarHistorial = useCallback(async () => {
    setCargandoHistorial(true);
    try {
      const { data } = await reposicionInternaService.historial();
      setHistorial(Array.isArray(data) ? data : []);
      setError('');
    } catch (exception) {
      setError(exception.response?.data?.message || 'No se pudo cargar el historial.');
    } finally {
      setCargandoHistorial(false);
    }
  }, []);

  const cargarArchivadas = useCallback(async () => {
    setCargandoArchivadas(true);
    setErrorArchivadas('');
    try {
      const { data } = await reposicionInternaService.archivadas();
      setSolicitudesArchivadas(Array.isArray(data) ? data : []);
    } catch (exception) {
      setErrorArchivadas(exception.response?.data?.message || 'No se pudieron cargar las solicitudes archivadas.');
    } finally {
      setCargandoArchivadas(false);
    }
  }, []);

  useEffect(() => {
    cargarHistorial();
  }, [cargarHistorial]);

  useEffect(() => {
    const timer = window.setInterval(() => setReloj(Date.now()), 15000);
    return () => window.clearInterval(timer);
  }, []);

  const resultados = useMemo(() => {
    const termino = busqueda.trim().toLocaleLowerCase('es');
    return catalogo.filter((insumo) => {
      const disponible = !items.some((item) => item.insumoId === insumo.insumoId);
      const coincide = !termino
        || `${insumo.nombre} ${insumo.categoria} ${insumo.unidadMedida || ''}`
          .toLocaleLowerCase('es')
          .includes(termino);
      return disponible && coincide;
    });
  }, [busqueda, catalogo, items]);

  const agregarInsumo = () => {
    const insumo = catalogo.find((item) => String(item.insumoId) === insumoSeleccionado);
    if (!insumo) {
      setError('Seleccioná un insumo del catálogo del depósito central.');
      return;
    }

    setItems((anteriores) => [...anteriores, { ...insumo, cantidadSolicitada: '1' }]);
    setInsumoSeleccionado('');
    setBusqueda('');
    setError('');
  };

  const actualizarCantidad = (insumoId, value) => {
    setItems((anteriores) => anteriores.map((item) => (
      item.insumoId === insumoId ? { ...item, cantidadSolicitada: value } : item
    )));
  };

  const quitarInsumo = (insumoId) => {
    setItems((anteriores) => anteriores.filter((item) => item.insumoId !== insumoId));
  };

  const crearSolicitud = async (event) => {
    event.preventDefault();
    if (items.length === 0) {
      setError('Agregá al menos un insumo a la solicitud.');
      return;
    }
    if (items.some((item) => !Number.isInteger(Number(item.cantidadSolicitada))
      || Number(item.cantidadSolicitada) < 1)) {
      setError('Todas las cantidades deben ser números enteros mayores a cero.');
      return;
    }

    setGuardando(true);
    setError('');
    try {
      const { data } = await reposicionInternaService.crear({
        prioridad,
        observaciones: observaciones.trim() || null,
        items: items.map(({ insumoId, cantidadSolicitada }) => ({
          insumoId,
          cantidad: Number(cantidadSolicitada),
        })),
      });
      setSolicitud(data);
      setHistorial((anteriores) => [
        data,
        ...anteriores.filter((request) => request.id !== data.id),
      ].sort((a, b) => (
        (getRequestTimestamp(b) || 0) - (getRequestTimestamp(a) || 0)
      )));
      setItems([]);
      setObservaciones('');
    } catch (exception) {
      setError(exception.response?.data?.message || 'No se pudo registrar la solicitud.');
    } finally {
      setGuardando(false);
    }
  };

  const descargarPdf = async (solicitudId) => {
    if (!solicitudId) return;
    setDescargandoId(solicitudId);
    setDescargando(true);
    setError('');
    try {
      const response = await reposicionInternaService.exportarPdf(solicitudId);
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `solicitud-interna-${solicitudId}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (exception) {
      setError(exception.response?.data?.message || 'No se pudo descargar el PDF.');
    } finally {
      setDescargando(false);
      setDescargandoId(null);
    }
  };

  const abrirEdicion = (request) => {
    setSolicitudEditando(request);
    setPrioridadEdicion(request.prioridad || 'NORMAL');
    setItemsEdicion((request.items || []).map((item) => ({
      insumoId: item.insumoId,
      insumoNombre: item.insumoNombre,
      cantidadSolicitada: String(item.cantidadSolicitada ?? ''),
    })));
    setErrorEdicion('');
  };

  const actualizarCantidadEdicion = (insumoId, value) => {
    setItemsEdicion((actuales) => actuales.map((item) => (
      item.insumoId === insumoId ? { ...item, cantidadSolicitada: value } : item
    )));
  };

  const guardarEdicion = async (event) => {
    event.preventDefault();
    if (!solicitudEditando) return;
    if (itemsEdicion.length === 0 || itemsEdicion.some((item) => (
      !Number.isInteger(Number(item.cantidadSolicitada)) || Number(item.cantidadSolicitada) < 1
    ))) {
      setErrorEdicion('Todas las cantidades deben ser números enteros mayores a cero.');
      return;
    }

    setGuardandoEdicion(true);
    setErrorEdicion('');
    try {
      const { data } = await reposicionInternaService.actualizar(solicitudEditando.id, {
        prioridad: prioridadEdicion,
        items: itemsEdicion.map(({ insumoId, cantidadSolicitada }) => ({
          insumoId,
          cantidad: Number(cantidadSolicitada),
        })),
      });
      setHistorial((anteriores) => anteriores.map((request) => (
        request.id === data.id ? data : request
      )));
      if (solicitud?.id === data.id) setSolicitud(data);
      setSolicitudEditando(null);
      await cargarHistorial();
    } catch (exception) {
      setErrorEdicion(exception.response?.data?.message
        || 'No se pudo modificar la solicitud.');
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const estaEnVentanaDeEdicion = (request) => {
    const emitidaEn = getRequestTimestamp(request) ?? Number.NaN;
    return Number.isFinite(emitidaEn)
      && reloj - emitidaEn <= 10 * 60 * 1000
      && reloj >= emitidaEn
      && request.estado === 'PENDIENTE';
  };

  const alternarArchivo = async (request, archivedList = false) => {
    setActualizandoArchivoId(request.id);
    setErrorArchivadas('');
    setError('');
    try {
      const { data } = await reposicionInternaService.alternarArchivo(request.id);
      if (data.archivado) {
        setHistorial((current) => current.filter((entry) => entry.id !== request.id));
        setSolicitudesArchivadas((current) => [
          data,
          ...current.filter((entry) => entry.id !== request.id),
        ].sort((a, b) => (getRequestTimestamp(b) || 0) - (getRequestTimestamp(a) || 0)));
      } else {
        setSolicitudesArchivadas((current) => current.filter((entry) => entry.id !== request.id));
        await cargarHistorial();
      }
    } catch (exception) {
      console.error('Error al alternar el archivo de la solicitud:', exception);
      const responseData = exception.response?.data;
      const message = responseData?.message
        || responseData?.error
        || (exception.response
          ? `El servidor rechazó la operación (HTTP ${exception.response.status}).`
          : 'No se pudo conectar con el servidor para actualizar el archivo.');
      if (archivedList) setErrorArchivadas(message);
      else setError(message);
    } finally {
      setActualizandoArchivoId(null);
    }
  };

  const abrirArchivadas = async () => {
    setMostrarArchivadas(true);
    await cargarArchivadas();
  };

  return (
    <div className="internal-requisition-page">
      <Sidebar />
      <main className="internal-requisition-main">
        <header className="internal-requisition-header">
          <div>
            <p className="internal-requisition-eyebrow">Depósito central · Enfermería</p>
            <h1>Solicitud interna de reposición</h1>
            <p>Seleccioná los insumos autorizados para solicitar reposición del área.</p>
          </div>
        </header>

        {error && <div className="internal-requisition-alert is-error" role="alert">{error}</div>}
        {solicitud && (
          <div className="internal-requisition-alert is-success" role="status" aria-live="polite">
            <div>
              <strong>Solicitud #{solicitud.id} registrada correctamente.</strong>
              <span>
                {solicitud.solicitanteNombre || 'Solicitante autenticado'}
                {solicitud.fechaEmision
                  ? ` · ${new Date(solicitud.fechaEmision).toLocaleString('es-AR')}`
                  : ' · Fecha registrada automáticamente'}
              </span>
            </div>
            <Button type="button" disabled={descargando} onClick={() => descargarPdf(solicitud.id)}>
              {descargando ? 'Preparando PDF…' : 'Descargar PDF'}
            </Button>
          </div>
        )}

        <form className="internal-requisition-card" onSubmit={crearSolicitud}>
          <section className="internal-requisition-catalog" aria-labelledby="internal-catalog-title">
            <div className="internal-requisition-section-heading">
              <div>
                <h2 id="internal-catalog-title">Catálogo de insumos</h2>
                <p>Solo se muestran insumos activos del depósito central.</p>
              </div>
              <span className="internal-requisition-count">{catalogo.length} insumos</span>
            </div>

            <div className="internal-requisition-add-row">
              <label className="internal-requisition-field">
                <span>Buscar insumo</span>
                <input
                  type="search"
                  value={busqueda}
                  onChange={(event) => {
                    setBusqueda(event.target.value);
                    setInsumoSeleccionado('');
                  }}
                  placeholder="Nombre o categoría"
                  disabled={cargando}
                />
              </label>
              <label className="internal-requisition-field">
                <span>Insumo autorizado</span>
                <select
                  value={insumoSeleccionado}
                  onChange={(event) => setInsumoSeleccionado(event.target.value)}
                  disabled={cargando || resultados.length === 0}
                >
                  <option value="">Seleccionar insumo</option>
                  {resultados.map((insumo) => (
                    <option key={insumo.insumoId} value={insumo.insumoId}>
                      {insumo.nombre} · {insumo.cantidadActual ?? 0} en stock
                    </option>
                  ))}
                </select>
              </label>
              <Button type="button" disabled={!insumoSeleccionado} onClick={agregarInsumo}>Agregar</Button>
            </div>

            {cargando && <p className="internal-requisition-muted">Cargando catálogo…</p>}
            {!cargando && catalogo.length === 0 && (
              <p className="internal-requisition-muted">No hay insumos activos autorizados en el depósito central.</p>
            )}
          </section>

          <section className="internal-requisition-details" aria-labelledby="internal-items-title">
            <div className="internal-requisition-section-heading">
              <div>
                <h2 id="internal-items-title">Insumos solicitados</h2>
                <p>Ajustá las cantidades antes de registrar la solicitud.</p>
              </div>
              <label className="internal-requisition-field internal-requisition-priority">
                <span>Prioridad</span>
                <select value={prioridad} onChange={(event) => setPrioridad(event.target.value)}>
                  {PRIORIDADES.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            </div>

            {items.length === 0 ? (
              <div className="internal-requisition-empty">Todavía no agregaste insumos.</div>
            ) : (
              <div className="internal-requisition-table-wrap">
                <table className="internal-requisition-table">
                  <thead>
                    <tr><th>Insumo</th><th>Unidad</th><th>Stock actual</th><th>Cantidad</th><th>Acción</th></tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.insumoId}>
                        <td><strong>{item.nombre}</strong><small>{item.categoria}</small></td>
                        <td>{item.unidadMedida || '—'}</td>
                        <td>{item.cantidadActual ?? 0}</td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={item.cantidadSolicitada}
                            aria-label={`Cantidad solicitada de ${item.nombre}`}
                            onChange={(event) => actualizarCantidad(item.insumoId, event.target.value)}
                          />
                        </td>
                        <td>
                          <button type="button" className="internal-requisition-remove" onClick={() => quitarInsumo(item.insumoId)}>
                            Quitar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <label className="internal-requisition-field internal-requisition-notes">
            <span>Observaciones (opcional)</span>
            <textarea
              value={observaciones}
              onChange={(event) => setObservaciones(event.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="Agregá contexto para el depósito central"
            />
          </label>

          <footer className="internal-requisition-footer">
            <span>La fecha y el usuario solicitante se asignan automáticamente.</span>
            <Button type="submit" disabled={guardando || cargando || items.length === 0}>
              {guardando ? 'Registrando…' : 'Registrar solicitud'}
            </Button>
          </footer>
        </form>

        <section className="internal-requisition-history" aria-labelledby="internal-history-title">
          <div className="internal-requisition-section-heading">
            <div>
              <h2 id="internal-history-title">Historial de solicitudes internas</h2>
              <p>Las solicitudes pendientes pueden editarse durante los primeros 10 minutos.</p>
            </div>
            <Button type="button" onClick={abrirArchivadas}>
              Ver Archivados
            </Button>
          </div>

          {cargandoHistorial ? (
            <p className="internal-requisition-muted">Cargando historial…</p>
          ) : historial.length === 0 ? (
            <div className="internal-requisition-empty">Todavía no hay solicitudes internas registradas.</div>
          ) : (
            <div className="internal-requisition-table-wrap internal-requisition-history-wrap">
              <table className="internal-requisition-table internal-requisition-history-table">
                <colgroup>
                  <col className="history-col-date" />
                  <col className="history-col-status" />
                  <col className="history-col-priority" />
                  <col className="history-col-requester" />
                  <col className="history-col-supplies" />
                  <col className="history-col-quantity" />
                  <col className="history-col-actions" />
                </colgroup>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th>Prioridad</th>
                    <th>Solicitante</th>
                    <th>Insumos</th>
                    <th>Cantidad</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((request) => (
                    <tr key={request.id}>
                      <td className="history-cell-date">{getRequestTimestamp(request) !== null
                        ? new Intl.DateTimeFormat('es-AR', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                          hourCycle: 'h23',
                        }).format(new Date(getRequestTimestamp(request)))
                        : '—'}</td>
                      <td>
                        <span className={`internal-requisition-badge ${
                          ESTADO_BADGE_CLASSES[request.estado] || 'is-neutral'
                        }`}>
                          {request.estado || '—'}
                        </span>
                      </td>
                      <td>
                        <span className={`internal-requisition-badge ${
                          PRIORIDAD_BADGE_CLASSES[request.prioridad] || 'is-neutral'
                        }`}>
                          {request.prioridad || '—'}
                        </span>
                      </td>
                      <td className="history-cell-requester">
                        {request.solicitanteNombre || request.enfermeroNombre || '—'}
                      </td>
                      <td>
                        {Array.isArray(request.items) && request.items.length > 0 ? (
                          <div className="internal-requisition-history-items">
                            {request.items.map((item) => (
                              <div className="internal-requisition-history-item" key={item.id || item.insumoId}>
                                {item.insumoNombre || `Insumo #${item.insumoId}`}
                              </div>
                            ))}
                          </div>
                        ) : 'Sin insumos'}
                      </td>
                      <td>
                        {Array.isArray(request.items) && request.items.length > 0 ? (
                          <div className="internal-requisition-history-items internal-requisition-quantities">
                            {request.items.map((item) => (
                              <div className="internal-requisition-history-item" key={item.id || item.insumoId}>
                                {item.cantidadSolicitada ?? '—'}
                              </div>
                            ))}
                          </div>
                        ) : '—'}
                      </td>
                      <td className="history-cell-actions">
                        <div className="internal-requisition-actions">
                          <Button
                            size="sm"
                            style={{ padding: '0.35rem 0.3rem', fontSize: '0.66rem', minWidth: 0, flexShrink: 0 }}
                            type="button"
                            disabled={descargando}
                            onClick={() => descargarPdf(request.id)}
                          >
                            {descargandoId === request.id ? 'Preparando…' : 'Descargar PDF'}
                          </Button>
                          {estaEnVentanaDeEdicion(request) && (
                            <Button
                              size="sm"
                              style={{ padding: '0.35rem 0.3rem', fontSize: '0.66rem', minWidth: 0, flexShrink: 0 }}
                              type="button"
                              onClick={() => abrirEdicion(request)}
                            >
                              Editar
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="danger"
                            style={{ padding: '0.35rem 0.3rem', fontSize: '0.66rem', minWidth: 0, flexShrink: 0 }}
                            type="button"
                            disabled={actualizandoArchivoId === request.id}
                            onClick={() => alternarArchivo(request)}
                          >
                            {actualizandoArchivoId === request.id ? 'Archivando…' : 'Archivar'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {solicitudEditando && (
          <div className="internal-requisition-modal-backdrop" role="presentation">
            <section
              className="internal-requisition-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="internal-edit-title"
            >
              <header className="internal-requisition-modal-header">
                <div>
                  <h2 id="internal-edit-title">Editar solicitud #{solicitudEditando.id}</h2>
                  <p>El plazo de edición vence a los 10 minutos desde su registro.</p>
                </div>
                <button
                  type="button"
                  className="internal-requisition-modal-close"
                  onClick={() => setSolicitudEditando(null)}
                  aria-label="Cerrar"
                >
                  ×
                </button>
              </header>

              <form onSubmit={guardarEdicion}>
                {errorEdicion && (
                  <div className="internal-requisition-alert is-error" role="alert">
                    {errorEdicion}
                  </div>
                )}
                <label className="internal-requisition-field internal-requisition-priority">
                  <span>Prioridad</span>
                  <select
                    value={prioridadEdicion}
                    onChange={(event) => setPrioridadEdicion(event.target.value)}
                  >
                    {PRIORIDADES.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>

                <div className="internal-requisition-table-wrap internal-requisition-edit-items">
                  <table className="internal-requisition-table">
                    <thead><tr><th>Insumo</th><th>Cantidad</th></tr></thead>
                    <tbody>
                      {itemsEdicion.map((item) => (
                        <tr key={item.insumoId}>
                          <td>{item.insumoNombre || `Insumo #${item.insumoId}`}</td>
                          <td>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={item.cantidadSolicitada}
                              aria-label={`Cantidad solicitada de ${item.insumoNombre || item.insumoId}`}
                              onChange={(event) => actualizarCantidadEdicion(
                                item.insumoId, event.target.value,
                              )}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <footer className="internal-requisition-modal-actions">
                  <Button
                    type="button"
                    disabled={guardandoEdicion}
                    onClick={() => setSolicitudEditando(null)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={guardandoEdicion}>
                    {guardandoEdicion ? 'Guardando…' : 'Guardar cambios'}
                  </Button>
                </footer>
              </form>
            </section>
          </div>
        )}

        {mostrarArchivadas && (
          <div
            className="internal-requisition-modal-backdrop"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setMostrarArchivadas(false);
            }}
          >
            <section
              className="internal-requisition-modal internal-requisition-archived-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="internal-archived-title"
            >
              <header className="internal-requisition-modal-header">
                <div>
                  <h2 id="internal-archived-title">Solicitudes archivadas</h2>
                  <p>Desarchivá una solicitud para devolverla al historial principal.</p>
                </div>
                <button
                  type="button"
                  className="internal-requisition-modal-close"
                  onClick={() => setMostrarArchivadas(false)}
                  aria-label="Cerrar solicitudes archivadas"
                >
                  ×
                </button>
              </header>

              {errorArchivadas && (
                <div className="internal-requisition-alert is-error" role="alert">
                  {errorArchivadas}
                </div>
              )}
              {cargandoArchivadas ? (
                <p className="internal-requisition-muted">Cargando solicitudes archivadas…</p>
              ) : solicitudesArchivadas.length === 0 ? (
                <div className="internal-requisition-empty">No hay solicitudes archivadas.</div>
              ) : (
                <div className="internal-requisition-table-wrap internal-requisition-archived-table-wrap">
                  <table className="internal-requisition-table internal-requisition-archived-table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Solicitante</th>
                        <th>Insumos</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {solicitudesArchivadas.map((request) => (
                        <tr key={request.id}>
                          <td className="history-cell-date">
                            {getRequestTimestamp(request) !== null
                              ? new Intl.DateTimeFormat('es-AR', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                                hourCycle: 'h23',
                              }).format(new Date(getRequestTimestamp(request)))
                              : '—'}
                          </td>
                          <td>{request.solicitanteNombre || request.enfermeroNombre || '—'}</td>
                          <td>
                            {Array.isArray(request.items) && request.items.length > 0
                              ? request.items.map((item) => (
                                <div key={item.id || item.insumoId}>
                                  {item.insumoNombre || `Insumo #${item.insumoId}`}
                                  {' — '}
                                  {item.cantidadSolicitada ?? '—'}
                                </div>
                              ))
                              : 'Sin insumos'}
                          </td>
                          <td>
                            <Button
                              size="sm"
                              variant="secondary"
                              type="button"
                              disabled={actualizandoArchivoId === request.id}
                              onClick={() => alternarArchivo(request, true)}
                            >
                              {actualizandoArchivoId === request.id ? 'Restaurando…' : 'Desarchivar'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
