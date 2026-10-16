import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import type { Task } from '../types'
import DaySlider from './DaySlider'
import styles from './ExtendModal.module.css'

interface ExtendModalProps {
  task: Task | null
  onClose: () => void
  onConfirm: (id: number, addDays: number) => void
}

export default function ExtendModal({ task, onClose, onConfirm }: ExtendModalProps) {
  const [days, setDays] = useState(2)

  useEffect(() => {
    if (task) setDays(2)
  }, [task?.id])

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
            <label className={styles.label}>⏱ add more time</label>
            <div className={styles.title}>{task.title}</div>
            <DaySlider days={days} onDaysChange={setDays} label={`add days (now ${task.daysTotal})`} />
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
                confirm →
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
