import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { incidenteService } from '../services/api';
import KpiCard from '../components/ui/KpiCard';

export default function MetricasUGL() {
  const [incidents, setIncidents] = useState([]);
  const [metrics, setMetrics] = useState({
    totalIncidents: 0,
    incidentsByPriority: {},
    incidentsByStatus: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [incRes, metRes] = await Promise.all([
          incidenteService.listarTodos(),
          incidenteService.metricasUGL(),
        ]);
        setIncidents(incRes.data);
        setMetrics(metRes.data);
      } catch (err) {
        setError('No se pudieron cargar las métricas UGL.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const renderPriorityCards = () => {
    return Object.entries(metrics.incidentsByPriority || {}).map(([priority, count]) => (
      <KpiCard
        key={priority}
        label={`Prioridad ${priority}`}
        value={count}
        meta="Incidentes"
      />
    ));
  };

  const renderStatusCards = () => {
    return Object.entries(metrics.incidentsByStatus || {}).map(([status, count]) => (
      <KpiCard
        key={status}
        label={`Estado ${status}`}
        value={count}
        meta="Incidentes"
      />
    ));
  };

  return (
    <div style={S.page}>
      <Sidebar />
      <main style={S.main}>
        <div style={S.content}>
          <header style={S.header}>
            <div>
              <h1 style={S.title}>Métricas UGL</h1>
              <p style={S.subtitle}>
                Vista global para Directivo/Gerencia con todas las incidencias y métricas del sistema.
              </p>
            </div>
          </header>

          {error && <div style={S.error}>{error}</div>}

          <section style={S.metricsGrid}>
            <KpiCard
              label="Total de incidentes"
              value={metrics.totalIncidents}
              meta="UGL Global"
              icon="📊"
            />
            {renderPriorityCards()}
            {renderStatusCards()}
          </section>

          <section style={S.tableSection}>
            <div style={S.tableHeader}>
              <h2 style={S.tableTitle}>Incidentes globales</h2>
              <p style={S.tableSubtitle}>Listado completo de todos los incidentes registrados en SIGEM.</p>
            </div>

            {loading ? (
              <div style={S.loading}>Cargando incidentes...</div>
            ) : (
              <div style={S.tableWrapper}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>ID</th>
                      <th style={S.th}>Título</th>
                      <th style={S.th}>Ubicación</th>
                      <th style={S.th}>Prioridad</th>
                      <th style={S.th}>Estado</th>
                      <th style={S.th}>Asignado a</th>
                      <th style={S.th}>Creado por</th>
                      <th style={S.th}>Fecha asignación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incidents.map((inc) => (
                      <tr key={inc.id}>
                        <td style={S.td}>{inc.id}</td>
                        <td style={S.td}>{inc.titulo}</td>
                        <td style={S.td}>{inc.ubicacion}</td>
                        <td style={S.td}>{inc.prioridad}</td>
                        <td style={S.td}>{inc.estado}</td>
                        <td style={S.td}>{inc.asignadoA?.nombre} {inc.asignadoA?.apellido}</td>
                        <td style={S.td}>{inc.creadoPor?.nombre} {inc.creadoPor?.apellido}</td>
                        <td style={S.td}>{new Date(inc.fechaAsignacion).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

const S = {
  page: { display: 'flex', minHeight: '100vh', fontFamily: 'var(--font-family-sans)', background: 'var(--color-page-bg)', color: 'var(--color-text-primary)' },
  main: { flex: 1, padding: 'var(--spacing-6)', background: 'var(--color-page-bg)' },
  content: { width: '100%', maxWidth: 'var(--content-width)', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  header: { display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' },
  title: { margin: 0, fontSize: '2rem', fontWeight: 800 },
  subtitle: { margin: '0.5rem 0 0', color: 'var(--color-text-secondary)' },
  error: { padding: '1rem', borderRadius: '0.75rem', background: 'var(--color-danger-soft)', color: 'var(--color-danger)', marginBottom: '1rem' },
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' },
  tableSection: { marginTop: '1.5rem' },
  tableHeader: { marginBottom: '1rem' },
  tableTitle: { margin: 0, fontSize: '1.4rem' },
  tableSubtitle: { margin: '0.4rem 0 0', color: 'var(--color-text-secondary)' },
  tableWrapper: { overflowX: 'auto', borderRadius: '1rem', border: '1px solid var(--color-border)' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '900px' },
  loading: { padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-secondary)' },
  th: { textAlign: 'left', padding: '1rem', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-muted)', color: 'var(--color-text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em' },
  td: { padding: '1rem', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-primary)' },
};
