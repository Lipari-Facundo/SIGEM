import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import EmptyState from '../components/ui/EmptyState';
import { inventarioService } from '../services/api';

export default function SolicitudesReposicion() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const cargarSolicitudes = async () => {
    try {
      const response = await inventarioService.solicitudesPendientes();
      setSolicitudes(response.data);
    } catch (exception) {
      setError(exception.response?.data?.message || 'No se pudieron cargar las solicitudes pendientes.');
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
            <p style={S.overline}>Abastecimiento</p>
            <h1 style={S.h1}>Solicitudes de reposición</h1>
            <p style={S.sub}>Solicitudes pendientes de los móviles en servicio.</p>
          </div>
          <div style={S.icon}>📋</div>
        </header>

        {/* Vista de solo consulta: la aprobación y gestión quedan para una HU posterior. */}
        {loading && <div style={S.status}>Cargando solicitudes...</div>}
        {!loading && error && <div style={S.error}>{error}</div>}
        {!loading && !error && solicitudes.length === 0 && (
          <EmptyState icon="✅" title="No hay solicitudes pendientes" description="No existen solicitudes de reposición para revisar en este momento." />
        )}
        {!loading && !error && solicitudes.length > 0 && (
          <div style={S.list}>
            {solicitudes.map(solicitud => (
              <section key={solicitud.id} style={S.card}>
                <div style={S.cardHeader}>
                  <div>
                    <p style={S.label}>Solicitud #{solicitud.id}</p>
                    <h2 style={S.title}>{solicitud.movilNumeroInterno} · {solicitud.enfermeroNombre}</h2>
                  </div>
                  <span style={S.badge}>PENDIENTE</span>
                </div>
                <p style={S.meta}>{formatearFecha(solicitud.fecha)}</p>
                {solicitud.observaciones && <p style={S.observaciones}>{solicitud.observaciones}</p>}
                <div style={S.items}>
                  {solicitud.items.map((item, index) => (
                    <div key={`${item.insumoNombre}-${index}`} style={S.item}>
                      <div>
                        <strong>{item.insumoNombre}</strong>
                        <span style={S.category}>{item.categoria}</span>
                      </div>
                      <div style={S.amounts}>
                        <span>Actual: {item.cantidadActualAlMomento}</span>
                        <strong>Solicitado: {item.cantidadSolicitada}</strong>
                      </div>
                    </div>
                  ))}
                </div>
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
  meta: { margin: 'var(--spacing-3) 0', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' },
  observaciones: { margin: '0 0 var(--spacing-4)', padding: 'var(--spacing-3)', color: 'var(--color-text-secondary)', background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-sm)' },
  items: { display: 'grid', gap: 'var(--spacing-2)' },
  item: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--spacing-4)', padding: 'var(--spacing-3)', background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-sm)' },
  category: { display: 'block', marginTop: '0.2rem', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' },
  amounts: { display: 'grid', gap: '0.2rem', textAlign: 'right', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)' },
};
