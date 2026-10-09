import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import { depositoCentralService, inventarioService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ESTADOS = {
  PENDIENTE: 'Pendiente',
  PARCIAL: 'Entrega parcial',
  COMPLETADA: 'Completada',
  RECHAZADA: 'Rechazada',
  CANCELADA: 'Cancelada',
};

export default function SolicitudesReposicion() {
  const { user } = useAuth();
  const [solicitudes, setSolicitudes] = useState([]);
  const [stockCentral, setStockCentral] = useState([]);
  const [cantidadesEntrega, setCantidadesEntrega] = useState({});
  const [motivosRechazo, setMotivosRechazo] = useState({});
  const [rechazoAbierto, setRechazoAbierto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [procesandoId, setProcesandoId] = useState(null);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const puedeDespachar = ['JEF', 'ADM'].includes(user?.rol);

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const cargarSolicitudes = async () => {
    try {
      const requestsPromise = inventarioService.solicitudesPendientes();
      const [requestsResponse, stockResponse] = puedeDespachar
        ? await Promise.all([requestsPromise, depositoCentralService.stock()])
        : [await requestsPromise, { data: [] }];
      setSolicitudes(requestsResponse.data || []);
      setStockCentral(stockResponse.data || []);
      const cantidadesIniciales = {};
      (requestsResponse.data || []).forEach(solicitud => {
        solicitud.items.forEach(item => {
          cantidadesIniciales[item.id] ??= 0;
        });
      });
      setCantidadesEntrega(cantidadesIniciales);
      setError('');
    } catch (exception) {
      setError(exception.response?.data?.message || 'No se pudieron cargar las solicitudes pendientes.');
    } finally {
      setLoading(false);
    }
  };

  const entregar = async (solicitud) => {
    const items = solicitud.items
      .map(item => ({ itemId: item.id, cantidad: Number(cantidadesEntrega[item.id]) || 0 }))
      .filter(item => item.cantidad > 0);
    if (!items.length) {
      setError(`Seleccioná cantidades para entregar en la solicitud #${solicitud.id}.`);
      return;
    }
    setError('');
    setProcesandoId(solicitud.id);
    try {
      await inventarioService.entregarReposicion(solicitud.id, { items });
      setMensaje(`Entrega registrada para la solicitud #${solicitud.id}.`);
      await cargarSolicitudes();
    } catch (exception) {
      setError(exception.response?.data?.message || 'No se pudo registrar la entrega.');
    } finally {
      setProcesandoId(null);
    }
  };

  const rechazar = async (solicitud) => {
    const motivo = motivosRechazo[solicitud.id]?.trim();
    if (!motivo) {
      setError('Ingresá el motivo para rechazar la solicitud.');
      return;
    }
    setError('');
    setProcesandoId(solicitud.id);
    try {
      await inventarioService.rechazarReposicion(solicitud.id, motivo);
      setMensaje(`Solicitud #${solicitud.id} rechazada con motivo registrado.`);
      setRechazoAbierto(null);
      await cargarSolicitudes();
    } catch (exception) {
      setError(exception.response?.data?.message || 'No se pudo rechazar la solicitud.');
    } finally {
      setProcesandoId(null);
    }
  };

  return (
    <div style={S.page}>
      <Sidebar />
      <main style={S.main}>
        <header style={S.header}>
          <div>
            <p style={S.overline}>Abastecimiento</p>
            <h1 style={S.h1}>Solicitudes de reposición</h1>
            <p style={S.sub}>Solicitudes abiertas de los móviles y existencias disponibles en central.</p>
          </div>
          <div style={S.icon}>📋</div>
        </header>

        {mensaje && <div style={S.success}>{mensaje}</div>}
        {loading && <div style={S.status}>Cargando solicitudes...</div>}
        {!loading && error && <div style={S.error}>{error}</div>}
        {!loading && !error && solicitudes.length === 0 && (
          <EmptyState icon="✅" title="No hay solicitudes pendientes" description="No existen solicitudes de reposición para revisar en este momento." />
        )}
        {!loading && solicitudes.length > 0 && (
          <div style={S.list}>
            {solicitudes.map(solicitud => (
              <section key={solicitud.id} style={S.card}>
                <div style={S.cardHeader}>
                  <div>
                    <p style={S.label}>Solicitud #{solicitud.id}</p>
                    <h2 style={S.title}>{solicitud.movilNumeroInterno} · {solicitud.enfermeroNombre}</h2>
                  </div>
                  <span style={{ ...S.badge, ...(solicitud.estado === 'PARCIAL' ? S.badgePartial : {}) }}>{ESTADOS[solicitud.estado] || solicitud.estado}</span>
                </div>
                <p style={S.meta}>{formatearFecha(solicitud.fecha)}</p>
                {solicitud.observaciones && <p style={S.observaciones}>{solicitud.observaciones}</p>}
                {solicitud.usuarioUltimaGestion && (
                  <p style={S.meta}>Última gestión: {solicitud.usuarioUltimaGestion} · {formatearFecha(solicitud.fechaUltimaGestion)}</p>
                )}
                <div style={S.items}>
                  {solicitud.items.map((item, index) => (
                    <div key={`${item.insumoNombre}-${index}`} style={S.item}>
                      <div>
                        <strong>{item.insumoNombre}</strong>
                        <span style={S.category}>{item.categoria}</span>
                        {item.motivoCambio && <span style={S.changeReason}>{etiquetaMotivo(item.motivoCambio)}{item.detalleCambio ? ` · ${item.detalleCambio}` : ''}</span>}
                      </div>
                      <div style={S.amounts}>
                        <span>Al solicitar: {item.cantidadActualAlMomento}</span>
                        <span>Entregado: {item.cantidadEntregada || 0} / {item.cantidadSolicitada}</span>
                        {puedeDespachar && (() => {
                          const stock = stockCentral.find(row => row.insumoId === item.insumoId);
                          const pendiente = item.cantidadSolicitada - (item.cantidadEntregada || 0);
                          const maximo = Math.min(pendiente, stock?.cantidadActual || 0);
                          return (
                            <label style={S.deliveryField}>
                              <span>{stock ? `Central: ${stock.cantidadActual}` : 'Sin alta en depósito'}</span>
                              <select
                                style={S.deliverySelect}
                                value={cantidadesEntrega[item.id] ?? 0}
                                disabled={!stock || maximo === 0}
                                onChange={event => setCantidadesEntrega(previous => ({ ...previous, [item.id]: Number(event.target.value) }))}
                                aria-label={`Entregar de ${item.insumoNombre}`}
                              >
                                {Array.from({ length: maximo + 1 }, (_, cantidad) => <option key={cantidad} value={cantidad}>{cantidad}</option>)}
                              </select>
                            </label>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
                {puedeDespachar && (
                  <div style={S.dispatchActions}>
                    <Button size="sm" onClick={() => entregar(solicitud)} disabled={procesandoId === solicitud.id}>
                      {procesandoId === solicitud.id ? 'Procesando...' : 'Registrar entrega'}
                    </Button>
                    <button type="button" style={S.rejectToggle} onClick={() => setRechazoAbierto(rechazoAbierto === solicitud.id ? null : solicitud.id)}>Rechazar</button>
                    {rechazoAbierto === solicitud.id && (
                      <div style={S.rejectForm}>
                        <textarea
                          style={S.rejectReason}
                          maxLength={500}
                          value={motivosRechazo[solicitud.id] || ''}
                          onChange={event => setMotivosRechazo(previous => ({ ...previous, [solicitud.id]: event.target.value }))}
                          placeholder="Motivo que verá el móvil solicitante"
                        />
                        <Button size="sm" variant="danger" onClick={() => rechazar(solicitud)} disabled={procesandoId === solicitud.id}>Confirmar rechazo</Button>
                      </div>
                    )}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' });
}

function etiquetaMotivo(motivo) {
  return ({ ROTURA: 'Ruptura', FALTANTE: 'Faltante', FALLA: 'No funciona', DESGASTE: 'Desgaste', OTRO: 'Otro' })[motivo] || motivo;
}

const S = {
  page: { display: 'flex', minHeight: '100vh', background: 'var(--color-page-bg)', color: 'var(--color-text-primary)' },
  main: { flex: 1, minWidth: 0, padding: 'var(--spacing-7)', maxWidth: 'var(--max-content-width)', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--spacing-5)', padding: 'var(--spacing-6)', marginBottom: 'var(--spacing-6)', background: 'var(--color-primary)', borderRadius: 'var(--radius-xl)', color: 'var(--color-on-primary)', boxShadow: 'var(--shadow-md)' },
  overline: { margin: '0 0 var(--spacing-2)', color: 'rgba(255,255,255,0.72)', fontSize: 'var(--font-size-xs)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' },
  h1: { margin: 0, color: 'var(--color-on-primary)', fontSize: 'var(--font-size-4xl)' },
  sub: { margin: 'var(--spacing-2) 0 0', color: 'rgba(255,255,255,0.86)', fontSize: 'var(--font-size-md)' },
  icon: { display: 'grid', placeItems: 'center', width: '4.5rem', height: '4.5rem', borderRadius: 'var(--radius-lg)', background: 'rgba(255,255,255,0.16)', fontSize: '2.2rem' },
  status: { padding: 'var(--spacing-7)', textAlign: 'center', color: 'var(--color-text-secondary)' },
  error: { padding: 'var(--spacing-4) var(--spacing-5)', color: 'var(--color-danger)', background: '#fff0f0', border: '1px solid #f1c6c6', borderRadius: 'var(--radius-md)' },
  list: { display: 'grid', gap: 'var(--spacing-5)' },
  card: { padding: 'var(--spacing-5)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--spacing-4)' },
  label: { margin: 0, color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' },
  title: { margin: 'var(--spacing-1) 0 0', fontSize: 'var(--font-size-lg)' },
  badge: { padding: '0.35rem 0.6rem', color: '#8a5a00', background: '#fff3d6', borderRadius: 'var(--radius-pill)', fontSize: 'var(--font-size-xs)', fontWeight: 700 },
  badgePartial: { color: 'var(--color-primary-strong)', background: 'var(--color-primary-soft)' },
  meta: { margin: 'var(--spacing-3) 0', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' },
  observaciones: { margin: '0 0 var(--spacing-4)', padding: 'var(--spacing-3)', color: 'var(--color-text-secondary)', background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-sm)' },
  items: { display: 'grid', gap: 'var(--spacing-2)' },
  item: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-4)', padding: 'var(--spacing-3)', background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-sm)' },
  category: { display: 'block', marginTop: '0.2rem', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' },
  changeReason: { display: 'block', marginTop: '0.25rem', color: 'var(--color-warning-strong)', fontSize: 'var(--font-size-xs)' },
  amounts: { display: 'grid', gap: '0.2rem', textAlign: 'left', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)' },
  deliveryField: { display: 'grid', justifyItems: 'start', gap: '0.25rem', marginTop: '0.25rem', fontWeight: 700 },
  deliverySelect: { width: '5rem', minHeight: '40px', padding: '0.35rem', textAlign: 'center', color: 'var(--color-text-primary)', background: 'var(--color-surface)', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-sm)' },
  dispatchActions: { display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', flexWrap: 'wrap', marginTop: 'var(--spacing-4)', paddingTop: 'var(--spacing-3)', borderTop: '1px solid var(--color-border)' },
  rejectToggle: { minHeight: '40px', padding: '0.5rem 0.8rem', color: 'var(--color-danger-strong)', background: 'transparent', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 700 },
  rejectForm: { display: 'flex', flex: '1 1 100%', gap: 'var(--spacing-2)', alignItems: 'end', flexWrap: 'wrap' },
  rejectReason: { flex: '1 1 16rem', minHeight: '72px', boxSizing: 'border-box', padding: '0.6rem', color: 'var(--color-text-primary)', background: 'var(--color-surface)', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-sm)' },
  success: { padding: 'var(--spacing-3)', color: 'var(--color-success-strong)', background: 'var(--color-success-soft)', border: '1px solid var(--color-success)', borderRadius: 'var(--radius-sm)' },
};
