import React from 'react';

export default function ChartCard({ title, description, children }) {
  return (
    <section style={S.card}>
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
    padding: '20px',
    boxShadow: '0 10px 30px rgba(15, 42, 42, 0.06)',
    border: '1px solid #E8F5F5',
    minHeight: '260px',
    display: 'flex',
    flexDirection: 'column',
  },
  header: { marginBottom: '14px' },
  title: { fontSize: '17px', fontWeight: '700', color: '#0F2A2A', margin: 0 },
  description: { margin: '6px 0 0', fontSize: '13px', color: '#6B7280' },
  body: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' },
};
