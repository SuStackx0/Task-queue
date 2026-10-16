import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import type { Task } from '../types'
import DaySlider from './DaySlider'
import styles from './ExtendModal.module.css'

interface ExtendModalProps {
  task: Task | null
  onClose: () => void
  onConfirm: (id: number, newDays: number) => void
}

export default function ExtendModal({ task, onClose, onConfirm }: ExtendModalProps) {
  const [days, setDays] = useState(7)

  // Seed the slider with the tube's current upper bound, not an arbitrary
  // default — this is a "set it to what you want" control, not "add N more"
  // (dragging to the number you actually want is what people expect).
  useEffect(() => {
    if (task?.daysTotal != null) setDays(task.daysTotal)
  }, [task?.id, task?.daysTotal])

  return (
    <AnimatePresence>
      {task && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={styles.panel}
            initial={{ opacity: 0, y: -24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            <label className={styles.label}>✎ edit upper bound</label>
            <div className={styles.title}>{task.title}</div>
            <div className={styles.currentValue}>currently {task.daysTotal} days — drag to the new total</div>
            <DaySlider days={days} onDaysChange={setDays} />
            <div className={styles.actions}>
              <button className={styles.btn} onClick={onClose}>
                cancel
              </button>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={() => {
                  onConfirm(task.id, days)
                  onClose()
                }}
              >
                set to {days} days →
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
