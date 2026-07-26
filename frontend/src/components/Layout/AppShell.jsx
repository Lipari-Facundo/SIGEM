export default function AppShell({ sidebar, header, children, footer }) {
  return (
    <div style={S.appShell}>
      {sidebar ? <aside style={S.sidebar}>{sidebar}</aside> : null}
      <div style={S.main}>
        {header ? <div style={S.stickyHeader}>{header}</div> : null}
        <div style={S.pageFrame}>{children}</div>
        {footer ? <footer style={S.footer}>{footer}</footer> : null}
      </div>
    </div>
  );
}

const S = {
  appShell: {
    minHeight: '100vh',
    display: 'flex',
    width: '100%',
    background: 'var(--color-page-bg)',
    color: 'var(--color-text-primary)',
  },
  sidebar: {
    flexShrink: 0,
    width: '280px',
    minHeight: '100vh',
    background: 'var(--color-surface)',
    borderRight: '1px solid var(--color-border)',
    boxShadow: 'var(--shadow-sm)',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
  stickyHeader: {
    position: 'sticky',
    top: 0,
    zIndex: 'var(--z-header)',
    background: 'var(--color-page-bg)',
    borderBottom: '1px solid var(--color-border)',
  },
  pageFrame: {
    width: '100%',
    maxWidth: 'var(--max-content-width)',
    margin: '0 auto',
    padding: 'var(--spacing-6)',
    boxSizing: 'border-box',
    minHeight: '100vh',
  },
  footer: {
    padding: 'var(--spacing-5) var(--spacing-6)',
    color: 'var(--color-text-muted)',
    fontSize: 'var(--font-size-sm)',
  },
};
