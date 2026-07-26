import React from 'react';

export default function LineChart({
  data = [],
  ariaLabel = 'Gráfico de línea de incidentes',
  height = 120,
  markerSize = 1.2,
  strokeWidth = 1.8,
  showArea = true,
}) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);
  const points = data.map((item, index) => {
    const x = (index / Math.max(data.length - 1, 1)) * 100;
    // keep chart within viewbox and allow slightly taller peaks but controlled
    const y = 90 - (item.value / maxValue) * 68;
    return { x, y, label: item.label, value: item.value };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');
  const areaPath = `${linePath} L 100 100 L 0 100 Z`;

  return (
    <div style={{ ...S.container, gap: '8px' }} role="img" aria-label={ariaLabel}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ ...S.svg, minHeight: height }}>
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2A9090" />
            <stop offset="100%" stopColor="#0F2A2A" />
          </linearGradient>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(42, 144, 144, 0.12)" />
            <stop offset="100%" stopColor="rgba(42, 144, 144, 0)" />
          </linearGradient>
        </defs>
        {showArea && <path d={areaPath} fill="url(#areaGradient)" />}
        <path d={linePath} fill="none" stroke="url(#lineGradient)" strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
        {points.map((point, index) => (
          <circle key={index} cx={point.x} cy={point.y} r={markerSize} fill="#0F2A2A" />
        ))}
      </svg>
      <div style={S.axis}>
        {points.map((point, index) => (
          <span key={index} style={S.axisLabel} aria-hidden="true">
            {point.label}
          </span>
        ))}
      </div>
    </div>
  );
}

const S = {
  container: { display: 'grid', gap: '12px', width: '100%' },
  svg: { width: '100%', minHeight: '150px', overflow: 'visible' },
  axis: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(0, 1fr))', gap: '6px', fontSize: '10px', color: '#47525D' },
  axisLabel: { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
};
