import React from 'react';

const COLORS = ['#0F2A2A', '#2A9090', '#5B9EA0', '#7FB8B8', '#A3D1D1'];

export default function DonutChart({ data = [], ariaLabel = 'Gráfico de dona de motivos' }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div style={S.container} role="img" aria-label={ariaLabel}>
      <div style={S.chartWrapper}>
        <svg width="172" height="172" viewBox="0 0 172 172" style={S.svg}>
          <circle cx="86" cy="86" r={radius} fill="none" stroke="#E5E7EB" strokeWidth="18" />
          {data.map((item, index) => {
            const share = total ? item.value / total : 0;
            const dash = share * circumference;
            const element = (
              <circle
                key={item.label}
                cx="86"
                cy="86"
                r={radius}
                fill="none"
                stroke={COLORS[index % COLORS.length]}
                strokeWidth="18"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={offset}
                strokeLinecap="round"
                transform="rotate(-90 86 86)"
              />
            );
            offset -= dash;
            return element;
          })}
        </svg>
        <div style={S.centerValue}>
          <span style={S.centerNumber}>{total}</span>
          <span style={S.centerLabel}>incidentes</span>
        </div>
      </div>
      <div style={S.legend}>
        {data.map((item, index) => (
          <div key={item.label} style={S.legendItem}>
            <span style={{ ...S.legendDot, background: COLORS[index % COLORS.length] }} />
            <span style={S.legendLabel}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const S = {
  container: { display: 'grid', gap: '14px', width: '100%', justifyItems: 'center' },
  chartWrapper: { position: 'relative', width: '140px', height: '140px' },
  svg: { width: '100%', height: '100%' },
  centerValue: { position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' },
  centerNumber: { fontSize: '22px', fontWeight: 700, color: '#ff8000' },
  centerLabel: { fontSize: '10px', color: '#4B5563', marginTop: '2px', display: 'block' },
  legend: { display: 'grid', gap: '8px', width: '100%' },
  legendItem: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#47525D' },
  legendDot: { width: '8px', height: '8px', borderRadius: '50%' },
  legendLabel: { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
};
