import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import type { Task } from '../types'
import { expiredAgo } from '../utils/tube'
import DaySlider from './DaySlider'
import styles from './Dustbin.module.css'

interface DustbinProps {
  expired: Task[]
  onRestore: (id: number, days: number) => void
}

export default function Dustbin({ expired, onRestore }: DustbinProps) {
  const [open, setOpen] = useState(false)
  const [restoringId, setRestoringId] = useState<number | null>(null)
  const [days, setDays] = useState(7)

  return (
    <div className={styles.wrap}>
      <button
        className={styles.toggle}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((o) => !o)
        }}
        title="dustbin"
        aria-label="dustbin"
      >
        🗑
        {expired.length > 0 && <span className={styles.badge}>{expired.length}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.panel}
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.title}>dustbin</div>
            {expired.length === 0 && <div className={styles.empty}>Nothing in here. Every tube's accounted for.</div>}
            <AnimatePresence initial={false}>
              {expired.map((task) => (
                <motion.div
                  key={task.id}
                  className={styles.row}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className={styles.rowHead}>
                    <span className={styles.rowTitle}>{task.title}</span>
                    <span className={styles.rowMeta}>
                      {task.expiredAt ? `expired ${expiredAgo(task.expiredAt)}` : ''}
                    </span>
                  </div>
                  <div className={styles.rowTag}>{task.tag}</div>

                  {restoringId === task.id ? (
                    <>
                      <DaySlider days={days} onDaysChange={setDays} label="refill for" />
                      <button
                        className={styles.confirmBtn}
                        onClick={() => {
                          onRestore(task.id, days)
                          setRestoringId(null)
                        }}
                      >
                        confirm restore →
                      </button>
                    </>
                  ) : (
                    <button
                      className={styles.restoreBtn}
                      onClick={() => {
                        setRestoringId(task.id)
                        setDays(7)
                      }}
                    >
                      ↺ restore
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
