import React, { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import './IncidentCharts.css';
import DashboardHeader from './DashboardHeader';
import ChartCard from './ChartCard';
import KpiSummary from './KpiSummary';
import BarChart from './BarChart';
import { incidenteService, movilService } from '../../services/api';

const TEAL = '#1B6B6B';
const DONUT_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B'];

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const label = item.payload?.name || item.payload?.label || item.name || 'Sin etiqueta';
  const value = Number(item.value) || 0;

  return (
    <div style={S.tooltip}>
      <strong>{label}</strong>
      <span>{value}</span>
    </div>
  );
}

function HorizontalBarChart({ data, ariaLabel }) {
  return (
    <div style={S.responsiveChart} role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height={250}>
        <RechartsBarChart data={data} layout="vertical" margin={{ top: 8, right: 12, left: 4, bottom: 8 }}>
          <CartesianGrid horizontal={false} vertical stroke="#E5EFF0" />
          <XAxis
            type="number"
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#4D6D75', fontSize: 11 }}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={124}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#0F2A2A', fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F1F8F8' }} />
          <Bar dataKey="value" radius={[0, 5, 5, 0]} barSize={18}>
            {data.map((entry, index) => (
              <Cell key={entry.label} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

function DoughnutChart({ data, ariaLabel }) {
  return (
    <div style={S.doughnutChart} role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="52%" outerRadius="78%" paddingAngle={3}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div style={S.doughnutLegend} aria-label="Referencias del gráfico">
        {data.map((entry, index) => (
          <span key={entry.name} style={S.legendItem}>
            <span style={{ ...S.legendDot, background: DONUT_COLORS[index % DONUT_COLORS.length] }} />
            {entry.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return <div style={S.skeletonCard} />;
}

export default function IncidentCharts() {
  const [series, setSeries] = useState(null);
  const [fleetStatus, setFleetStatus] = useState({});
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setError('');
      setLoading(true);
      try {
        const params = { startDate, endDate };
        const [dashboardRes, fleetRes, incidentsRes] = await Promise.all([
          incidenteService.dashboard(params),
          movilService.metricasEstado(),
          incidenteService.listarTodos(),
        ]);
        if (mounted) {
          setSeries(dashboardRes.data);
          setFleetStatus(fleetRes.data || {});
          setIncidents(incidentsRes.data || []);
        }
      } catch (e) {
        if (mounted) setError('No se pudieron cargar los datos del dashboard.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [startDate, endDate]);

  function applyPreset(days) {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days + 1);
    setStartDate(start.toISOString().slice(0, 10));
    setEndDate(end.toISOString().slice(0, 10));
  }

  const kpis = useMemo(() => {
    if (!series) return [];
    return [
      {
        icon: '🚨',
        title: 'Incidentes totales',
        value: series.totalIncidents ?? 0,
        subtitle: 'Registrados en el período',
      },
      {
        icon: '🚘',
        title: 'Móviles activos',
        value: series.activeVehicles ?? 0,
        subtitle: 'Vehículos operativos',
      },
      {
        icon: '📍',
        title: 'Móviles con incidentes',
        value: series.vehiclesWithIncidents ?? 0,
        subtitle: 'Con eventos en el período',
      },
      {
        icon: '📊',
        title: 'Promedio diario',
        value: series.averageIncidentsPerDay ?? 0,
        subtitle: 'Incidentes por día',
      },
      {
        icon: '🔥',
        title: 'Motivo más frecuente',
        value: series.mostFrequentMotive ?? 'No disponible',
        subtitle: 'Motivo principal',
      },
      {
        icon: '📅',
        title: 'Día pico',
        value: series.peakIncidentDay ?? 'No disponible',
        subtitle: 'Mayor actividad del período',
      },
    ];
  }, [series]);

  const lineData = useMemo(() => {
    if (!series?.overTime?.length) return [];
    return series.overTime.map((item) => ({ label: item.period, value: item.count }));
  }, [series]);

  const vehicles = useMemo(() => {
    if (!series?.vehicles?.length) return [];
    return series.vehicles.slice(0, 6).map((item) => ({ label: item.name, value: item.count }));
  }, [series]);

  const motives = useMemo(() => {
    if (!series?.motives?.length) return [];
    return series.motives.slice(0, 6).map((item) => ({ label: item.name, value: item.count }));
  }, [series]);

  const fleetStatusData = useMemo(() => Object.entries(fleetStatus).map(([status, value]) => ({
    name: status.replaceAll('_', ' '),
    value: Number(value) || 0,
  })).filter((item) => item.value > 0), [fleetStatus]);

  const incidentsByPriority = useMemo(() => {
    const grouped = new Map();
    incidents.forEach((incident) => {
      const date = String(incident.fechaAsignacion || '').slice(0, 10);
      if (!date || (startDate && date < startDate) || (endDate && date > endDate)) return;
      if (!grouped.has(date)) grouped.set(date, { date, ALTA: 0, MEDIA: 0, BAJA: 0 });
      const priority = incident.prioridad;
      if (priority && priority in grouped.get(date)) grouped.get(date)[priority] += 1;
    });
    return [...grouped.values()].sort((first, second) => first.date.localeCompare(second.date)).map((item) => ({
      ...item,
      label: new Date(`${item.date}T00:00:00`).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
    }));
  }, [incidents, startDate, endDate]);

  return (
    <div style={S.container}>
      <DashboardHeader
        startDate={startDate}
        endDate={endDate}
        onStartChange={(e) => setStartDate(e.target.value)}
        onEndChange={(e) => setEndDate(e.target.value)}
        onPreset={applyPreset}
      />

      {error ? <div style={S.errorBanner}>{error}</div> : null}

      <section className="col-span-1 xl:col-span-12 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 kpi-summary-wrapper" aria-label="Resumen de indicadores">
        {loading ? Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={index} />) : <KpiSummary items={kpis.slice(0, 4)} className="kpi-summary-grid" itemClassName="col-span-1" />}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 dashboard-grid">
        <div className="xl:col-span-8 dashboard-grid__wide">
          <ChartCard title="Incidentes a lo largo del tiempo" description="Tendencia de incidentes por día en el rango seleccionado." loading={loading}>
            {loading ? <SkeletonCard /> : lineData.length ? (
              <BarChart data={lineData} vertical={true} height={120} xAxisTitle="Fecha" yAxisTitle="Incidentes" />
            ) : <div style={S.empty}>No hay datos para este rango.</div>}
          </ChartCard>
        </div>

        <div className="xl:col-span-4 dashboard-grid__half">
          <ChartCard title="Hallazgo clave" description="Puntos de atención rápida">
            <div style={S.insightList}>
              <div style={S.insightItem}>
                <span style={S.insightLabel}>Incidentes totales</span>
                <strong style={S.insightValue}>{series?.totalIncidents ?? '-'}</strong>
              </div>
              <div style={S.insightItem}>
                <span style={S.insightLabel}>Motivo principal</span>
                <strong style={S.insightValue}>{series?.mostFrequentMotive ?? '-'}</strong>
              </div>
              <div style={S.insightItem}>
                <span style={S.insightLabel}>Día de mayor presión</span>
                <strong style={S.insightValue}>{series?.peakIncidentDay ?? '-'}</strong>
              </div>
            </div>
          </ChartCard>
        </div>

        <div className="xl:col-span-6 dashboard-grid__half">
          <ChartCard title="Motivos de llamada" description="Los motivos más comunes de llamadas en el periodo." loading={loading}>
            {loading ? <SkeletonCard /> : motives.length ? <HorizontalBarChart data={motives} ariaLabel="Comparación de motivos de incidentes" /> : <div style={S.empty}>No hay datos para este rango.</div>}
          </ChartCard>
        </div>

        <div className="xl:col-span-6 dashboard-grid__half">
          <ChartCard title="Vehículos con más incidentes" description="Top móviles por volumen de registros." loading={loading}>
            {loading ? <SkeletonCard /> : vehicles.length ? <HorizontalBarChart data={vehicles} ariaLabel="Vehículos con más incidentes" /> : <div style={S.empty}>No hay datos para este rango.</div>}
          </ChartCard>
        </div>

        <div className="xl:col-span-4 dashboard-grid__half">
          <ChartCard title="Estado de la flota" description="Distribución actual de los móviles por estado." loading={loading}>
            {loading ? <SkeletonCard /> : fleetStatusData.length ? (
              <DoughnutChart data={fleetStatusData} ariaLabel="Distribución del estado de la flota" />
            ) : <div style={S.empty}>No hay datos de la flota.</div>}
          </ChartCard>
        </div>

        <div className="xl:col-span-8 dashboard-grid__wide">
          <ChartCard title="Incidentes por prioridad" description="Registros diarios apilados en el rango seleccionado." loading={loading}>
            {loading ? <SkeletonCard /> : incidentsByPriority.length ? (
              <div style={S.rechartsFrame}>
                <ResponsiveContainer width="100%" height={260}>
                  <RechartsBarChart data={incidentsByPriority} margin={{ top: 8, right: 12, left: -12, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={S.legend} />
                    <Bar dataKey="ALTA" name="Alta" stackId="priority" fill="#C62828" />
                    <Bar dataKey="MEDIA" name="Media" stackId="priority" fill="#E65100" />
                    <Bar dataKey="BAJA" name="Baja" stackId="priority" fill="#2E7D32" radius={[4, 4, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            ) : <div style={S.empty}>No hay incidentes para este rango.</div>}
          </ChartCard>
        </div>
      </section>
    </div>
  );
}

const S = {
  container: { display: 'grid', gap: 'var(--spacing-5)', padding: '0 0 var(--spacing-5)', width: '100%', maxWidth: '100%', overflow: 'hidden' },
  topRow: { display: 'grid', gridTemplateColumns: '1.4fr 0.95fr', gap: 'var(--spacing-5)', alignItems: 'start' },
  summaryColumn: { display: 'grid', gap: 'var(--spacing-3)' },
  sectionTitle: { margin: 0, fontSize: 'var(--font-size-3xl)', fontWeight: 800, color: 'var(--color-text-primary)' },
  sectionText: { margin: 0, fontSize: 'var(--font-size-sm)', lineHeight: 1.7, color: 'var(--color-text-secondary)', maxWidth: '700px' },
  filterPanel: { background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)', padding: 'var(--spacing-4)', display: 'grid', gap: 'var(--spacing-3)' },
  filterRow: { display: 'grid', gap: 'var(--spacing-2)' },
  filterLabel: { fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  filterInput: { width: '100%', padding: '0.7rem 0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' },
  presetGroup: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 'var(--spacing-2)' },
  presetButton: { appearance: 'none', background: 'var(--color-primary)', border: 'none', borderRadius: 'var(--radius-md)', color: 'var(--color-on-primary)', padding: '0.65rem 0.75rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem' },
  errorBanner: { padding: '0.9rem 1rem', borderRadius: 'var(--radius-md)', background: '#FEF3F2', color: 'var(--color-danger)', border: '1px solid #FECACA' },
  kpiSection: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 'var(--spacing-4)' },
  skeletonCard: { minHeight: '120px', borderRadius: 'var(--radius-lg)', background: 'var(--color-surface-muted)' },
  empty: { minHeight: '150px', display: 'grid', placeItems: 'center', color: 'var(--color-text-secondary)', borderRadius: 'var(--radius-lg)', background: 'var(--color-surface-alt)' },
  responsiveChart: { width: '100%', minWidth: 0, height: '250px', paddingTop: '0.5rem' },
  doughnutChart: { width: '100%', minWidth: 0, display: 'grid', gap: '0.25rem', justifyItems: 'stretch' },
  doughnutLegend: { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.7rem 1rem', padding: '0 0.25rem' },
  legendItem: { display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-text-secondary)', fontSize: '0.7rem', whiteSpace: 'nowrap' },
  legendDot: { width: '0.5rem', height: '0.5rem', borderRadius: '50%', flex: '0 0 auto' },
  tooltip: { display: 'grid', gap: '0.25rem', padding: '0.65rem 0.8rem', borderRadius: '0.6rem', background: '#fff', color: '#0F2A2A', boxShadow: '0 8px 20px rgba(15, 42, 42, 0.18)', fontSize: '0.75rem', border: '1px solid #D9E5E5' },
  insightList: { display: 'grid', gap: 'var(--spacing-3)' },
  insightItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--spacing-3)', background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-md)', padding: '0.8rem 0.9rem', border: '1px solid var(--color-border)' },
  insightLabel: { color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', fontWeight: 600 },
  insightValue: { color: 'var(--color-text-primary)', fontSize: 'var(--font-size-md)', fontWeight: 700 },
  mobileTopRow: { display: 'grid', gap: 'var(--spacing-4)' },
  mobileGrid: { gridTemplateColumns: '1fr', gridTemplateRows: 'auto', gap: 'var(--spacing-3)' },
};
