import React from 'react';

export default function DashboardHeader({ startDate, endDate, onStartChange, onEndChange, onPreset }) {
  return (
    <div style={S.header}>
      <div>
        <p style={S.overline}>Executive Analytics</p>
        <h1 style={S.title}>Incident Operations Dashboard</h1>
        <p style={S.subtitle}>Monitorea el comportamiento de incidentes, detecta tendencias y toma decisiones con un vista clara y ejecutiva.</p>
      </div>

      <div style={S.filterGroup}>
        <div style={S.datePair}>
          <label style={S.label} htmlFor="dashboard-start">Desde</label>
          <input id="dashboard-start" type="date" value={startDate} onChange={onStartChange} style={S.input} />
        </div>
        <div style={S.datePair}>
          <label style={S.label} htmlFor="dashboard-end">Hasta</label>
          <input id="dashboard-end" type="date" value={endDate} onChange={onEndChange} style={S.input} />
        </div>
        <div style={S.presets}>
          <button type="button" style={S.presetBtn} onClick={() => onPreset(7)}>7 días</button>
          <button type="button" style={S.presetBtn} onClick={() => onPreset(30)}>30 días</button>
          <button type="button" style={S.presetBtn} onClick={() => onPreset(90)}>90 días</button>
        </div>
      </div>
    </div>
  );
}

const S = {
  header: { display: 'grid', gridTemplateColumns: '1fr minmax(260px, 1fr)', gap: '14px', alignItems: 'flex-start', padding: '8px 0 10px', borderBottom: '1px solid #E8F5F5' },
  overline: { margin: 0, fontSize: '10px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#0F2A2A' },
  title: { margin: '6px 0', fontSize: '1.2rem', fontWeight: 800, color: '#0F2A2A' },
  subtitle: { margin: 0, fontSize: '0.9rem', color: '#47525D', lineHeight: 1.5, maxWidth: '620px' },
  filterGroup: { display: 'grid', gap: '8px' },
  datePair: { display: 'grid', gap: '5px' },
  label: { fontSize: '10px', fontWeight: 700, color: '#47525D' },
  input: { width: '100%', padding: '8px 10px', borderRadius: '10px', border: '1px solid #D1D5DB', background: '#fff', color: '#0F172A', fontSize: '12px' },
  presets: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  presetBtn: { background: '#0F2A2A', color: '#fff', border: 'none', borderRadius: '10px', padding: '7px 10px', cursor: 'pointer', fontSize: '11px', fontWeight: 700 },
};
