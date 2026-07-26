export default function PageContainer({ children, style, ...props }) {
  return (
    <section style={{ ...S.container, ...style }} {...props}>
      {children}
    </section>
  );
}

const S = {
  container: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-6)',
    background: 'transparent',
  },
};
