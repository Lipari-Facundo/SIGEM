import React from 'react';
import Sidebar from '../components/Sidebar';
import IncidentCharts from '../components/dashboard/IncidentCharts';

export default function DirectorDashboard() {
  return (
    <div style={S.page}>
      <Sidebar />
      <main style={S.main}>
        <div style={S.content}>
          <IncidentCharts />
        </div>
      </main>
    </div>
  );
}

const S = {
  page: { display: 'flex', minHeight: '100vh', fontFamily: 'var(--font-family-sans)', background: 'var(--color-page-bg)', color: 'var(--color-text-primary)' },
  main: { flex: 1, padding: 'var(--spacing-6)', background: 'var(--color-page-bg)' },
  content: { width: '100%', maxWidth: 'var(--content-width)', margin: '0 auto' },
};
