import { motion } from 'motion/react'

interface CryoBoxProps {
  count: number
  bumpKey: number
}

const COLS = 4
const SLOT = 16
const GAP = 5

export default function CryoBox({ count, bumpKey }: CryoBoxProps) {
  const totalSlots = Math.max(COLS * 4, Math.ceil((count + 1) / COLS) * COLS)
  const slots = Array.from({ length: totalSlots })
  const rows = Math.ceil(totalSlots / COLS)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <div
        style={{
          width: COLS * SLOT + (COLS - 1) * GAP + 16,
          padding: 8,
          borderRadius: 8,
          background: 'linear-gradient(180deg, var(--rack-edge), var(--rack))',
          border: '1px solid var(--rack-edge)',
          boxShadow: '0 10px 24px -10px var(--shadow-color)',
          display: 'grid',
          gridTemplateColumns: `repeat(${COLS}, ${SLOT}px)`,
          gridTemplateRows: `repeat(${rows}, ${SLOT}px)`,
          gap: GAP,
        }}
      >
        {slots.map((_, i) => {
          const filled = i < count
          const isNewest = filled && i === count - 1
          return (
            <motion.div
              key={i}
              animate={
                isNewest
                  ? { scale: [1.5, 0.85, 1], filter: ['invert(1)', 'invert(1)', 'invert(0)'] }
                  : {}
              }
              transition={{ duration: 0.35 }}
              style={{
                width: SLOT,
                height: SLOT,
                borderRadius: 2,
                border: filled ? 'none' : '1px dashed var(--ink-dim)',
                background: filled ? 'var(--ink)' : 'transparent',
                boxShadow: filled ? 'inset 0 0 4px rgba(var(--frost), 0.4)' : 'none',
              }}
            />
          )
        })}
      </div>
      <div
        key={bumpKey}
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: '0.7em',
          color: 'var(--ink-dim)',
          letterSpacing: '0.04em',
        }}
      >
        {count} done
      </div>
    </div>
  )
}
