import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import type { Tag } from '../types'
import styles from './AddForm.module.css'

interface AddFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (title: string, tag: Tag, urgent: boolean) => void
}

const TAGS: { value: Tag; color: string }[] = [
  { value: 'work', color: 'var(--tag-work)' },
  { value: 'study', color: 'var(--tag-study)' },
  { value: 'task', color: 'var(--tag-task)' },
]

export default function AddForm({ open, onClose, onSubmit }: AddFormProps) {
  const [title, setTitle] = useState('')
  const [tag, setTag] = useState<Tag>('work')
  const [urgent, setUrgent] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTitle('')
      setTag('work')
      setUrgent(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  function submit() {
    if (!title.trim()) return
    onSubmit(title.trim(), tag, urgent)
  }

  return (
    <AnimatePresence>
      {open && (
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
            <label className={styles.label}>✨ new ticket</label>
            <input
              ref={inputRef}
              className={styles.titleInput}
              placeholder="what are you starting?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit()
                if (e.key === 'Escape') onClose()
              }}
            />
            <div className={styles.tagRow}>
              {TAGS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  className={`${styles.tagBtn} ${tag === t.value ? styles.active : ''}`}
                  style={{
                    color: t.color,
                    background: tag === t.value ? t.color : 'transparent',
                  }}
                  onClick={() => setTag(t.value)}
                >
                  {t.value}
                </button>
              ))}
            </div>
            <button
              type="button"
              className={`${styles.urgentToggle} ${urgent ? styles.urgentActive : ''}`}
              onClick={() => setUrgent((u) => !u)}
            >
              <span className={styles.urgentFlame}>🔥</span>
              need this done right now
              <span className={styles.urgentSwitch} data-on={urgent} />
            </button>

            <div className={styles.actions}>
              <button className={styles.btn} onClick={onClose}>
                cancel
              </button>
              <button className={`${styles.btn} ${styles.btnPrimary}`} disabled={!title.trim()} onClick={submit}>
                send it →
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
