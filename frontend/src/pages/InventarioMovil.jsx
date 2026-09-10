import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import { incidenteService, inventarioService } from '../services/api';

const CATEGORIAS = [
  { key: 'MEDICACION', label: 'Medicación', icon: '💊' },
  { key: 'DESCARTABLE', label: 'Descartables', icon: '🧤' },
  { key: 'TRAUMA', label: 'Trauma', icon: '🩹' },
  { key: 'VIA_AEREA', label: 'Vía aérea', icon: '🫁' },
  { key: 'EQUIPO_MEDICO', label: 'Equipos médicos', icon: '🩺' },
  { key: 'OXIGENO', label: 'Oxígeno', icon: '🫧' },
];

export default function InventarioMovil() {
  const navigate = useNavigate();
  const [inventario, setInventario] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [atenciones, setAtenciones] = useState([]);
  const [vista, setVista] = useState('inventario');
  const [loading, setLoading] = useState(true);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [guardiaActiva, setGuardiaActiva] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [cantidades, setCantidades] = useState({});
  const [incidenteId, setIncidenteId] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [solicitudes, setSolicitudes] = useState([]);
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(false);
  const [modalReposicion, setModalReposicion] = useState(false);
  const [reposicionSeleccionados, setReposicionSeleccionados] = useState([]);
  const [reposicionCantidades, setReposicionCantidades] = useState({});
  const [observacionesReposicion, setObservacionesReposicion] = useState('');
  const [insumoManual, setInsumoManual] = useState('');
  const [guardandoReposicion, setGuardandoReposicion] = useState(false);

  useEffect(() => {
    cargarInventario();
    cargarHistorial();
    cargarSolicitudes();
  }, []);

  const cargarInventario = async () => {
    try {
      const response = await inventarioService.miInventario();
      setInventario(response.data);
      setGuardiaActiva(true);
    } catch (exception) {
      const message = exception.response?.data?.message || '';
      if (message.includes('guardia activa')) setGuardiaActiva(false);
      else setError('No se pudo cargar el inventario. Volvé a intentarlo.');
    } finally {
      setLoading(false);
    }
  };

  const cargarHistorial = async () => {
    setLoadingHistorial(true);
    try {
      const response = await inventarioService.miHistorial();
      setHistorial(response.data);
    } catch (exception) {
      const message = exception.response?.data?.message || '';
      if (!message.includes('guardia activa')) setError('No se pudo cargar el historial de uso.');
    } finally {
      setLoadingHistorial(false);
    }
  };

  const cargarSolicitudes = async () => {
    setLoadingSolicitudes(true);
    try {
      const response = await inventarioService.misSolicitudes();
      setSolicitudes(response.data);
    } catch {
      setError('No se pudieron cargar las solicitudes de reposición.');
    } finally {
      setLoadingSolicitudes(false);
    }
  };

  const abrirModal = async () => {
    setError('');
    setMensaje('');
    setCantidades({});
    setIncidenteId('');
    setModalAbierto(true);
    try {
      const response = await incidenteService.listarAsignados();
      setAtenciones((response.data || []).filter(atencion => atencion.estado === 'EN_PROCESO'));
    } catch {
      setAtenciones([]);
      setError('No se pudieron cargar las atenciones activas.');
    }
  };

  const cerrarModal = () => {
    if (!guardando) setModalAbierto(false);
  };

  const actualizarCantidad = (insumoId, valor, maximo) => {
    if (valor === '') {
      setCantidades(previo => ({ ...previo, [insumoId]: '' }));
      return;
    }
    const cantidad = Math.max(0, Math.min(Number(valor) || 0, maximo));
    setCantidades(previo => ({ ...previo, [insumoId]: cantidad }));
  };

  const registrarConsumo = async () => {
    setError('');
    const items = inventario
      .filter(insumo => insumo.tipo === 'CONSUMIBLE')
      .map(insumo => ({ insumoId: insumo.insumoId, cantidad: Number(cantidades[insumo.insumoId]) || 0 }))
      .filter(item => item.cantidad > 0);

    if (items.length === 0) {
      setError('Seleccioná al menos un insumo y una cantidad mayor a cero.');
      return;
    }

    setGuardando(true);
    try {
      await inventarioService.registrarConsumo({
        incidenteId: incidenteId ? Number(incidenteId) : null,
        items,
      });
      setMensaje('Uso registrado correctamente.');
      setModalAbierto(false);
      await Promise.all([cargarInventario(), cargarHistorial()]);
    } catch (exception) {
      setError(exception.response?.data?.message || 'No se pudo registrar el uso.');
    } finally {
      setGuardando(false);
    }
  };

  const abrirModalReposicion = async () => {
    setError('');
    setMensaje('');
    setObservacionesReposicion('');
    setInsumoManual('');
    try {
      const response = await inventarioService.sugerenciaReposicion();
      const sugerencias = response.data || [];
      setReposicionSeleccionados(sugerencias.map(item => item.insumoId));
      setReposicionCantidades(Object.fromEntries(
        sugerencias.map(item => [item.insumoId, item.cantidadSugerida])
      ));
      setModalReposicion(true);
    } catch (exception) {
      setError(exception.response?.data?.message || 'No se pudo calcular la sugerencia de reposición.');
    }
  };

  const agregarInsumoManual = () => {
    if (!insumoManual) return;
    const id = Number(insumoManual);
    if (!reposicionSeleccionados.includes(id)) {
      setReposicionSeleccionados(previo => [...previo, id]);
      setReposicionCantidades(previo => ({ ...previo, [id]: 0 }));
    }
    setInsumoManual('');
  };

  const quitarInsumoReposicion = (insumoId) => {
    setReposicionSeleccionados(previo => previo.filter(id => id !== insumoId));
    setReposicionCantidades(previo => {
      const copia = { ...previo };
      delete copia[insumoId];
      return copia;
    });
  };

  const crearReposicion = async () => {
    setError('');
    const items = reposicionSeleccionados
      .map(insumoId => ({ insumoId, cantidad: Number(reposicionCantidades[insumoId]) || 0 }))
      .filter(item => item.cantidad > 0);
    if (items.length === 0) {
      setError('Seleccioná al menos un insumo con una cantidad mayor a cero.');
      return;
    }
    setGuardandoReposicion(true);
    try {
      await inventarioService.crearReposicion({
        observaciones: observacionesReposicion.trim() || null,
        items,
      });
      setMensaje('Solicitud de reposición creada correctamente.');
      setModalReposicion(false);
      await cargarSolicitudes();
    } catch (exception) {
      setError(exception.response?.data?.message || 'No se pudo crear la solicitud de reposición.');
    } finally {
      setGuardandoReposicion(false);
    }
  };

  const cancelarSolicitud = async (id) => {
    if (!window.confirm('¿Querés cancelar esta solicitud de reposición?')) return;
    try {
      await inventarioService.cancelarSolicitud(id);
      setMensaje('Solicitud cancelada correctamente.');
      await cargarSolicitudes();
    } catch (exception) {
      setError(exception.response?.data?.message || 'No se pudo cancelar la solicitud.');
    }
  };

  const consumibles = inventario.filter(insumo => insumo.tipo === 'CONSUMIBLE');
  const grupos = CATEGORIAS.map(categoria => ({
    ...categoria,
    insumos: inventario.filter(insumo => insumo.categoria === categoria.key),
  })).filter(categoria => categoria.insumos.length > 0);
  const lotes = Object.values(historial.reduce((gruposPorLote, registro) => {
    const grupo = gruposPorLote[registro.loteId] || { loteId: registro.loteId, registros: [] };
    grupo.registros.push(registro);
    gruposPorLote[registro.loteId] = grupo;
    return gruposPorLote;
  }, {}));

  return (
    <div style={S.page}>
      <Sidebar />
      <main style={S.main}>
        <header style={S.header}>
          <div>
            <p style={S.overline}>Operación del móvil</p>
            <h1 style={S.h1}>Inventario móvil</h1>
            <p style={S.sub}>Consultá y registrá el uso de los insumos de tu guardia.</p>
          </div>
          <div style={S.headerActions}>
            {guardiaActiva && <button style={S.btnHeader} onClick={abrirModal}>📦 Registrar uso</button>}
            {guardiaActiva && <button style={S.btnHeader} onClick={abrirModalReposicion}>📋 Solicitar reposición</button>}
            <div style={S.headerIcon}>🎒</div>
          </div>
        </header>

        {mensaje && <div style={S.success}>{mensaje}</div>}
        {error && !modalAbierto && <div style={S.error}>{error}</div>}

        {!loading && !guardiaActiva && (
          <EmptyState
            icon="🩺"
            title="No tenés una guardia activa"
            description="Iniciá tu guardia para ver el inventario del móvil asignado."
            action={<Button onClick={() => navigate('/guardias')}>Ir a Guardia</Button>}
          />
        )}
        {loading && <div style={S.status}>Cargando inventario...</div>}

        {!loading && guardiaActiva && (
          <>
            <div style={S.tabs}>
              <button style={{ ...S.tab, ...(vista === 'inventario' ? S.tabActive : {}) }} onClick={() => setVista('inventario')}>Stock actual</button>
              <button style={{ ...S.tab, ...(vista === 'historial' ? S.tabActive : {}) }} onClick={() => setVista('historial')}>Historial de uso</button>
              <button style={{ ...S.tab, ...(vista === 'solicitudes' ? S.tabActive : {}) }} onClick={() => setVista('solicitudes')}>Solicitudes de reposición</button>
            </div>

            {vista === 'inventario' && (
              inventario.length === 0
                ? <EmptyState icon="📦" title="Inventario sin cargar" description="El móvil todavía no tiene insumos inicializados." />
                : <div style={S.categoryGrid}>
                  {grupos.map(categoria => (
                    <section key={categoria.key} style={S.category}>
                      <div style={S.categoryHeader}>
                        <span style={S.categoryIcon}>{categoria.icon}</span>
                        <h2 style={S.categoryTitle}>{categoria.label}</h2>
                        <span style={S.count}>{categoria.insumos.length}</span>
                      </div>
                      <div style={S.itemList}>
                        {categoria.insumos.map(insumo => (
                          <div key={insumo.insumoId} style={S.item}>
                            <div style={S.itemInfo}>
                              <span style={S.itemName}>{insumo.nombre}</span>
                              {insumo.tipo === 'REUTILIZABLE' && <span style={S.reusable}>Reutilizable</span>}
                            </div>
                            <div style={S.quantity}>
                              <strong>{insumo.cantidadActual}</strong>
                              {insumo.unidadMedida && <span>{insumo.unidadMedida}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
            )}

            {vista === 'historial' && (
              loadingHistorial
                ? <div style={S.status}>Cargando historial...</div>
                : lotes.length === 0
                  ? <EmptyState icon="🧾" title="Sin registros de uso" description="Todavía no hay consumos registrados para este móvil." />
                  : <div style={S.historyList}>{lotes.map(lote => <LoteCard key={lote.loteId} lote={lote} />)}</div>
            )}

            {vista === 'solicitudes' && (
              loadingSolicitudes
                ? <div style={S.status}>Cargando solicitudes...</div>
                : solicitudes.length === 0
                  ? <EmptyState icon="📋" title="Sin solicitudes" description="Todavía no enviaste solicitudes de reposición." />
                  : <div style={S.historyList}>{solicitudes.map(solicitud => (
                    <SolicitudCard key={solicitud.id} solicitud={solicitud} onCancelar={cancelarSolicitud} />
                  ))}</div>
            )}
          </>
        )}
      </main>

      {modalAbierto && (
        <div style={S.overlay} onMouseDown={cerrarModal}>
          <div style={S.modal} onMouseDown={event => event.stopPropagation()}>
            <div style={S.modalHeader}>
              <div>
                <p style={S.sectionLabel}>Stock del móvil</p>
                <h2 style={S.modalTitle}>Registrar uso de insumos</h2>
              </div>
              <button style={S.closeButton} onClick={cerrarModal} aria-label="Cerrar">×</button>
            </div>
            {error && <div style={S.error}>{error}</div>}
            <label style={S.label} htmlFor="incidente">Atención asociada (opcional)</label>
            <select id="incidente" style={S.input} value={incidenteId} onChange={event => setIncidenteId(event.target.value)}>
              <option value="">Sin atención asociada</option>
              {atenciones.map(atencion => (
                <option key={atencion.id} value={atencion.id}>
                  #{atencion.numeroIncidente || atencion.id} — {atencion.ubicacion}
                </option>
              ))}
            </select>
            <p style={S.label}>Insumos consumibles</p>
            <div style={S.consumableList}>
              {consumibles.map(insumo => (
                <div key={insumo.insumoId} style={S.consumableRow}>
                  <div style={S.consumableInfo}>
                    <span style={S.itemName}>{insumo.nombre}</span>
                    <span style={S.available}>Disponible: {insumo.cantidadActual}</span>
                  </div>
                  <input
                    style={S.quantityInput}
                    type="number"
                    min="0"
                    max={insumo.cantidadActual}
                    value={cantidades[insumo.insumoId] ?? ''}
                    onChange={event => actualizarCantidad(insumo.insumoId, event.target.value, insumo.cantidadActual)}
                  />
                </div>
              ))}
            </div>
            <div style={S.modalActions}>
              <Button variant="secondary" onClick={cerrarModal}>Cancelar</Button>
              <Button onClick={registrarConsumo} disabled={guardando}>{guardando ? 'Guardando...' : 'Confirmar uso'}</Button>
            </div>
          </div>
        </div>
      )}

      {modalReposicion && (
        <div style={S.overlay} onMouseDown={() => !guardandoReposicion && setModalReposicion(false)}>
          <div style={S.modal} onMouseDown={event => event.stopPropagation()}>
            <div style={S.modalHeader}>
              <div>
                <p style={S.sectionLabel}>Stock real contra estándar</p>
                <h2 style={S.modalTitle}>Solicitar reposición</h2>
              </div>
              <button style={S.closeButton} onClick={() => !guardandoReposicion && setModalReposicion(false)} aria-label="Cerrar">×</button>
            </div>
            {error && <div style={S.error}>{error}</div>}
            <div style={S.manualRow}>
              <select style={{ ...S.input, marginBottom: 0 }} value={insumoManual} onChange={event => setInsumoManual(event.target.value)}>
                <option value="">Agregar otro insumo del móvil...</option>
                {inventario.filter(item => !reposicionSeleccionados.includes(item.insumoId)).map(item => (
                  <option key={item.insumoId} value={item.insumoId}>{item.nombre}</option>
                ))}
              </select>
              <button style={S.btnSecondary} onClick={agregarInsumoManual}>Agregar</button>
            </div>
            <p style={S.hint}>Las cantidades sugeridas son editables. También podés incluir equipos reutilizables.</p>
            <div style={S.consumableList}>
              {reposicionSeleccionados.map(insumoId => {
                const insumo = inventario.find(item => item.insumoId === insumoId);
                if (!insumo) return null;
                return (
                  <div key={insumoId} style={S.consumableRow}>
                    <div style={S.consumableInfo}>
                      <span style={S.itemName}>{insumo.nombre}</span>
                      <span style={S.available}>Stock actual: {insumo.cantidadActual}</span>
                    </div>
                    <input
                      style={S.quantityInput}
                      type="number"
                      min="0"
                      value={reposicionCantidades[insumoId] ?? 0}
                      onChange={event => setReposicionCantidades(previo => ({ ...previo, [insumoId]: Math.max(0, Number(event.target.value) || 0) }))}
                    />
                    <button style={S.removeButton} onClick={() => quitarInsumoReposicion(insumoId)} aria-label={`Quitar ${insumo.nombre}`}>×</button>
                  </div>
                );
              })}
            </div>
            <label style={S.label} htmlFor="observaciones-reposicion">Observaciones (opcional)</label>
            <textarea id="observaciones-reposicion" style={S.textarea} value={observacionesReposicion} onChange={event => setObservacionesReposicion(event.target.value)} placeholder="Ej.: tensiómetro roto o faltante durante la guardia" />
            <div style={S.modalActions}>
              <Button variant="secondary" onClick={() => setModalReposicion(false)}>Cancelar</Button>
              <Button onClick={crearReposicion} disabled={guardandoReposicion}>{guardandoReposicion ? 'Enviando...' : 'Enviar solicitud'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LoteCard({ lote }) {
  const primero = lote.registros[0];
  return (
    <section style={S.historyCard}>
      <div style={S.historyHeader}>
        <div>
          <p style={S.sectionLabel}>Lote de uso</p>
          <h2 style={S.historyTitle}>{formatearFecha(primero.fecha)}</h2>
        </div>
        <span style={S.loteBadge}>{lote.registros.length} insumo{lote.registros.length !== 1 ? 's' : ''}</span>
      </div>
      <p style={S.historyMeta}>
        {primero.enfermeroNombre} · {primero.incidenteId ? `Atención #${primero.incidenteId}${primero.incidenteUbicacion ? ` · ${primero.incidenteUbicacion}` : ''}` : 'Sin atención asociada'}
      </p>
      <div style={S.historyItems}>
        {lote.registros.map(registro => (
          <div key={registro.id} style={S.historyItem}><span>{registro.insumoNombre}</span><strong>{registro.cantidad}</strong></div>
        ))}
      </div>
    </section>
  );
}

function SolicitudCard({ solicitud, onCancelar }) {
  const pendiente = solicitud.estado === 'PENDIENTE';
  return (
    <section style={S.historyCard}>
      <div style={S.historyHeader}>
        <div>
          <p style={S.sectionLabel}>Solicitud #{solicitud.id}</p>
          <h2 style={S.historyTitle}>{formatearFecha(solicitud.fecha)}</h2>
        </div>
        <span style={{ ...S.statusBadge, ...(pendiente ? S.pendingBadge : S.cancelledBadge) }}>{solicitud.estado}</span>
      </div>
      {solicitud.observaciones && <p style={S.historyMeta}>{solicitud.observaciones}</p>}
      <div style={S.historyItems}>
        {solicitud.items.map((item, index) => (
          <div key={`${item.insumoNombre}-${index}`} style={S.historyItem}>
            <span>{item.insumoNombre}</span>
            <strong>{item.cantidadSolicitada}</strong>
          </div>
        ))}
      </div>
      {pendiente && <button style={S.cancelButton} onClick={() => onCancelar(solicitud.id)}>Cancelar solicitud</button>}
    </section>
  );
}

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' });
}

const S = {
  page: { display: 'flex', minHeight: '100vh', background: 'var(--color-page-bg)', color: 'var(--color-text-primary)' },
  main: { flex: 1, minWidth: 0, padding: 'var(--spacing-7)', maxWidth: 'var(--max-content-width)', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--spacing-5)', padding: 'var(--spacing-6)', marginBottom: 'var(--spacing-6)', background: 'var(--color-primary)', borderRadius: 'var(--radius-xl)', color: 'var(--color-on-primary)', boxShadow: 'var(--shadow-md)' },
  overline: { margin: '0 0 var(--spacing-2)', color: 'rgba(255,255,255,0.72)', fontSize: 'var(--font-size-xs)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' },
  h1: { margin: 0, color: 'var(--color-on-primary)', fontSize: 'var(--font-size-4xl)', lineHeight: 'var(--line-height-heading)' },
  sub: { margin: 'var(--spacing-2) 0 0', color: 'rgba(255,255,255,0.86)', fontSize: 'var(--font-size-md)' },
  headerActions: { display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' },
  btnHeader: { padding: '0.75rem 1rem', color: 'var(--color-primary-strong)', background: 'var(--color-surface)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 700 },
  headerIcon: { display: 'grid', placeItems: 'center', width: '4.5rem', height: '4.5rem', flexShrink: 0, borderRadius: 'var(--radius-lg)', background: 'rgba(255,255,255,0.16)', fontSize: '2.2rem' },
  success: { marginBottom: 'var(--spacing-5)', padding: 'var(--spacing-4) var(--spacing-5)', color: 'var(--color-success)', background: '#eaf7ef', border: '1px solid #b9e4c8', borderRadius: 'var(--radius-md)' },
  error: { marginBottom: 'var(--spacing-4)', padding: 'var(--spacing-4) var(--spacing-5)', color: 'var(--color-danger)', background: '#fff0f0', border: '1px solid #f1c6c6', borderRadius: 'var(--radius-md)' },
  status: { padding: 'var(--spacing-7)', textAlign: 'center', color: 'var(--color-text-secondary)' },
  tabs: { display: 'flex', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-5)', borderBottom: '1px solid var(--color-border)' },
  tab: { padding: '0.8rem 1rem', color: 'var(--color-text-secondary)', background: 'transparent', border: 'none', borderBottom: '3px solid transparent', cursor: 'pointer', fontWeight: 700 },
  tabActive: { color: 'var(--color-primary-strong)', borderBottomColor: 'var(--color-primary)' },
  categoryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(19rem, 1fr))', gap: 'var(--spacing-5)' },
  category: { overflow: 'hidden', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' },
  categoryHeader: { display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', padding: 'var(--spacing-4) var(--spacing-5)', background: 'var(--color-surface-alt)', borderBottom: '1px solid var(--color-border)' },
  categoryIcon: { fontSize: '1.35rem' },
  categoryTitle: { flex: 1, margin: 0, fontSize: 'var(--font-size-lg)' },
  count: { minWidth: '1.6rem', padding: '0.2rem 0.4rem', textAlign: 'center', color: 'var(--color-primary-strong)', background: 'var(--color-primary-soft)', borderRadius: 'var(--radius-pill)', fontSize: 'var(--font-size-xs)', fontWeight: 700 },
  itemList: { padding: '0 var(--spacing-5)' },
  item: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--spacing-4)', padding: 'var(--spacing-4) 0', borderBottom: '1px solid var(--color-border)' },
  itemInfo: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-2)', minWidth: 0 },
  itemName: { fontSize: 'var(--font-size-md)', fontWeight: 600 },
  reusable: { padding: '0.2rem 0.45rem', color: 'var(--color-info)', background: '#e8f3fb', borderRadius: 'var(--radius-pill)', fontSize: 'var(--font-size-xxs)', fontWeight: 700 },
  quantity: { display: 'flex', alignItems: 'baseline', gap: '0.3rem', flexShrink: 0, color: 'var(--color-text-secondary)' },
  historyList: { display: 'grid', gap: 'var(--spacing-5)' },
  historyCard: { padding: 'var(--spacing-5)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' },
  historyHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--spacing-4)' },
  historyTitle: { margin: 'var(--spacing-1) 0 0', fontSize: 'var(--font-size-lg)' },
  historyMeta: { margin: 'var(--spacing-3) 0', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' },
  loteBadge: { padding: '0.3rem 0.55rem', color: 'var(--color-primary-strong)', background: 'var(--color-primary-soft)', borderRadius: 'var(--radius-pill)', fontSize: 'var(--font-size-xs)', fontWeight: 700 },
  historyItems: { display: 'grid', gap: 'var(--spacing-2)' },
  historyItem: { display: 'flex', justifyContent: 'space-between', padding: 'var(--spacing-3)', background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-sm)' },
  overlay: { position: 'fixed', inset: 0, zIndex: 'var(--z-modal)', display: 'grid', placeItems: 'center', padding: 'var(--spacing-5)', background: 'rgba(15,42,48,0.48)' },
  modal: { width: 'min(100%, 40rem)', maxHeight: '90vh', overflowY: 'auto', padding: 'var(--spacing-6)', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-5)' },
  modalTitle: { margin: 'var(--spacing-1) 0 0', fontSize: 'var(--font-size-2xl)' },
  closeButton: { alignSelf: 'flex-start', color: 'var(--color-text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.8rem', lineHeight: 1 },
  sectionLabel: { margin: 0, color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' },
  label: { display: 'block', margin: '0 0 var(--spacing-2)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', fontWeight: 700 },
  input: { width: '100%', boxSizing: 'border-box', marginBottom: 'var(--spacing-5)', padding: '0.75rem', color: 'var(--color-text-primary)', background: 'var(--color-surface)', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-md)' },
  consumableList: { display: 'grid', gap: 'var(--spacing-2)', maxHeight: '22rem', overflowY: 'auto', marginBottom: 'var(--spacing-5)' },
  consumableRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--spacing-4)', padding: 'var(--spacing-3)', background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' },
  consumableInfo: { display: 'grid', gap: '0.2rem', minWidth: 0 },
  available: { color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' },
  quantityInput: { width: '5rem', padding: '0.6rem', textAlign: 'center', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-size-md)' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-3)' },
  manualRow: { display: 'grid', gridTemplateColumns: '1fr auto', gap: 'var(--spacing-2)', alignItems: 'start' },
  btnSecondary: { padding: '0.7rem 0.9rem', color: 'var(--color-primary-strong)', background: 'var(--color-primary-soft)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 700 },
  hint: { margin: '0 0 var(--spacing-4)', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' },
  textarea: { width: '100%', minHeight: '5rem', boxSizing: 'border-box', marginBottom: 'var(--spacing-5)', padding: '0.75rem', resize: 'vertical', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-md)', fontFamily: 'inherit', fontSize: 'var(--font-size-md)' },
  removeButton: { color: 'var(--color-danger)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.3rem' },
  statusBadge: { padding: '0.35rem 0.6rem', borderRadius: 'var(--radius-pill)', fontSize: 'var(--font-size-xs)', fontWeight: 700 },
  pendingBadge: { color: '#8a5a00', background: '#fff3d6' },
  cancelledBadge: { color: 'var(--color-text-muted)', background: 'var(--color-surface-muted)' },
  cancelButton: { marginTop: 'var(--spacing-4)', padding: '0.6rem 0.85rem', color: 'var(--color-danger)', background: 'transparent', border: '1px solid #e4bcbc', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 700 },
};
