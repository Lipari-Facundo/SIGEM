export default function ContentGrid({ children, columns = 'repeat(12, minmax(0, 1fr))', gap = 'var(--spacing-6)', style, ...props }) {
  return (
    <div style={{ ...S.grid, gridTemplateColumns: columns, gap, ...style }} {...props}>
      {children}
    </div>
  );
}

const S = {
  grid: {
    display: 'grid',
    width: '100%',
    alignItems: 'start',
    boxSizing: 'border-box',
  },
};
