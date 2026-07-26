export default function PageHeader({ overline, title, subtitle, actions, children }) {
  return (
    <div style={S.header}>
      <div style={S.titleGroup}>
        {overline ? <span style={S.overline}>{overline}</span> : null}
        {title ? <h1 style={S.title}>{title}</h1> : null}
        {subtitle ? <p style={S.subtitle}>{subtitle}</p> : null}
      </div>
      {actions ? <div style={S.actions}>{actions}</div> : null}
      {children ? <div style={S.extra}>{children}</div> : null}
    </div>
  );
}

const S = {
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-4)',
    paddingBottom: 'var(--spacing-4)',
    marginBottom: 'var(--spacing-5)',
    borderBottom: '1px solid var(--color-border)',
  },
  titleGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-2)',
  },
  overline: {
    fontSize: 'var(--font-size-xs)',
    fontWeight: 700,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: 'var(--color-primary-strong)',
  },
  title: {
    fontSize: 'var(--font-size-3xl)',
    lineHeight: 'var(--line-height-heading)',
    margin: 0,
    color: 'var(--color-text-primary)',
  },
  subtitle: {
    fontSize: 'var(--font-size-md)',
    margin: 0,
    color: 'var(--color-text-secondary)',
    maxWidth: '60ch',
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 'var(--spacing-3)',
    alignItems: 'center',
  },
  extra: {
    marginTop: 'var(--spacing-3)',
  },
};
