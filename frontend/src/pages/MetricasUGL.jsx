import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { incidenteService } from '../services/api';
import KpiCard from '../components/ui/KpiCard';

// ─── Mapeos y Constantes de Filtro ──────────────────────────────────────────

const PRIORIDAD_COLORS = {
  ALTA:  { bg: '#FFEBEE', color: '#C62828' },
  MEDIA: { bg: '#FFF8E1', color: '#F57F17' },
  BAJA:  { bg: '#E8F5E9', color: '#2E7D32' },
};

const ESTADO_COLORS = {
  PENDIENTE:  { bg: '#FFF8E1', color: '#F57F17' },
  EN_PROCESO: { bg: '#E3F2FD', color: '#1565C0' },
  RECHAZADO:  { bg: '#FFEBEE', color: '#C62828' },
  FINALIZADO: { bg: '#E8F5E9', color: '#2E7D32' },
};

const ESTADO_LABELS = {
  PENDIENTE: 'Pendiente', 
  EN_PROCESO: 'En atención',
  RECHAZADO: 'Rechazado', 
  FINALIZADO: 'Finalizado',
};

const PRIORIDADES = ['TODAS', 'ALTA', 'MEDIA', 'BAJA'];
const ESTADOS     = ['TODOS', 'PENDIENTE', 'EN_PROCESO', 'RECHAZADO', 'FINALIZADO'];

