export default function Button({ variant = 'primary', size = 'md', children, style, ...props }) {
  return (
    <button style={{ ...S.base, ...S[variant], ...S[size], ...style }} {...props}>
      {children}
    </button>
  );
}

const S = {
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid transparent',
    borderRadius: 'var(--radius-md)',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'background var(--transition-base), border var(--transition-base), transform var(--transition-base), color var(--transition-base)',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  },
  primary: {
    background: 'var(--color-primary)',
    color: 'var(--color-on-primary)',
  },
  secondary: {
    background: 'var(--color-surface)',
    color: 'var(--color-text-primary)',
    borderColor: 'var(--color-border)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--color-text-primary)',
  },
  danger: {
    background: 'var(--color-danger)',
    color: 'var(--color-on-primary)',
  },
  sm: {
    padding: '0.6rem 1rem',
    fontSize: 'var(--font-size-sm)',
  },
  md: {
    padding: '0.85rem 1.3rem',
    fontSize: 'var(--font-size-md)',
  },
  lg: {
    padding: '1rem 1.5rem',
    fontSize: 'var(--font-size-lg)',
  },
};
