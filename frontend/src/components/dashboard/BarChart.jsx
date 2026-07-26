import React from 'react';

const COLORS = ['#0F2A2A', '#2A9090', '#5B9EA0', '#7FB8B8', '#A3D1D1'];

export default function BarChart({ data = [], ariaLabel = 'Gráfico de barras horizontales', height = 120, vertical = false, xAxisTitle = '', yAxisTitle = '' }) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  if (!vertical) {
    return (
      <div style={S.container} role="img" aria-label={ariaLabel}>
        {data.map((item, index) => {
          const width = Math.max((item.value / maxValue) * 100, 6);
          return (
            <div key={item.label} style={S.row}>
              <div style={S.rowLabel}>{item.label}</div>
              <div style={S.barTrack}>
                <div style={{ ...S.barFill, width: `${width}%`, background: COLORS[index % COLORS.length] }} />
              </div>
              <div style={S.rowValue}>{item.value}</div>
            </div>
          );
        })}
      </div>
    );
  }

  // Vertical bars with Y-axis ticks (0, half, max)
  const barCount = data.length || 1;
  const half = Math.ceil(maxValue / 2);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }} role="img" aria-label={ariaLabel}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch' }}>
        {/* Y axis ticks column */}
        <div style={{ width: '56px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '8px 6px', fontSize: '12px', color: '#47525D' }}>
          <div style={{ textAlign: 'right' }}>{maxValue}</div>
          <div style={{ textAlign: 'right' }}>{half}</div>
          <div style={{ textAlign: 'right' }}>0</div>
        </div>

        {/* Bars area */}
        <div style={{ flex: 1, display: 'flex', gap: '12px', alignItems: 'end', height: height, padding: '8px 6px', borderRadius: '8px', background: 'transparent', overflow: 'hidden', boxSizing: 'border-box' }}>
          {(() => {
            const maxLabels = 8;
            const step = Math.max(1, Math.ceil(data.length / maxLabels));
            return data.map((item, index) => {
              const h = Math.max((item.value / maxValue) * 100, 4);
              const showLabel = (index % step === 0) || index === data.length - 1;
              return (
                <div key={item.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: '1 1 0', minWidth: 28 }}>
                  <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', height: '100%', justifyContent: 'center' }}>
                    <div style={{ width: '70%', height: `${h}%`, background: COLORS[index % COLORS.length], borderRadius: '6px 6px 2px 2px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', boxShadow: 'inset 0 -6px 8px rgba(0,0,0,0.06)' }} title={`${item.label}: ${item.value}`}>
                      <div style={{ fontSize: '11px', color: '#fff', padding: '2px 4px', borderRadius: '4px', marginBottom: 4, background: 'rgba(0,0,0,0.18)', display: item.value > 0 ? 'block' : 'none' }}>{item.value}</div>
                    </div>
                  </div>
                  <div style={S.xLabel}>{showLabel ? item.label : ''}</div>
                </div>
              );
            });
          })()}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {yAxisTitle ? <div style={S.axisTitleY}>{yAxisTitle}</div> : null}
        </div>
        {xAxisTitle ? <div style={S.axisTitleX}>{xAxisTitle}</div> : <div />}
      </div>
    </div>
  );
}

const S = {
  container: { display: 'grid', gap: '12px', width: '100%' },
  row: { display: 'grid', gridTemplateColumns: 'minmax(90px, 1fr) auto minmax(38px, auto)', gap: '10px', alignItems: 'center' },
  rowLabel: { fontSize: '11px', color: '#47525D', fontWeight: 600, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  barTrack: { height: '10px', background: '#E5E7EB', borderRadius: '999px', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: '999px', transition: 'width 0.4s ease' },
  rowValue: { fontSize: '12px', color: '#0F2A2A', fontWeight: 700, textAlign: 'right' },
  xLabel: { fontSize: '11px', color: '#47525D', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '88px' },
  axisTitleX: { fontSize: '12px', color: '#47525D', fontWeight: 700, marginLeft: 'auto' },
  axisTitleY: { writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: '12px', color: '#47525D', fontWeight: 700 },
};
