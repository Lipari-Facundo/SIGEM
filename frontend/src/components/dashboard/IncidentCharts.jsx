import React, { useEffect, useMemo, useState } from 'react';
import ChartCard from './ChartCard';
import { incidenteService } from '../../services/api';

function SkeletonBar({ height = 10 }) {
  return <div style={{ height, borderRadius: 999, background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.2s infinite' }} />;
}

export default function IncidentCharts() {
  const [series, setSeries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0,10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0,10));

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const params = { startDate, endDate };
        const res = await incidenteService.dashboard(params);
        if (mounted) setSeries(res.data);
      } catch (e) {
        if (mounted) setError('No se pudieron cargar los gráficos del dashboard.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [startDate, endDate]);

  function applyPreset(days) {
    const end = new Date();
    const start = new Date(); start.setDate(end.getDate() - days + 1);
    setStartDate(start.toISOString().slice(0,10));
    setEndDate(end.toISOString().slice(0,10));
  }

  const lineData = useMemo(() => {
    if (!series?.overTime?.length) return [];
    return series.overTime.map(item => ({ label: item.period, value: item.count }));
  }, [series]);

  const vehicles = useMemo(() => {
    if (!series?.vehicles?.length) return [];
    return series.vehicles.slice(0, 6);
  }, [series]);

  const motives = useMemo(() => {
    if (!series?.motives?.length) return [];
    return series.motives.slice(0, 6);
  }, [series]);

  if (loading) {
    return (
      <div style={S.grid}>
          <div style={{ gridColumn: '1 / -1', marginBottom: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <label style={{ fontSize: '13px', color: '#374151' }}>Desde</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <label style={{ fontSize: '13px', color: '#374151' }}>Hasta</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            <div style={{ marginLeft: '12px', display: 'flex', gap: '6px' }}>
              <button onClick={() => applyPreset(7)} style={S.presetBtn}>Últimos 7 días</button>
              <button onClick={() => applyPreset(30)} style={S.presetBtn}>30 días</button>
              <button onClick={() => applyPreset(90)} style={S.presetBtn}>90 días</button>
            </div>
          </div>
        <ChartCard title="Total de incidentes por periodo" description="Cargando métricas...">
          <SkeletonBar height={14} />
          <div style={{ marginTop: '10px', display: 'grid', gap: '8px' }}>
            {[...Array(5)].map((_, i) => <SkeletonBar key={i} height={10} />)}
          </div>
        </ChartCard>
        <ChartCard title="Móviles más afectados" description="Cargando métricas...">
          <div style={{ display: 'grid', gap: '10px' }}>
            {[...Array(4)].map((_, i) => <SkeletonBar key={i} height={12} />)}
          </div>
        </ChartCard>
        <ChartCard title="Motivos de llamada más comunes" description="Cargando métricas...">
          <div style={{ display: 'grid', gap: '10px' }}>
            {[...Array(4)].map((_, i) => <SkeletonBar key={i} height={12} />)}
          </div>
        </ChartCard>
      </div>
    );
  }

  return (
    <div style={S.grid}>
      <ChartCard title="Total de incidentes a lo largo del tiempo" description="Evolución diaria o mensual según la carga actual del sistema.">
        {error ? <EmptyState message={error} /> : (
          <div style={S.chartArea}>
            {lineData.length ? (
              <div style={S.barList}>
                {lineData.map(item => (
                  <div key={item.label} style={S.barRow}>
                    <div style={S.labelCell}>{item.label}</div>
                    <div style={S.barTrack}>
                      <div style={{ ...S.barFill, width: `${Math.max(10, (item.value / Math.max(...lineData.map(x => x.value), 1)) * 100)}%` }} />
                    </div>
                    <div style={S.valueCell}>{item.value}</div>
                  </div>
                ))}
              </div>
            ) : <EmptyState message="No hay datos para mostrar aún." />}
          </div>
        )}
      </ChartCard>

      <ChartCard title="Móviles más afectados" description="Vehículos con más incidentes asociados.">
        {error ? <EmptyState message={error} /> : (
          vehicles.length ? (
            <div style={S.list}>
              {vehicles.map(item => (
                <div key={item.name} style={S.listItem}>
                  <span style={S.listName}>{item.name}</span>
                  <span style={S.listValue}>{item.count}</span>
                </div>
              ))}
            </div>
          ) : <EmptyState message="No hay datos de móviles aún." />
        )}
      </ChartCard>

      <ChartCard title="Motivos de llamada más comunes" description="Frecuencia de los motivos registrados.">
        {error ? <EmptyState message={error} /> : (
          motives.length ? (
            <div style={S.list}>
              {motives.map(item => (
                <div key={item.name} style={S.listItem}>
                  <span style={S.listName}>{item.name}</span>
                  <span style={S.listValue}>{item.count}</span>
                </div>
              ))}
            </div>
          ) : <EmptyState message="No hay motivos registrados aún." />
        )}
      </ChartCard>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div style={S.emptyState}>
      <div style={S.emptyIcon}>📈</div>
      <p style={S.emptyText}>{message}</p>
    </div>
  );
}

const S = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '18px' },
  chartArea: { flex: 1, display: 'flex', alignItems: 'center' },
  barList: { width: '100%', display: 'grid', gap: '10px' },
  barRow: { display: 'grid', gridTemplateColumns: '70px 1fr 36px', alignItems: 'center', gap: '8px' },
  labelCell: { fontSize: '12px', color: '#4B5563', fontWeight: 600 },
  barTrack: { height: '10px', background: '#E5E7EB', borderRadius: 999, overflow: 'hidden' },
  barFill: { height: '100%', background: 'linear-gradient(90deg, #1B6B6B 0%, #2A9090 100%)', borderRadius: 999 },
  valueCell: { fontSize: '12px', fontWeight: 700, color: '#0F2A2A', textAlign: 'right' },
  list: { display: 'grid', gap: '10px' },
  listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E5E7EB' },
  listName: { fontSize: '13px', color: '#374151', fontWeight: 600 },
  listValue: { fontSize: '13px', fontWeight: 700, color: '#1B6B6B' },
  emptyState: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#6B7280', textAlign: 'center', minHeight: '180px' },
  emptyIcon: { fontSize: '28px', marginBottom: '8px' },
  emptyText: { margin: 0, fontSize: '13px' },
  presetBtn: { background: '#0F172A', color: '#fff', border: 'none', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }
};