export default function MetricasUGL() {
  const [incidents, setIncidents] = useState([]);
  const [metrics, setMetrics] = useState({
    totalIncidents: 0,
    incidentsByPriority: {},
    incidentsByStatus: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados de Filtros
  const [filtroPrioridad, setFiltroPrioridad] = useState('TODAS');
  const [filtroEstado, setFiltroEstado]       = useState('TODOS');
  const [filtroTexto, setFiltroTexto]         = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [incRes, metRes] = await Promise.all([
          incidenteService.listarTodos(),
          incidenteService.metricasUGL(),
        ]);
        setIncidents(incRes.data || []);
        setMetrics(metRes.data || {});
      } catch (err) {
        setError('No se pudieron cargar las métricas UGL.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Lógica de Filtrado
  const filtrados = incidents.filter((inc) => {
    if (filtroPrioridad !== 'TODAS' && inc.prioridad !== filtroPrioridad) return false;
    if (filtroEstado !== 'TODOS' && inc.estado !== filtroEstado) return false;
    if (filtroTexto.trim()) {
      const q = filtroTexto.toLowerCase();
      return (
        inc.titulo?.toLowerCase().includes(q) ||
        inc.ubicacion?.toLowerCase().includes(q) ||
        `${inc.asignadoA?.nombre || ''} ${inc.asignadoA?.apellido || ''}`.toLowerCase().includes(q) ||
        `${inc.creadoPor?.nombre || ''} ${inc.creadoPor?.apellido || ''}`.toLowerCase().includes(q) ||
        inc.pacienteNombre?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const hayFiltros = filtroPrioridad !== 'TODAS' || filtroEstado !== 'TODOS' || filtroTexto.trim() !== '';
  const limpiarFiltros = () => {
    setFiltroPrioridad('TODAS');
    setFiltroEstado('TODOS');
    setFiltroTexto('');
  };

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
        label={`Estado ${ESTADO_LABELS[status] || status}`}
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

          {/* Panel de Filtros */}
          <section style={S.filterCard}>
            <div style={S.filtrosHeader}>
              <h2 style={S.filterCardTitle}>🔍 Filtros</h2>
              {hayFiltros && (
                <button onClick={limpiarFiltros} style={S.btnLimpiar}>
                  ✕ Limpiar filtros
                </button>
              )}
            </div>

            <input
              style={S.searchInput}
              placeholder="Buscar por título, ubicación, asignado o paciente..."
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
            />

            <div style={S.filtrosRow}>
              {/* Filtro Prioridad */}
              <div style={S.filtroGroup}>
                <span style={S.filtroLabel}>Prioridad</span>
                <div style={S.chipRow}>
                  {PRIORIDADES.map((p) => {
                    const activo = filtroPrioridad === p;
                    const col = PRIORIDAD_COLORS[p]?.color || 'var(--color-primary)';
                    return (
                      <button
                        key={p}
                        onClick={() => setFiltroPrioridad(p)}
                        style={{
                          ...S.chip,
                          background: activo ? col : 'var(--color-surface, #fff)',
                          color: activo ? '#fff' : 'var(--color-text-secondary)',
                          borderColor: activo ? col : 'var(--color-border)',
                        }}
                      >
                        {p === 'TODAS' ? 'Todas' : p}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Filtro Estado */}
              <div style={S.filtroGroup}>
                <span style={S.filtroLabel}>Estado</span>
                <div style={S.chipRow}>
                  {ESTADOS.map((e) => {
                    const activo = filtroEstado === e;
                    const col = ESTADO_COLORS[e]?.color || 'var(--color-primary)';
                    return (
                      <button
                        key={e}
                        onClick={() => setFiltroEstado(e)}
                        style={{
                          ...S.chip,
                          background: activo ? col : 'var(--color-surface, #fff)',
                          color: activo ? '#fff' : 'var(--color-text-secondary)',
                          borderColor: activo ? col : 'var(--color-border)',
                        }}
                      >
                        {e === 'TODOS' ? 'Todos' : ESTADO_LABELS[e] || e}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <p style={S.resultadoTexto}>
              Mostrando <strong>{filtrados.length}</strong> de <strong>{incidents.length}</strong> incidentes
              {hayFiltros && ' (filtros activos)'}
            </p>
          </section>

          <section style={S.tableSection}>
            <div style={S.tableHeader}>
              <h2 style={S.tableTitle}>Incidentes globales</h2>
              <p style={S.tableSubtitle}>Listado completo de todos los incidentes registrados en SIGEM.</p>
            </div>

            {loading ? (
              <div style={S.loading}>Cargando incidentes...</div>
            ) : filtrados.length === 0 ? (
              <div style={S.loading}>No hay incidentes que coincidan con los filtros.</div>
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
                    {filtrados.map((inc) => {
                      const pc = PRIORIDAD_COLORS[inc.prioridad] || {};
                      const ec = ESTADO_COLORS[inc.estado] || {};
                      return (
                        <tr key={inc.id}>
                          <td style={{ ...S.td, color: 'var(--color-primary)', fontWeight: 700 }}>{inc.id}</td>
                          <td style={S.td}>{inc.titulo || 'Sin título'}</td>
                          <td style={S.td}>{inc.ubicacion || '—'}</td>
                          <td style={S.td}>
                            {inc.prioridad ? (
                              <span style={{ ...S.badge, background: pc.bg || '#eee', color: pc.color || '#333' }}>
                                {inc.prioridad}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td style={S.td}>
                            {inc.estado ? (
                              <span style={{ ...S.badge, background: ec.bg || '#eee', color: ec.color || '#333' }}>
                                {ESTADO_LABELS[inc.estado] || inc.estado}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td style={S.td}>
                            {inc.asignadoA ? `${inc.asignadoA.nombre || ''} ${inc.asignadoA.apellido || ''}`.trim() : '—'}
                          </td>
                          <td style={S.td}>
                            {inc.creadoPor ? `${inc.creadoPor.nombre || ''} ${inc.creadoPor.apellido || ''}`.trim() : '—'}
                          </td>
                          <td style={S.td}>
                            {inc.fechaAsignacion
                              ? new Date(inc.fechaAsignacion).toLocaleString('es-AR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '—'}
                          </td>
                        </tr>
                      );
                    })}
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
  
  // Card Filtros
  filterCard: { background: 'var(--color-surface, #fff)', borderRadius: '1rem', padding: '1.5rem', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.1))', display: 'flex', flexDirection: 'column', gap: '1rem' },
  filterCardTitle: { margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' },
  filtrosHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' },
  searchInput: { padding: '0.65rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', fontSize: '0.9rem', outline: 'none', background: 'var(--color-surface, #fff)', color: 'var(--color-text-primary)', width: '100%', boxSizing: 'border-box' },
  filtrosRow: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  filtroGroup: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  filtroLabel: { fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  chipRow: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  chip: { padding: '5px 12px', borderRadius: '9999px', border: '1px solid', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.15s' },
  btnLimpiar: { padding: '5px 14px', borderRadius: '9999px', border: '1px solid var(--color-danger)', background: 'var(--color-danger-soft)', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700 },
  resultadoTexto: { fontSize: '0.82rem', color: 'var(--color-text-secondary)', margin: 0 },

  // Tabla
  tableSection: { marginTop: '1.5rem' },
  tableHeader: { marginBottom: '1rem' },
  tableTitle: { margin: 0, fontSize: '1.4rem' },
  tableSubtitle: { margin: '0.4rem 0 0', color: 'var(--color-text-secondary)' },
  tableWrapper: { overflowX: 'auto', borderRadius: '1rem', border: '1px solid var(--color-border)' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '900px' },
  loading: { padding: '2.5rem', textAlign: 'center', color: 'var(--color-text-secondary)' },
  th: { textAlign: 'left', padding: '1rem', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-muted)', color: 'var(--color-text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em' },
  td: { padding: '1rem', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-primary)', verticalAlign: 'middle' },
  badge: { display: 'inline-flex', padding: '3px 10px', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 700 },
};