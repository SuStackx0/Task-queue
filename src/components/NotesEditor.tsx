import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import type { Task } from '../types'
import styles from './NotesEditor.module.css'

interface NotesEditorProps {
  task: Task | null
  onClose: () => void
  onSave: (id: number, notes: string) => void
}

export default function NotesEditor({ task, onClose, onSave }: NotesEditorProps) {
  const [draft, setDraft] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (task) {
      setDraft(task.notes || '')
      setTimeout(() => textareaRef.current?.focus(), 50)
    }
  }, [task])

  function save() {
    if (!task) return
    onSave(task.id, draft)
  }

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
            <label className={styles.label}>📝 notes</label>
            <div className={styles.title}>{task.title}</div>
            <textarea
              ref={textareaRef}
              className={styles.textarea}
              placeholder="jot anything useful about this ticket…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') onClose()
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save()
              }}
            />
            <div className={styles.actions}>
              <button className={styles.btn} onClick={onClose}>
                cancel
              </button>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={save}>
                save
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
