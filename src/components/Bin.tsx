export default function Bin() {
  return (
    <div
      style={{
        width: 76,
        height: 68,
        borderRadius: '8px 8px 18px 18px',
        background: 'linear-gradient(180deg, var(--glass-strong), var(--glass))',
        border: '1px solid var(--glass-border)',
        backdropFilter: 'blur(14px)',
        boxShadow: 'inset 0 8px 14px rgba(0,0,0,0.4), 0 0 24px -6px var(--neon-pink)',
        position: 'relative',
      }}
      aria-hidden="true"
    >
      <div
        style={{
          position: 'absolute',
          top: -5,
          left: -5,
          right: -5,
          height: 10,
          borderRadius: 4,
          background: 'linear-gradient(90deg, var(--neon-pink), var(--neon-purple))',
          boxShadow: '0 0 14px -2px var(--neon-pink)',
        }}
      />
    </div>
  )
}
