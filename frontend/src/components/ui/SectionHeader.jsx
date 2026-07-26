export default function SectionHeader({ title, subtitle, action, style, ...props }) {
  return (
    <div style={{ ...S.root, ...style }} {...props}>
      <div style={S.textGroup}>
        {title ? <h2 style={S.title}>{title}</h2> : null}
        {subtitle ? <p style={S.subtitle}>{subtitle}</p> : null}
      </div>
      {action ? <div style={S.action}>{action}</div> : null}
    </div>
  );
}

const S = {
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'var(--spacing-4)',
    padding: 'var(--spacing-4) 0',
    borderBottom: '1px solid var(--color-border)',
  },
  textGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-1)',
  },
  title: {
    margin: 0,
    fontSize: 'var(--font-size-xl)',
    fontWeight: 700,
    color: 'var(--color-text-primary)',
  },
  subtitle: {
    margin: 0,
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-secondary)',
  },
  action: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-2)',
  },
};
