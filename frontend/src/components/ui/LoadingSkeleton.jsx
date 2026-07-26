export default function LoadingSkeleton({ rows = 3, width = '100%', height = '1rem', style, ...props }) {
  return (
    <div style={{ ...S.root, width, ...style }} {...props}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} style={{ ...S.bar, height, width: index === rows - 1 ? '70%' : '100%' }} />
      ))}
    </div>
  );
}

const S = {
  root: {
    display: 'grid',
    gap: 'var(--spacing-3)',
  },
  bar: {
    background: 'var(--color-surface-muted)',
    borderRadius: 'var(--radius-full)',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
};
