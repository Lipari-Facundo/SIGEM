import React from 'react';

export default function PlaceholderCards() {
  return (
    <div style={S.grid}>
      {[1, 2, 3].map(i => (
        <div key={i} style={S.card}>
          <div style={S.header} />
          <div style={S.line} />
          <div style={S.lineShort} />
          <div style={S.bar} />
        </div>
      ))}
    </div>
  );
}

const S = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '18px', marginTop: '18px' },
  card: { background: 'linear-gradient(135deg, #f8fcfc 0%, #f3f8f8 100%)', border: '1px dashed #B2DFDB', borderRadius: '18px', padding: '18px', minHeight: '140px' },
  header: { height: '14px', width: '60%', borderRadius: '999px', background: '#D1FAE5', marginBottom: '14px' },
  line: { height: '10px', width: '100%', borderRadius: '999px', background: '#E5E7EB', marginBottom: '8px' },
  lineShort: { height: '10px', width: '70%', borderRadius: '999px', background: '#E5E7EB', marginBottom: '14px' },
  bar: { height: '42px', borderRadius: '10px', background: 'linear-gradient(90deg, #E0F2FE 0%, #CCFBF1 100%)' },
};
