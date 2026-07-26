export default function KpiCard({ label, value, meta, icon, trend, style, ...props }) {
  return (
    <article style={{ ...S.card, ...style }} {...props}>
      <div style={S.topRow}>
        <div style={S.icon}>{icon}</div>
        <div style={S.meta}>{meta}</div>
      </div>
      <div style={S.value}>{value}</div>
      <div style={S.label}>{label}</div>
      {trend ? (
        <div style={S.trend}>{trend}</div>
      ) : null}
    </article>
  );
}

const S = {
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-2)',
    padding: 'var(--spacing-4)',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    minWidth: 0,
  },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'var(--spacing-2)',
  },
  icon: {
    display: 'grid',
    placeItems: 'center',
    width: '2.2rem',
    height: '2.2rem',
    borderRadius: 'var(--radius-md)',
    background: 'var(--color-primary-soft)',
    color: 'var(--color-primary)',
    fontSize: '1rem',
  },
  meta: {
    color: 'var(--color-text-secondary)',
    fontSize: 'var(--font-size-xxs)',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
  },
  value: {
    fontSize: '2.25rem',
    fontWeight: 800,
    color: 'var(--color-text-primary)',
    lineHeight: 1,
  },
  label: {
    color: 'var(--color-text-secondary)',
    fontSize: 'var(--font-size-sm)',
  },
  trend: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.3rem 0.7rem',
    borderRadius: 'var(--radius-pill)',
    fontSize: 'var(--font-size-xxs)',
    background: 'var(--color-surface-muted)',
    color: 'var(--color-text-primary)',
  },
};
