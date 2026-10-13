import { motion, AnimatePresence } from 'motion/react'

interface SpindleProps {
  count: number
  bumpKey: number
}

const CONFETTI_COLORS = ['#27f5e8', '#ff3fd0', '#b24bff', '#d4ff3f', '#ff9a3f']

export default function Spindle({ count, bumpKey }: SpindleProps) {
  const stack = Array.from({ length: Math.min(count, 14) })
  const confetti = Array.from({ length: 14 })

  return (
    <div
      style={{
        position: 'relative',
        width: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: 18,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: 70,
          height: Math.max(30, stack.length * 9 + 16),
          display: 'flex',
          flexDirection: 'column-reverse',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            bottom: -6,
            width: 5,
            height: '100%',
            background: 'linear-gradient(180deg, var(--neon-cyan), var(--neon-purple))',
            borderRadius: 3,
            boxShadow: '0 0 16px -2px var(--neon-purple)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: -9,
            width: 0,
            height: 0,
            borderLeft: '4px solid transparent',
            borderRight: '4px solid transparent',
            borderBottom: '11px solid var(--neon-cyan)',
            filter: 'drop-shadow(0 0 6px var(--neon-cyan))',
          }}
        />

        <AnimatePresence>
          {bumpKey > 0 && (
            <motion.div
              key={bumpKey}
              style={{ position: 'absolute', inset: 0, pointerEvents: 'none', top: -30 }}
            >
              {confetti.map((_, i) => {
                const angle = (i / confetti.length) * Math.PI * 2
                const dist = 40 + (i % 4) * 14
                return (
                  <motion.span
                    key={i}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                    animate={{
                      x: Math.cos(angle) * dist,
                      y: Math.sin(angle) * dist - 20,
                      opacity: 0,
                      scale: 0.3,
                      rotate: (i * 47) % 360,
                    }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      width: 6,
                      height: 6,
                      borderRadius: i % 2 ? '50%' : 2,
                      background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                      boxShadow: `0 0 8px ${CONFETTI_COLORS[i % CONFETTI_COLORS.length]}`,
                    }}
                  />
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {stack.map((_, i) => (
          <motion.div
            key={i}
            initial={i === stack.length - 1 ? { y: -40, scale: 1.3, rotate: 0 } : false}
            animate={
              i === stack.length - 1
                ? { y: [-40, 4, 0], scale: [1.3, 0.85, 1], rotate: (bumpKey % 7) - 3 }
                : { rotate: ((i * 37) % 7) - 3 }
            }
            transition={{ type: 'spring', stiffness: 500, damping: 18 }}
            style={{
              width: 62 - (i % 3),
              height: 7,
              marginBottom: -2,
              background: i % 2 ? 'var(--neon-cyan)' : 'var(--neon-pink)',
              borderRadius: 2,
              boxShadow: `0 0 10px -1px ${i % 2 ? 'var(--neon-cyan)' : 'var(--neon-pink)'}`,
              opacity: 0.85,
            }}
          />
        ))}
      </div>
      <motion.div
        key={count}
        initial={{ scale: 1.5 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 14 }}
        style={{
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontWeight: 800,
          fontSize: '0.78em',
          color: 'var(--ink)',
          marginTop: 10,
          letterSpacing: '0.02em',
          textShadow: '0 0 14px var(--neon-lime)',
        }}
      >
        {count} done
      </motion.div>
    </div>
  )
}
