import { forwardRef, useEffect, useRef, useState, type CSSProperties } from 'react'
import { motion } from 'motion/react'
import type { Task } from '../types'
import { agingFactor, hungAgo, liquidLevel, tubeLean, tubeVariant } from '../utils/tube'
import styles from './Tube.module.css'

const TAG_LABEL: Record<Task['tag'], string> = {
  work: 'work',
  study: 'study',
  task: 'task',
}

const LIQUID_CLASS: Record<Task['tag'], string> = {
  work: styles.liquidWork,
  study: styles.liquidStudy,
  task: styles.liquidTask,
}

const CAP_CLASS: Record<Task['tag'], string> = {
  work: styles.capWork,
  study: styles.capStudy,
  task: styles.capTask,
}

const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&*+-/\\'

function useScramble(text: string, active: boolean) {
  const [display, setDisplay] = useState(active ? '' : text)

  useEffect(() => {
    if (!active) {
      setDisplay(text)
      return
    }
    let frame = 0
    const totalFrames = 14
    let raf: number
    function tick() {
      frame++
      const revealCount = Math.floor((frame / totalFrames) * text.length)
      const next = text
        .split('')
        .map((ch, i) => {
          if (ch === ' ') return ' '
          if (i < revealCount) return ch
          return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
        })
        .join('')
      setDisplay(next)
      if (frame < totalFrames) raf = requestAnimationFrame(tick)
      else setDisplay(text)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, active])

  return display
}

function titleFontSize(len: number, size: 'rack' | 'bench'): string {
  if (size === 'bench') {
    if (len > 28) return '1.0em'
    if (len > 20) return '1.15em'
    return '1.3em'
  }
  if (len > 28) return '0.44em'
  if (len > 22) return '0.5em'
  if (len > 16) return '0.56em'
  if (len > 10) return '0.62em'
  return '0.7em'
}

interface TubeProps {
  task: Task
  flipped: boolean
  size?: 'rack' | 'bench'
  focused?: boolean
  armed?: boolean
  scramble?: boolean
  style?: CSSProperties
  className?: string
  onClick?: () => void
  tabIndex?: number
}

const Tube = forwardRef<HTMLDivElement, TubeProps>(function Tube(
  { task, flipped, size = 'rack', focused = false, armed = false, scramble = false, style, className, onClick, tabIndex },
  ref
) {
  const hangStart = task.state === 'paused' && task.pausedAt ? task.pausedAt : task.createdAt
  const aging = task.state === 'active' ? 0 : agingFactor(hangStart)
  const lean = size === 'rack' ? tubeLean(task.id) : 0
  const w = size === 'rack' ? 140 : 215
  const h = size === 'rack' ? 215 : 340
  const level = liquidLevel(aging)
  const variant = tubeVariant(task.id)
  const bodyVars = {
    '--bottom-radius': size === 'rack' ? '22px' : '34px',
    '--label-bottom': size === 'rack' ? '30px' : '48px',
    '--glow-op': variant.glowOp,
    '--glow-blur': `${variant.glowBlur}px`,
    '--halo-op': variant.haloOp,
    '--halo-blur': `${variant.haloBlur}px`,
    '--pattern-scale': variant.patternScale,
    '--tint-hue': variant.hue,
    '--sheen-angle': `${variant.sheenAngle}deg`,
    '--sheen-op': variant.sheenOp,
    '--title-size': titleFontSize(task.title.length, size),
  } as CSSProperties
  const displayTitle = useScramble(task.title, scramble && size === 'rack')
  const bubbles = useRef(
    Array.from({ length: 4 }, (_, i) => ({ delay: i * 1.1, x: (i % 2 === 0 ? -1 : 1) * (4 + i * 3) }))
  ).current

  return (
    <div
      ref={ref}
      className={`${styles.scene} ${className || ''}`}
      style={{ width: w, height: h, ...style }}
      onClick={onClick}
      tabIndex={tabIndex}
      role={onClick ? 'button' : undefined}
    >
      <motion.div
        className={styles.card}
        style={{
          width: w,
          height: h,
          outline: focused ? '2px solid var(--ink)' : 'none',
          outlineOffset: 3,
        }}
        animate={{ rotateY: flipped ? 180 : 0, rotate: lean, scale: armed ? 1.08 : 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        {/* front */}
        <div className={styles.face}>
          <div className={`${styles.cap} ${CAP_CLASS[task.tag]}`} />
          <div className={styles.rim} />
          <div className={styles.body} style={bodyVars}>
            <div className={styles.specular} />
            <div
              className={`${styles.liquid} ${LIQUID_CLASS[task.tag]}`}
              style={{ height: `${level * 100}%` }}
            >
              <div className={styles.meniscus} />
              <div className={styles.liquidSheen} />
            </div>
            <div className={styles.sediment} style={{ height: `${aging * 10}%` }} />
            {task.state === 'active' &&
              bubbles.map((b, i) => (
                <motion.div
                  key={i}
                  className={styles.bubble}
                  style={{ marginLeft: b.x }}
                  initial={{ bottom: '10%', opacity: 0 }}
                  animate={{ bottom: '85%', opacity: [0, 0.7, 0] }}
                  transition={{ duration: 2.6, delay: b.delay, repeat: Infinity, ease: 'easeIn' }}
                />
              ))}
            <div className={styles.fog} style={{ '--fog-opacity': aging * 0.55 } as CSSProperties} />
            <div className={styles.labelBand}>
              <div className={styles.title}>{displayTitle}</div>
              <div className={styles.metaRow}>
                <span className={styles.tagText}>{TAG_LABEL[task.tag]}</span>
                {task.state !== 'active' && <span className={styles.hungText}>{hungAgo(hangStart)}</span>}
              </div>
              <div className={styles.labelPeel} style={{ transform: `rotate(${aging * 18}deg)` }} />
            </div>
          </div>
        </div>

        {/* back */}
        <div className={`${styles.face} ${styles.back}`}>
          <div className={`${styles.cap} ${CAP_CLASS[task.tag]}`} />
          <div className={styles.rim} />
          <div className={styles.body} style={bodyVars}>
            <div
              className={`${styles.liquid} ${LIQUID_CLASS[task.tag]}`}
              style={{ height: `${level * 100}%` }}
            />
            <div className={styles.fog} style={{ '--fog-opacity': aging * 0.55 } as CSSProperties} />
            <div className={styles.backNote}>
              <div className={styles.backLabel}>next step</div>
              <div className={styles.noteText} style={{ fontSize: size === 'bench' ? '2em' : '1.1em' }}>
                {task.nextStep || '…'}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
})

export default Tube
