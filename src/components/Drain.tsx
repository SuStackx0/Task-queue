export default function Drain() {
  return (
    <div
      style={{
        width: 76,
        height: 56,
        borderRadius: 6,
        background: 'linear-gradient(180deg, var(--rack-edge), var(--rack))',
        border: '1px solid var(--rack-edge)',
        boxShadow: 'inset 0 6px 10px rgba(0,0,0,0.4), 0 6px 14px -6px var(--shadow-color)',
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 3,
        padding: 8,
      }}
      aria-hidden="true"
    >
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          style={{
            background: 'var(--bg)',
            borderRadius: 1,
            opacity: 0.8,
          }}
        />
      ))}
    </div>
  )
}
