import React from 'react';

export default function KpiCard({ icon, title, value, subtitle, trend }) {
  return (
    <div style={S.card}>
      <div style={S.topRow}>
        <div style={S.icon}>{icon}</div>
        {trend ? (
          <div style={S.trend}>
            <span style={S.trendValue}>{trend.value}</span>
            <span style={S.trendLabel}>{trend.label}</span>
          </div>
        ) : null}
      </div>
      <div style={S.value}>{value}</div>
      <div style={S.subtitle}>{subtitle}</div>
    </div>
  );
}

const S = {
  card: {
    background: '#fff',
    borderRadius: '18px',
    padding: '12px',
    boxShadow: '0 6px 18px rgba(15, 42, 42, 0.05)',
    border: '1px solid #E8F5F5',
    minHeight: '108px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '10px',
  },
  icon: {
    width: '38px',
    height: '38px',
    borderRadius: '14px',
    background: '#E0F2FE',
    display: 'grid',
    placeItems: 'center',
    fontSize: '18px',
  },
  trend: {
    textAlign: 'right',
    fontSize: '12px',
    color: '#0F2A2A',
  },
  trendValue: {
    display: 'block',
    fontWeight: 700,
    color: '#1B6B6B',
  },
  trendLabel: {
    color: '#6B7280',
  },
  value: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#0F2A2A',
    margin: '10px 0 4px',
    lineHeight: 1,
  },
  subtitle: {
    fontSize: '13px',
    color: '#4B5563',
    lineHeight: 1.6,
  },
};
