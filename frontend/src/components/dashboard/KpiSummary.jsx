import React from 'react';

export default function KpiSummary({ items = [] }) {
  return (
    <div style={S.grid}>
      {items.map((item) => (
        <article key={item.title} style={S.card} tabIndex={0} aria-label={`${item.title}: ${item.value}`}>
          <div style={S.topRow}>
            <div style={S.meta}>{item.icon}</div>
            <div style={S.trend}>{item.subtitle}</div>
          </div>
          <p style={S.title}>{item.title}</p>
          <div style={S.value}>{item.value}</div>
        </article>
      ))}
    </div>
  );
}

const S = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' },
  card: { background: '#fff', borderRadius: '16px', padding: '12px 14px', boxShadow: '0 8px 18px rgba(15, 42, 42, 0.04)', border: '1px solid #E8F5F5', minHeight: '110px', display: 'grid', gap: '8px', transition: 'transform 0.2s ease, box-shadow 0.2s ease' },
  topRow: { display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center' },
  meta: { width: '34px', height: '34px', display: 'grid', placeItems: 'center', borderRadius: '14px', background: '#E0F2FE', fontSize: '16px' },
  trend: { textAlign: 'right', fontSize: '0.85rem', color: '#47525D' },
  title: { margin: 0, fontSize: '11px', fontWeight: 700, color: '#47525D', textTransform: 'uppercase', letterSpacing: '0.9px' },
  value: { fontSize: '1.8rem', fontWeight: 800, color: '#0F2A2A', lineHeight: 1 },
};
