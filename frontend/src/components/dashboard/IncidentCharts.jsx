import React, { useEffect, useMemo, useState } from 'react';
import DashboardHeader from './DashboardHeader';
import ChartCard from './ChartCard';
import KpiSummary from './KpiSummary';
import BarChart from './BarChart';
import DonutChart from './DonutChart';
import { incidenteService } from '../../services/api';

function SkeletonCard() {
  return <div style={S.skeletonCard} />;
}

export default function IncidentCharts() {
  const [series, setSeries] = useState(null);
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
        const res = await incidenteService.dashboard(params);
        if (mounted) setSeries(res.data);
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
        value: series.mostFrequentMotive ?? 'N/A',
        subtitle: 'Motivo principal',
      },
      {
        icon: '📅',
        title: 'Día pico',
        value: series.peakIncidentDay ?? 'N/A',
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

      <section style={S.kpiSection} aria-label="KPI summary">
        {loading ? Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={index} />) : <KpiSummary items={kpis} />}
      </section>

      <section style={S.dashboardGrid}>
        <div style={{ gridColumn: 'span 8', minWidth: 0 }}>
          <ChartCard title="Incidentes a lo largo del tiempo" description="Tendencia de incidentes por día en el rango seleccionado." loading={loading}>
            {loading ? <SkeletonCard /> : lineData.length ? (
              <BarChart data={lineData} vertical={true} height={120} xAxisTitle="Fecha" yAxisTitle="Incidentes" />
            ) : <div style={S.empty}>No hay datos para este rango.</div>}
          </ChartCard>
        </div>

        <div style={{ gridColumn: 'span 4', display: 'grid', gap: '16px', minWidth: 0 }}>
          <ChartCard title="Motivos de llamada" description="Distribución de las razones más frecuentes." loading={loading}>
            {loading ? <SkeletonCard /> : motives.length ? <DonutChart data={motives} /> : <div style={S.empty}>No hay datos para este rango.</div>}
          </ChartCard>

          <ChartCard title="Insight clave" description="Puntos de atención rápida">
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

        <div style={{ gridColumn: 'span 5', minWidth: 0 }}>
          <ChartCard title="Vehículos con más incidentes" description="Top móviles por volumen de registros." loading={loading}>
            {loading ? <SkeletonCard /> : vehicles.length ? <BarChart data={vehicles} /> : <div style={S.empty}>No hay datos para este rango.</div>}
          </ChartCard>
        </div>

        <div style={{ gridColumn: 'span 7', minWidth: 0 }}>
          <ChartCard title="Comparación de motivos" description="Los motivos más comunes del periodo." loading={loading}>
            {loading ? <SkeletonCard /> : motives.length ? <BarChart data={motives} /> : <div style={S.empty}>No hay datos para este rango.</div>}
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
  kpiSection: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 'var(--spacing-4)' },
  dashboardGrid: { display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 'var(--spacing-4)', width: '100%', maxWidth: '100%' },
  skeletonCard: { minHeight: '120px', borderRadius: 'var(--radius-lg)', background: 'var(--color-surface-muted)' },
  empty: { minHeight: '150px', display: 'grid', placeItems: 'center', color: 'var(--color-text-secondary)', borderRadius: 'var(--radius-lg)', background: 'var(--color-surface-alt)' },
  insightList: { display: 'grid', gap: 'var(--spacing-3)' },
  insightItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--spacing-3)', background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-md)', padding: '0.8rem 0.9rem', border: '1px solid var(--color-border)' },
  insightLabel: { color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', fontWeight: 600 },
  insightValue: { color: 'var(--color-text-primary)', fontSize: 'var(--font-size-md)', fontWeight: 700 },
  mobileTopRow: { display: 'grid', gap: 'var(--spacing-4)' },
  mobileGrid: { gridTemplateColumns: '1fr', gridTemplateRows: 'auto', gap: 'var(--spacing-3)' },
};
