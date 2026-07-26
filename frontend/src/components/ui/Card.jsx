export default function Card({ title, description, footer, children, style, ...props }) {
  return (
    <article style={{ ...S.card, ...style }} {...props}>
      {(title || description) && (
        <div style={S.header}>
          {title ? <h2 style={S.title}>{title}</h2> : null}
          {description ? <p style={S.description}>{description}</p> : null}
        </div>
      )}
      <div style={S.body}>{children}</div>
      {footer ? <div style={S.footer}>{footer}</div> : null}
    </article>
  );
}

const S = {
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-4)',
    padding: 'var(--spacing-5)',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-sm)',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-2)',
  },
  title: {
    margin: 0,
    fontSize: 'var(--font-size-xl)',
    fontWeight: 700,
    color: 'var(--color-text-primary)',
  },
  description: {
    margin: 0,
    color: 'var(--color-text-secondary)',
    fontSize: 'var(--font-size-sm)',
    lineHeight: 'var(--line-height-base)',
  },
  body: {
    width: '100%',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 'var(--spacing-4)',
    borderTop: '1px solid var(--color-surface-muted)',
    color: 'var(--color-text-secondary)',
    fontSize: 'var(--font-size-sm)',
  },
};
