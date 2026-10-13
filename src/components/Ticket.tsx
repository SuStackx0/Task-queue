import { forwardRef, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { motion, useMotionValue, useSpring } from 'motion/react'
import type { Task } from '../types'
import { agingFactor, hungAgo, ticketRotation } from '../utils/ticket'
import styles from './Ticket.module.css'

const TAG_LABEL: Record<Task['tag'], string> = {
  work: 'work',
  study: 'study',
  task: 'task',
}

const TAG_CLASS: Record<Task['tag'], string> = {
  work: styles.stampWork,
  study: styles.stampStudy,
  task: styles.stampTask,
}

const TAG_GLOW: Record<Task['tag'], [string, string, string]> = {
  work: ['#4df0ff', '#b24bff', '#4df0ff'],
  study: ['#d4ff3f', '#4df0ff', '#d4ff3f'],
  task: ['#ff3fd0', '#b24bff', '#ff3fd0'],
}

const URGENT_GLOW: [string, string, string] = ['#ff2e2e', '#ff9a3f', '#ff2e2e']

interface TicketProps {
  task: Task
  flipped: boolean
  size?: 'rail' | 'pass'
  showClip?: boolean
  focused?: boolean
  armed?: boolean
  style?: CSSProperties
  className?: string
  onClick?: () => void
  tabIndex?: number
}

const Ticket = forwardRef<HTMLDivElement, TicketProps>(function Ticket(
  { task, flipped, size = 'rail', showClip = false, focused = false, armed = false, style, className, onClick, tabIndex },
  ref
) {
  const hangStart = task.state === 'paused' && task.pausedAt ? task.pausedAt : task.createdAt
  const aging = task.state === 'active' ? 0 : agingFactor(hangStart)
  const rotation = size === 'rail' ? ticketRotation(task.id) : 0
  const w = size === 'rail' ? 162 : 440
  const h = size === 'rail' ? 118 : 310

  const paper = mixGlass(aging)
  const [ga, gb, gc] = task.urgent ? URGENT_GLOW : TAG_GLOW[task.tag]

  const rotX = useMotionValue(0)
  const rotY = useMotionValue(0)
  const springX = useSpring(rotX, { stiffness: 220, damping: 18 })
  const springY = useSpring(rotY, { stiffness: 220, damping: 18 })
  const sceneRef = useRef<HTMLDivElement | null>(null)

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const el = sceneRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    rotY.set(px * (size === 'pass' ? 14 : 20))
    rotX.set(-py * (size === 'pass' ? 14 : 20))
    el.style.setProperty('--sheen-x', `${(px + 0.5) * 160 - 30}%`)
  }

  function handlePointerLeave() {
    rotX.set(0)
    rotY.set(0)
  }

  return (
    <div
      ref={(el) => {
        sceneRef.current = el
        if (typeof ref === 'function') ref(el)
        else if (ref) (ref as { current: HTMLDivElement | null }).current = el
      }}
      className={`${styles.scene} ${className || ''}`}
      style={{ width: w, height: h, ...style }}
      onClick={onClick}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      tabIndex={tabIndex}
      role={onClick ? 'button' : undefined}
    >
      {showClip && (
        <div className={styles.clipWrap}>
          <div className={styles.clip} />
        </div>
      )}
      <motion.div
        className={styles.card}
        style={
          {
            width: w,
            height: h,
            rotateX: springX,
            rotateY: springY,
            outline: focused ? `3px solid var(--neon-cyan)` : 'none',
            outlineOffset: 3,
            borderRadius: 26,
          } as CSSProperties
        }
        animate={{
          rotate: rotation,
          scale: task.urgent ? [1, 1.035, 1] : armed ? 1.06 : 1,
        }}
        transition={
          task.urgent
            ? { scale: { repeat: Infinity, duration: 1.3, ease: 'easeInOut' }, rotate: { type: 'spring', stiffness: 260, damping: 24 } }
            : { type: 'spring', stiffness: 260, damping: 24 }
        }
      >
        <div
          className={styles.glowRing}
          style={
            {
              '--glow-a': ga,
              '--glow-b': gb,
              '--glow-c': gc,
              '--ring-opacity': armed || task.state === 'active' ? 1 : 0.5,
            } as CSSProperties
          }
        />
        <div
          className={styles.face}
          style={
            {
              width: w,
              height: h,
              '--glass': paper,
              '--glow-shadow': ga,
            } as CSSProperties
          }
        >
          <div className={styles.sheen} />
          {task.urgent && <div className={styles.urgentBadge}>🔥 do this now</div>}
          <div className={styles.body}>
            <div className={styles.title} style={{ fontSize: size === 'rail' ? '1em' : '1.9em' }}>
              {task.title}
            </div>
            <div className={styles.meta}>
              <span className={`${styles.stamp} ${TAG_CLASS[task.tag]}`}>{TAG_LABEL[task.tag]}</span>
              {task.state !== 'active' && <span className={styles.hung}>{hungAgo(hangStart)}</span>}
            </div>
          </div>
        </div>
        <div
          className={`${styles.face} ${styles.back}`}
          style={
            {
              width: w,
              height: h,
              '--glass': paper,
              '--glow-shadow': ga,
            } as CSSProperties
          }
        >
          <div className={styles.backBody}>
            <div className={styles.backLabel}>next step</div>
            <div className={styles.noteText} style={{ fontSize: size === 'rail' ? '1.1em' : '2em' }}>
              {task.nextStep || '…'}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
})

function mixGlass(t: number): string {
  const fresh = [255, 255, 255, 0.07]
  const old = [255, 210, 120, 0.1]
  const r = Math.round(fresh[0] + (old[0] - fresh[0]) * t)
  const g = Math.round(fresh[1] + (old[1] - fresh[1]) * t)
  const b = Math.round(fresh[2] + (old[2] - fresh[2]) * t)
  const a = fresh[3] + (old[3] - fresh[3]) * t
  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`
}

export default Ticket
