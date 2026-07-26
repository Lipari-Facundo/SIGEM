import React from 'react';

export default function ChartCard({ title, description, children, loading = false }) {
  return (
    <section style={S.card} aria-busy={loading}>
      <div style={S.header}>
        <div>
          <h3 style={S.title}>{title}</h3>
          {description ? <p style={S.description}>{description}</p> : null}
        </div>
      </div>
      <div style={S.body}>{children}</div>
    </section>
  );
}

const S = {
  card: {
    background: '#fff',
    borderRadius: '18px',
    padding: '12px 14px',
    boxShadow: '0 8px 18px rgba(15, 42, 42, 0.06)',
    border: '1px solid #E8F5F5',
    minHeight: '130px',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  header: { marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: '0.95rem', fontWeight: '700', color: '#0F2A2A', margin: 0 },
  description: { margin: '5px 0 0', fontSize: '11px', color: '#6B7280' },
  body: { flex: 1, display: 'grid', alignItems: 'start' },
};
