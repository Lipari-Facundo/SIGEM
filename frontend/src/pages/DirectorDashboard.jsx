import React from 'react';
import Sidebar from '../components/Sidebar';
import IncidentCharts from '../components/dashboard/IncidentCharts';
import PlaceholderCards from '../components/dashboard/PlaceholderCards';

export default function DirectorDashboard() {
  return (
    <div style={S.page}>
      <Sidebar />
      <main style={S.main}>
        <header style={S.header}>
          <div>
            <p style={S.eyebrow}>Módulo de dirección</p>
            <h1 style={S.h1}>Management Dashboard</h1>
            <p style={S.sub}>KPIs globales y tendencias de incidentes en tiempo real.</p>
          </div>
          <div style={S.badge}>📊 Director</div>
        </header>

        <section style={S.hero}>
          <div>
            <h2 style={S.heroTitle}>Vista operativa de incidentes</h2>
            <p style={S.heroText}>Los gráficos dinámicos se alimentan directamente desde la base de datos y quedan listos para adaptarse a nuevas métricas en futuras iteraciones.</p>
          </div>
        </section>

        <IncidentCharts />
        <PlaceholderCards />
      </main>
    </div>
  );
}

const S = {
  page: { display: 'flex', minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif", background: '#F0F7F7' },
  main: { flex: 1, padding: '32px 36px', background: '#F0F7F7' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '18px', flexWrap: 'wrap' },
  eyebrow: { margin: 0, fontSize: '12px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', color: '#1B6B6B' },
  h1: { margin: '4px 0 6px', fontSize: '30px', fontWeight: '800', color: '#0F2A2A' },
  sub: { margin: 0, fontSize: '14px', color: '#4B5563' },
  badge: { padding: '10px 14px', borderRadius: '999px', background: '#E0F2FE', color: '#0369A1', fontWeight: '700', fontSize: '13px' },
  hero: { background: 'linear-gradient(135deg, #0F2A2A 0%, #1B6B6B 100%)', color: '#fff', borderRadius: '20px', padding: '24px 28px', marginBottom: '20px', boxShadow: '0 16px 36px rgba(0,0,0,0.10)' },
  heroTitle: { margin: '0 0 8px', fontSize: '22px', fontWeight: '700' },
  heroText: { margin: 0, fontSize: '14px', lineHeight: 1.6, color: 'rgba(255,255,255,0.86)' },
};
