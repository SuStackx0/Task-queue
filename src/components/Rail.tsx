import { useRef, useState, type HTMLAttributes } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useDrag } from '@use-gesture/react'
import type { Task } from '../types'
import Ticket from './Ticket'
import styles from './Rail.module.css'

interface RailProps {
  tasks: Task[]
  focusedId: number | null
  armedId: number | null
  onArm: (id: number) => void
  onStartRequest: (id: number) => void
  onToggleUrgent: (id: number) => void
  onOpenNotes: (id: number) => void
  onReorder: (id: number, newPosition: number) => void
  onLocalReorder: (orderedIds: number[]) => void
}

const START_THRESHOLD = 56

export default function Rail({
  tasks,
  focusedId,
  armedId,
  onArm,
  onStartRequest,
  onToggleUrgent,
  onOpenNotes,
  onReorder,
  onLocalReorder,
}: RailProps) {
  const refs = useRef(new Map<number, HTMLDivElement>())
  const [dragState, setDragState] = useState<{ id: number; dx: number; dy: number; axis: 'x' | 'y' | null } | null>(
    null
  )

  const bind = useDrag(({ args: [id], movement: [mx, my], first, last, event }) => {
    event.preventDefault?.()
    if (first) setDragState({ id, dx: 0, dy: 0, axis: null })

    setDragState((prev) => {
      if (!prev || prev.id !== id) return prev
      let axis = prev.axis
      if (!axis && (Math.abs(mx) > 8 || Math.abs(my) > 8)) {
        axis = Math.abs(my) > Math.abs(mx) ? 'y' : 'x'
      }
      return { id, dx: mx, dy: my, axis }
    })

    if (last) {
      setDragState((prev) => {
        if (!prev || prev.id !== id) return null
        if (prev.axis === 'y' && prev.dy > START_THRESHOLD) {
          onStartRequest(id)
        } else if (prev.axis === 'x' && Math.abs(prev.dx) > 20) {
          resolveReorder(id, event as PointerEvent)
        }
        return null
      })
    }
  })

  function resolveReorder(draggedId: number, event: PointerEvent) {
    const clientX = 'clientX' in event ? event.clientX : 0
    const others = tasks.filter((t) => t.id !== draggedId)
    const dragged = tasks.find((t) => t.id === draggedId)
    if (!dragged) return

    let insertBefore: Task | null = null
    for (const t of others) {
      const el = refs.current.get(t.id)
      if (!el) continue
      const rect = el.getBoundingClientRect()
      const center = rect.left + rect.width / 2
      if (clientX < center) {
        insertBefore = t
        break
      }
    }

    const idx = insertBefore ? others.indexOf(insertBefore) : others.length
    const before = others[idx - 1]
    const after = others[idx]
    let newPosition: number
    if (!before && !after) newPosition = dragged.position
    else if (!before) newPosition = after.position - 1
    else if (!after) newPosition = before.position + 1
    else newPosition = (before.position + after.position) / 2

    const ordered = [...others]
    ordered.splice(idx, 0, dragged)
    onLocalReorder(ordered.map((t) => t.id))
    onReorder(draggedId, newPosition)
  }

  return (
    <div className={styles.railBar}>
      <div className={styles.printSlot} aria-hidden="true" />
      <div className={styles.railTrack}>
        {tasks.length === 0 && (
          <div className={styles.emptyRail}>Nothing on the rail. Press n to add a ticket.</div>
        )}
        <AnimatePresence initial={false}>
          {tasks.map((task, i) => {
            const isDragging = dragState?.id === task.id
            const dx = isDragging && dragState?.axis === 'x' ? dragState.dx : 0
            const dy = isDragging && dragState?.axis === 'y' ? Math.max(0, dragState.dy) : 0
            const swing = isDragging && dragState?.axis === 'y' ? Math.min(18, dy / 4) : 0

            return (
              <motion.div
                key={task.id}
                layout
                layoutId={`ticket-wrap-${task.id}`}
                className={styles.ticketSlot}
                ref={(el) => {
                  if (el) refs.current.set(task.id, el)
                  else refs.current.delete(task.id)
                }}
                initial={{ opacity: 0, scale: 0.85, y: -16 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  x: dx,
                  y: dy,
                  rotate: swing,
                }}
                exit={{ opacity: 0, scale: 0.8, y: 10, transition: { duration: 0.2 } }}
                transition={
                  isDragging
                    ? { type: 'tween', duration: 0 }
                    : { type: 'spring', stiffness: 420, damping: 26 }
                }
                whileHover={!isDragging ? { y: -10, rotate: 2 } : undefined}
              >
                <div
                  {...(bind(task.id) as HTMLAttributes<HTMLDivElement>)}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (dragState) return
                    if (armedId === task.id) onStartRequest(task.id)
                    else onArm(task.id)
                  }}
                  style={{ touchAction: 'none' }}
                >
                  <Ticket
                    task={task}
                    flipped={false}
                    size="rail"
                    showClip
                    focused={focusedId === task.id}
                    armed={armedId === task.id}
                    tabIndex={0}
                  />
                  <button
                    type="button"
                    className={`${styles.urgentFlag} ${task.urgent ? styles.urgentFlagActive : ''}`}
                    title={task.urgent ? 'unmark urgent' : 'mark urgent'}
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleUrgent(task.id)
                    }}
                  >
                    🔥
                  </button>
                  <button
                    type="button"
                    className={`${styles.notesFlag} ${task.notes ? styles.notesFlagActive : ''}`}
                    title={task.notes ? 'edit notes' : 'add notes'}
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpenNotes(task.id)
                    }}
                  >
                    📝
                  </button>
                  {armedId === task.id && (
                    <div className={styles.armedBadge}>tap again to {task.state === 'paused' ? 'resume' : 'start'} · esc to cancel</div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
