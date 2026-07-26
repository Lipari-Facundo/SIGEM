export default function EmptyState({ title, description, icon, action, style, ...props }) {
  return (
    <section style={{ ...S.root, ...style }} {...props}>
      {icon ? <div style={S.icon}>{icon}</div> : null}
      {title ? <h3 style={S.title}>{title}</h3> : null}
      {description ? <p style={S.description}>{description}</p> : null}
      {action ? <div style={S.action}>{action}</div> : null}
    </section>
  );
}

const S = {
  root: {
    display: 'grid',
    placeItems: 'center',
    gap: 'var(--spacing-4)',
    textAlign: 'center',
    padding: 'var(--spacing-8) var(--spacing-5)',
    background: 'var(--color-surface-muted)',
    border: '1px dashed var(--color-border)',
    borderRadius: 'var(--radius-xl)',
  },
  icon: {
    fontSize: '2.4rem',
    color: 'var(--color-primary)',
  },
  title: {
    margin: 0,
    fontSize: 'var(--font-size-2xl)',
    fontWeight: 700,
    color: 'var(--color-text-primary)',
  },
  description: {
    margin: 0,
    color: 'var(--color-text-secondary)',
    maxWidth: '32rem',
    lineHeight: 'var(--line-height-relaxed)',
  },
  action: {
    display: 'flex',
    justifyContent: 'center',
  },
};
